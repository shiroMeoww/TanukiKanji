-- Tanuki Kanji Database Schema

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    current_level INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Kanji table
CREATE TABLE kanji (
    id SERIAL PRIMARY KEY,
    character VARCHAR(10) UNIQUE NOT NULL,
    meaning VARCHAR(255) NOT NULL,
    on_reading VARCHAR(100),
    kun_reading VARCHAR(100),
    level INTEGER NOT NULL CHECK (level >= 1 AND level <= 60),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vocabulary table
CREATE TABLE vocabulary (
    id SERIAL PRIMARY KEY,
    word VARCHAR(50) NOT NULL,
    reading VARCHAR(100) NOT NULL,
    meaning VARCHAR(255) NOT NULL,
    level INTEGER NOT NULL CHECK (level >= 1 AND level <= 60),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Many-to-many relationship between vocabulary and kanji
CREATE TABLE vocabulary_kanji (
    vocabulary_id INTEGER REFERENCES vocabulary(id) ON DELETE CASCADE,
    kanji_id INTEGER REFERENCES kanji(id) ON DELETE CASCADE,
    PRIMARY KEY (vocabulary_id, kanji_id)
);

-- User progress for both kanji and vocabulary
CREATE TABLE user_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('kanji', 'vocabulary')),
    item_id INTEGER NOT NULL,
    srs_stage INTEGER DEFAULT 0 CHECK (srs_stage >= 0 AND srs_stage <= 6),
    -- Stages: 0=lesson, 1=4h, 2=8h, 3=2d, 4=6d, 5=10d, 6=30d
    unlocked_at TIMESTAMP,
    available_at TIMESTAMP,
    last_reviewed_at TIMESTAMP,
    correct_streak INTEGER DEFAULT 0,
    incorrect_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, item_type, item_id)
);

-- Review history
CREATE TABLE review_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('kanji', 'vocabulary')),
    item_id INTEGER NOT NULL,
    question_type VARCHAR(20) NOT NULL CHECK (question_type IN ('meaning', 'reading')),
    user_answer TEXT,
    correct_answer TEXT,
    is_correct BOOLEAN NOT NULL,
    srs_stage_before INTEGER,
    srs_stage_after INTEGER,
    reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_kanji_level ON kanji(level);
CREATE INDEX idx_vocabulary_level ON vocabulary(level);
CREATE INDEX idx_user_progress_user_item ON user_progress(user_id, item_type, item_id);
CREATE INDEX idx_user_progress_available ON user_progress(user_id, available_at);
CREATE INDEX idx_review_history_user ON review_history(user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON user_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
