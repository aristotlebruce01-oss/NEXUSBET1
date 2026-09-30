# NexusBet — First Deposit Bonus & Payment Method Branding

## First deposit promotion
- Minimum deposit remains GH₵300.
- A user's first successful deposit receives a 100% match capped at GH₵100.
- With the current GH₵300 minimum, an eligible first deposit receives the full GH₵100 bonus.
- The backend is authoritative and uses an atomic user update so the bonus cannot be awarded twice by concurrent requests.
- The real-money deposit amount is recorded in `total_deposited`; the promotional bonus is recorded separately as `first_deposit_bonus`.
- Referral commission remains calculated from the real-money deposit amount, not the bonus.
- The wallet response exposes `first_deposit_bonus_available` and `first_deposit_bonus_cap` for the UI.

## Deposit UI
The Cashier page now:
- Shows a first-deposit bonus banner.
- Previews deposit + bonus + total wallet credit before submission.
- Shows the uploaded payment branding on the four deposit method selectors.
- Uses the supplied images for MTN MoMo, Telecel Cash, AirtelTigo Money, and GhIPSS/Bank Transfer.
- Shows the bonus as a separate history transaction after it is credited.

## Assets
- `frontend/public/payment-methods/mtn-momo.png`
- `frontend/public/payment-methods/telecel-cash.png`
- `frontend/public/payment-methods/airteltigo-money.png`
- `frontend/public/payment-methods/ghipss.png`
