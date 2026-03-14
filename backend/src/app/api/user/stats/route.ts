import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { query } from '@/lib/db';
import { normalizeReviewAvailability, unlockNewItems } from '@/lib/srs';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    await normalizeReviewAvailability(user.id);

    const initialLessonsResult = await query(
      `SELECT COUNT(*) as count FROM user_progress
       WHERE user_id = $1 AND srs_stage = 0 AND available_at <= NOW()`,
      [user.id]
    );

    if (parseInt(initialLessonsResult.rows[0].count) === 0) {
      await unlockNewItems(user.id);
    }
    
    // Get stats by SRS stage
    const stageStats = await query(
      `SELECT 
         srs_stage,
         item_type,
         COUNT(*) as count
       FROM user_progress
       WHERE user_id = $1 AND srs_stage > 0
       GROUP BY srs_stage, item_type`,
      [user.id]
    );
    
    // Count lessons available
    const lessonsResult = await query(
      `SELECT COUNT(*) as count FROM user_progress
       WHERE user_id = $1 AND srs_stage = 0 AND available_at <= NOW()`,
      [user.id]
    );
    
    // Count reviews available
    const reviewsResult = await query(
      `SELECT COUNT(*) as count FROM user_progress
       WHERE user_id = $1 AND srs_stage > 0 AND available_at <= NOW()`,
      [user.id]
    );
    
    // Get next review time
    const nextReviewResult = await query(
      `SELECT MIN(available_at) as next_review FROM user_progress
       WHERE user_id = $1 AND srs_stage > 0 AND available_at > NOW()`,
      [user.id]
    );
    
    // Get total kanji and vocabulary counts
    const kanjiTotalResult = await query(
      `SELECT COUNT(*) as count FROM kanji WHERE level <= $1`,
      [user.current_level]
    );
    
    const vocabTotalResult = await query(
      `SELECT COUNT(*) as count FROM vocabulary WHERE level <= $1`,
      [user.current_level]
    );
    
    const kanjiLearnedResult = await query(
      `SELECT COUNT(*) as count FROM user_progress
       WHERE user_id = $1 AND item_type = 'kanji' AND srs_stage >= 4`,
      [user.id]
    );
    
    const vocabLearnedResult = await query(
      `SELECT COUNT(*) as count FROM user_progress
       WHERE user_id = $1 AND item_type = 'vocabulary' AND srs_stage >= 4`,
      [user.id]
    );
    
    // Build item spread
    const itemSpread = {
      apprentice: { radicals: 0, kanji: 0, vocabulary: 0 },
      guru: { radicals: 0, kanji: 0, vocabulary: 0 },
      master: { radicals: 0, kanji: 0, vocabulary: 0 },
      enlightened: { radicals: 0, kanji: 0, vocabulary: 0 },
      burned: { radicals: 0, kanji: 0, vocabulary: 0 },
    };
    
    stageStats.rows.forEach(row => {
      const count = parseInt(row.count, 10);
      const srsStage = Number(row.srs_stage);
      const itemType = row.item_type as 'kanji' | 'vocabulary';

      // Item spread in dashboard is currently kanji-only.
      if (itemType !== 'kanji') return;

      if (srsStage >= 1 && srsStage <= 3) {
        itemSpread.apprentice.kanji += count;
      } else if (srsStage >= 4 && srsStage <= 5) {
        itemSpread.guru.kanji += count;
      } else if (srsStage === 6) {
        itemSpread.master.kanji += count;
      }
    });
    
    const stats = {
      apprentice: itemSpread.apprentice.kanji,
      guru: itemSpread.guru.kanji,
      master: itemSpread.master.kanji,
      enlightened: 0,
      burned: 0,
    };
    
    return NextResponse.json({
      stats: {
        ...stats,
        total_items: stats.apprentice + stats.guru + stats.master,
        lessons_available: parseInt(lessonsResult.rows[0].count),
        reviews_available: parseInt(reviewsResult.rows[0].count),
        next_review_date: nextReviewResult.rows[0].next_review,
        kanji_total: parseInt(kanjiTotalResult.rows[0].count),
        kanji_learned: parseInt(kanjiLearnedResult.rows[0].count),
        vocab_total: parseInt(vocabTotalResult.rows[0].count),
        vocab_learned: parseInt(vocabLearnedResult.rows[0].count),
      },
      item_spread: itemSpread,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
}
