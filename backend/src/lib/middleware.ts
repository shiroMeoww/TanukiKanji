import { NextRequest } from 'next/server';
import { getUserByToken } from './auth';
import { User } from '../types';

export interface AuthenticatedRequest extends NextRequest {
  user?: User;
}

export async function authenticate(request: NextRequest): Promise<User | null> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  const user = await getUserByToken(token);
  
  return user;
}

export async function requireAuth(request: NextRequest): Promise<User> {
  const user = await authenticate(request);
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  return user;
}

export async function requireAdmin(request: NextRequest): Promise<User> {
  const user = await requireAuth(request);
  
  if (user.role !== 'admin') {
    throw new Error('Forbidden - Admin access required');
  }
  
  return user;
}
