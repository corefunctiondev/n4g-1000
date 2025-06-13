import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from './db';
import { users, adminSessions } from '@shared/schema';
import { eq, and, gt, lt, sql } from 'drizzle-orm';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    isAdmin: boolean;
  };
}

// Generate secure session token
export function generateSessionToken(): string {
  return uuidv4();
}

// Hash password with bcrypt
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

// Verify password with bcrypt
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Create admin session
export async function createAdminSession(userId: number): Promise<string> {
  const sessionToken = generateSessionToken();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour session

  await db.insert(adminSessions).values({
    userId,
    sessionToken,
    expiresAt,
  });

  return sessionToken;
}

// Verify admin session
export async function verifyAdminSession(sessionToken: string): Promise<{ id: number; username: string; isAdmin: boolean } | null> {
  const session = await db
    .select({
      userId: adminSessions.userId,
      username: users.username,
      isAdmin: users.isAdmin,
    })
    .from(adminSessions)
    .innerJoin(users, eq(adminSessions.userId, users.id))
    .where(
      and(
        eq(adminSessions.sessionToken, sessionToken),
        gt(adminSessions.expiresAt, new Date())
      )
    )
    .limit(1);

  if (session.length === 0) {
    return null;
  }

  return {
    id: session[0].userId,
    username: session[0].username,
    isAdmin: session[0].isAdmin,
  };
}

// Middleware to check admin authentication
export async function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const sessionToken = req.cookies?.adminSession || req.headers.authorization?.replace('Bearer ', '');

  if (!sessionToken) {
    return res.status(401).json({ error: 'No session token provided' });
  }

  const user = await verifyAdminSession(sessionToken);

  if (!user || !user.isAdmin) {
    return res.status(403).json({ error: 'Access denied - admin privileges required' });
  }

  req.user = user;
  next();
}

// Clean up expired sessions
export async function cleanupExpiredSessions() {
  const now = new Date();
  await db.delete(adminSessions).where(
    lt(adminSessions.expiresAt, now)
  );
}