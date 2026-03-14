# API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "username": "string (min 3, max 50)",
  "password": "string (min 6)"
}
```

**Response (201):**
```json
{
  "token": "jwt-token-string",
  "user": {
    "id": 1,
    "username": "testuser",
    "role": "user",
    "current_level": 1
  }
}
```

**Errors:**
- `400` - Invalid input
- `409` - Username already exists

---

#### Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response (200):**
```json
{
  "token": "jwt-token-string",
  "user": {
    "id": 1,
    "username": "testuser",
    "role": "user",
    "current_level": 1
  }
}
```

**Errors:**
- `400` - Invalid input
- `401` - Invalid credentials

---

#### Logout
```http
POST /auth/logout
```

**Headers:**
- `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

---

### User

#### Get Profile
```http
GET /user/profile
```

**Headers:**
- `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "id": 1,
  "username": "testuser",
  "role": "user",
  "current_level": 1,
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

---

#### Get Statistics
```http
GET /user/stats
```

**Headers:**
- `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "stats": {
    "total_items": 50,
    "apprentice": 20,
    "guru": 15,
    "master": 10,
    "enlightened": 5,
    "burned": 0,
    "lessons_available": 5,
    "reviews_available": 12,
    "next_review_date": "2024-01-01T12:00:00.000Z"
  },
  "upcoming_reviews": [
    {
      "hour": "2024-01-01T12:00:00.000Z",
      "count": 5
    }
  ]
}
```

---

### Lessons

#### Get Available Lessons
```http
GET /lessons
```

**Headers:**
- `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "lessons": [
    {
      "type": "kanji",
      "id": 1,
      "data": {
        "id": 1,
        "character": "一",
        "meaning": "one",
        "on_reading": "イチ、イツ",
        "kun_reading": "ひと、ひとつ",
        "level": 1
      }
    },
    {
      "type": "vocabulary",
      "id": 1,
      "data": {
        "id": 1,
        "word": "ひとつ",
        "reading": "ひとつ",
        "meaning": "one (thing)",
        "level": 1
      }
    }
  ]
}
```

---

#### Complete Lessons
```http
POST /lessons/complete
```

**Headers:**
- `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "items": [
    { "type": "kanji", "id": 1 },
    { "type": "vocabulary", "id": 1 }
  ]
}
```

**Response (200):**
```json
{
  "message": "Lessons completed",
  "completed": 2
}
```

---

#### Unlock New Items
```http
POST /lessons/unlock
```

**Headers:**
- `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "Items unlocked",
  "unlocked": 5
}
```

**Notes:**
- Max 10 new items per day
- Unlocks kanji and vocabulary from user's current level
- Vocabulary only unlocks if required kanji are at Guru+ (stage 4+)

---

### Reviews

#### Get Available Reviews
```http
GET /reviews
```

**Headers:**
- `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "reviews": [
    {
      "type": "kanji",
      "id": 1,
      "question_type": "meaning",
      "data": {
        "id": 1,
        "character": "一",
        "meaning": "one",
        "on_reading": "イチ、イツ",
        "kun_reading": "ひと、ひとつ",
        "level": 1
      }
    },
    {
      "type": "kanji",
      "id": 1,
      "question_type": "reading",
      "data": {
        "id": 1,
        "character": "一",
        "meaning": "one",
        "on_reading": "イチ、イツ",
        "kun_reading": "ひと、ひとつ",
        "level": 1
      }
    }
  ],
  "total": 2
}
```

**Notes:**
- Each item appears twice: once for meaning, once for reading
- Reviews are shuffled randomly

---

#### Submit Review Answer
```http
POST /reviews/submit
```

**Headers:**
- `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "item_type": "kanji",
  "item_id": 1,
  "question_type": "meaning",
  "answer": "one"
}
```

**Response (200):**
```json
{
  "is_correct": true,
  "correct_answer": "one",
  "srs_stage_before": 2,
  "srs_stage_after": 3,
  "leveled_up": false
}
```

**Notes:**
- Answers are case-insensitive
- For kanji readings, either on or kun reading is accepted
- Correct answer moves item up one SRS stage
- Incorrect answer moves item down one SRS stage
- `leveled_up` is true if this review triggered a level up

---

## SRS Stages

| Stage | Name | Interval | Description |
|-------|------|----------|-------------|
| 0 | Lesson | - | Item is in lessons queue |
| 1 | Apprentice 1 | 4 hours | First review |
| 2 | Apprentice 2 | 8 hours | Second review |
| 3 | Apprentice 3 | 2 days | Third review |
| 4 | Guru 1 | 6 days | Item is considered "learned" |
| 5 | Guru 2 | 10 days | Reinforcement |
| 6 | Master | 30 days | Long-term retention |

## Error Codes

- `400` - Bad Request (invalid input)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (e.g., username already exists)
- `500` - Internal Server Error

## Rate Limiting

Currently no rate limiting is implemented. Consider implementing rate limiting in production.

## Example Usage

### Complete Flow

1. **Register**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"newuser","password":"password123"}'
```

2. **Login** (if already registered)
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"newuser","password":"password123"}'
```

3. **Unlock Items**
```bash
curl -X POST http://localhost:3000/api/lessons/unlock \
  -H "Authorization: Bearer <your-token>"
```

4. **Get Lessons**
```bash
curl http://localhost:3000/api/lessons \
  -H "Authorization: Bearer <your-token>"
```

5. **Complete Lessons**
```bash
curl -X POST http://localhost:3000/api/lessons/complete \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"type":"kanji","id":1}]}'
```

6. **Get Reviews**
```bash
curl http://localhost:3000/api/reviews \
  -H "Authorization: Bearer <your-token>"
```

7. **Submit Review**
```bash
curl -X POST http://localhost:3000/api/reviews/submit \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{"item_type":"kanji","item_id":1,"question_type":"meaning","answer":"one"}'
```

8. **Get Stats**
```bash
curl http://localhost:3000/api/user/stats \
  -H "Authorization: Bearer <your-token>"
```
