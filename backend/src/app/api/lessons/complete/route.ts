import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { query } from '@/lib/db';
import { z } from 'zod';

const completeLessonSchema = z.object({
  items: z.array(z.object({
    type: z.enum(['kanji', 'vocabulary']),
    id: z.number(),
  })),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const { items } = completeLessonSchema.parse(body);
    
    // Move items from lesson (stage 0) to first review (stage 1)
    // Set available_at to NOW() instead of adding 4h cooldown
    for (const item of items) {
      await query(
        `UPDATE user_progress 
         SET srs_stage = 1, available_at = NOW(), last_reviewed_at = NOW()
         WHERE user_id = $1 AND item_type = $2 AND item_id = $3 AND srs_stage = 0`,
        [user.id, item.type, item.id]
      );
    }
    
    return NextResponse.json({
      message: 'Lessons completed',
      completed: items.length,
    });
  } catch (error) {
    console.error('Complete lesson error:', error);
    
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
