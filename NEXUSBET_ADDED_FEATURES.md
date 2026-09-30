# NexusBet Added Features

## Sports matches and admin-controlled live scores
- Sports now loads standard matches in `open`, `live`, and `finished` states.
- Admin-created matches appear in the user Sports section.
- Admin can start a match as live, increase either team's score, set score/minute manually, and finish the match.
- Standard sports bets are accepted while the event is `open` or `live`, and are blocked after the match is finished or cancelled.
- Finishing a match calculates the result from the admin-controlled score and settles its open bets.

## Booking codes
- Every match has a booking code shown on its match card.
- Users can generate a fresh booking code for any match with the **Generate booking code** button.
- Users can copy the displayed booking code.

## Validation
- Backend Python syntax check passed.
- Frontend production build passed with CI disabled; an existing React hook dependency warning remains in `AdminPage.jsx`.
- Existing backend safety test suite still reports its pre-existing wagering-route assertion failure because the project intentionally contains the demo betting routes used by NexusBet.
