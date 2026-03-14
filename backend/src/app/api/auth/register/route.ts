import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword, generateToken, createSession } from '@/lib/auth';
import { z } from 'zod';

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = registerSchema.parse(body);
    
    // Check if username exists
    const existingUser = await query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );
    
    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      );
    }
    
    // Hash password
    const passwordHash = await hashPassword(password);
    
    // Create user
    const result = await query(
      `INSERT INTO users (username, password_hash, role, current_level)
       VALUES ($1, $2, 'user', 1)
       RETURNING id, username, role, current_level, created_at`,
      [username, passwordHash]
    );
    
    const user = result.rows[0];
    
    // Generate token and create session
    const token = generateToken(user.id);
    await createSession(user.id, token);
    
    return NextResponse.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        current_level: user.current_level,
        created_at: user.created_at,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Register error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
