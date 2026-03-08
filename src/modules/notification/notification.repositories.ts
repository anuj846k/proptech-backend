import { eq, and, desc } from 'drizzle-orm';
import { db } from '#db/db';
import { notifications } from './notification.models';

type CreateNotificationInput = {
  userId: string;
  message: string;
  ticketId: string;
};

export const createNotification = async (data: CreateNotificationInput) => {
  const [row] = await db
    .insert(notifications)
    .values({
      userId: data.userId,
      message: data.message,
      ticketId: data.ticketId,
    })
    .returning();
  return row ?? null;
};

export const findNotificationsByUserId = async (userId: string) => {
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt));
  return rows;
};

export const findNotificationById = async (id: string) => {
  const [row] = await db
    .select()
    .from(notifications)
    .where(eq(notifications.id, id))
    .limit(1);
  return row ?? null;
};

export const markNotificationAsRead = async (id: string, userId: string) => {
  const [updated] = await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
    .returning();
  return updated ?? null;
};
