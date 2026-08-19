# Integrations

Adapters are chosen in `backend/src/container.ts`.

## CRM

`CRMProvider`:

- `upsertCustomer`
- `upsertStudent`
- `createLead`
- `updateLead`
- `createTrial`
- `createEnrollment`
- `syncSubscription`

`CRM_ADAPTER=local` stores rows in `crm_sync_log`.  
`CRM_ADAPTER=external` throws `501 CRM_NOT_CONFIGURED`.

Intended later adapters: Bitrix24, amoCRM, industry CRM, customer backend.

## Payments

`PAYMENT_ADAPTER=mock` writes a `PAID` payment.  
`PAYMENT_ADAPTER=external` throws `501 PAYMENT_NOT_CONFIGURED`.

## Events

Application services publish:

`lead_created`, `lead_qualified`, `trial_booked`, `trial_attended`, `trial_no_show`, `recommendation_created`, `enrollment_created`, `subscription_purchased`, `subscription_low_balance`, `subscription_expiring`, `lesson_booked`, `student_absent`, `student_inactive`, `renewal_due`.

`EVENT_ADAPTER=webhook` POSTs to `EVENT_WEBHOOK_URL` after storing locally.

## Notifications

Local provider inserts into `notifications`. Mock provider keeps them in memory for tests.
