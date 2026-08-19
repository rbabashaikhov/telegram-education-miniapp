# Demo

Browser demo starts when `isDemo && !isTelegram && demoMode`.

## Guided tour

Intro:

> Посмотрите, как учебный центр превращает нового посетителя в постоянного ученика.

Steps highlight real UI via `data-demo-tour`:

1. `program-matching` — qualification entry
2. `qualification-form` — quiz (local draft until submit)
3. `trial-booking` — slot picker (Lead/Trial are created only after **Подтвердить запись**)
4. `teacher-recommendation` — Sofia's live recommendation
5. `subscription-card` — remaining lessons
6. `progress-card` — parent-facing progress
7. `low-balance` — renewal CTA

Finish screen: Lead generation / Conversion / Client service / Retention.

## Demo data

Do not use lorem ipsum. Seed builds a working school around 19 августа 2026:

- София: 3 из 8 занятий, English Start A1
- Максим: 7 из 8, Robotics Junior
- Extra leads in every funnel status for the admin dashboard

## Admin preview

`/demo/admin` is read-only. Completing a trial or creating a recommendation requires `/admin` and `ADMIN_TOKEN`.
