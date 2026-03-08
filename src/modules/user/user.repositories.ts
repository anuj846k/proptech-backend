import { eq, or } from 'drizzle-orm';
import { db } from '#db/db';
import { AppError } from '#utils/error';
import { users } from './user.models';
import type { PublicUser, UserRole } from './user.types';

type UserData = {
  name: string;
  email: string;
  hashedPassword: string;
  phone: string | null;
  role: UserRole;
};

export const registerUser = async (data: UserData) => {
  const { name, email, hashedPassword, phone, role } = data;
  const newUser = await db
    .insert(users)
    .values({
      name,
      email,
      passwordHash: hashedPassword,
      phone,
      role,
    })
    .returning();
  return newUser[0];
};

export const findExistingUser = async (email?: string, phone?: string) => {
  if (!email && !phone) {
    throw new AppError('Email or phone must be provided', 400);
  }

  const user = await db
    .select()
    .from(users)
    .where(
      or(
        email ? eq(users.email, email) : undefined,
        phone ? eq(users.phone, phone) : undefined,
      ),
    )
    .limit(1);

  return user[0] || null;
};

export const findUserById = async (id: string) => {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user || null;
};

export const listUsers = async (role?: UserRole): Promise<PublicUser[]> => {
  const query = db.select().from(users);

  const rows = role
    ? await db.select().from(users).where(eq(users.role, role))
    : await query;

  return rows.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    createdAt: u.createdAt,
  }));
};
export const updateUserById = async (
  id: string,
  data: Partial<Pick<UserData, 'name' | 'phone' | 'role'>>,
) => {
  const updateData: Partial<Pick<UserData, 'name' | 'phone' | 'role'>> = {};

  if (data.name !== undefined) {
    updateData.name = data.name;
  }
  if (data.phone !== undefined) {
    updateData.phone = data.phone;
  }
  if (data.role !== undefined) {
    updateData.role = data.role;
  }

  const [updated] = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, id))
    .returning();

  return updated || null;
};
