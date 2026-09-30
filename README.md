# NexusBet

NexusBet is a demo sports-information and virtual-wallet application using React/CRACO, FastAPI and MongoDB.

## Current scope
- Sports information for football, basketball, tennis and virtual sports.
- No wagering, casino, betting tickets, bet slips or cash-out features. Legacy wagering API prefixes return HTTP 410.
- Wallet/cashier uses manual review records only; it does not connect to real payment providers.
- Minimum deposit: GH₵300. Minimum withdrawal: GH₵3,000.
- Deposit and withdrawal references, status history, admin review, rejection reasons and audit history.
- Admin and sub-admin roles with configurable permissions for users, events/odds, payments, reports and promotions.
- Informational event creation/editing/deletion and odds display.

## Verification
Backend source compilation and static project tests are included under `backend/tests`. Install dependencies, configure MongoDB and environment variables, then run the frontend build and live API tests locally before deployment.
