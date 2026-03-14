import { NextRequest, NextResponse } from 'next/server';
import { deleteSession } from '@/lib/auth';
import { requireAuth } from '@/lib/middleware';

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);
    
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      await deleteSession(token);
    }
    
    return NextResponse.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
}
