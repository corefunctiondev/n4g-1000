import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';

// Extract Supabase credentials
const rawSupabaseUrl = process.env.SUPABASE_URL;
const supabaseUrl = rawSupabaseUrl?.includes('=') ? rawSupabaseUrl.split('=')[1] : rawSupabaseUrl;

const rawSupabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseAnonKey = rawSupabaseKey?.includes('=') ? rawSupabaseKey.split('=')[1] : rawSupabaseKey;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

  const { error } = await supabase
    .from('admin_sessions')
    .insert({
      user_id: userId,
      session_token: sessionToken,
      expires_at: expiresAt.toISOString()
    });

  if (error) {
    throw new Error(`Failed to create admin session: ${error.message}`);
  }

  return sessionToken;
}

// Verify admin session
export async function verifyAdminSession(sessionToken: string): Promise<{ id: number; username: string; isAdmin: boolean } | null> {
  const { data: session, error } = await supabase
    .from('admin_sessions')
    .select(`
      user_id,
      users!inner(id, username, is_admin)
    `)
    .eq('session_token', sessionToken)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !session) {
    return null;
  }

  const user = Array.isArray(session.users) ? session.users[0] : session.users;
  
  return {
    id: session.user_id,
    username: user.username,
    isAdmin: user.is_admin,
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
  await supabase
    .from('admin_sessions')
    .delete()
    .lt('expires_at', now.toISOString());
}