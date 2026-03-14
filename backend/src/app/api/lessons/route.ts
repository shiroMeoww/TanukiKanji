import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { getAvailableLessons, unlockNewItems } from '@/lib/srs';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    let lessons = await getAvailableLessons(user.id, 10);

    if (lessons.length === 0) {
      await unlockNewItems(user.id);
      lessons = await getAvailableLessons(user.id, 10);
    }
    
    return NextResponse.json({
      lessons: lessons.map(lesson => ({
        type: lesson.item_type,
        id: lesson.item_id,
        data: lesson.data,
      })),
    });
  } catch (error) {
    console.error('Get lessons error:', error);
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
}
