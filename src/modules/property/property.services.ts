import { AppError } from '#utils/error';
import logger from '#utils/logger';
import type { PropertyCreateInput } from '#validations/property.validations';
import {
  createProperty,
  findOccupancyByManagerId,
  findOccupancyByOwnerId,
  findPropertiesByManagerId,
  findPropertiesByOwnerId,
  findPropertyById,
  findPropertyByNameAndOwner,
  findUnitsByPropertyId,
  updatePropertyManager,
} from './property.repositories';
import { findUserById } from '../user/user.repositories';

export const createPropertyService = async (
  ownerId: string,
  data: PropertyCreateInput,
) => {
  try {
    logger.info(
      `createPropertyService called by ownerId=${ownerId} name=${data.name}`,
    );

    const existing = await findPropertyByNameAndOwner(data.name, ownerId);
    if (existing) {
      throw new AppError('Property with this name already exists', 400);
    }

    const property = await createProperty({
      name: data.name,
      address: data.address,
      ownerId,
    });

    logger.info(`Property created id=${property?.id} by ownerId=${ownerId}`);
    return property;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`createPropertyService error: ${message}`);
    throw error;
  }
};

export const getPropertiesService = async (userId: string, role: string) => {
  try {
    if (role === 'ADMIN') {
      logger.info(`getPropertiesService for ownerId=${userId}`);
      const props = await findPropertiesByOwnerId(userId);
      logger.info(`Fetched ${props.length} properties for ownerId=${userId}`);
      return props;
    }

    if (role === 'MANAGER') {
      logger.info(`getPropertiesService for managerId=${userId}`);
      const props = await findPropertiesByManagerId(userId);
      logger.info(`Fetched ${props.length} properties for managerId=${userId}`);
      return props;
    }

    throw new AppError('Unauthorized', 403);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`getPropertiesService error: ${message}`);
    throw error;
  }
};

export const getPropertyByIdService = async (
  propertyId: string,
  userId: string,
  role: string,
) => {
  const property = await findPropertyById(propertyId);
  if (!property) {
    throw new AppError('Property not found', 404);
  }

  const isOwner = property.ownerId === userId;
  const isManager = property.managerId === userId;

  if (role === 'ADMIN' && !isOwner) {
    throw new AppError('You can only view properties you own', 403);
  }

  if (role === 'MANAGER' && !isManager) {
    throw new AppError('You can only view properties you manage', 403);
  }

  const unitsList = await findUnitsByPropertyId(propertyId);
  return { property, units: unitsList };
};

export const assignManagerToPropertyService = async (
  propertyId: string,
  ownerId: string,
  newManagerId: string,
) => {
  const property = await findPropertyById(propertyId);
  if (!property) {
    throw new AppError('Property not found', 404);
  }

  if (property.ownerId !== ownerId) {
    throw new AppError('Only the owner can assign a manager', 403);
  }

  const user = await findUserById(newManagerId);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  if (user.role !== 'MANAGER') {
    throw new AppError('Target user must have role MANAGER', 400);
  }

  const updated = await updatePropertyManager(propertyId, newManagerId);
  logger.info(
    `Property ${propertyId} assigned to manager ${newManagerId} by owner ${ownerId}`,
  );
  return updated;
};

export const getOccupancyService = async (userId: string, role: string) => {
  try {
    if (role === 'ADMIN') {
      const results = await findOccupancyByOwnerId(userId);
      logger.info(
        `Fetched occupancy for ${results.length} properties (ownerId=${userId})`,
      );
      return results;
    }
    if (role === 'MANAGER') {
      const results = await findOccupancyByManagerId(userId);
      logger.info(
        `Fetched occupancy for ${results.length} properties (managerId=${userId})`,
      );
      return results;
    }
    throw new AppError('Unauthorized', 403);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`getOccupancyService error: ${message}`);
    throw error;
  }
};
