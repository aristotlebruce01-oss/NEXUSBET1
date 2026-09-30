# NexusBet — Product Requirements Document

## Original Problem Statement
User (beginner) wants to build their own betting site. Clarified into a **play-money** cyberpunk sportsbook + casino called **NexusBet**. Later added a **simulated cashier**: deposits with a 100% first-deposit bonus and straightforward withdrawals. Explicitly NOT real-money gambling (no payment gateway / cash-out).

## Architecture
- **Frontend**: React 19 (CRA/craco), Tailwind, framer-motion, sonner, lucide-react. Context: AuthContext (JWT in localStorage), BetSlipContext (selections + trophy). Pages: Sports, Casino, Cashier, MyBets, Admin. Components: Navbar, AuthModal, BetSlip, TrophyOverlay.
- **Backend**: FastAPI, Motor (MongoDB). JWT (PyJWT) + bcrypt auth. All routes under `/api`. Background asyncio loop drifts open-event odds every 6s.
- **DB collections**: users, events, bets, transactions, settings, status_checks.

## User Personas
- **Player**: signs up, gets ₵1000 welcome balance, bets on sports, plays casino, uses cashier, chases wins.
- **Admin**: manages events (create/settle/delete), cashier settings, staff roles. Seeded: admin@nexusbet.com / admin123.
- **Sub-admin**: can manage events + cashier settings; cannot manage staff.

## Core Requirements (static)
- Play-money only, virtual Ghana Cedis (₵). No real payments.
- Email/password auth (JWT).
- Sports betting with dynamic bet slip (single + parlay), real-time simulated odds.
- Casino: Slots, Dice, Roulette (server-side RNG, 2% house edge on dice).
- My Bets history with filters + simulated cashout.
- Full-screen golden trophy overlay ("NEXUSBET WINNER") on wins.
- Cashier: deposit (100% first-deposit bonus), withdraw with minimum limits, admin/sub-admin configurable.

## Implemented (with dates)
### 2026-09-17
- Auth: register/login/me, JWT Bearer, bcrypt, admin seeding.
- Sports: event seeding (6 demo), list, admin create/finish/delete, live odds drift, bet placement + settlement (single & parlay).
- Casino: dice, roulette, slots with balance updates.
- Bet slip (desktop aside + mobile drawer), My Bets (poll + cashout + auto trophy on win), Trophy overlay.
- Cashier: deposit with atomic first-deposit 100% bonus, direct withdrawals, transaction history, min deposit/withdrawal.
- Admin dashboard: cashier settings (min deposit/withdrawal, bonus %), staff management (promote/demote sub-admin, last-admin protection).
- Currency displayed as ₵ across UI.
- Testing: 19/19 backend pytests pass; frontend E2E 100% (2 iterations).

## Backlog / Remaining
- P1: Configurable per-user KYC-style limits (only if ever going real-money — requires licensing, out of scope for demo).
- 
- P2: Render only viewport-appropriate BetSlip to avoid duplicate testids.
- P2: Leaderboard, daily challenges, more casino games.

## Next Tasks
- Await user feedback on cashier UX; consider bonus-history and withdrawal-status states.
