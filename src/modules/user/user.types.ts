import { roleEnum, userRoles, type UserRole } from './user.models';

export { roleEnum, userRoles };
export type { UserRole };

export const ALLOWED_USER_ROLES: readonly UserRole[] = userRoles;

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  createdAt: Date | null;
};

export type UpdateUserPayload = {
  name?: string;
  phone?: string;
  role?: UserRole;
};

export type TokenPayload = {
  userId: string;
  role: string;
};
