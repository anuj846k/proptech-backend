import { uploadToCloudinary } from '#utils/cloudinary';
import { AppError } from '#utils/error';
import logger from '#utils/logger';
import type {
  TicketAssignInput,
  TicketCreateInput,
  TicketUpdateInput,
} from '#validations/ticket.validations';
import {
  createActivityLog,
  createTicket,
  createTicketImage,
  findActivityLogsByTicketId,
  findAllTicketsForManager,
  findAllTicketsForOwner,
  findTicketById,
  findTicketImagesByTicketId,
  findTicketsByTechnicianId,
  findTicketsByTenantId,
  findUnitByPropertyAndNumber,
  findUnitById,
  updateTicket,
  type ListTicketsFilters,
} from './ticket.repositories';
import { createNotificationService } from '../notification/notification.services';
import { findPropertyById } from '../property/property.repositories';
import { findUserById } from '../user/user.repositories';

export const createTicketService = async (
  userId: string,
  tenantId: string,
  data: TicketCreateInput,
  files?: Express.Multer.File[],
) => {
  try {
    if (!data.unit) {
      throw new AppError('Unit is required', 400);
    }

    const unit = await findUnitByPropertyAndNumber(data.propertyId, data.unit);
    if (!unit) {
      throw new AppError('Unit not found for this property', 404);
    }

    let priority: 'LOW' | 'MEDIUM' | 'HIGH';
    if (!data.priority) {
      priority = 'MEDIUM';
    } else if (data.priority === 'URGENT') {
      priority = 'HIGH';
    } else {
      priority = data.priority;
    }

    const bodyImageUrls = data.imageUrls ?? [];
    let cloudinaryImageUrls: string[] = [];

    if (files && files.length > 0) {
      cloudinaryImageUrls = await Promise.all(
        files.map(async (file: Express.Multer.File) => {
          const fileSource = file.path || file.buffer;
          const url = await uploadToCloudinary(fileSource);
          return url;
        }),
      );
    }

    const allImageUrls = [...bodyImageUrls, ...cloudinaryImageUrls];

    const ticket = await createTicket({
      title: data.title,
      description: data.description,
      priority,
      tenantId,
      unitId: unit.id,
    });

    if (ticket?.id && allImageUrls.length > 0) {
      await Promise.all(
        allImageUrls.map((url) => createTicketImage(ticket.id, url)),
      );
    }

    await createActivityLog({
      ticketId: ticket?.id ?? '',
      performedBy: tenantId,
      actionType: 'CREATED',
      oldValue: null,
      newValue: `Ticket created with status OPEN and priority ${priority}`,
    });

    const property = await findPropertyById(data.propertyId);
    if (property?.managerId && ticket?.id) {
      try {
        await createNotificationService(
          property.managerId,
          `New ticket: ${data.title}`,
          ticket.id,
        );
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        logger.error(
          `Failed to create notification for managerId=${property.managerId} ticketId=${ticket.id}: ${errorMessage}`,
        );
      }
    }
    if (!ticket?.id) {
      throw new AppError('Failed to create ticket', 500);
    }

    const images = await findTicketImagesByTicketId(ticket.id);

    logger.info(`Ticket created id=${ticket.id} by tenantId=${tenantId}`);
    return { ...ticket, images };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`createTicketService error: ${message}`);
    throw error;
  }
};

export const getMyTicketsService = async (tenantId: string) => {
  try {
    const tickets = await findTicketsByTenantId(tenantId);
    logger.info(`Fetched ${tickets.length} tickets for tenantId=${tenantId}`);
    return tickets;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`getMyTicketsService error: ${message}`);
    throw error;
  }
};

export const getAllTicketsService = async (
  userId: string,
  role: string,
  filters?: ListTicketsFilters,
) => {
  try {
    let results;
    if (role === 'ADMIN') {
      results = await findAllTicketsForOwner(userId, filters);
      logger.info(
        `Fetched ${results.length} tickets for ownerId=${userId} with filters`,
        { filters },
      );
    } else if (role === 'MANAGER') {
      results = await findAllTicketsForManager(userId, filters);
      logger.info(
        `Fetched ${results.length} tickets for managerId=${userId} with filters`,
        { filters },
      );
    } else {
      throw new AppError('Unauthorized', 403);
    }
    return results;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`getAllTicketsService error: ${message}`);
    throw error;
  }
};

