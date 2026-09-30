# Frontend Build Verification

Updated the NexusBet frontend to resolve React Hooks ESLint warnings that were causing the production build to fail under `CI=true`.

## Fixes
- Added `setUser` to the balance synchronization effect dependencies in `src/App.js`.
- Stabilized Admin page data loaders with `useCallback` and correct `useEffect` dependencies.
- Stabilized Referral, Global Users, Staff Manager, Permission Manager, and Events loaders.
- Moved payout account defaults to a module-level constant so the effect does not depend on a recreated object.

## Verification
- `CI=true npm run build` — **PASS**
- `pytest -q` — **6 passed**

The source package does not include `node_modules`; run `npm ci` (or `npm install`) in `frontend` on the development machine before starting/building.
