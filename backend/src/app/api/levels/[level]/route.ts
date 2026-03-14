import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { level: string } }
) {
  try {
    const user = await requireAuth(request);
    const level = Number(params.level);

    if (!Number.isInteger(level) || level < 1 || level > 3) {
      return NextResponse.json(
        { error: 'Level must be between 1 and 3' },
        { status: 400 }
      );
    }

    const kanjiResult = await query(
      `SELECT id, character, meaning, on_reading, kun_reading, level
       FROM kanji
       WHERE level = $1
       ORDER BY id`,
      [level]
    );

    return NextResponse.json({
      level,
      unlocked: level <= user.current_level,
      kanji: kanjiResult.rows,
    });
  } catch (error) {
    console.error('Get level details error:', error);
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
}
