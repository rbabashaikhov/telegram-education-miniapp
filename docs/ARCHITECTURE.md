# Architecture

```text
Frontend
React + Vite + Telegram WebApp
        ↓
REST API
        ↓
Express
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

## Composition root

`backend/src/container.ts` is the only place that reads:

- `DATA_MODE`
- `CRM_ADAPTER`
- `PAYMENT_ADAPTER`
- `EVENT_ADAPTER`
- `NOTIFICATION_ADAPTER`

Application services receive a `Providers` object and never inspect env flags.

## Layers

| Layer | Location | Responsibility |
| --- | --- | --- |
| HTTP | `backend/src/routes/` | Auth, validation, error contract |
| Application | `backend/src/services/` | Funnel, matching, trials, subscriptions, retention |
| Ports | `backend/src/providers/types.ts` | Repository and adapter interfaces |
| Local data | `backend/src/providers/local/sqlite.ts` | SQLite mapping |
| Stubs | `backend/src/providers/external/` | `501 NOT_CONFIGURED` |

## Deployment

One Docker container. Express serves `/api/*` and the Vite build from `PUBLIC_DIR`. SQLite path defaults to `/data/education.db` with WAL.

## Telegram

`x-telegram-init-data` is validated with HMAC when `TELEGRAM_BOT_TOKEN` is set. Browser demo maps to Мария Смирнова (`telegramUserId=999000001`) when demo mode is allowed.

## Error contract

```json
{
  "error": {
    "code": "TRIAL_SLOT_NOT_AVAILABLE",
    "message": "Этот слот уже занят."
  }
}
```

Frontend shows `error.message`. Unknown technical dumps (`undefined`, `[]`) are not rendered.
