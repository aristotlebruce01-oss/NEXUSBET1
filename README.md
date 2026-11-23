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

# NexusBet — AlphaPay integration package

This package combines the `NEXUSBET1` frontend with the separately supplied FastAPI `nexusbet-monolith` backend.

## What changed

- Replaced Paystack deposit initiation, verification and webhook handling in `backend/app/routers/nexusbet.py` with AlphaPay.
- Kept the existing frontend cashier page and API contract (`POST /api/wallet/deposit`, `GET /api/wallet/deposit/verify/{reference}`), so the current MTN MoMo, Telecel Cash and AirtelTigo Money interface remains in place.
- Mapped Ghana networks to AlphaPay network codes: `mtn_gh`, `vodafone_gh`, and `tigo_gh`.
- Preserved wallet crediting, the first-deposit bonus cap (GHS 100), referral commission, transaction history, and the duplicate-credit guard.
- Added an AlphaPay webhook endpoint: `POST /api/payments/alphapay/webhook`.

## Backend setup (Render)

1. Deploy the `backend` folder as the FastAPI service (use the same start command already used for this backend, commonly `uvicorn app.main:app --host 0.0.0.0 --port $PORT`).
2. Add the values from `backend/.env.example` in Render → Environment. Use your own AlphaPay key and webhook signing secret; do not put either value in frontend code or commit them to Git.
3. In the AlphaPay dashboard, configure the webhook URL as:
   `https://YOUR-RENDER-SERVICE.onrender.com/api/payments/alphapay/webhook`
4. Set `ALPHAPAY_RETURN_URL` to your frontend wallet/cashier URL if you want a browser return destination.
5. Set `REACT_APP_BACKEND_URL` in the frontend deployment to the Render backend origin (without `/api`).

## Local development

Backend:
```bash
cd backend
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
# Create .env from .env.example and fill in your own values
uvicorn app.main:app --reload --port 8000
```

Frontend:
```bash
cd frontend
npm install
# Create .env from .env.example
npm start
```

## Important before live payments

- Start with AlphaPay sandbox credentials and run a real end-to-end test for each of the three Ghana networks before switching to live credentials.
- Confirm in writing that AlphaPay and the underlying regulated payment provider approve NexusBet's betting/gaming merchant category and all three Ghana networks. AlphaPay's public site describes AlphaPay as a technical integration service rather than a PSP or aggregator.
- Confirm the exact verify endpoint and webhook signing secret in your merchant documentation/dashboard. The verify route is configurable with `ALPHAPAY_VERIFY_PATH_TEMPLATE` if AlphaPay gives your account a different path.
- Never credit a wallet from a browser redirect alone. This integration credits only after the backend receives a successful provider verification or a valid signed webhook.
- Do not share API keys, webhook secrets, database URLs, JWT secrets, or admin passwords in chat.

## Files changed

- `backend/app/routers/nexusbet.py` — AlphaPay server integration.
- `backend/.env.example` — required environment variables.
- `frontend/.env.example` — backend URL configuration.

The frontend cashier UI is intentionally left visually unchanged.

NexusBet frontend update

Copy the included files into the matching paths in your frontend project.
- Minimum stake is now GHS 200.00 in both SportsPage and MyBetsPage.
- The minimum-stake notice remains hidden until Place Bet is attempted below the minimum.
- First-deposit bonus display fallback is GHS 50.
- Welcome bonus banner now advertises GHC50.
- Existing HT event controls and display behavior are retained in SportsPage/AdminPage.

Deploy the matching backend update as well.
