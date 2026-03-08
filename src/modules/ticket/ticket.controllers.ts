import { successResponse } from '#utils/apiResponse';
import asyncHandler from '#utils/asyncHandler';
import { AppError } from '#utils/error';
import logger from '#utils/logger';
import { formatZodError } from '#utils/zod';
import {
  ticketCreateSchema,
  ticketListQuerySchema,
  ticketProgressSchema,
  ticketAssignSchema,
  ticketUpdateSchema,
} from '#validations/ticket.validations';

import type { ListTicketsFilters } from './ticket.repositories';

import {
  createTicketService,
  getAllTicketsService,
  getAssignedTicketsService,
  getMyTicketsService,
  getTicketByIdService,
  updateTicketProgressService,
  assignTicketService,
  updateTicketService,
} from './ticket.services';

export const createTicketController = asyncHandler(async (req, res) => {
  const user = req.user;
  const files = req.files;

  if (!user?.userId) {
    throw new AppError('Unauthorized', 401);
  }

  const parseResult = ticketCreateSchema.safeParse(req.body);

  if (!parseResult.success) {
    const messages = formatZodError(parseResult.error);
    throw new AppError(`Validation error: ${messages}`, 400);
  }

  const data = parseResult.data;

  logger.info(`createTicketController request by userId=${user.userId}`);

  const fileArray = Array.isArray(files) ? files : [];

  const ticket = await createTicketService(
    user.userId,
    user.userId,
    data,
    fileArray,
  );

  return successResponse(res, 'Ticket created successfully', { ticket }, 201);
});

export const getMyTicketsController = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user?.userId) {
    throw new AppError('Unauthorized', 401);
  }

  logger.info(`getMyTickets request by userId=${user.userId}`);

  const tickets = await getMyTicketsService(user.userId);

  return successResponse(res, 'Tickets fetched successfully', { tickets });
});

export const getAllTicketsController = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user?.userId || !user?.role) {
    throw new AppError('Unauthorized', 401);
  }

  const parseResult = ticketListQuerySchema.safeParse(req.query);

  if (!parseResult.success) {
    throw new AppError('Invalid filter values', 400);
  }

  const filters = parseResult.data;

  logger.info(
    `getAllTickets request by userId=${user.userId} role=${user.role}`,
  );

  const results = await getAllTicketsService(
    user.userId,
    user.role,
    filters as ListTicketsFilters,
  );

  return successResponse(res, 'Tickets fetched successfully', {
    tickets: results,
  });
});

export const getTicketByIdController = asyncHandler(async (req, res) => {
  const user = req.user;
  const ticketId = req.params.id;

  if (!user?.userId || !user?.role) {
    throw new AppError('Unauthorized', 401);
  }

  if (!ticketId) {
    throw new AppError('Ticket ID is required', 400);
  }

  logger.info(`getTicketById request ticketId=${ticketId}`);

  const result = await getTicketByIdService(ticketId as string, {
    userId: user.userId,
    role: user.role,
  });

  return successResponse(res, 'Ticket fetched successfully', result);
});

export const assignTicketController = asyncHandler(async (req, res) => {
  const user = req.user;
  const ticketId = req.params.id;

  if (!user?.userId || !user?.role) {
    throw new AppError('Unauthorized', 401);
  }

  if (!ticketId) {
    throw new AppError('Ticket ID required', 400);
  }

  const parseResult = ticketAssignSchema.safeParse(req.body);

  if (!parseResult.success) {
    const messages = formatZodError(parseResult.error);
    throw new AppError(`Validation error: ${messages}`, 400);
  }

  const ticket = await assignTicketService(
    ticketId as string,
    user.userId,
    user.role,
    parseResult.data,
  );

  return successResponse(res, 'Ticket assigned successfully', { ticket });
});

export const updateTicketController = asyncHandler(async (req, res) => {
  const user = req.user;
  const ticketId = req.params.id;

  if (!user?.userId || !user?.role) {
    throw new AppError('Unauthorized', 401);
  }

  if (!ticketId) {
    throw new AppError('Ticket ID required', 400);
  }

  const parseResult = ticketUpdateSchema.safeParse(req.body);

  if (!parseResult.success) {
    const messages = formatZodError(parseResult.error);
    throw new AppError(`Validation error: ${messages}`, 400);
  }

  const ticket = await updateTicketService(
    ticketId as string,
    user.userId,
    user.role,
    parseResult.data,
  );

  return successResponse(res, 'Ticket updated successfully', { ticket });
});

export const getAssignedTicketsController = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user?.userId) {
    throw new AppError('Unauthorized', 401);
  }

  const tickets = await getAssignedTicketsService(user.userId);

  return successResponse(res, 'Assigned tickets fetched successfully', {
    tickets,
  });
});

export const updateTicketProgressController = asyncHandler(async (req, res) => {
  const user = req.user;
  const ticketId = req.params.id;

  if (!user?.userId) {
    throw new AppError('Unauthorized', 401);
  }

  if (!ticketId) {
    throw new AppError('Ticket ID required', 400);
  }

  const parseResult = ticketProgressSchema.safeParse(req.body);

  if (!parseResult.success) {
    const messages = formatZodError(parseResult.error);
    throw new AppError(`Validation error: ${messages}`, 400);
  }

  const ticket = await updateTicketProgressService(
    ticketId as string,
    user.userId,
    parseResult.data,
  );

  return successResponse(res, 'Ticket progress updated successfully', {
    ticket,
  });
});
