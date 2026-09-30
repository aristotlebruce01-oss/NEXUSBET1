# Booking code reuse + Admin validation

- Admin/Sub-Admin phone input now accepts up to 40 characters; backend and Admin UI use the same limit.
- Booking codes are reusable share codes. The original booking remains a template.
- Every placement creates a separate ticket with its own ticket ID and unique `NBV-...` verify code.
- Each user pays their own stake and receives their own settlement/payout.
- The shared booking code can still be entered later to load the selections while the matches remain available.
- Placed tickets are verified using their unique verify code, avoiding ambiguity when many users use the same booking code.
