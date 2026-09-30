# Wallet and Cashier Changes

- Deposit responses now include the generated transaction reference.
- Cashier displays the deposit reference in the success toast.
- Client-side minimum deposit and withdrawal validation added.
- Client-side available-balance validation added before withdrawal submission.
- Deposit and withdrawal loading states are separated.
- Cashier shows available balance beside withdrawal requirements.
- Backend compilation checked with `python -m py_compile backend/server.py`.
