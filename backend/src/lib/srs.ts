import { query } from './db';
import { UserProgress, SRS_STAGES } from '../types';

// Calculate next review time based on SRS stage
export function calculateNextReview(srsStage: number): Date {
  const interval = SRS_STAGES[srsStage as keyof typeof SRS_STAGES].interval;
  return new Date(Date.now() + interval);
}

// Update SRS stage after review
export async function updateSRSStage(
  userId: number,
  itemType: 'kanji' | 'vocabulary',
  itemId: number,
  isCorrect: boolean
): Promise<{ oldStage: number; newStage: number }> {
  // Get current progress
  const progressResult = await query(
    `SELECT * FROM user_progress 
     WHERE user_id = $1 AND item_type = $2 AND item_id = $3`,
    [userId, itemType, itemId]
  );
  
  const progress: UserProgress = progressResult.rows[0];
  const oldStage = progress.srs_stage;
  let newStage = oldStage;
  
  if (isCorrect) {
    // Move forward
    newStage = Math.min(oldStage + 1, 6);
  } else {
    // Move back one stage
    newStage = Math.max(oldStage - 1, 0);
  }
  
  const nextReview = calculateNextReview(newStage);
  
  // Update progress
  await query(
    `UPDATE user_progress 
     SET srs_stage = $1, 
         available_at = $2, 
         last_reviewed_at = NOW(),
         correct_streak = CASE WHEN $3 THEN correct_streak + 1 ELSE 0 END,
         incorrect_count = CASE WHEN $3 THEN incorrect_count ELSE incorrect_count + 1 END
     WHERE user_id = $4 AND item_type = $5 AND item_id = $6`,
    [newStage, nextReview, isCorrect, userId, itemType, itemId]
  );
  
  return { oldStage, newStage };
}

export async function normalizeReviewAvailability(userId: number): Promise<void> {
  await query(
    `UPDATE user_progress
     SET available_at = NOW() + INTERVAL '5 minutes'
     WHERE user_id = $1
       AND srs_stage > 0
       AND available_at > NOW() + INTERVAL '5 minutes'`,
    [userId]
  );
}

// Unlock new items for lessons (max 10 per call)
export async function unlockNewItems(userId: number): Promise<number> {
  while (await checkLevelUp(userId)) {
    // Keep promoting if the user already satisfies the next level requirements.
  }

  const user = await query('SELECT current_level FROM users WHERE id = $1', [userId]);
  const currentLevel = user.rows[0].current_level;

  // Allow up to 10 items per unlock call (remove daily cap for testing)
  const canUnlock = 10;

  // Get kanji from current level that user doesn't have yet
  const availableKanji = await query(
    `SELECT id FROM kanji 
     WHERE level = $1 
     AND id NOT IN (
       SELECT item_id FROM user_progress 
       WHERE user_id = $2 AND item_type = 'kanji'
     )
     ORDER BY id
     LIMIT $3`,
    [currentLevel, userId, Math.ceil(canUnlock / 2)]
  );

  // Get vocabulary from current level that user doesn't have yet
  // and only if all required kanji are already learned (stage >= 4)
  const availableVocab = await query(
    `SELECT DISTINCT v.id 
     FROM vocabulary v
     LEFT JOIN vocabulary_kanji vk ON v.id = vk.vocabulary_id
     LEFT JOIN kanji k ON vk.kanji_id = k.id
     WHERE v.level = $1
     AND v.id NOT IN (
       SELECT item_id FROM user_progress 
       WHERE user_id = $2 AND item_type = 'vocabulary'
     )
     AND NOT EXISTS (
       SELECT 1 FROM vocabulary_kanji vk2
       JOIN kanji k2 ON vk2.kanji_id = k2.id
       WHERE vk2.vocabulary_id = v.id
       AND k2.id NOT IN (
         SELECT item_id FROM user_progress
         WHERE user_id = $2 AND item_type = 'kanji' AND srs_stage >= 4
       )
     )
     ORDER BY v.id
     LIMIT $3`,
    [currentLevel, userId, Math.floor(canUnlock / 2)]
  );

  // Insert progress records for new items
  let unlocked = 0;

  for (const kanji of availableKanji.rows) {
    await query(
      `INSERT INTO user_progress (user_id, item_type, item_id, srs_stage, unlocked_at, available_at)
       VALUES ($1, 'kanji', $2, 0, NOW(), NOW())`,
      [userId, kanji.id]
    );
    unlocked++;
  }

  for (const vocab of availableVocab.rows) {
    await query(
      `INSERT INTO user_progress (user_id, item_type, item_id, srs_stage, unlocked_at, available_at)
       VALUES ($1, 'vocabulary', $2, 0, NOW(), NOW())`,
      [userId, vocab.id]
    );
    unlocked++;
  }

  return unlocked;
}

