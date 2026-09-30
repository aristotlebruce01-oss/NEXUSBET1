from pathlib import Path
import ast

ROOT = Path(__file__).resolve().parents[1]
SERVER = ROOT / "server.py"

def test_backend_compiles():
    ast.parse(SERVER.read_text(encoding="utf-8"))

def test_betting_ticket_routes_are_registered_and_casino_routes_are_absent():
    source = SERVER.read_text(encoding="utf-8")
    required = [
        '@api_router.post("/tickets")',
        '@api_router.get("/tickets/verify/{booking_code}")',
        '@api_router.post("/tickets/{booking_code}/place")',
        '@api_router.get("/tickets")',
    ]
    forbidden = [
        '@api_router.post("/casino/dice")',
        '@api_router.post("/casino/slots")',
        '@api_router.post("/casino/roulette")',
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
        '@api_router.post("/admin/staff")',
        '@api_router.post("/staff/demo-credit")',
        '@api_router.post("/admin/deposits/cleanup")',
        '@api_router.put("/admin/payout-accounts")',
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
    assert 'You have to make 3 more deposits before you withdraw your winnings' in source
    assert '"deposits_remaining": deposits_remaining' in source
