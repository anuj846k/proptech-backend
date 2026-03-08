import { AppError } from '#utils/error';
import logger from '#utils/logger';
import { findPropertyById } from '../property/property.repositories';
import {
  findActivityLogsByTicketId,
  findTicketById,
  findUnitById,
} from '../ticket/ticket.repositories';
import type { TokenPayload } from '../user/user.types';

export const getTicketActivityService = async (
  ticketId: string,
  user: TokenPayload,
) => {
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
  } else {
    throw new AppError('You do not have access to this ticket', 403);
  }

  const activity = await findActivityLogsByTicketId(ticketId);
  logger.info(
    `Fetched ${activity.length} activity logs for ticketId=${ticketId}`,
  );
  return activity;
};