type UserForAccess = { userId: string; role: string };

const checkTicketAccess = async (ticketId: string, user: UserForAccess) => {
  const ticket = await findTicketById(ticketId);
  if (!ticket) {
    throw new AppError('Ticket not found', 404);
  }

  if (user.role === 'TENANT') {
    if (ticket.tenantId !== user.userId) {
      throw new AppError('You do not have access to this ticket', 403);
    }
  } else if (user.role === 'TECHNICIAN') {
    if (ticket.technicianId !== user.userId) {
      throw new AppError('You do not have access to this ticket', 403);
    }
  } else if (user.role === 'MANAGER') {
    const unit = await findUnitById(ticket.unitId);
    if (!unit) {
      throw new AppError('Ticket unit not found', 404);
    }
    const property = await findPropertyById(unit.propertyId);
    if (!property || property.managerId !== user.userId) {
      throw new AppError('You do not have access to this ticket', 403);
    }
  } else if (user.role === 'ADMIN') {
    const unit = await findUnitById(ticket.unitId);
    if (!unit) {
      throw new AppError('Ticket unit not found', 404);
    }
    const property = await findPropertyById(unit.propertyId);
    if (!property || property.ownerId !== user.userId) {
      throw new AppError('You do not have access to this ticket', 403);
    }
  }

  return ticket;
};

export const getTicketByIdService = async (
  ticketId: string,
  user: UserForAccess,
) => {
  const ticket = await checkTicketAccess(ticketId, user);

  const [images, activity] = await Promise.all([
    findTicketImagesByTicketId(ticketId),
    findActivityLogsByTicketId(ticketId),
  ]);

  return { ticket, images, activity };
};

/**
 * Assigns a technician to a ticket. Manager or Owner must have access to the ticket's property.
 * Sets status to ASSIGNED and creates ASSIGNED activity log.
 */
