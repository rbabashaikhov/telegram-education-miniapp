# Domain

BrightWay models a **commercial education process**, not a school diary.

## Core entities

School → Branch → Program → Group → Lesson  
Customer → Family → Student  
Lead → LeadQualification → TrialLesson → Recommendation → Enrollment → StudentSubscription

## Lead statuses

`NEW → QUALIFIED → TRIAL_BOOKED → TRIAL_ATTENDED → OFFERED → CONVERTED`  
`LOST` is a side exit (no-show, declined).

## Trial statuses

`BOOKED`, `CONFIRMED`, `ATTENDED`, `NO_SHOW`, `CANCELLED`, `COMPLETED`

## Subscription

A plan (`8 занятий / 30 дней`) becomes `StudentSubscription`. Ledger types:

- `PURCHASE`
- `LESSON_DEBIT`
- `REFUND`
- `MANUAL_ADJUSTMENT`

Statuses: `ACTIVE`, `EXPIRING`, `EXPIRED`, `FROZEN`, `CANCELLED`.

## Retention rules

- `remainingLessons <= 2` → `subscription_low_balance` and `renewal_due`
- expires within N days → `subscription_expiring`
- absence → `student_absent`; several absences → `student_inactive`

## Matching

Rule-based score: age band, goal → program titles, format, weekday/time, free seats. Top 3 groups are returned with the qualified lead.

## Demo brand

**BrightWay Education**  
Филиал: Москва, Ходынское поле  
Семья Смирновых: София (English Start A1, Анна Орлова, Пн/Ср 18:00) и Максим (Robotics Junior, Илья Соколов, Сб 12:00).
