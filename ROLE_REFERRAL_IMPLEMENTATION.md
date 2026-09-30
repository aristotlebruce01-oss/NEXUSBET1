# NexusBet — Role, Referral, Commission & Match Scheduling Update

## Implemented

### Roles
- `super_admin`: full staff control; can create/edit/remove Admins and Sub-Admins; protected from modification/deletion; sole role allowed to soft-delete historical deposit logs.
- `admin`: can onboard/manage Sub-Admins, manage matches, review transactions, manage users and settlement payout details; cannot modify/delete Super Admins or create/promote another Admin.
- `sub_admin`: receives a unique referral code/link, can earn 70% referral commission on approved deposits from referred users, sees a dated commission ledger, and can receive match permissions such as `events.manage`.
- `user`: must register with a valid Admin/Sub-Admin referral code and cannot access staff demo credits.

### Referral system
- Links use `window.location.origin`, so the same UI works on localhost, a LAN IP, or the production domain.
- `/signup?ref=CODE` auto-opens signup, fills the referral code and locks it.
- Referral code is also validated again on the backend.
- Staff dashboards have one-click copy with a clipboard fallback for non-secure local IP testing.

### Commission system
- Commission rate: 70%.
- Deposit approval creates an immutable `referral_commission` ledger entry.
- Staff dashboard shows today's and all-time commission plus dated referred-user deposit entries.

### Staff demo wallet
- Only `super_admin`, `admin`, and `sub_admin` can call the demo-credit endpoint.
- Staff can enter any custom test amount.
- Regular users start at zero balance and have no demo-credit UI/API access.

### Settlement payout accounts
- MTN MoMo, Telecel Cash and bank details are stored in the database settings collection.
- Super Admins and Admins can edit; staff can view.

### Deposit log cleanup
- Super Admin-only soft deletion by cutoff date/time.
- Deposit records are hidden from normal admin transaction listings after cleanup.
- User balances are not changed.

### Match event scheduling
- New/edit event forms include a `datetime-local` Match Start Time field.
- Any chosen time such as 1:00 PM, 7:00 PM or 11:30 PM can be stored.
- The value is converted to ISO time in the browser and stored by the backend.
- Existing live/finish controls remain available.

### Environment workflow
- Existing `CORS_ORIGINS` remains the source of allowed origins.
- Added `FRONTEND_URL` to backend environment example and `REACT_APP_FRONTEND_URL` to frontend example for deployment configuration.
- Referral links themselves are generated from the active browser origin, avoiding hard-coded production/local domains.

## Backend endpoints added

- `GET /api/referrals/me`
- `GET /api/staff/commissions`
- `POST /api/staff/demo-credit`
- `GET /api/admin/payout-accounts`
- `PUT /api/admin/payout-accounts`
- `POST /api/admin/deposits/cleanup`
- `GET /api/admin/staff`
- `POST /api/admin/staff`
- `PUT /api/admin/staff/{user_id}`
- `DELETE /api/admin/staff/{user_id}`
- `POST /api/admin/staff/{user_id}/invite`
- `GET /api/staff/invite/{token}`

## Validation

Backend Python compilation and the project test suite pass locally in the working environment. Frontend dependency installation/build could not be rerun in this environment because the npm registry package required by the existing project was not available from the local npm cache; the source changes are included in the project archive.
