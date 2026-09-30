# NexusBet 2026/27 League Club Catalog

Implemented for the main-screen **Leagues** section only:

- Premier League (England) — 20 clubs
- LaLiga (Spain) — 20 clubs
- Serie A (Italy) — 20 clubs
- Ligue 1 (France) — 18 clubs
- Bundesliga (Germany) — 18 clubs

The 2026/27 league membership and display names are maintained in the backend `LEAGUE_CATALOG`. Official league sources are used as the membership/name reference. TheSportsDB is used as the football-data source for provider team IDs and crest image URLs.

The frontend calls `/api/leagues` only for the **Leagues** section. Opening a league shows its season, country, club count, exact catalog name, and real crest when the provider asset is available.

## Scope protection

Real crest URLs are intentionally isolated to `LeagueCrest.jsx` and the Leagues UI. Existing match cards, betting selections, My Bet/bet slip, Open Bets, Results/My Bets, and other existing team displays continue using the existing NexusBet `TeamLogo` behavior and are not changed to use league crest assets.
