import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { unlockNewItems } from '@/lib/srs';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    const unlocked = await unlockNewItems(user.id);
    
    return NextResponse.json({
      message: 'Items unlocked',
      unlocked,
    });
  } catch (error) {
    console.error('Unlock items error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
