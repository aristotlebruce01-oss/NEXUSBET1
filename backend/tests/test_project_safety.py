from pathlib import Path
import ast

ROOT = Path(__file__).resolve().parents[1]
SERVER = ROOT / "server.py"

def test_backend_compiles():
    ast.parse(SERVER.read_text(encoding="utf-8"))

def test_betting_ticket_routes_are_registered_and_casino_routes_are_absent():
    source = SERVER.read_text(encoding="utf-8")
    required = [
        '@router.post("/tickets")',
        '@router.get("/tickets/verify/{booking_code}")',
        '@router.post("/tickets/{booking_code}/place")',
        '@router.get("/tickets")',
    ]
    forbidden = [
        '@router.post("/casino/dice")',
        '@router.post("/casino/slots")',
        '@router.post("/casino/roulette")',
    ]
    for marker in required:
        assert marker in source
    for marker in forbidden:
        assert marker not in source

def test_cashier_limits_are_safe_defaults():
    source = SERVER.read_text(encoding="utf-8")
    assert '"min_deposit": 300.0' in source
    assert '"min_withdrawal": 3000.0' in source

def test_events_support_admin_controlled_settlement():
    source = SERVER.read_text(encoding="utf-8")
    assert 'return [event_public(d) for d in docs]' in source
    assert 'async def control_event' in source
    assert 'async def settle_event' in source
    assert 'await settle_event_bets(event_id, values["result"])' in source
    assert 'await settle_ticket_event(event_id, body.result)' in source

def test_role_referral_controls_are_present():
    source = SERVER.read_text(encoding="utf-8")
    required = [
        '"super_admin"',
        'REFERRAL_COMMISSION_RATE = 0.70',
        '@router.post("/admin/staff")',
        '@router.post("/staff/demo-credit")',
        '@router.post("/admin/deposits/cleanup")',
        '@router.put("/admin/payout-accounts")',
        'referral_code: str = Field(min_length=4, max_length=40)',
        'kickoff_at: Optional[datetime] = None',
    ]
    for marker in required:
        assert marker in source


def test_super_admin_protection_is_present():
    source = SERVER.read_text(encoding="utf-8")
    assert 'Super Admin accounts cannot be modified' in source
    assert 'Super Admin accounts cannot be deleted' in source
    assert 'Only Super Admins can create or promote Admin accounts' in source


def test_withdrawal_requires_three_deposits():
    source = SERVER.read_text(encoding="utf-8")
    assert 'deposit_count < 3' in source
    assert 'MAKE 3 MORE DEPOSIT BEFORE YOU CAN WITHDRAW YOUR WINNINGS' in source
    assert '"deposits_remaining": deposits_remaining' in source


def test_requested_ticket_history_and_admin_features_are_present():
    source = SERVER.read_text(encoding="utf-8")
    for marker in [
        '@router.delete("/tickets/history")',
        '@router.delete("/tickets/{ticket_id}")',
        '@router.delete("/admin/users/{user_id}")',
        '@router.get("/admin/commission-ledger")',
        '@router.get("/live-scores")',
        'score_controlled',
        'status == "paused"',
        'referral_used',
    ]:
        assert marker in source

def test_automatic_ghana_mobile_money_checkout_is_configured():
    source = SERVER.read_text(encoding="utf-8")
    for marker in [
        '"mtn": {"id": "mtn", "label": "MTN MoMo", "provider": "mtn"',
        '"telecel": {"id": "telecel", "label": "Telecel Cash", "provider": "vod"',
        '"airteltigo": {"id": "airteltigo", "label": "AirtelTigo Money", "provider": "atl"',
        '@router.post("/payments/paystack/webhook")',
        'hmac.compare_digest(signature, expected)',
        '@router.get("/wallet/deposit/verify/{reference}")',
        'PAYSTACK_SECRET_KEY',
    ]:
        assert marker in source


def test_manual_deposit_submission_is_disabled():
    source = SERVER.read_text(encoding="utf-8")
    assert 'Manual deposits are disabled. Use the automatic mobile money checkout.' in source
    cashier = (ROOT.parent / "frontend" / "src" / "pages" / "CashierPage.jsx").read_text(encoding="utf-8")
    assert "Submit Manual Deposit" not in cashier
    assert "Manual review only" not in cashier


def test_withdrawals_are_mobile_money_only():
    source = SERVER.read_text(encoding="utf-8")
    cashier = (ROOT.parent / "frontend" / "src" / "pages" / "CashierPage.jsx").read_text(encoding="utf-8")
    assert 'method: Literal["mtn", "telecel", "airteltigo"] = "mtn"' in source
    assert '{ id: "bank", label: "Bank Transfer"' not in cashier
    assert 'placeholder="Mobile money number"' in cashier