// Check if user can level up
export async function checkLevelUp(userId: number): Promise<boolean> {
  const user = await query('SELECT current_level FROM users WHERE id = $1', [userId]);
  const currentLevel = user.rows[0].current_level;
  
  // Get all items for current level
  const levelItems = await query(
    `SELECT COUNT(*) as total FROM (
       SELECT id FROM kanji WHERE level = $1
       UNION ALL
       SELECT id FROM vocabulary WHERE level = $1
     ) items`,
    [currentLevel]
  );
  
  const totalItems = parseInt(levelItems.rows[0].total);
  
  // Get user's progress on current level items
  const progress = await query(
    `SELECT COUNT(*) as guru_plus FROM user_progress
     WHERE user_id = $1 
     AND (
       (item_type = 'kanji' AND item_id IN (SELECT id FROM kanji WHERE level = $2))
       OR
       (item_type = 'vocabulary' AND item_id IN (SELECT id FROM vocabulary WHERE level = $2))
     )
     AND srs_stage >= 4`,
    [userId, currentLevel]
  );
  
  const guruPlus = parseInt(progress.rows[0].guru_plus);
  
  // Check apprentice 4+ for the rest
  const apprentice = await query(
    `SELECT COUNT(*) as apprentice FROM user_progress
     WHERE user_id = $1 
     AND (
       (item_type = 'kanji' AND item_id IN (SELECT id FROM kanji WHERE level = $2))
       OR
       (item_type = 'vocabulary' AND item_id IN (SELECT id FROM vocabulary WHERE level = $2))
     )
     AND srs_stage >= 3 AND srs_stage < 4`,
    [userId, currentLevel]
  );
  
  const apprentice4Plus = parseInt(apprentice.rows[0].apprentice);
  
  // Need 90% guru+ and rest apprentice 4+
  const requirement = totalItems * 0.9;
  
  if (guruPlus >= requirement && (guruPlus + apprentice4Plus) >= totalItems) {
    // Level up!
    await query(
      'UPDATE users SET current_level = current_level + 1 WHERE id = $1',
      [userId]
    );
    return true;
  }
  
  return false;
}

// Get items available for lessons
export async function getAvailableLessons(userId: number, limit: number = 10) {
  const result = await query(
    `SELECT up.item_type, up.item_id, up.srs_stage,
       CASE 
         WHEN up.item_type = 'kanji' THEN row_to_json(k.*)
         WHEN up.item_type = 'vocabulary' THEN row_to_json(v.*)
       END as data
     FROM user_progress up
     LEFT JOIN kanji k ON up.item_type = 'kanji' AND up.item_id = k.id
     LEFT JOIN vocabulary v ON up.item_type = 'vocabulary' AND up.item_id = v.id
     WHERE up.user_id = $1 AND up.srs_stage = 0 AND up.available_at <= NOW()
     ORDER BY up.unlocked_at
     LIMIT $2`,
    [userId, limit]
  );
  
  return result.rows;
}

// Get items available for reviews
export async function getAvailableReviews(userId: number) {
  const result = await query(
    `SELECT up.item_type, up.item_id, up.srs_stage,
       CASE 
         WHEN up.item_type = 'kanji' THEN row_to_json(k.*)
         WHEN up.item_type = 'vocabulary' THEN row_to_json(v.*)
       END as data
     FROM user_progress up
     LEFT JOIN kanji k ON up.item_type = 'kanji' AND up.item_id = k.id
     LEFT JOIN vocabulary v ON up.item_type = 'vocabulary' AND up.item_id = v.id
     WHERE up.user_id = $1 AND up.srs_stage > 0 AND up.available_at <= NOW()
     ORDER BY up.available_at`,
    [userId]
  );
  
  return result.rows;
}
