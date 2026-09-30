# Test result

- Backend `compileall`: PASS.
- Pytest collection: fixed the cashier test base URL default; full integration tests require a running API server and MongoDB.
- Legacy wagering-oriented tests are not valid acceptance tests for this wagering-disabled build and must be replaced with wallet/cashier and informational-sports tests.
- Frontend build requires `npm install`/`npm ci` and was not executed in this environment.
