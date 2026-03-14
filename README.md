# Tanuki Kanji

Tanuki Kanji to aplikacja do nauki kanji i slownictwa japońskiego.
Projekt działa na Next.js + PostgreSQL.

## Dlaczego ten stack

- Next.js: jeden projekt na frontend i API, prostsze wdrożenie i mniej konfiguracji.
- PostgreSQL: stabilna relacyjna baza, dobra do postepu nauki i historii review.
- Docker Compose: szybki start lokalnie, bez recznego stawiania środowiska.
- TypeScript: mniej błedów przy zmianach i czytelniejsze modele danych.

## Co jest w projekcie

- frontend i backend w jednej aplikacji Next.js (folder `backend`)
- baza danych PostgreSQL (folder `database`)
- logowanie, lekcje, review i dashboard postepu

## Wymagania

- Docker + Docker Compose

## Start 

1. Wejdz do katalogu projektu:

```bash
cd tanuki-kanji
```

2. Uruchom aplikacje:

```bash
docker compose up --build
```

3. Otworz:

- aplikacja: http://localhost:3000
- postgres: localhost:5432


Aplikacja bedzie pod: http://localhost:3000


## Struktura

```text
tanuki-kanji/
├── backend/               # Next.js (UI + API)
├── database/              # schema i seed PostgreSQL
├── docs/                  # dodatkowa dokumentacja
├── docker-compose.yml
└── README.md
```

## API (skrot)

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/user/profile`
- `GET /api/user/stats`
- `GET /api/lessons`
- `POST /api/lessons/complete`
- `POST /api/lessons/unlock`
- `GET /api/reviews`
- `POST /api/reviews/submit`

Dla endpointow chronionych potrzebny jest naglowek:
`Authorization: Bearer <token>`
