# NexusBet automatic Ghana Mobile Money deposits

The cashier now offers only MTN MoMo, Telecel Cash and AirtelTigo Money. Manual receiving numbers, bank-transfer deposits, proof screenshots and manual deposit submission have been removed from the user-facing deposit flow.

## Gateway implementation

This build uses Paystack's Ghana Mobile Money charge API:

- MTN MoMo provider code: `mtn`
- Telecel Cash provider code: `vod`
- AirtelTigo Money provider code: `atl`

The backend initiates the charge, stores a pending deposit, verifies the provider response and accepts signed `charge.success` webhooks. The user's wallet is credited only after a successful provider confirmation. Credit processing is idempotent and records the provider reference in the transaction ledger. The first-deposit bonus and Sub-Admin referral commission are applied by the automatic credit path.

## Required Render configuration

1. Complete Paystack merchant onboarding and enable Ghana Mobile Money on the merchant account.
2. Add `PAYSTACK_SECRET_KEY` to the **backend** Render service environment. Start with the Paystack test secret for sandbox testing. Use the live secret only after merchant approval and successful end-to-end tests.
3. In the Paystack dashboard, configure a webhook pointing to:

   `https://YOUR-BACKEND-DOMAIN/api/payments/paystack/webhook`

4. Subscribe to the `charge.success` event. The backend verifies `x-paystack-signature` with the secret key before processing the event.
5. Deploy the backend and test all three networks with small test transactions before enabling live payments.

Never put `PAYSTACK_SECRET_KEY` in the React frontend, a public repository, or a `REACT_APP_` variable. Keep it only in the backend environment.

## Runtime behaviour

- The customer selects one of the three networks, enters an amount and their Ghana mobile number, and starts checkout.
- The provider sends a payment authorization prompt to that phone. The customer approves using their own MoMo PIN/OTP directly with the network.
- NexusBet displays the pending reference and offers a status check. The webhook is the primary confirmation path; the status-check endpoint verifies with Paystack if the customer checks manually.
- Failed, abandoned, pending and unconfirmed requests do not credit the wallet.
- The old manual deposit endpoint now returns HTTP 410. Old manual payment configuration endpoints have been removed.

## Scope note

This change automates **deposits/collections**. The existing withdrawal request and staff review workflow is unchanged; automated payouts require a separately approved payout product, provider credentials, and controls.
