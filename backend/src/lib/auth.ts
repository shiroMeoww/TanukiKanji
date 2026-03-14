import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from './db';
import { User, Session } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SALT_ROUNDS = 10;

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Generate JWT token
export function generateToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

// Verify JWT token
export function verifyToken(token: string): { userId: number } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number };
  } catch (error) {
    return null;
  }
}

// Create session in database
export async function createSession(userId: number, token: string): Promise<Session> {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  
  const result = await query(
    'INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3) RETURNING *',
    [userId, token, expiresAt]
  );
  
  return result.rows[0];
}

// Get session from database
export async function getSession(token: string): Promise<Session | null> {
  const result = await query(
    'SELECT * FROM sessions WHERE token = $1 AND expires_at > NOW()',
    [token]
  );
  
  return result.rows[0] || null;
}

// Delete session
export async function deleteSession(token: string): Promise<void> {
  await query('DELETE FROM sessions WHERE token = $1', [token]);
}

// Get user by session token
export async function getUserByToken(token: string): Promise<User | null> {
  // Full JWT verification: signature + expiry must be valid.
  const payload = verifyToken(token);
  if (!payload) return null;

  // Session check keeps logout/revocation behavior.
  const session = await getSession(token);
  if (!session) return null;

  // Defensive check: token payload must match session owner.
  if (session.user_id !== payload.userId) return null;
  
  const result = await query(
    'SELECT id, username, role, current_level, created_at, updated_at FROM users WHERE id = $1',
    [session.user_id]
  );
  
  return result.rows[0] || null;
}

// Clean expired sessions (run periodically)
export async function cleanExpiredSessions(): Promise<void> {
  await query('DELETE FROM sessions WHERE expires_at < NOW()');
}
