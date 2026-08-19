# BrightWay Education — Telegram Mini App

Production-ready demo of a **school commercial process**, not a generic timetable.

BrightWay walks an education center through the full client lifecycle:

**интерес → подбор программы → лид → пробное занятие → рекомендация → покупка абонемента → обучение → контроль прогресса → продление.**

Product name in the UI: **BrightWay**. Brand in demo data: **BrightWay Education**, филиал **Москва, Ходынское поле**.

## What the product demonstrates

1. Qualification of a new visitor into a structured lead
2. Rule-based program matching
3. Trial lesson booking with slot collision checks
4. Teacher recommendation after the trial
5. Mock purchase of a subscription and enrollment
6. Family cabinet, schedule, homework and progress
7. Low-balance / expiring retention
8. Admin funnel dashboard
9. Guided sales demo tour in the browser
10. Ports ready for CRM, payments, events and notifications

Demo family: **Мария Смирнова**. Дети: **София** (English Start A1, 3 из 8 занятий) и **Максим** (Robotics Junior, 7 из 8).

## Architecture

```text
React + Vite + Telegram WebApp
              ↓ REST
Express + TypeScript
              ↓
Application Services
              ↓
Domain Ports
              ↓
Providers
 ├── SQLite / local
 ├── CRM adapter
 ├── Payment adapter
 ├── Notification adapter
 └── Event adapter
```

Implementations are selected only in `backend/src/container.ts`. Application services never branch on `DATA_MODE`, `CRM_ADAPTER` or `PAYMENT_ADAPTER`.

## Local run

```bash
cp .env.example .env
npm install
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:3000
- Browser demo works when Telegram context is missing and `ALLOW_DEMO_MODE=true`

```bash
npm test
npm run typecheck
```

## Docker

```bash
docker compose up --build
```

Single container: Express serves `/api/*` and the frontend build. SQLite lives on volume `/data` (`DATABASE_PATH=/data/education.db`). Healthcheck: `GET /api/health`.

## Environment

See `.env.example`. Important:

| Variable | Meaning |
| --- | --- |
| `DATA_MODE=local\|external` | SQLite demo vs CRM/ERP stub (`501 NOT_CONFIGURED`) |
| `CRM_ADAPTER=local\|external` | Local CRM sync log vs `501 CRM_NOT_CONFIGURED` |
| `PAYMENT_ADAPTER=mock\|external` | Mock charge vs `501 PAYMENT_NOT_CONFIGURED` |
| `EVENT_ADAPTER=local\|webhook\|mock` | Domain events |
| `NOTIFICATION_ADAPTER=local\|mock` | In-app notifications |
| `ADMIN_TOKEN` | Fail-closed admin writes |
| `TELEGRAM_BOT_TOKEN` | Production `initData` validation |
| `ALLOW_DEMO_MODE` | Browser demo user |

## Admin

- `/admin` — write console. Sends `x-admin-token`. Empty `ADMIN_TOKEN` **locks writes**.
- `/demo/admin` — sales preview, **GET only**.

Docker Compose sets `ADMIN_TOKEN=brightway-demo` by default.

## Adapters

- **Local / SQLite** — source of truth for the MVP, WAL mode.
- **LocalCRMProvider** — writes integration records to `crm_sync_log`.
- **ExternalCRMProvider** — explicit `501 CRM_NOT_CONFIGURED` until Bitrix24 / amoCRM / custom backend is wired.
- **MockPaymentProvider** — records a paid payment, no acquiring.
- **External payment** — `501 PAYMENT_NOT_CONFIGURED`.
- **Events** — stored locally; webhook adapter forwards HTTP requests; mock adapter is in-memory.
- **Notifications** — stored in SQLite for the parent.

## Known limitations

- no full LMS
- no video lessons or teacher chat
- no real acquiring / fiscal receipts
- no vendor-specific CRM adapter
- no file storage; materials are links

These are future extensions, not missing MVP features.
