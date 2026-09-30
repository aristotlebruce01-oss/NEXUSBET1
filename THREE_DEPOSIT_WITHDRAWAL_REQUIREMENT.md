# Withdrawal: 3-Deposit Requirement

NexusBet now requires a user to complete at least 3 approved/credited deposits before a withdrawal can be submitted.

## User experience
- The withdrawal form does not show the requirement warning in advance.
- After the user enters the withdrawal amount, phone number, and destination/account and taps **Withdraw**, the UI displays this red warning when fewer than 3 qualifying deposits exist:

> You have to make 3 more deposits before you withdraw your winnings

- Editing any withdrawal field clears the warning so the user can try again after meeting the requirement.

## Backend enforcement
`POST /api/wallet/withdraw` independently counts the user's approved/credited deposit transactions and rejects withdrawal requests until the count reaches 3. This prevents bypassing the frontend restriction.

`GET /api/wallet/status` now exposes:
- `deposit_count`
- `deposits_required`
- `deposits_remaining`
- `withdrawal_deposit_requirement_met`
- `can_withdraw`

The minimum withdrawal remains GH₵3,000.