export const assignTicketService = async (
  ticketId: string,
  userId: string,
  role: string,
  data: TicketAssignInput,
) => {
  const ticket = await findTicketById(ticketId);
  if (!ticket) {
    throw new AppError('Ticket not found', 404);
  }

  const unit = await findUnitById(ticket.unitId);
  if (!unit) {
    throw new AppError('Ticket unit not found', 404);
  }
  const property = await findPropertyById(unit.propertyId);
  if (!property) {
    throw new AppError('Property not found', 404);
  }

  // Allow if user is owner OR manager
  const isOwner = property.ownerId === userId;
  const isManager = property.managerId === userId;

  if (role === 'ADMIN' && !isOwner) {
    throw new AppError('You do not have access to this ticket', 403);
  }
  if (role === 'MANAGER' && !isManager) {
    throw new AppError('You do not have access to this ticket', 403);
  }

  const technician = await findUserById(data.technicianId);
  if (!technician) {
    throw new AppError('Technician not found', 404);
  }
  if (technician.role !== 'TECHNICIAN') {
    throw new AppError('User is not a technician', 400);
  }

  const previousTechnicianId = ticket.technicianId;
  const previousStatus = ticket.status;

  const updated = await updateTicket(ticketId, {
    technicianId: data.technicianId,
    status: 'ASSIGNED',
  });

  if (!updated) {
    throw new AppError('Failed to assign ticket', 500);
  }

  await createActivityLog({
    ticketId,
    performedBy: userId,
    actionType: 'ASSIGNED',
    oldValue: `Technician: ${previousTechnicianId ?? 'Unassigned'}; Status: ${
      previousStatus ?? 'OPEN'
    }`,
    newValue: `Technician: ${technician.name}; Status: ASSIGNED`,
  });

  try {
    await createNotificationService(
      data.technicianId,
      `You were assigned to ticket: ${ticket.title}`,
      ticketId,
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(
      `Failed to create notification for technicianId=${data.technicianId} ticketId=${ticketId}: ${errorMessage}`,
    );
  }

  logger.info(
    `Ticket ${ticketId} assigned to technician ${data.technicianId} by user ${userId}`,
  );
  return updated;
};

/**
 * Updates ticket priority and/or status. Manager or Owner must have access.
 * Creates STATUS_CHANGED activity log for each change.
 */
export const updateTicketService = async (
  ticketId: string,
  userId: string,
  role: string,
  data: TicketUpdateInput,
) => {
  const ticket = await findTicketById(ticketId);
  if (!ticket) {
    throw new AppError('Ticket not found', 404);
  }

  const unit = await findUnitById(ticket.unitId);
  if (!unit) {
    throw new AppError('Ticket unit not found', 404);
  }
  const property = await findPropertyById(unit.propertyId);
  if (!property) {
    throw new AppError('Property not found', 404);
  }

  // Allow if user is owner OR manager
  const isOwner = property.ownerId === userId;
  const isManager = property.managerId === userId;

  if (role === 'ADMIN' && !isOwner) {
    throw new AppError('You do not have access to this ticket', 403);
  }
  if (role === 'MANAGER' && !isManager) {
    throw new AppError('You do not have access to this ticket', 403);
  }

  const updates: Parameters<typeof updateTicket>[1] = {};
  const activityMessages: string[] = [];

  if (data.priority !== undefined && data.priority !== ticket.priority) {
    updates.priority = data.priority;
    activityMessages.push(
      `Priority changed from ${ticket.priority} to ${data.priority}`,
    );
  }
  if (data.status !== undefined && data.status !== ticket.status) {
    updates.status = data.status;
    activityMessages.push(
      `Status changed from ${ticket.status} to ${data.status}`,
    );
  }

  if (Object.keys(updates).length === 0) {
    return ticket;
  }

  const updated = await updateTicket(ticketId, updates);
  if (!updated) {
    throw new AppError('Failed to update ticket', 500);
  }

  await createActivityLog({
    ticketId,
    performedBy: userId,
    actionType: 'STATUS_CHANGED',
    oldValue: `Priority: ${ticket.priority}, Status: ${ticket.status}`,
    newValue: activityMessages.join('; '),
  });

  logger.info(`Ticket ${ticketId} updated by user ${userId}`, {
    updates,
  });
  return updated;
};

export const getAssignedTicketsService = async (technicianId: string) => {
  const tickets = await findTicketsByTechnicianId(technicianId);
  logger.info(
    `Fetched ${tickets.length} assigned tickets for technicianId=${technicianId}`,
  );
  return tickets;
};

export const updateTicketProgressService = async (
  ticketId: string,
  technicianId: string,
  data: { status: 'IN_PROGRESS' | 'DONE' },
) => {
  const ticket = await findTicketById(ticketId);
  if (!ticket) {
    throw new AppError('Ticket not found', 404);
  }
  if (ticket.technicianId !== technicianId) {
    throw new AppError('You do not have access to this ticket', 403);
  }
  const allowed: Record<string, string[]> = {
    ASSIGNED: ['IN_PROGRESS'],
    IN_PROGRESS: ['DONE'],
  };
  const next = allowed[ticket.status ?? 'OPEN'];
  if (!next || !next.includes(data.status)) {
    throw new AppError(
      `Cannot set status to ${data.status} from ${ticket.status}. Allowed: ${next?.join(', ') ?? 'none'}`,
      400,
    );
  }
  const updated = await updateTicket(ticketId, { status: data.status });
  if (!updated) {
    throw new AppError('Failed to update ticket', 500);
  }
  await createActivityLog({
    ticketId,
    performedBy: technicianId,
    actionType: 'STATUS_CHANGED',
    oldValue: ticket.status,
    newValue: data.status,
  });

  if (data.status === 'DONE' && ticket.tenantId) {
    try {
      await createNotificationService(
        ticket.tenantId,
        `Your ticket has been completed: ${ticket.title}`,
        ticketId,
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(
        `Failed to create notification for tenantId=${ticket.tenantId} ticketId=${ticketId}: ${errorMessage}`,
      );
    }
  }

  logger.info(
    `Ticket ${ticketId} progress updated to ${data.status} by technician ${technicianId}`,
  );
  return updated;
};
