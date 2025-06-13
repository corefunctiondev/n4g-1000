import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

// Use environment variables directly
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    isAdmin: boolean;
  };
}

// Authenticate admin user using Supabase Auth
export async function authenticateAdmin(email: string, password: string): Promise<{ user: any; session: any } | null> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      console.error('Auth error:', error?.message);
      return null;
    }

    // Check if user has admin role in user metadata
    const isAdmin = data.user.user_metadata?.is_admin === true;
    
    if (!isAdmin) {
      await supabase.auth.signOut();
      return null;
    }

    return data;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

// Verify admin session using Supabase Auth
export async function verifyAdminSession(accessToken: string): Promise<{ id: string; email: string; isAdmin: boolean } | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return null;
    }

    // Check if user has admin role
    const isAdmin = user.user_metadata?.is_admin === true;
    
    if (!isAdmin) {
      return null;
    }

    return {
      id: user.id,
      email: user.email || '',
      isAdmin,
    };
  } catch (error) {
    console.error('Session verification error:', error);
    return null;
  }
}

// Middleware to require admin authentication
export async function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const user = await verifyAdminSession(token);
    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
}

// Create admin user in Supabase Auth
export async function createAdminUser(email: string, password: string): Promise<any> {
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        is_admin: true
      }
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  }
}

// Update user admin status
export async function updateUserAdminStatus(userId: string, isAdmin: boolean): Promise<void> {
  try {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: {
        is_admin: isAdmin
      }
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error updating user admin status:', error);
    throw error;
  }
}