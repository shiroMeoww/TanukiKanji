// Database types
export interface User {
  id: number;
  username: string;
  password_hash: string;
  role: 'user' | 'admin';
  current_level: number;
  created_at: Date;
  updated_at: Date;
}

export interface Session {
  id: number;
  user_id: number;
  token: string;
  expires_at: Date;
  created_at: Date;
}

export interface Kanji {
  id: number;
  character: string;
  meaning: string;
  on_reading: string | null;
  kun_reading: string | null;
  level: number;
  created_at: Date;
}

export interface Vocabulary {
  id: number;
  word: string;
  reading: string;
  meaning: string;
  level: number;
  created_at: Date;
}

export interface UserProgress {
  id: number;
  user_id: number;
  item_type: 'kanji' | 'vocabulary';
  item_id: number;
  srs_stage: number; // 0-6
  unlocked_at: Date | null;
  available_at: Date | null;
  last_reviewed_at: Date | null;
  correct_streak: number;
  incorrect_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface ReviewHistory {
  id: number;
  user_id: number;
  item_type: 'kanji' | 'vocabulary';
  item_id: number;
  question_type: 'meaning' | 'reading';
  user_answer: string;
  correct_answer: string;
  is_correct: boolean;
  srs_stage_before: number;
  srs_stage_after: number;
  reviewed_at: Date;
}

// API types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    username: string;
    role: string;
    current_level: number;
  };
}

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface LessonItem {
  type: 'kanji' | 'vocabulary';
  id: number;
  data: Kanji | Vocabulary;
}

export interface ReviewItem {
  type: 'kanji' | 'vocabulary';
  id: number;
  question_type: 'meaning' | 'reading';
  data: Kanji | Vocabulary;
}

export interface ReviewAnswer {
  item_type: 'kanji' | 'vocabulary';
  item_id: number;
  question_type: 'meaning' | 'reading';
  answer: string;
}

export interface ReviewResult {
  is_correct: boolean;
  correct_answer: string;
  srs_stage_before: number;
  srs_stage_after: number;
}

export interface UserStats {
  total_items: number;
  apprentice: number;
  guru: number;
  master: number;
  enlightened: number;
  burned: number;
  lessons_available: number;
  reviews_available: number;
  next_review_date: Date | null;
}

export interface DashboardData {
  stats: UserStats;
  upcoming_reviews: {
    hour: string;
    count: number;
  }[];
}

// SRS stage definitions
export const SRS_STAGES = {
  0: { name: 'Lesson', interval: 0 },
  // For testing
  1: { name: 'Apprentice 1', interval: 5 * 60 * 1000 }, // 5 minutes
  2: { name: 'Apprentice 2', interval: 5 * 60 * 1000 }, // 5 minutes
  3: { name: 'Apprentice 3', interval: 5 * 60 * 1000 }, // 5 minutes
  4: { name: 'Guru 1', interval: 5 * 60 * 1000 }, // 5 minutes
  5: { name: 'Guru 2', interval: 5 * 60 * 1000 }, // 5 minutes
  6: { name: 'Master', interval: 5 * 60 * 1000 }, // 5 minutes
} as const;

export type SRSStage = keyof typeof SRS_STAGES;
