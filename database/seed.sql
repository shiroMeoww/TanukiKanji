-- Seed data for Tanuki Kanji
-- 3 levels with simple kanji and vocabulary

-- Level 1 Kanji (10 items)
INSERT INTO kanji (character, meaning, on_reading, kun_reading, level) VALUES
('一', 'one', 'いち、いつ', 'ひと、ひとつ', 1),
('二', 'two', 'に', 'ふた、ふたつ', 1),
('三', 'three', 'さん', 'み、みつ', 1),
('人', 'person', 'じん、にん', 'ひと', 1),
('日', 'day, sun', 'にち、じつ', 'ひ、か', 1),
('月', 'month, moon', 'げつ、がつ', 'つき', 1),
('火', 'fire', 'か', 'ひ', 1),
('水', 'water', 'すい', 'みず', 1),
('木', 'tree, wood', 'もく、ぼく', 'き', 1),
('金', 'gold, money', 'きん、こん', 'かね', 1);

-- Level 2 Kanji (10 items)
INSERT INTO kanji (character, meaning, on_reading, kun_reading, level) VALUES
('大', 'big', 'だい、たい', 'おお', 2),
('小', 'small', 'しょう', 'ちい、こ', 2),
('中', 'middle, inside', 'ちゅう', 'なか', 2),
('山', 'mountain', 'さん', 'やま', 2),
('川', 'river', 'せん', 'かわ', 2),
('田', 'rice field', 'でん', 'た', 2),
('土', 'earth, soil', 'ど、と', 'つち', 2),
('上', 'up, above', 'じょう', 'うえ、あ', 2),
('下', 'down, below', 'か、げ', 'した、しも', 2),
('本', 'book, origin', 'ほん', 'もと', 2);

-- Level 3 Kanji (10 items)
INSERT INTO kanji (character, meaning, on_reading, kun_reading, level) VALUES
('女', 'woman', 'じょ、にょ', 'おんな', 3),
('子', 'child', 'し、す', 'こ', 3),
('学', 'learning', 'がく', 'まな', 3),
('生', 'life, birth', 'せい、しょう', 'い、う、なま', 3),
('先', 'before, ahead', 'せん', 'さき', 3),
('手', 'hand', 'しゅ', 'て', 3),
('力', 'power', 'りょく、りき', 'ちから', 3),
('気', 'spirit, mood', 'き、け', '', 3),
('年', 'year', 'ねん', 'とし', 3),
('時', 'time, hour', 'じ', 'とき', 3);

-- Level 1 Vocabulary (10 items)
INSERT INTO vocabulary (word, reading, meaning, level) VALUES
('ひとつ', 'ひとつ', 'one (thing)', 1),
('ふたつ', 'ふたつ', 'two (things)', 1),
('みっつ', 'みっつ', 'three (things)', 1),
('ひとり', 'ひとり', 'one person, alone', 1),
('ふたり', 'ふたり', 'two people', 1),
('一日', 'いちにち', 'one day', 1),
('二日', 'ふつか', 'two days, 2nd day', 1),
('月火', 'げつか', 'Monday and Tuesday', 1),
('火水', 'かすい', 'Tuesday and Wednesday', 1),
('水木', 'すいもく', 'Wednesday and Thursday', 1);

-- Level 2 Vocabulary (10 items)
INSERT INTO vocabulary (word, reading, meaning, level) VALUES
('大小', 'だいしょう', 'large and small, size', 2),
('中山', 'なかやま', 'middle mountain', 2),
('山川', 'やまかわ', 'mountains and rivers', 2),
('田中', 'たなか', 'Tanaka (surname)', 2),
('土下', 'どげ', 'prostration', 2),
('上下', 'じょうげ', 'up and down', 2),
('大人', 'おとな', 'adult', 2),
('小人', 'こびと', 'dwarf, small person', 2),
('日本', 'にほん', 'Japan', 2),
('本日', 'ほんじつ', 'today', 2);

-- Level 3 Vocabulary (10 items)
INSERT INTO vocabulary (word, reading, meaning, level) VALUES
('女子', 'じょし', 'girl, woman', 3),
('男子', 'だんし', 'boy, man', 3),
('子供', 'こども', 'child', 3),
('学生', 'がくせい', 'student', 3),
('先生', 'せんせい', 'teacher', 3),
('手本', 'てほん', 'model, example', 3),
('人気', 'にんき', 'popularity', 3),
('火力', 'かりょく', 'thermal power', 3),
('一年', 'いちねん', 'one year', 3),
('時間', 'じかん', 'time, hours', 3);

-- Link vocabulary to kanji (vocabulary_kanji table)
-- Level 1 vocab
INSERT INTO vocabulary_kanji (vocabulary_id, kanji_id) VALUES
(1, 1), -- ひとつ uses 一
(2, 2), -- ふたつ uses 二
(3, 3), -- みっつ uses 三
(4, 1), (4, 4), -- ひとり uses 一,人
(5, 2), (5, 4), -- ふたり uses 二,人
(6, 1), (6, 5), -- 一日 uses 一,日
(7, 2), (7, 5), -- 二日 uses 二,日
(8, 6), (8, 7), -- 月火 uses 月,火
(9, 7), (9, 8), -- 火水 uses 火,水
(10, 8), (10, 9); -- 水木 uses 水,木

-- Level 2 vocab
INSERT INTO vocabulary_kanji (vocabulary_id, kanji_id) VALUES
(11, 11), (11, 12), -- 大小 uses 大,小
(12, 13), (12, 14), -- 中山 uses 中,山
(13, 14), (13, 15), -- 山川 uses 山,川
(14, 16), (14, 13), -- 田中 uses 田,中
(15, 17), (15, 19), -- 土下 uses 土,下
(16, 18), (16, 19), -- 上下 uses 上,下
(17, 11), (17, 4), -- 大人 uses 大,人
(18, 12), (18, 4), -- 小人 uses 小,人
(19, 5), (19, 20), -- 日本 uses 日,本
(20, 20), (20, 5); -- 本日 uses 本,日

-- Level 3 vocab
INSERT INTO vocabulary_kanji (vocabulary_id, kanji_id) VALUES
(21, 21), (21, 22), -- 女子 uses 女,子
(22, 22), -- 男子 uses 子 (男 not in our kanji yet)
(23, 22), -- 子供 uses 子
(24, 23), (24, 24), -- 学生 uses 学,生
(25, 25), (25, 24), -- 先生 uses 先,生
(26, 26), (26, 20), -- 手本 uses 手,本
(27, 4), (27, 28), -- 人気 uses 人,気
(28, 7), (28, 27), -- 火力 uses 火,力
(29, 1), (29, 29), -- 一年 uses 一,年
(30, 30); -- 時間 uses 時

-- Demo admin user (password: admin123)
-- Password hash for 'admin123' using bcrypt
INSERT INTO users (username, password_hash, role, current_level) VALUES
('admin', '$2b$10$rXKLzKqHqKqGqHqKqHqKq.KqHqKqHqKqHqKqHqKqHqKqHqKqHqKq', 'admin', 3);

-- Demo regular user (password: user123)
INSERT INTO users (username, password_hash, role, current_level) VALUES
('testuser', '$2b$10$rXKLzKqHqKqGqHqKqHqKq.KqHqKqHqKqHqKqHqKqHqKqHqKqHqKq', 'user', 1);