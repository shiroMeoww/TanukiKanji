import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { query } from '@/lib/db';
import { updateSRSStage, checkLevelUp } from '@/lib/srs';
import { z } from 'zod';

function normalizeAnswer(value: string) {
  return value.trim().toLowerCase();
}

function splitAcceptedAnswers(value: string | null | undefined) {
  return (value || '')
    .split(/,|、|;/)
    .map(part => normalizeAnswer(part))
    .filter(Boolean);
}

const submitAnswerSchema = z.object({
  item_type: z.enum(['kanji', 'vocabulary']),
  item_id: z.number(),
  question_type: z.enum(['meaning', 'reading']),
  answer: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const { item_type, item_id, question_type, answer } = submitAnswerSchema.parse(body);
    
    // Get the item
    const itemTable = item_type === 'kanji' ? 'kanji' : 'vocabulary';
    const itemResult = await query(
      `SELECT * FROM ${itemTable} WHERE id = $1`,
      [item_id]
    );
    
    if (itemResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }
    
    const item = itemResult.rows[0];
    let correctAnswer = '';
    let isCorrect = false;
    const normalizedAnswer = normalizeAnswer(answer);
    
    // Check answer based on question type
    if (question_type === 'meaning') {
      const acceptedMeanings = splitAcceptedAnswers(item.meaning);
      correctAnswer = acceptedMeanings.join(' / ');
      isCorrect = acceptedMeanings.includes(normalizedAnswer);
    } else if (question_type === 'reading') {
      if (item_type === 'kanji') {
        // Accept either on or kun reading
        const onReadings = splitAcceptedAnswers(item.on_reading);
        const kunReadings = splitAcceptedAnswers(item.kun_reading);
        const acceptedReadings = [...onReadings, ...kunReadings];
        correctAnswer = acceptedReadings.join(' / ');
        isCorrect = acceptedReadings.includes(normalizedAnswer);
      } else {
        // Vocabulary has single reading
        correctAnswer = item.reading.toLowerCase();
        isCorrect = normalizedAnswer === correctAnswer;
      }
    }
    
    // Update SRS stage
    const { oldStage, newStage } = await updateSRSStage(
      user.id,
      item_type,
      item_id,
      isCorrect
    );
    
    // Record in history
    await query(
      `INSERT INTO review_history 
       (user_id, item_type, item_id, question_type, user_answer, correct_answer, is_correct, srs_stage_before, srs_stage_after)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [user.id, item_type, item_id, question_type, answer, correctAnswer, isCorrect, oldStage, newStage]
    );
    
    // Check if user can level up
    const leveledUp = await checkLevelUp(user.id);
    
    return NextResponse.json({
      is_correct: isCorrect,
      correct_answer: correctAnswer,
      srs_stage_before: oldStage,
      srs_stage_after: newStage,
      leveled_up: leveledUp,
    });
  } catch (error) {
    console.error('Submit answer error:', error);
    
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
