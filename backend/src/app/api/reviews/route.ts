import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { getAvailableReviews, normalizeReviewAvailability } from '@/lib/srs';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    await normalizeReviewAvailability(user.id);
    
    const reviews = await getAvailableReviews(user.id);
    
    // Create review items - for each item, we need both meaning and reading questions
    const reviewItems = [];
    
    for (const review of reviews) {
      // Always add meaning question
      reviewItems.push({
        type: review.item_type,
        id: review.item_id,
        question_type: 'meaning',
        data: review.data,
      });
      
      // Add reading question (for kanji and vocabulary)
      reviewItems.push({
        type: review.item_type,
        id: review.item_id,
        question_type: 'reading',
        data: review.data,
      });
    }
    
    // Shuffle items
    const shuffled = reviewItems.sort(() => Math.random() - 0.5);
    
    return NextResponse.json({
      reviews: shuffled,
      total: shuffled.length,
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
}
