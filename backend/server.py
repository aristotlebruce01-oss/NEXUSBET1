from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import uuid
import random
import asyncio
import logging
import math
import csv
import requests
import io
import re
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Literal, Any

import bcrypt
import jwt
from bson import ObjectId
from pymongo import UpdateOne, ReturnDocument
from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends, Security, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr

# ------------------------------------------------------------------ setup
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_ALGORITHM = "HS256"
STARTING_BALANCE = 0.0
STAFF_STARTING_DEMO_BALANCE = 1000.0
REFERRAL_COMMISSION_RATE = 0.70
# The 70% referral commission is earned only by Sub-Admins. Admin and
# Super Admin accounts may have referral codes for onboarding, but they do not
# receive referral commission.

LEAGUE_CATALOG = {
    "premier-league": {
        "name": "Premier League", "country": "England", "season": "2026/27", "provider_league": "English Premier League",
        "teams": [
            "Arsenal", "Aston Villa", "AFC Bournemouth", "Brentford", "Brighton & Hove Albion", "Chelsea",
            "Coventry City", "Crystal Palace", "Everton", "Fulham", "Hull City", "Ipswich Town", "Leeds United",
            "Liverpool", "Manchester City", "Manchester United", "Newcastle United", "Nottingham Forest", "Sunderland", "Tottenham Hotspur"
        ]
    },
    "laliga": {
        "name": "LaLiga", "country": "Spain", "season": "2026/27", "provider_league": "Spanish La Liga",
        "teams": [
            "Athletic Club", "Atlético de Madrid", "CA Osasuna", "Celta", "Deportivo Alavés", "Elche CF", "FC Barcelona",
            "Getafe CF", "Levante UD", "Málaga CF", "R. Racing Club", "Rayo Vallecano", "RC Deportivo",
            "RCD Espanyol de Barcelona", "Real Betis", "Real Madrid", "Real Sociedad", "Sevilla FC", "Valencia CF", "Villarreal CF"
        ]
    },
    "serie-a": {
        "name": "Serie A", "country": "Italy", "season": "2026/27", "provider_league": "Italian Serie A",
        "teams": [
            "AC Milan", "Atalanta", "Bologna", "Cagliari", "Como", "Fiorentina", "Frosinone", "Genoa", "Inter",
            "Juventus", "Lazio", "Lecce", "Monza", "Napoli", "Parma", "Roma", "Sassuolo", "Torino", "Udinese", "Venezia"
        ]
    },
    "ligue-1": {
        "name": "Ligue 1", "country": "France", "season": "2026/27", "provider_league": "French Ligue 1",
        "teams": [
            "Angers SCO", "AJ Auxerre", "Stade Brestois 29", "Havre AC", "Le Mans FC", "RC Lens", "FC Lorient", "LOSC",
            "Olympique Lyonnais", "Olympique de Marseille", "AS Monaco", "OGC Nice", "Paris FC", "Paris Saint-Germain",
            "Stade Rennais F.C.", "RC Strasbourg Alsace", "Toulouse FC", "ESTAC Troyes"
        ]
    },
    "bundesliga": {
        "name": "Bundesliga", "country": "Germany", "season": "2026/27", "provider_league": "German Bundesliga",
        "teams": [
            "FC Augsburg", "1. FC Union Berlin", "SV Werder Bremen", "Borussia Dortmund", "SV Elversberg", "Eintracht Frankfurt",
            "Sport-Club Freiburg", "Hamburger SV", "TSG Hoffenheim", "1. FC Köln", "RB Leipzig", "Bayer 04 Leverkusen",
            "1. FSV Mainz 05", "Borussia Mönchengladbach", "FC Bayern München", "SC Paderborn 07", "FC Schalke 04", "VfB Stuttgart"
        ]
    },
    "liga-portugal": {"name": "Liga Portugal", "country": "Portugal", "season": "2026/27", "provider_league": "Portuguese Primeira Liga", "teams": []},
    "eredivisie": {"name": "Eredivisie", "country": "Netherlands", "season": "2026/27", "provider_league": "Dutch Eredivisie", "teams": []},
    "scottish-premiership": {"name": "Scottish Premiership", "country": "Scotland", "season": "2026/27", "provider_league": "Scottish Premier League", "teams": []},
    "turkiye-super-lig": {"name": "Türkiye Super Lig", "country": "Türkiye", "season": "2026/27", "provider_league": "Turkish Super Lig", "teams": []},
    "greece-super-league": {"name": "Greece Super League", "country": "Greece", "season": "2026/27", "provider_league": "Greek Super League", "teams": []},
    "belgium-pro-league": {"name": "Belgium Pro League", "country": "Belgium", "season": "2026/27", "provider_league": "Belgian Pro League", "teams": []}
}

TEAM_ALIASES = {
    "brighton & hove albion": ["Brighton & Hove Albion", "Brighton"],
    "afc bournemouth": ["AFC Bournemouth", "Bournemouth"],
    "atletico de madrid": ["Atlético de Madrid", "Atletico Madrid"],
    "deportivo alaves": ["Deportivo Alavés", "Alaves"],
    "r. racing club": ["R. Racing Club", "Racing Santander", "Racing Club"],
    "rc deportivo": ["RC Deportivo", "Deportivo La Coruna", "Deportivo"],
    "rcd espanyol de barcelona": ["RCD Espanyol de Barcelona", "Espanyol"],
    "celta": ["Celta", "Celta Vigo"],
    "stade rennais f.c.": ["Stade Rennais F.C.", "Stade Rennais", "Rennes"],
    "stade brestois 29": ["Stade Brestois 29", "Brest"],
    "havre ac": ["Havre AC", "Le Havre"],
    "losc": ["LOSC", "Lille"],
    "paris saint-germain": ["Paris Saint-Germain", "Paris SG", "PSG"],
    "olympique lyonnais": ["Olympique Lyonnais", "Lyon"],
    "olympique de marseille": ["Olympique de Marseille", "Marseille"],
    "fc bayern münchen": ["FC Bayern München", "Bayern Munich"],
    "bayer 04 leverkusen": ["Bayer 04 Leverkusen", "Bayer Leverkusen"],
    "1. fc köln": ["1. FC Köln", "FC Cologne", "Cologne"],
    "1. fsv mainz 05": ["1. FSV Mainz 05", "Mainz"],
    "1. fc union berlin": ["1. FC Union Berlin", "Union Berlin"],
    "sv werder bremen": ["SV Werder Bremen", "Werder Bremen"],
    "sport-club freiburg": ["Sport-Club Freiburg", "SC Freiburg", "Freiburg"],
    "sc paderborn 07": ["SC Paderborn 07", "Paderborn"],
    "fc schalke 04": ["FC Schalke 04", "Schalke 04", "Schalke"],
    "sv elversberg": ["SV Elversberg", "Elversberg"],
    "hamburger sv": ["Hamburger SV", "Hamburg"],
    "tsg hoffenheim": ["TSG Hoffenheim", "Hoffenheim"],
}

def _team_key(value: str) -> str:
    import unicodedata
    value = unicodedata.normalize("NFKD", str(value or "")).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", " ", value).strip()

async def sync_league_catalog():
    """Cache football club crests for every supported league.

    TheSportsDB is used only as the crest/team-data source. Logos are cached in
    MongoDB so an event keeps a stable stored logo URL after it is created.
    """
    for slug, league in LEAGUE_CATALOG.items():
        try:
            url = "https://www.thesportsdb.com/api/v1/json/3/search_all_teams.php"
            response = await asyncio.to_thread(requests.get, url, params={"l": league["provider_league"]}, timeout=12)
            response.raise_for_status()
            provider_teams = response.json().get("teams") or []
            by_key = {_team_key(t.get("strTeam")): t for t in provider_teams if t.get("strTeam")}
            names = league["teams"] or [t.get("strTeam") for t in provider_teams if t.get("strTeam")]
            for name in names:
                candidates = [name] + TEAM_ALIASES.get(_team_key(name), [])
                found = next((by_key.get(_team_key(c)) for c in candidates if by_key.get(_team_key(c))), None)
                if not found:
                    continue
                doc = {
                    "league_slug": slug, "league": league["name"], "country": league["country"], "season": league["season"],
                    "name": name, "provider": "TheSportsDB", "provider_team_id": found.get("idTeam"),
                    "api_football_id": found.get("idAPIfootball"), "logo_url": found.get("strBadge"),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
                await db.teams.update_one({"league_slug": slug, "name": name, "season": league["season"]}, {"$set": doc}, upsert=True)
            team_count = await db.teams.count_documents({"league_slug": slug, "season": league["season"]})
            await db.leagues.update_one({"slug": slug}, {"$set": {"slug": slug, "name": league["name"], "country": league["country"], "season": league["season"], "team_count": team_count, "updated_at": datetime.now(timezone.utc).isoformat()}}, upsert=True)
        except Exception as exc:
            logger.warning("League crest sync failed for %s: %s", league["name"], exc)

async def team_asset(name: str, league: Optional[str] = None) -> dict:
    key = _team_key(name)
    slug = None
    if league:
        slug = next((k for k,v in LEAGUE_CATALOG.items() if _team_key(v["name"]) == _team_key(league)), None)
    queries = []
    if slug:
        queries.append({"league_slug": slug, "name": name})
        queries.append({"league_slug": slug, "name": {"$in": TEAM_ALIASES.get(key, [])}})
    queries.append({"name": name})
    queries.append({"name": {"$in": TEAM_ALIASES.get(key, [])}})
    doc = None
    for q in queries:
        doc = await db.teams.find_one(q)
        if doc:
            break
    if not doc and (slug or not league):
        candidates = await db.teams.find({"league_slug": slug}).to_list(300) if slug else await db.teams.find({}).to_list(500)
        doc = next((d for d in candidates if _team_key(d.get("name")) == key), None)
    return {"name": name, "logo_url": doc.get("logo_url") if doc else None, "team_id": doc.get("provider_team_id") if doc else None, "league_slug": doc.get("league_slug") if doc else None}

CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
STAFF_ROLES = {"super_admin", "admin", "sub_admin"}
MANAGER_ROLES = {"super_admin", "admin"}


def gen_code(n: int = 8) -> str:
    return "".join(random.choices(CODE_ALPHABET, k=n))


async def unique_code(collection, field: str, n: int = 8) -> str:
    for _ in range(25):
        code = gen_code(n)
        if not await collection.find_one({field: code}):
            return code
    return gen_code(n + 2)

app = FastAPI()
bearer_scheme = HTTPBearer(auto_error=False)

# Demo wagering is enabled. All stakes use the platform's demo wallet balance;
# no external payment provider or real-money settlement is connected.
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("nexusbet")


# ------------------------------------------------------------------ auth utils
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "access",
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def public_user(doc: dict) -> dict:
    role = doc.get("role", "user")
    return {
        "id": str(doc["_id"]),
        "email": doc["email"],
        "phone": doc.get("phone", ""),
        "name": doc.get("name", ""),
        "role": role,
        "balance": round(doc.get("balance", 0.0), 2),
        "total_deposited": round(doc.get("total_deposited", 0.0), 2),
        "referral_code": doc.get("referral_code", ""),
        "commission_total": round(doc.get("commission_total", 0.0), 2) if role == "sub_admin" else 0.0,
        "demo_balance": round(doc.get("balance", 0.0), 2) if role in STAFF_ROLES else None,
        "permissions": doc.get("permissions", []),
    }


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Security(bearer_scheme),
) -> dict:
    token = request.cookies.get("access_token")
    if not token and credentials is not None:
        token = credentials.credentials
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") not in MANAGER_ROLES:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


async def require_super_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "super_admin":
        raise HTTPException(status_code=403, detail="Super Admin access required")
    return user


async def require_staff(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") not in STAFF_ROLES:
        raise HTTPException(status_code=403, detail="Staff access required")
    return user

ROLE_PERMISSIONS = {
    "user_management": {"users.view", "users.manage"},
    "sports_odds": {"events.view", "events.manage", "odds.manage"},
    "payments": {"transactions.view", "transactions.review"},
    "reports": {"reports.view", "transactions.view"},
    "promotions": {"promotions.manage"},
}
ALL_SUBADMIN_PERMISSIONS = sorted(set().union(*ROLE_PERMISSIONS.values()))

def default_subadmin_permissions():
    return []

def require_permission(permission: str = ""):
    async def dependency(user: dict = Depends(get_current_user)):
        if user.get("role") in MANAGER_ROLES:
            return user
        if user.get("role") != "sub_admin" or (permission and permission not in user.get("permissions", [])):
            raise HTTPException(status_code=403, detail=f"Permission required: {permission}")
        return user
    return dependency

DEFAULT_SETTINGS = {
    "min_deposit": 300.0,
    "min_withdrawal": 3000.0,
    "first_deposit_bonus_cap": 100.0,
}

FIRST_DEPOSIT_BONUS_CAP = 100.0


async def get_settings() -> dict:
    doc = await db.settings.find_one({"_id": "global"})
    if not doc:
        return dict(DEFAULT_SETTINGS)
    return {k: doc.get(k, DEFAULT_SETTINGS[k]) for k in DEFAULT_SETTINGS}


# ------------------------------------------------------------------ models
class RegisterInput(BaseModel):
    name: str = Field(min_length=1, max_length=40)
    email: EmailStr
    phone: str = Field(min_length=7, max_length=25)
    password: str = Field(min_length=6, max_length=128)
    confirm_password: str = Field(min_length=6, max_length=128)
    referral_code: str = Field(min_length=4, max_length=40)

class LoginInput(BaseModel):
    identifier: str = Field(min_length=3, max_length=120)
    password: str

class EventInput(BaseModel):
    sport: str = Field(min_length=2, max_length=40)
    league: str = Field(min_length=2, max_length=80)
    home: str = Field(min_length=1, max_length=80)
    away: str = Field(min_length=1, max_length=80)
    odds_home: float = Field(gt=1.0, le=1000)
    odds_draw: float = Field(gt=1.0, le=1000)
    odds_away: float = Field(gt=1.0, le=1000)
    kickoff_at: Optional[datetime] = None

class EventControlInput(BaseModel):
    status: Optional[Literal["open", "live", "finished", "cancelled"]] = None
    minute: Optional[int] = Field(default=None, ge=0, le=120)
    home_score: Optional[int] = Field(default=None, ge=0, le=99)
    away_score: Optional[int] = Field(default=None, ge=0, le=99)
    halftime_home_score: Optional[int] = Field(default=None, ge=0, le=99)
    halftime_away_score: Optional[int] = Field(default=None, ge=0, le=99)

class VirtualMatchInput(BaseModel):
    home: str = Field(min_length=1, max_length=80)
    away: str = Field(min_length=1, max_length=80)
    league: str = Field(default="Virtual Football", min_length=2, max_length=80)
    kickoff_at: Optional[datetime] = None
    status: Literal["scheduled", "live", "halftime", "finished", "paused", "cancelled"] = "scheduled"
    minute: int = Field(default=0, ge=0, le=94)
    home_score: int = Field(default=0, ge=0, le=99)
    away_score: int = Field(default=0, ge=0, le=99)
    odds_home: float = Field(default=2.0, gt=1.0, le=1000)
    odds_draw: float = Field(default=3.2, gt=1.0, le=1000)
    odds_away: float = Field(default=3.0, gt=1.0, le=1000)
    halftime_home_score: Optional[int] = Field(default=None, ge=0, le=99)
    halftime_away_score: Optional[int] = Field(default=None, ge=0, le=99)

class VirtualBulkInput(BaseModel):
    matches: List[VirtualMatchInput] = Field(min_length=1, max_length=5000)

class VirtualControlInput(BaseModel):
    status: Optional[Literal["scheduled", "live", "halftime", "finished", "paused", "cancelled"]] = None
    minute: Optional[int] = Field(default=None, ge=0, le=94)
    home_score: Optional[int] = Field(default=None, ge=0, le=99)
    away_score: Optional[int] = Field(default=None, ge=0, le=99)
    odds_home: Optional[float] = Field(default=None, gt=1.0, le=1000)
    odds_draw: Optional[float] = Field(default=None, gt=1.0, le=1000)
    odds_away: Optional[float] = Field(default=None, gt=1.0, le=1000)
    halftime_home_score: Optional[int] = Field(default=None, ge=0, le=99)
    halftime_away_score: Optional[int] = Field(default=None, ge=0, le=99)

class DepositInput(BaseModel):
    amount: float = Field(gt=0, le=1000000)
    method: Literal["mtn", "telecel", "airteltigo", "bank"] = "mtn"
    phone_number: str = Field(min_length=7, max_length=25)

class WithdrawInput(BaseModel):
    amount: float = Field(gt=0, le=1000000)
    method: Literal["mtn", "telecel", "airteltigo", "bank"] = "mtn"
    destination: str = Field(min_length=4, max_length=120)
    phone_number: str = Field(min_length=7, max_length=25)

class SettingsInput(BaseModel):
    min_deposit: Optional[float] = Field(default=None, ge=300, le=1000000)
    min_withdrawal: Optional[float] = Field(default=None, ge=3000, le=1000000)

class RoleInput(BaseModel):
    role: str

class PermissionsInput(BaseModel):
    permissions: List[str] = Field(default_factory=list)

class StaffCreateInput(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    email: EmailStr
    phone: str = Field(default="", max_length=40)
    password: str = Field(min_length=6, max_length=128)
    role: Literal["admin", "sub_admin"]

class StaffUpdateInput(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=80)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(default=None, max_length=40)
    password: Optional[str] = Field(default=None, min_length=6, max_length=128)

class DemoCreditInput(BaseModel):
    amount: float = Field(gt=0, le=1000000000)

class PayoutAccountsInput(BaseModel):
    mtn_name: str = Field(default="", max_length=100)
    mtn_number: str = Field(default="", max_length=30)
    telecel_name: str = Field(default="", max_length=100)
    telecel_number: str = Field(default="", max_length=30)
    bank_name: str = Field(default="", max_length=120)
    bank_account_name: str = Field(default="", max_length=120)
    bank_account_number: str = Field(default="", max_length=60)
    bank_branch: str = Field(default="", max_length=120)

class DepositCleanupInput(BaseModel):
    before: datetime

class BetInput(BaseModel):
    event_id: str = Field(min_length=1, max_length=100)
    market: Literal["match_result", "double_chance", "correct_score", "ht_draw_ft", "goals_over_under", "both_teams_score"] = "match_result"
    selection: str = Field(min_length=1, max_length=80)
    stake: float = Field(gt=0, le=100000)

class TicketSelection(BaseModel):
    event_id: str = Field(min_length=1, max_length=100)
    market: Literal["match_result", "double_chance", "correct_score", "ht_draw_ft", "goals_over_under", "both_teams_score"] = "match_result"
    selection: str = Field(min_length=1, max_length=80)

class TicketInput(BaseModel):
    selections: List[TicketSelection] = Field(min_length=1, max_length=30)
    stake: float = Field(default=0, ge=0, le=100000)

class TicketVerifyInput(BaseModel):
    identifier: str = Field(min_length=4, max_length=120)

class BetSettlementInput(BaseModel):
    result: Literal["home", "draw", "away", "void"]

# ------------------------------------------------------------------ virtual football
def virtual_minute(doc: dict) -> int:
    if doc.get("status") in ("finished", "cancelled"):
        return int(doc.get("minute", 94))
    if doc.get("status") in ("halftime", "paused"):
        return int(doc.get("minute", 45))
    if doc.get("status") != "live" or not doc.get("clock_started_at"):
        return int(doc.get("minute", 0))
    started = datetime.fromisoformat(doc["clock_started_at"])
    elapsed = max(0, int((datetime.now(timezone.utc) - started).total_seconds() // 60))
    base = int(doc.get("clock_base_minute", 0))
    if base < 45:
        first_half_elapsed = min(45, base + elapsed)
        if base + elapsed <= 45:
            return first_half_elapsed
        second_half_elapsed = base + elapsed - 45
        if second_half_elapsed <= 15:
            return 45
        return min(94, 46 + second_half_elapsed - 16)
    return min(94, base + elapsed)

def virtual_phase(doc: dict) -> str:
    if doc.get("status") != "live":
        return doc.get("status", "scheduled")
    if not doc.get("clock_started_at"):
        return "live"
    started = datetime.fromisoformat(doc["clock_started_at"])
    elapsed = max(0, int((datetime.now(timezone.utc) - started).total_seconds() // 60))
    base = int(doc.get("clock_base_minute", 0))
    total = base + elapsed
    if base < 45 and total > 45 and total <= 60:
        return "halftime"
    if virtual_minute(doc) >= 94:
        return "finished"
    return "live"

def virtual_public(doc: dict) -> dict:
    minute = virtual_minute(doc)
    status = doc.get("status", "scheduled")
    phase = virtual_phase(doc)
    return {"id": doc["id"], "home": doc["home"], "away": doc["away"], "league": doc.get("league", "Virtual Football"),
            "kickoff_at": doc.get("kickoff_at"), "status": status, "phase": phase, "minute": minute,
            "score": {"home": doc.get("home_score", 0), "away": doc.get("away_score", 0)},
            "halftime_score": {"home": doc.get("halftime_home_score"), "away": doc.get("halftime_away_score")},
            "result": doc.get("result"),
            "booking_code": doc.get("booking_code") or f"NBM-{doc['id'][:8].upper()}",
            "odds": {"home": round(doc.get("odds_home", 2), 2), "draw": round(doc.get("odds_draw", 3.2), 2), "away": round(doc.get("odds_away", 3), 2)}}

@api_router.get("/virtual-football/matches")
async def list_virtual_matches(status: Optional[str] = None, limit: int = 200, skip: int = 0):
    query = {"sport": "Virtual Football"}
    if status in {"scheduled", "live", "halftime", "finished", "paused", "cancelled"}: query["status"] = status
    docs = await db.events.find(query).sort("kickoff_at", 1).skip(max(0, skip)).limit(min(max(limit, 1), 1000)).to_list(min(max(limit, 1), 1000))
    # Finalize clock-driven matches as soon as the public feed reaches FT.
    for doc in docs:
        if doc.get("status") == "live" and virtual_phase(doc) == "finished":
            home_score = int(doc.get("home_score", 0)); away_score = int(doc.get("away_score", 0))
            result = "home" if home_score > away_score else "away" if away_score > home_score else "draw"
            await db.events.update_one({"id": doc["id"], "status": "live"}, {"$set": {"status": "finished", "minute": 94, "result": result, "clock_started_at": None}})
            await settle_event_bets(doc["id"], result)
            await settle_ticket_event(doc["id"], result)
            doc = await db.events.find_one({"id": doc["id"]}) or doc
        elif doc.get("status") == "live" and virtual_phase(doc) == "halftime":
            # Keep the public phase accurate while preserving the live status.
            pass
    return [virtual_public(d) for d in docs]

@api_router.post("/admin/virtual-football/matches")
async def create_virtual_match(body: VirtualMatchInput, staff: dict = Depends(require_permission("events.manage"))):
    doc = body.model_dump()
    doc.update({"id": str(uuid.uuid4()), "sport": "Virtual Football", "kickoff_at": (body.kickoff_at or datetime.now(timezone.utc)).isoformat(),
                "clock_base_minute": body.minute, "clock_started_at": datetime.now(timezone.utc).isoformat() if body.status == "live" else None,
                "created_at": datetime.now(timezone.utc).isoformat()})
    await db.events.insert_one(doc)
    return virtual_public(doc)

@api_router.post("/admin/virtual-football/bulk")
async def bulk_virtual_matches(body: VirtualBulkInput, staff: dict = Depends(require_permission("events.manage"))):
    now = datetime.now(timezone.utc).isoformat(); docs = []
    for item in body.matches:
        d = item.model_dump(); d.update({"id": str(uuid.uuid4()), "sport": "Virtual Football", "kickoff_at": (item.kickoff_at or datetime.now(timezone.utc)).isoformat(),
            "clock_base_minute": item.minute, "clock_started_at": now if item.status == "live" else None, "created_at": now})
        docs.append(d)
    if docs: await db.events.insert_many(docs)
    return {"created": len(docs), "matches": [virtual_public(d) for d in docs]}

@api_router.post("/admin/virtual-football/bulk-csv")
async def bulk_virtual_csv(file: UploadFile = File(...), staff: dict = Depends(require_permission("events.manage"))):
    raw = await file.read()
    if len(raw) > 5 * 1024 * 1024: raise HTTPException(status_code=413, detail="CSV file is larger than 5MB")
    try: rows = list(csv.DictReader(io.StringIO(raw.decode("utf-8-sig"))))
    except Exception as exc: raise HTTPException(status_code=400, detail=f"Invalid CSV: {exc}")
    if not rows or len(rows) > 5000: raise HTTPException(status_code=400, detail="CSV must contain 1 to 5000 matches")
    matches = []
    for i, r in enumerate(rows, 2):
        try:
            matches.append(VirtualMatchInput(home=r["home"], away=r["away"], league=r.get("league") or "Virtual Football",
                kickoff_at=datetime.fromisoformat(r["kickoff_at"]) if r.get("kickoff_at") else None, status=r.get("status") or "scheduled",
                minute=int(r.get("minute") or 0), home_score=int(r.get("home_score") or 0), away_score=int(r.get("away_score") or 0),
                halftime_home_score=int(r["halftime_home_score"]) if r.get("halftime_home_score") not in (None, "") else None,
                halftime_away_score=int(r["halftime_away_score"]) if r.get("halftime_away_score") not in (None, "") else None,
                odds_home=float(r.get("odds_home") or 2), odds_draw=float(r.get("odds_draw") or 3.2), odds_away=float(r.get("odds_away") or 3)))
        except Exception as exc: raise HTTPException(status_code=400, detail=f"Invalid row {i}: {exc}")
    return await bulk_virtual_matches(VirtualBulkInput(matches=matches), staff)

@api_router.patch("/admin/virtual-football/matches/{match_id}")
async def control_virtual_match(match_id: str, body: VirtualControlInput, staff: dict = Depends(require_permission("events.manage"))):
    current = await db.events.find_one({"id": match_id, "sport": "Virtual Football"})
    if not current: raise HTTPException(status_code=404, detail="Virtual match not found")
    values = {k: v for k, v in body.model_dump(exclude_none=True).items()}
    if values.get("status") == "live" and current.get("status") != "live":
        values["clock_started_at"] = datetime.now(timezone.utc).isoformat(); values["clock_base_minute"] = values.get("minute", current.get("minute", 0))
    if values.get("status") in ("paused", "halftime", "finished", "cancelled"): values["clock_started_at"] = None
    await db.events.update_one({"id": match_id}, {"$set": values})
    updated = await db.events.find_one({"id": match_id})
    if values.get("status") == "finished":
        home_score = int(updated.get("home_score", 0)); away_score = int(updated.get("away_score", 0))
        result = "home" if home_score > away_score else "away" if away_score > home_score else "draw"
        await db.events.update_one({"id": match_id}, {"$set": {"result": result}})
        await settle_event_bets(match_id, result)
        updated = await db.events.find_one({"id": match_id})
    return virtual_public(updated)

# ------------------------------------------------------------------ demo wagering and settlement

def bet_public(doc: dict, event: Optional[dict] = None) -> dict:
    return {
        "id": doc["id"], "event_id": doc["event_id"], "user_id": doc["user_id"],
        "market": doc.get("market", "match_result"), "selection": doc["selection"], "stake": round(doc["stake"], 2),
        "odds": round(doc["odds"], 2), "potential_win": round(doc["potential_win"], 2),
        "status": doc["status"], "result": doc.get("result"),
        "payout": round(doc.get("payout", 0.0), 2), "created_at": doc["created_at"],
        "settled_at": doc.get("settled_at"), "reference": doc.get("reference"),
        "event": ({"id": event.get("id"), "home": event.get("home"), "away": event.get("away"),
                   "sport": event.get("sport"), "status": event.get("status"),
                   "minute": virtual_minute(event) if event.get("sport") == "Virtual Football" else None,
                   "score": {"home": event.get("home_score", 0), "away": event.get("away_score", 0)},
                   "halftime_score": {"home": event.get("halftime_home_score"), "away": event.get("halftime_away_score")},
                   "result": event.get("result")} if event else None),
    }


CORRECT_SCORE_ODDS = {
    "0-0": 6.0, "1-0": 5.5, "0-1": 6.5, "1-1": 5.0, "2-0": 7.0, "0-2": 8.0,
    "2-1": 8.0, "1-2": 8.5, "2-2": 10.0, "3-0": 11.0, "0-3": 13.0, "3-1": 12.0,
    "1-3": 14.0, "3-2": 16.0, "2-3": 17.0, "3-3": 24.0, "4-0": 18.0, "0-4": 22.0,
    "4-1": 20.0, "1-4": 26.0, "4-2": 24.0, "2-4": 30.0, "4-3": 32.0, "3-4": 36.0, "4-4": 55.0,
}
OVER_UNDER_ODDS = {
    "over_0.5": 1.15, "under_0.5": 5.50, "over_1.5": 1.48, "under_1.5": 2.55,
    "over_2.5": 2.05, "under_2.5": 1.78, "over_3.5": 3.05, "under_3.5": 1.36,
    "over_4.5": 4.40, "under_4.5": 1.18, "over_5.5": 6.50, "under_5.5": 1.10,
}
BOTH_TEAMS_SCORE_ODDS = {"yes": 1.72, "no": 1.92}


def selection_odds(event: dict, selection: str) -> float:
    if selection not in {"home", "draw", "away"}:
        raise HTTPException(status_code=400, detail="Selection must be home, draw, or away")
    defaults = {"home": 1.85, "draw": 3.40, "away": 3.75}
    raw = {"home": event.get("odds_home"), "draw": event.get("odds_draw"), "away": event.get("odds_away")}[selection]
    try:
        value = float(raw)
    except (TypeError, ValueError):
        value = defaults[selection]
    return value if value > 0 else defaults[selection]

def market_odds(event: dict, market: str, selection: str) -> float:
    if market == "match_result":
        return selection_odds(event, selection)
    if market == "double_chance":
        aliases = {"dc_team_1": 1.25, "dc_team_2": 1.45, "1X": 1.25, "X2": 1.45}
        if selection not in aliases:
            raise HTTPException(status_code=400, detail="Unsupported double chance selection")
        return aliases[selection]
    if market == "correct_score":
        if selection not in CORRECT_SCORE_ODDS:
            raise HTTPException(status_code=400, detail="Unsupported correct score selection")
        return CORRECT_SCORE_ODDS[selection]
    if market == "ht_draw_ft":
        aliases = {"home": 7.0, "draw": 5.0, "away": 7.5, "ht_draw_ft_home": 7.0, "ht_draw_ft_draw": 5.0, "ht_draw_ft_away": 7.5}
        if selection not in aliases:
            raise HTTPException(status_code=400, detail="Unsupported half-time/full-time selection")
        return aliases[selection]
    if market == "goals_over_under":
        if selection not in OVER_UNDER_ODDS:
            raise HTTPException(status_code=400, detail="Unsupported over/under selection")
        return OVER_UNDER_ODDS[selection]
    if market == "both_teams_score":
        if selection not in BOTH_TEAMS_SCORE_ODDS:
            raise HTTPException(status_code=400, detail="Unsupported GG/NG selection")
        return BOTH_TEAMS_SCORE_ODDS[selection]
    raise HTTPException(status_code=400, detail="Unsupported betting market")

def selection_wins(bet: dict, event: dict, result: str) -> bool:
    market = bet.get("market", "match_result")
    selection = bet.get("selection")
    if market == "match_result":
        return selection == result
    if market == "double_chance":
        if selection in {"dc_team_1", "1X"}:
            return result in {"home", "draw"}
        if selection in {"dc_team_2", "X2"}:
            return result in {"away", "draw"}
        return False
    if market == "correct_score":
        final_score = f"{int(event.get('home_score', 0))}-{int(event.get('away_score', 0))}"
        return selection == final_score
    if market == "ht_draw_ft":
        ht_home = event.get("halftime_home_score")
        ht_away = event.get("halftime_away_score")
        if ht_home is None or ht_away is None or int(ht_home) != int(ht_away):
            return False
        return selection in {"home", "win1", "ht_draw_ft_home"} and result == "home" or selection in {"draw", "ht_draw_ft_draw"} and result == "draw" or selection in {"away", "win2", "ht_draw_ft_away"} and result == "away"
    if market == "goals_over_under":
        total = int(event.get("home_score", 0) or 0) + int(event.get("away_score", 0) or 0)
        try:
            line = float(selection.split("_")[1])
        except (IndexError, ValueError):
            return False
        return total > line if selection.startswith("over_") else total < line
    if market == "both_teams_score":
        gg = int(event.get("home_score", 0) or 0) > 0 and int(event.get("away_score", 0) or 0) > 0
        return gg if selection == "yes" else (not gg if selection == "no" else False)
    return False


async def settle_event_bets(event_id: str, result: str):
    """Settle open demo bets exactly once, even if settlement is triggered twice."""
    now = datetime.now(timezone.utc).isoformat()
    while True:
        bet = await db.bets.find_one_and_update(
            {"event_id": event_id, "status": "open"},
            {"$set": {"status": "settling", "settling_at": now}},
            return_document=ReturnDocument.AFTER,
        )
        if not bet:
            break
        if result == "void":
            payout = round(bet["stake"], 2)
            status = "void"
        elif selection_wins(bet, await db.events.find_one({"id": event_id}) or {}, result):
            payout = round(bet["potential_win"], 2)
            status = "won"
        else:
            payout = 0.0
            status = "lost"
        if payout:
            await db.users.update_one(
                {"_id": ObjectId(bet["user_id"])},
                {"$inc": {"balance": payout}},
            )
        await db.transactions.insert_one({
            "id": str(uuid.uuid4()),
            "reference": f"NB-SET-{bet['id'][:10].upper()}",
            "user_id": bet["user_id"],
            "type": "bet_settlement",
            "amount": payout,
            "method": "demo_wallet",
            "status": "completed",
            "bet_id": bet["id"],
            "created_at": now,
        })
        await db.bets.update_one(
            {"_id": bet["_id"], "status": "settling"},
            {"$set": {
                "status": status,
                "result": result,
                "payout": payout,
                "settled_at": now,
            }, "$unset": {"settling_at": ""}},
        )


@api_router.post("/bets")
async def place_demo_bet(body: BetInput, user: dict = Depends(get_current_user)):
    event = await db.events.find_one({"id": body.event_id})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    is_virtual = event.get("sport") == "Virtual Football"
    if (is_virtual and event.get("status") not in ("scheduled", "live")) or (not is_virtual and event.get("status") not in ("open", "live")):
        raise HTTPException(status_code=400, detail="Betting is closed for this event")
    odds = market_odds(event, body.market, body.selection)
    stake = round(body.stake, 2)
    updated = await db.users.find_one_and_update(
        {"_id": user["_id"], "balance": {"$gte": stake}},
        {"$inc": {"balance": -stake}}, return_document=ReturnDocument.AFTER,
    )
    if not updated:
        raise HTTPException(status_code=400, detail="Insufficient demo wallet balance")
    now = datetime.now(timezone.utc).isoformat()
    bet = {"id": str(uuid.uuid4()), "reference": f"NB-B-{uuid.uuid4().hex[:10].upper()}",
           "user_id": str(user["_id"]), "event_id": body.event_id, "market": body.market, "selection": body.selection,
           "stake": stake, "odds": odds, "potential_win": round(stake * odds, 2),
           "status": "open", "created_at": now}
    try:
        await db.bets.insert_one(bet)
        await db.transactions.insert_one({"id": str(uuid.uuid4()), "reference": bet["reference"],
            "user_id": str(user["_id"]), "type": "bet_stake", "amount": stake,
            "method": "demo_wallet", "status": "completed", "bet_id": bet["id"], "created_at": now})
    except Exception:
        await db.users.update_one({"_id": user["_id"]}, {"$inc": {"balance": stake}})
        raise HTTPException(status_code=503, detail="Bet could not be recorded; stake restored")
    return {"bet": bet_public(bet, event), "balance": round(updated.get("balance", 0.0), 2), "demo": True}


@api_router.get("/bets")
async def list_demo_bets(user: dict = Depends(get_current_user)):
    docs = await db.bets.find({"user_id": str(user["_id"])}).sort("created_at", -1).to_list(200)
    result = []
    for d in docs:
        event = await db.events.find_one({"id": d["event_id"]})
        result.append(bet_public(d, event))
    return result


@api_router.patch("/admin/events/{event_id}/control")
async def control_event(event_id: str, body: EventControlInput, staff: dict = Depends(require_permission("events.manage"))):
    current = await db.events.find_one({"id": event_id, "sport": {"$ne": "Virtual Football"}})
    if not current:
        raise HTTPException(status_code=404, detail="Sports event not found")

    values = {k: v for k, v in body.model_dump(exclude_none=True).items()}
    requested_status = values.get("status")

    # Start Live always starts a fresh 94-minute real-time clock. Score changes
    # made by Admin before/while live are preserved.
    if requested_status == "live":
        values["minute"] = 1
        values["clock_base_minute"] = 1
        values["clock_started_at"] = datetime.now(timezone.utc).isoformat()
        values.pop("result", None)

    # Finish Match freezes the event at 94 minutes and settles every ticket
    # leg against the exact score currently stored on the event.
    if requested_status == "finished":
        home_score = int(values.get("home_score", current.get("home_score", 0)) or 0)
        away_score = int(values.get("away_score", current.get("away_score", 0)) or 0)
        values["home_score"] = home_score
        values["away_score"] = away_score
        values["minute"] = 94
        values["clock_base_minute"] = 94
        values["clock_started_at"] = None
        values["result"] = "home" if home_score > away_score else "away" if away_score > home_score else "draw"

    # Any score update while live keeps the already-running clock.
    if requested_status is None and current.get("status") == "live":
        values.pop("minute", None)

    await db.events.update_one({"id": event_id}, {"$set": values})
    updated = await db.events.find_one({"id": event_id})

    if requested_status == "finished":
        await settle_event_bets(event_id, values["result"])
        await settle_ticket_event(event_id, values["result"])
        updated = await db.events.find_one({"id": event_id})

    updated = await hydrate_event_team_assets(updated)
    return event_public(updated)


@api_router.post("/events/{event_id}/booking-code")
async def generate_event_booking_code(event_id: str, user: dict = Depends(get_current_user)):
    event = await db.events.find_one({"id": event_id})
    if not event:
        raise HTTPException(status_code=404, detail="Match not found")
    code = f"NBM-{uuid.uuid4().hex[:10].upper()}"
    await db.events.update_one({"id": event_id}, {"$set": {"booking_code": code}})
    return {"event_id": event_id, "booking_code": code}


@api_router.post("/admin/events/{event_id}/settle")
async def settle_event(event_id: str, body: BetSettlementInput, staff: dict = Depends(require_permission("events.manage"))):
    event = await db.events.find_one({"id": event_id})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    await db.events.update_one({"id": event_id}, {"$set": {"status": "finished", "result": body.result}})
    await settle_event_bets(event_id, body.result)
    await settle_ticket_event(event_id, body.result)
    return {"ok": True, "event_id": event_id, "result": body.result}



# ------------------------------------------------------------------ booking tickets / multiples
async def ticket_public(doc: dict):
    # Be defensive with tickets created by older versions. One malformed legacy
    # leg must never make the whole /tickets response fail with HTTP 500.
    ticket_id = doc.get("id") or str(doc.get("_id"))
    raw_legs = doc.get("selections") if isinstance(doc.get("selections"), list) else []
    legs=[]
    for leg in raw_legs:
        if not isinstance(leg, dict):
            continue
        event_id = leg.get("event_id")
        ev = await db.events.find_one({"id": event_id}) if event_id else None
        try:
            minute = virtual_minute(ev) if ev and ev.get("sport")=="Virtual Football" else live_event_minute(ev) if ev else None
        except (TypeError, ValueError):
            minute = 0
        try:
            score_home = int(ev.get("home_score", 0) or 0) if ev else 0
            score_away = int(ev.get("away_score", 0) or 0) if ev else 0
        except (TypeError, ValueError):
            score_home, score_away = 0, 0
        home_name = ev.get("home") if ev else leg.get("home", "Home")
        away_name = ev.get("away") if ev else leg.get("away", "Away")
        legs.append({**leg, "event_id": event_id or "", "home": home_name, "away": away_name,
                     "league": ev.get("league") if ev else leg.get("league"),
                     "status": leg.get("status", "pending"),
                     "event_status": ev.get("status") if ev else "finished",
                     "minute": minute,
                     "score": {"home": score_home, "away": score_away}})
    try:
        stake = round(float(doc.get("stake",0) or 0),2)
        total_odds = round(float(doc.get("total_odds",1) or 1),2)
        potential_win = round(float(doc.get("potential_win",0) or 0),2)
        payout = round(float(doc.get("payout",0) or 0),2)
    except (TypeError, ValueError):
        stake, total_odds, potential_win, payout = 0.0, 1.0, 0.0, 0.0
    return {"id":ticket_id, "booking_code":doc.get("booking_code", ""),
            "verify_code":doc.get("verify_code") or doc.get("booking_code", ""),
            "status":doc.get("status","booked"),
            "bet_type":"Multiple" if len(legs)>1 else "Singles", "stake":stake,
            "total_odds":total_odds, "potential_win":potential_win,
            "payout":payout, "created_at":doc.get("created_at"), "settled_at":doc.get("settled_at"), "selections":legs}

async def settle_ticket_event(event_id: str, result: str):
    tickets = await db.tickets.find({"selections.event_id": event_id, "status": {"$in":["open","pending"]}}).to_list(500)
    for ticket in tickets:
        changed=False
        for leg in ticket.get("selections",[]):
            if leg.get("event_id") != event_id or leg.get("status") not in ("open","pending"): continue
            ev=await db.events.find_one({"id":event_id}) or {}
            pseudo={"market":leg["market"],"selection":leg["selection"]}
            leg["status"]="won" if selection_wins(pseudo,ev,result) else "lost"; leg["result"]=result; changed=True
        if not changed: continue
        if any(l.get("status")=="lost" for l in ticket.get("selections",[])):
            ticket["status"]="lost"
        elif all(l.get("status")=="won" for l in ticket.get("selections",[])):
            ticket["status"]="won"
            if ticket.get("stake",0)>0 and not ticket.get("paid",False):
                ticket["payout"]=round(ticket["potential_win"],2)
                await db.users.update_one({"_id":ObjectId(ticket["user_id"])},{"$inc":{"balance":ticket["payout"]}})
                ticket["paid"]=True
                await db.transactions.insert_one({"id":str(uuid.uuid4()),"reference":f"NB-SET-{ticket['id'][:10].upper()}","user_id":ticket["user_id"],"type":"bet_settlement","amount":ticket["payout"],"method":"demo_wallet","status":"completed","ticket_id":ticket["id"],"created_at":datetime.now(timezone.utc).isoformat()})
        await db.tickets.update_one({"_id":ticket["_id"]},{"$set":{"selections":ticket["selections"],"status":ticket["status"],"payout":ticket.get("payout",0),"paid":ticket.get("paid",False),"settled_at":datetime.now(timezone.utc).isoformat() if ticket["status"] in ("won","lost") else None}})

@api_router.post("/tickets")
async def create_ticket(body: TicketInput, user: dict = Depends(get_current_user)):
    ids=[x.event_id for x in body.selections]
    if len(ids)!=len(set(ids)): raise HTTPException(status_code=400, detail="A ticket cannot contain the same match twice")
    selections=[]; total=1.0
    for item in body.selections:
        ev=await db.events.find_one({"id":item.event_id})
        if not ev: raise HTTPException(status_code=404, detail=f"Match {item.event_id} not found")
        if ev.get("status") not in ("open","scheduled","live"): raise HTTPException(status_code=400, detail="One of the selected matches is no longer open")
        # Snapshot the exact odds at booking time. This value is returned with the
        # booking code and is reused when that code is loaded later, so a booking
        # never falls back to 1.00 or changes because the UI recalculates it.
        odds=round(market_odds(ev,item.market,item.selection),2)
        if odds <= 0:
            raise HTTPException(status_code=400, detail="Odds unavailable for this selection")
        total*=odds
        selections.append({"event_id":item.event_id,"market":item.market,"selection":item.selection,"odds":odds,"status":"pending","result":None})
    code=f"NBM-{uuid.uuid4().hex[:10].upper()}"; now=datetime.now(timezone.utc).isoformat()
    doc={"id":str(uuid.uuid4()),"booking_code":code,"user_id":str(user["_id"]),"selections":selections,"total_odds":round(total,2),"stake":0.0,"potential_win":0.0,"payout":0.0,"status":"booked","created_at":now}
    await db.tickets.insert_one(doc)
    return {"ticket":await ticket_public(doc)}

@api_router.get("/tickets/verify/{booking_code}")
async def verify_ticket(booking_code:str):
    doc=await db.tickets.find_one({"booking_code":booking_code.strip().upper()})
    if not doc: raise HTTPException(status_code=404, detail="Booking code not found")
    return {"ticket":await ticket_public(doc)}

@api_router.post("/tickets/verify")
async def verify_ticket_status(body: TicketVerifyInput):
    """Public ticket verification endpoint used by the Verify Ticket modal.

    It accepts either the public booking/verify code or the ticket UUID and returns
    a normalized status: Won, Lost, Pending, or Invalid. No wallet/auth data is
    exposed by this endpoint.
    """
    identifier = body.identifier.strip()
    if not identifier:
        return {"verification": {"status": "Invalid", "message": "Enter a Ticket ID or Verify Code.", "ticket": None}}

    doc = await db.tickets.find_one({"$or": [
        {"verify_code": identifier.upper()},
        {"booking_code": identifier.upper(), "status": "booked"},
        {"id": identifier},
    ]})
    if not doc:
        return {"verification": {"status": "Invalid", "message": "We could not find a ticket with that Ticket ID or Verify Code.", "ticket": None}}

    public = await ticket_public(doc)
    raw_status = str(public.get("status", "pending")).lower()
    status = "Won" if raw_status == "won" else "Lost" if raw_status == "lost" else "Pending"
    message = {
        "Won": "Congratulations! This ticket is verified as a winner and the payout shown below is the recorded winning payout.",
        "Lost": "This ticket has been settled and did not win.",
        "Pending": "This ticket is valid but has not reached a final result yet.",
    }[status]
    verified_at = datetime.now(timezone.utc).isoformat()
    ticket = {
        "ticket_id": public["id"],
        "id": public["id"],
        "verify_code": public.get("booking_code", ""),
        "booking_code": public.get("booking_code", ""),
        "status": public.get("status", "pending"),
        "stake": public.get("stake", 0),
        "total_odds": public.get("total_odds", 0),
        "payout": public.get("payout", 0),
        "potential_win": public.get("potential_win", 0),
        "created_at": public.get("created_at"),
        "settled_at": public.get("settled_at"),
        "verification_timestamp": verified_at,
        "selections": public.get("selections", []),
    }
    return {"verification": {"status": status, "message": message, "verified_at": verified_at, "ticket": ticket}}

@api_router.post("/tickets/{booking_code}/place")
async def place_ticket(booking_code:str, body:dict, user:dict=Depends(get_current_user)):
    # A booking code is a reusable shareable bet template. Every user who
    # places it gets a separate ticket/verify code, stake, wallet deduction
    # and settlement record. The original booking remains reusable.
    code = booking_code.strip().upper()
    template = await db.tickets.find_one({"booking_code": code, "status": "booked"})
    if not template:
        raise HTTPException(status_code=404, detail="Booking code not found or no longer available")

    stake=round(float(body.get("stake",0)),2)
    if stake<=0: raise HTTPException(status_code=400, detail="Enter a valid stake")

    # Do not allow a shared booking to be placed after any of its matches
    # have closed/finished. This protects all users using the same code.
    for leg in template.get("selections", []):
        event = await db.events.find_one({"id": leg.get("event_id")})
        if not event or event.get("status") not in ("open", "scheduled", "live"):
            raise HTTPException(status_code=400, detail="One of the matches in this booking is no longer available")

    updated=await db.users.find_one_and_update({"_id":user["_id"],"balance":{"$gte":stake}},{"$inc":{"balance":-stake}},return_document=ReturnDocument.AFTER)
    if not updated: raise HTTPException(status_code=400, detail="Insufficient demo wallet balance. Go to deposit.")

    ticket_id=str(uuid.uuid4())
    verify_code=f"NBV-{uuid.uuid4().hex[:10].upper()}"
    now=datetime.now(timezone.utc).isoformat()
    placed={
        "id":ticket_id,
        "booking_code":code,
        "verify_code":verify_code,
        "user_id":str(user["_id"]),
        "selections":[dict(x) for x in template.get("selections", [])],
        "total_odds":round(float(template.get("total_odds",1) or 1),2),
        "stake":stake,
        "potential_win":round(stake*float(template.get("total_odds",1) or 1),2),
        "payout":0.0,
        "status":"open",
        "created_at":now,
        "source_booking_id":template.get("id"),
    }
    await db.tickets.insert_one(placed)
    await db.transactions.insert_one({"id":str(uuid.uuid4()),"reference":f"NB-T-{ticket_id[:10].upper()}","user_id":str(user["_id"]),"type":"bet_stake","amount":stake,"method":"demo_wallet","status":"completed","ticket_id":ticket_id,"booking_code":code,"created_at":now})
    return {"ticket":await ticket_public(placed),"balance":round(updated.get("balance",0),2)}

@api_router.get("/tickets")
async def list_tickets(user:dict=Depends(get_current_user)):
    docs=await db.tickets.find({"user_id":str(user["_id"])}).sort("created_at",-1).to_list(200)
    result=[]
    for d in docs:
        try:
            result.append(await ticket_public(d))
        except Exception as exc:
            logger.exception("Skipping malformed ticket %s: %s", d.get("id") or d.get("_id"), exc)
    return result

# ------------------------------------------------------------------ auth routes
@api_router.post("/auth/register")
async def register(body: RegisterInput):
    if body.password != body.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    email = body.email.lower()
    phone = body.phone.strip()
    referral_code = body.referral_code.strip().upper()
    referrer = await db.users.find_one({"referral_code": referral_code, "role": {"$in": ["admin", "sub_admin"]}})
    if not referrer:
        raise HTTPException(status_code=400, detail="A valid Admin or Sub-Admin referral code is required to create an account")
    if await db.users.find_one({"$or": [{"email": email}, {"phone": phone}]}):
        raise HTTPException(status_code=400, detail="Email or phone number is already registered")
    doc = {"email": email, "phone": phone, "password_hash": hash_password(body.password), "name": body.name,
           "role": "user", "balance": STARTING_BALANCE, "total_deposited": 0.0,
           "referral_code_used": referral_code, "referred_by": str(referrer["_id"]),
           "created_at": datetime.now(timezone.utc).isoformat()}
    res = await db.users.insert_one(doc); doc["_id"] = res.inserted_id
    token = create_access_token(str(res.inserted_id), email)
    return {"token": token, "user": public_user(doc), "referrer": {"name": referrer.get("name", ""), "role": referrer.get("role")}}

@api_router.post("/auth/login")
async def login(body: LoginInput):
    identifier = body.identifier.strip().lower()
    user = await db.users.find_one({"$or": [{"email": identifier}, {"phone": body.identifier.strip()}]})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email/phone number or password")
    token = create_access_token(str(user["_id"]), user.get("email", ""))
    return {"token": token, "user": public_user(user)}

@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return public_user(user)


# ------------------------------------------------------------------ cashier (simulated)
def txn_public(d: dict) -> dict:
    return {
        "id": d["id"], "type": d["type"], "amount": round(d["amount"], 2),
        "method": d.get("method"),
        "status": d["status"], "reference": d.get("reference"), "created_at": d["created_at"],
        "reviewed_at": d.get("reviewed_at"), "reviewed_by": d.get("reviewed_by"),
        "review_reason": d.get("review_reason"), "destination": d.get("destination"), "audit_history": d.get("audit_history", []),
    }


@api_router.get("/wallet/status")
async def wallet_status(user: dict = Depends(get_current_user)):
    s = await get_settings()
    fresh = await db.users.find_one({"_id": user["_id"]})
    total_dep = fresh.get("total_deposited", 0.0)
    deposit_count_result = await db.transactions.aggregate([
        {"$match": {"user_id": str(user["_id"]), "type": "deposit", "status": {"$in": ["approved", "credited"]}}},
        {"$count": "count"},
    ]).to_list(1)
    deposit_count = int(deposit_count_result[0]["count"] if deposit_count_result else 0)
    deposits_required = 3
    deposits_remaining = max(0, deposits_required - deposit_count)
    can_withdraw = fresh.get("balance", 0.0) >= s["min_withdrawal"] and deposits_remaining == 0
    reserved = await db.transactions.aggregate([
        {"$match": {"user_id": str(user["_id"]), "type": "withdrawal", "status": {"$in": ["pending", "processing"]}}},
        {"$group": {"_id": None, "amount": {"$sum": "$amount"}}},
    ]).to_list(1)
    reserved_balance = round((reserved[0]["amount"] if reserved else 0.0), 2)
    return {
        "balance": round(fresh.get("balance", 0.0), 2),
        "available_balance": round(fresh.get("balance", 0.0), 2),
        "reserved_withdrawals": reserved_balance,
        "total_deposited": round(total_dep, 2),
        "deposit_count": deposit_count,
        "deposits_required": deposits_required,
        "deposits_remaining": deposits_remaining,
        "withdrawal_deposit_requirement_met": deposits_remaining == 0,
        "can_withdraw": can_withdraw,
        "first_deposit_bonus_available": not bool(fresh.get("first_deposit_bonus_awarded", False)),
        "first_deposit_bonus_cap": round(float(s.get("first_deposit_bonus_cap", FIRST_DEPOSIT_BONUS_CAP)), 2),
        **s,
    }


@api_router.post("/wallet/deposit")
async def deposit(body: DepositInput, user: dict = Depends(get_current_user)):
    if not math.isfinite(body.amount):
        raise HTTPException(status_code=400, detail="Amount must be a finite number")
    s = await get_settings()
    if body.amount < s["min_deposit"]:
        raise HTTPException(status_code=400, detail=f"Minimum deposit is GHS {s['min_deposit']:.0f}")

    amount = round(body.amount, 2)
    now = datetime.now(timezone.utc).isoformat()
    ref = f"NB-D-{uuid.uuid4().hex[:10].upper()}"

    # First-deposit promotion: a 100% match capped at GH₵100. Since the
    # minimum deposit is GH₵300, an eligible first deposit receives GH₵100.
    # The atomic filter prevents a double bonus if deposits arrive together.
    bonus_cap = round(float(s.get("first_deposit_bonus_cap", FIRST_DEPOSIT_BONUS_CAP)), 2)
    bonus_amount = min(amount, bonus_cap)
    bonus_result = await db.users.update_one(
        {"_id": user["_id"], "first_deposit_bonus_awarded": {"$ne": True}},
        {
            "$inc": {"balance": amount + bonus_amount, "total_deposited": amount},
            "$set": {"first_deposit_bonus_awarded": True},
        },
    )
    first_deposit_bonus = bonus_result.modified_count == 1
    if not first_deposit_bonus:
        bonus_amount = 0.0
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$inc": {"balance": amount, "total_deposited": amount}},
        )

    await db.transactions.insert_one({
        "id": str(uuid.uuid4()), "reference": ref, "user_id": str(user["_id"]),
        "type": "deposit", "amount": amount, "method": body.method,
        "phone_number": body.phone_number, "status": "approved", "credited": True,
        "created_at": now, "first_deposit_bonus": first_deposit_bonus,
        "bonus_amount": round(bonus_amount, 2),
    })

    if first_deposit_bonus and bonus_amount > 0:
        await db.transactions.insert_one({
            "id": str(uuid.uuid4()),
            "reference": f"NB-B-{uuid.uuid4().hex[:10].upper()}",
            "user_id": str(user["_id"]),
            "type": "first_deposit_bonus",
            "amount": round(bonus_amount, 2),
            "method": "promotion",
            "status": "credited",
            "deposit_reference": ref,
            "created_at": now,
            "promotion": "100% first deposit bonus up to GHS 100",
        })

    # Referral commission uses the real-money deposit amount, not the bonus.
    referrer_id = user.get("referred_by")
    if referrer_id and ObjectId.is_valid(referrer_id):
        referrer = await db.users.find_one({"_id": ObjectId(referrer_id), "role": "sub_admin"})
        if referrer:
            commission = round(amount * REFERRAL_COMMISSION_RATE, 2)
            await db.users.update_one({"_id": referrer["_id"]}, {"$inc": {"commission_total": commission}})
            await db.transactions.insert_one({
                "id": str(uuid.uuid4()), "reference": f"NB-C-{uuid.uuid4().hex[:10].upper()}",
                "user_id": str(referrer["_id"]), "type": "referral_commission", "amount": commission,
                "deposit_amount": amount, "referred_user_id": str(user["_id"]),
                "method": "referral", "status": "earned", "commission_rate": REFERRAL_COMMISSION_RATE,
                "created_at": now, "deposit_reference": ref,
            })

    fresh = await db.users.find_one({"_id": user["_id"]})
    total_credited = round(amount + bonus_amount, 2)
    message = "Deposit credited with your GH₵100 first-deposit bonus." if first_deposit_bonus else "Deposit credited to your wallet."
    return {
        "reference": ref, "status": "approved", "balance": round(fresh.get("balance", 0), 2),
        "deposit_amount": amount, "bonus_amount": round(bonus_amount, 2),
        "total_credited": total_credited, "first_deposit_bonus": first_deposit_bonus,
        "message": message,
    }


@api_router.post("/wallet/deposit/manual")
async def manual_deposit(body: DepositInput, user: dict = Depends(get_current_user)):
    return await deposit(body, user)

@api_router.post("/wallet/withdraw")
async def withdraw(body: WithdrawInput, user: dict = Depends(get_current_user)):
    if not math.isfinite(body.amount):
        raise HTTPException(status_code=400, detail="Amount must be a finite number")
    destination = body.destination.strip()
    if len(destination) < 4:
        raise HTTPException(status_code=400, detail="A valid payout destination is required")
    s = await get_settings()
    if body.amount < s["min_withdrawal"]:
        raise HTTPException(status_code=400, detail=f"Minimum withdrawal is GHS {s['min_withdrawal']:.0f}")

    deposit_count_result = await db.transactions.aggregate([
        {"$match": {"user_id": str(user["_id"]), "type": "deposit", "status": {"$in": ["approved", "credited"]}}},
        {"$count": "count"},
    ]).to_list(1)
    deposit_count = int(deposit_count_result[0]["count"] if deposit_count_result else 0)
    if deposit_count < 3:
        raise HTTPException(status_code=400, detail="MAKE 3 MORE DEPOSIT BEFORE YOU CAN WITHDRAW YOUR WINNINGS")

    # Reserve the amount atomically so two simultaneous requests cannot
    # spend the same available balance. The amount remains reserved while
    # the demo withdrawal moves through pending -> processing -> paid.
    updated = await db.users.find_one_and_update(
        {"_id": user["_id"], "balance": {"$gte": body.amount}},
        {"$inc": {"balance": -round(body.amount, 2)}},
        return_document=ReturnDocument.AFTER,
    )
    if not updated:
        raise HTTPException(status_code=400, detail="Insufficient balance")
    new_balance = round(updated.get("balance", 0.0), 2)
    txn = {
        "id": str(uuid.uuid4()), "reference": f"NB-W-{uuid.uuid4().hex[:10].upper()}", "user_id": str(user["_id"]), "type": "withdrawal",
        "amount": round(body.amount, 2), "method": body.method,
        "destination": destination, "phone_number": body.phone_number, "status": "pending", "created_at": datetime.now(timezone.utc).isoformat(),
    }
    try:
        await db.transactions.insert_one(txn)
    except Exception:
        # Compensate if the transaction record cannot be created after the
        # balance reservation, so a failed request cannot consume funds.
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$inc": {"balance": round(body.amount, 2)}},
        )
        raise HTTPException(status_code=503, detail="Withdrawal could not be recorded; no funds were taken")
    return {"balance": new_balance, "withdrawn": round(body.amount, 2), "status": "pending", "reference": txn["reference"]}


@api_router.get("/wallet/transactions")
async def wallet_transactions(user: dict = Depends(get_current_user)):
    docs = await db.transactions.find({"user_id": str(user["_id"])}).sort("created_at", -1).to_list(200)
    return [txn_public(d) for d in docs]


# ------------------------------------------------------------------ referrals, staff wallets & settlement accounts

def role_label(role: str) -> str:
    return {"super_admin": "Super Admin", "admin": "Admin", "sub_admin": "Sub-Admin", "user": "User"}.get(role, role)


def staff_public(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]), "name": doc.get("name", ""), "email": doc.get("email", ""),
        "phone": doc.get("phone", ""), "role": doc.get("role", "user"),
        "role_label": role_label(doc.get("role", "user")),
        "balance": round(doc.get("balance", 0.0), 2),
        "demo_balance": round(doc.get("balance", 0.0), 2) if doc.get("role") in STAFF_ROLES else None,
        "referral_code": doc.get("referral_code", ""),
        "commission_total": round(doc.get("commission_total", 0.0), 2),
        "permissions": doc.get("permissions", []), "created_at": doc.get("created_at"),
    }


@api_router.get("/referrals/me")
async def referral_profile(user: dict = Depends(require_staff)):
    if user.get("role") not in ("admin", "sub_admin"):
        # Super Admin can also have a referral code, but this endpoint remains useful for the staff UI.
        if user.get("role") != "super_admin":
            raise HTTPException(status_code=403, detail="Referral tools are for staff accounts")
    code = user.get("referral_code")
    if not code:
        code = await unique_code(db.users, "referral_code", 8)
        await db.users.update_one({"_id": user["_id"]}, {"$set": {"referral_code": code}})
    deposits = await db.transactions.count_documents({"type": "deposit", "status": "approved", "user_id": {"$in": [str(x["_id"]) async for x in db.users.find({"referred_by": str(user["_id"])}, {"_id": 1})]}})
    rate = REFERRAL_COMMISSION_RATE if user.get("role") == "sub_admin" else 0.0
    return {"referral_code": code, "role": user.get("role"), "commission_rate": rate, "commission_total": round(user.get("commission_total", 0.0), 2) if user.get("role") == "sub_admin" else 0.0, "referred_deposit_count": deposits}


@api_router.get("/staff/commissions")
async def staff_commissions(user: dict = Depends(require_staff)):
    if user.get("role") != "sub_admin":
        return {"commission_rate": 0.0, "today": 0.0, "all_time": 0.0, "ledger": []}
    docs = await db.transactions.find({"type": "referral_commission", "user_id": str(user["_id"])}).sort("created_at", -1).to_list(1000)
    referred_ids = [d.get("referred_user_id") for d in docs if d.get("referred_user_id") and ObjectId.is_valid(d.get("referred_user_id"))]
    users = {}
    if referred_ids:
        async for u in db.users.find({"_id": {"$in": [ObjectId(x) for x in referred_ids]}}):
            users[str(u["_id"])] = {"name": u.get("name", ""), "email": u.get("email", ""), "phone": u.get("phone", "")}
    rows = [{"id": d["id"], "created_at": d["created_at"], "deposit_amount": round(d.get("deposit_amount", 0), 2),
             "commission": round(d.get("amount", 0), 2), "user": users.get(d.get("referred_user_id"), {}), "deposit_reference": d.get("deposit_reference")} for d in docs]
    today = datetime.now(timezone.utc).date().isoformat()
    today_total = round(sum(x["commission"] for x in rows if str(x["created_at"]).startswith(today)), 2)
    all_time = round(sum(x["commission"] for x in rows), 2)
    return {"commission_rate": REFERRAL_COMMISSION_RATE, "today": today_total, "all_time": all_time, "ledger": rows}


@api_router.post("/staff/demo-credit")
async def demo_credit(body: DemoCreditInput, user: dict = Depends(require_staff)):
    amount = round(float(body.amount), 2)
    updated = await db.users.find_one_and_update({"_id": user["_id"], "role": {"$in": list(STAFF_ROLES)}}, {"$inc": {"balance": amount}}, return_document=ReturnDocument.AFTER)
    if not updated:
        raise HTTPException(status_code=403, detail="Demo credits are only available to staff accounts")
    now = datetime.now(timezone.utc).isoformat()
    await db.transactions.insert_one({"id": str(uuid.uuid4()), "reference": f"NB-DEMO-{uuid.uuid4().hex[:10].upper()}", "user_id": str(user["_id"]), "type": "demo_credit", "amount": amount, "method": "staff_demo", "status": "completed", "created_at": now})
    return {"ok": True, "demo_balance": round(updated.get("balance", 0.0), 2)}


@api_router.get("/admin/payout-accounts")
async def read_payout_accounts(staff: dict = Depends(require_staff)):
    doc = await db.settings.find_one({"_id": "payout_accounts"}) or {}
    fields = ["mtn_name", "mtn_number", "telecel_name", "telecel_number", "bank_name", "bank_account_name", "bank_account_number", "bank_branch"]
    return {k: doc.get(k, "") for k in fields}


@api_router.put("/admin/payout-accounts")
async def update_payout_accounts(body: PayoutAccountsInput, admin: dict = Depends(require_admin)):
    values = {k: v.strip() for k, v in body.model_dump().items()}
    values["updated_at"] = datetime.now(timezone.utc).isoformat()
    values["updated_by"] = str(admin["_id"])
    await db.settings.update_one({"_id": "payout_accounts"}, {"$set": values}, upsert=True)
    return await read_payout_accounts(admin)


@api_router.post("/admin/deposits/cleanup")
async def cleanup_deposit_logs(body: DepositCleanupInput, super_admin: dict = Depends(require_super_admin)):
    cutoff = body.before
    if cutoff.tzinfo is None:
        cutoff = cutoff.replace(tzinfo=timezone.utc)
    cutoff_iso = cutoff.astimezone(timezone.utc).isoformat()
    result = await db.transactions.update_many(
        {"type": "deposit", "created_at": {"$lt": cutoff_iso}, "deposit_log_deleted_at": {"$exists": False}},
        {"$set": {"deposit_log_deleted_at": datetime.now(timezone.utc).isoformat(), "deposit_log_deleted_by": str(super_admin["_id"]), "deposit_log_deleted": True}},
    )
    return {"ok": True, "soft_deleted": result.modified_count, "before": cutoff_iso, "balances_untouched": True}


@api_router.get("/staff/invite/{token}")
async def inspect_staff_invite(token: str):
    invite = await db.settings.find_one({"_id": f"staff_invite:{token}"})
    if not invite:
        raise HTTPException(status_code=404, detail="Invitation link is invalid or expired")
    expires_at = datetime.fromisoformat(invite["expires_at"])
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=410, detail="Invitation link has expired")
    target = await db.users.find_one({"_id": ObjectId(invite["user_id"])}) if ObjectId.is_valid(invite.get("user_id", "")) else None
    if not target:
        raise HTTPException(status_code=404, detail="Invited staff account no longer exists")
    return {"valid": True, "name": target.get("name", ""), "email": target.get("email", ""), "role": target.get("role"), "role_label": role_label(target.get("role", "user")), "expires_at": invite["expires_at"]}


@api_router.get("/admin/staff")
async def list_staff(manager: dict = Depends(require_admin)):
    docs = await db.users.find({"role": {"$in": ["super_admin", "admin", "sub_admin"]}}).sort("created_at", -1).to_list(500)
    return [staff_public(d) for d in docs]


@api_router.post("/admin/staff")
async def create_staff(body: StaffCreateInput, manager: dict = Depends(require_admin)):
    if manager.get("role") == "admin" and body.role != "sub_admin":
        raise HTTPException(status_code=403, detail="Admins can only create Sub-Admin accounts")
    email = body.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email is already registered")
    referral_code = await unique_code(db.users, "referral_code", 8)
    now = datetime.now(timezone.utc).isoformat()
    doc = {"email": email, "phone": body.phone.strip(), "password_hash": hash_password(body.password), "name": body.name.strip(),
           "role": body.role, "balance": STAFF_STARTING_DEMO_BALANCE, "demo_balance": STAFF_STARTING_DEMO_BALANCE,
           "commission_total": 0.0, "referral_code": referral_code, "permissions": default_subadmin_permissions() if body.role == "sub_admin" else ALL_SUBADMIN_PERMISSIONS,
           "created_at": now, "created_by": str(manager["_id"])}
    res = await db.users.insert_one(doc); doc["_id"] = res.inserted_id
    return staff_public(doc)


@api_router.put("/admin/staff/{user_id}")
async def update_staff(user_id: str, body: StaffUpdateInput, manager: dict = Depends(require_admin)):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user id")
    target = await db.users.find_one({"_id": ObjectId(user_id)})
    if not target or target.get("role") not in STAFF_ROLES:
        raise HTTPException(status_code=404, detail="Staff account not found")
    if target.get("role") == "super_admin" and manager.get("role") != "super_admin":
        raise HTTPException(status_code=403, detail="Admins cannot modify Super Admin accounts")
    values = {}
    for key in ("name", "email", "phone"):
        value = getattr(body, key, None)
        if value is not None:
            values[key] = str(value).lower() if key == "email" else str(value).strip()
    if body.password:
        values["password_hash"] = hash_password(body.password)
    if values.get("email") and await db.users.find_one({"email": values["email"], "_id": {"$ne": target["_id"]}}):
        raise HTTPException(status_code=400, detail="Email is already registered")
    if values:
        await db.users.update_one({"_id": target["_id"]}, {"$set": values})
    updated = await db.users.find_one({"_id": target["_id"]})
    return staff_public(updated)


@api_router.delete("/admin/staff/{user_id}")
async def delete_staff(user_id: str, manager: dict = Depends(require_admin)):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user id")
    target = await db.users.find_one({"_id": ObjectId(user_id)})
    if not target or target.get("role") not in STAFF_ROLES:
        raise HTTPException(status_code=404, detail="Staff account not found")
    if target.get("role") == "super_admin":
        raise HTTPException(status_code=403, detail="Super Admin accounts cannot be deleted")
    if manager.get("role") == "admin" and target.get("role") != "sub_admin":
        raise HTTPException(status_code=403, detail="Admins can only remove Sub-Admins")
    await db.users.delete_one({"_id": target["_id"]})
    return {"ok": True}


@api_router.post("/admin/staff/{user_id}/invite")
async def create_staff_invite(user_id: str, expires_hours: int = 24, manager: dict = Depends(require_admin)):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user id")
    target = await db.users.find_one({"_id": ObjectId(user_id), "role": {"$in": ["admin", "sub_admin"]}})
    if not target:
        raise HTTPException(status_code=404, detail="Staff account not found")
    if manager.get("role") == "admin" and target.get("role") != "sub_admin":
        raise HTTPException(status_code=403, detail="Admins can only invite Sub-Admins")
    expires_hours = max(1, min(expires_hours, 720))
    token = uuid.uuid4().hex + uuid.uuid4().hex
    expires_at = datetime.now(timezone.utc) + timedelta(hours=expires_hours)
    await db.settings.update_one({"_id": f"staff_invite:{token}"}, {"$set": {"user_id": str(target["_id"]), "expires_at": expires_at.isoformat(), "created_by": str(manager["_id"])}}, upsert=True)
    return {"token": token, "expires_at": expires_at.isoformat(), "role": target.get("role"), "referral_code": target.get("referral_code", "")}


# ------------------------------------------------------------------ settings & staff
@api_router.get("/settings")
async def read_settings(user: dict = Depends(get_current_user)):
    return await get_settings()


@api_router.put("/admin/settings")
async def update_settings(body: SettingsInput, admin: dict = Depends(require_admin)):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if "min_deposit" in updates and updates["min_deposit"] < 300:
        raise HTTPException(status_code=400, detail="Minimum deposit cannot be below GHS 300")
    if "min_withdrawal" in updates and updates["min_withdrawal"] < 3000:
        raise HTTPException(status_code=400, detail="Minimum withdrawal cannot be below GHS 3,000")
    if updates:
        await db.settings.update_one({"_id": "global"}, {"$set": updates}, upsert=True)
    return await get_settings()


@api_router.get("/admin/transactions")
async def admin_transactions(status: Optional[str] = None, transaction_type: Optional[str] = None,
                             staff: dict = Depends(require_permission("transactions.view"))):
    query = {"deposit_log_deleted": {"$ne": True}}
    if status:
        query["status"] = status
    if transaction_type:
        query["type"] = transaction_type
    docs = await db.transactions.find(query).sort("created_at", -1).to_list(500)
    user_ids = list({d.get("user_id") for d in docs if d.get("user_id")})
    users = {}
    if user_ids:
        async for u in db.users.find({"_id": {"$in": [ObjectId(uid) for uid in user_ids if ObjectId.is_valid(uid)]}}):
            users[str(u["_id"])] = {"email": u.get("email", ""), "name": u.get("name", "")}
    return [{**txn_public(d), "user": users.get(d.get("user_id"), {})} for d in docs]


@api_router.post("/admin/transactions/{transaction_id}/review")
async def review_transaction(transaction_id: str, action: Literal["approve", "reject"],
                             reason: str = "", staff: dict = Depends(require_permission("transactions.review"))):
    txn = await db.transactions.find_one({"id": transaction_id})
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if txn.get("type") != "withdrawal":
        raise HTTPException(status_code=400, detail="Deposit review is disabled; deposits are credited automatically.")
    if txn.get("status") not in ("pending", "processing"):
        raise HTTPException(status_code=400, detail="Transaction has already been reviewed")

    # Validate stored transaction data before changing its status. This avoids
    # approving a malformed transaction and then failing during balance credit
    # or refund processing.
    user_id = txn.get("user_id")
    amount = txn.get("amount")
    if not user_id or not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Transaction has an invalid user reference")
    if not isinstance(amount, (int, float)) or not math.isfinite(float(amount)) or float(amount) <= 0:
        raise HTTPException(status_code=400, detail="Transaction has an invalid amount")

    reason = reason.strip()[:500]
    if action == "reject" and not reason:
        raise HTTPException(status_code=400, detail="A rejection reason is required")
    reviewed_at = datetime.now(timezone.utc).isoformat()
    audit_entry = {"action": action, "reason": reason, "reviewed_at": reviewed_at, "reviewed_by": str(staff["_id"])}

    if action == "approve":
        approved_status = "paid" if txn.get("type") == "withdrawal" else "approved"
        result = await db.transactions.update_one(
            {"id": transaction_id, "status": {"$in": ["pending", "processing"]}},
            {"$set": {"status": approved_status, "reviewed_at": reviewed_at,
                      "reviewed_by": str(staff["_id"]), "review_reason": reason},
             "$push": {"audit_history": audit_entry}},
        )
        if result.modified_count != 1:
            raise HTTPException(status_code=409, detail="Transaction was already reviewed")
        if txn.get("type") == "deposit" and not txn.get("credited", False):
            await db.users.update_one(
                {"_id": ObjectId(txn["user_id"])},
                {"$inc": {"balance": txn["amount"], "total_deposited": txn["amount"]}}
            )
            await db.transactions.update_one({"id": transaction_id}, {"$set": {"credited": True}})
        return {"ok": True, "status": "approved"}

    result = await db.transactions.update_one(
        {"id": transaction_id, "status": {"$in": ["pending", "processing"]}},
        {"$set": {"status": "rejected", "reviewed_at": reviewed_at,
                  "reviewed_by": str(staff["_id"]), "review_reason": reason},
         "$push": {"audit_history": audit_entry}},
    )
    if result.modified_count != 1:
        raise HTTPException(status_code=409, detail="Transaction was already reviewed")
    if txn.get("type") == "withdrawal":
        await db.users.update_one({"_id": ObjectId(txn["user_id"])}, {"$inc": {"balance": txn["amount"]}})
        return {"ok": True, "status": "rejected", "refunded": round(txn["amount"], 2)}
    return {"ok": True, "status": "rejected"}


@api_router.get("/admin/users")
async def list_users(admin: dict = Depends(require_permission("users.view"))):
    docs = await db.users.find().sort("created_at", -1).to_list(500)
    return [
        {"id": str(d["_id"]), "email": d["email"], "name": d.get("name", ""),
         "role": d.get("role", "user"), "permissions": d.get("permissions", []), "balance": round(d.get("balance", 0.0), 2),
         "referral_code": d.get("referral_code", ""), "commission_total": round(d.get("commission_total", 0.0), 2),
         "phone": d.get("phone", ""), "created_at": d.get("created_at") }
        for d in docs
    ]


@api_router.put("/admin/users/{user_id}/role")
async def set_user_role(user_id: str, body: RoleInput, admin: dict = Depends(require_permission("users.manage"))):
    if body.role not in ("user", "sub_admin", "admin"):
        raise HTTPException(status_code=400, detail="Invalid role")
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user id")
    target = await db.users.find_one({"_id": ObjectId(user_id)})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if target.get("role") == "super_admin":
        raise HTTPException(status_code=403, detail="Super Admin accounts cannot be modified")
    if admin.get("role") == "admin" and target.get("role") == "admin":
        raise HTTPException(status_code=403, detail="Admins cannot modify or demote Admin accounts")
    if admin.get("role") == "admin" and body.role == "admin":
        raise HTTPException(status_code=403, detail="Only Super Admins can create or promote Admin accounts")
    updates = {"role": body.role}
    if body.role in ("admin", "sub_admin") and not target.get("referral_code"):
        updates["referral_code"] = await unique_code(db.users, "referral_code", 8)
    updates["permissions"] = [] if body.role == "sub_admin" else ALL_SUBADMIN_PERMISSIONS
    await db.users.update_one({"_id": target["_id"]}, {"$set": updates})
    return {"ok": True, "role": body.role, "permissions": updates["permissions"], "referral_code": updates.get("referral_code", target.get("referral_code", ""))}


@api_router.get("/admin/reports/summary")
async def reports_summary(staff: dict = Depends(require_permission("reports.view"))):
    pending = await db.transactions.count_documents({"status": "pending"})
    approved_deposits = await db.transactions.aggregate([
        {"$match": {"type": "deposit", "status": "approved"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}, "count": {"$sum": 1}}},
    ]).to_list(1)
    withdrawals = await db.transactions.aggregate([
        {"$match": {"type": "withdrawal", "status": "paid"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}, "count": {"$sum": 1}}},
    ]).to_list(1)
    return {
        "pending_transactions": pending,
        "approved_deposits": {"count": approved_deposits[0]["count"] if approved_deposits else 0, "total": round(approved_deposits[0]["total"] if approved_deposits else 0, 2)},
        "paid_withdrawals": {"count": withdrawals[0]["count"] if withdrawals else 0, "total": round(withdrawals[0]["total"] if withdrawals else 0, 2)},
        "users": await db.users.count_documents({}),
        "events": await db.events.count_documents({}),
    }

@api_router.get("/admin/promotions")
async def read_promotions(admin: dict = Depends(require_permission("promotions.manage"))):
    doc = await db.settings.find_one({"_id": "promotions"}) or {}
    return {"enabled": bool(doc.get("enabled", False)), "message": doc.get("message", "")[:200]}

@api_router.put("/admin/promotions")
async def update_promotions(enabled: bool, message: str = "", admin: dict = Depends(require_permission("promotions.manage"))):
    message = message.strip()[:200]
    await db.settings.update_one({"_id": "promotions"}, {"$set": {"enabled": enabled, "message": message}}, upsert=True)
    return {"enabled": enabled, "message": message}

# ------------------------------------------------------------------ sports events
def live_event_minute(doc: dict) -> int:
    """Return the real-time minute for admin-controlled live matches.

    A match runs at real time: one minute of match time equals one real minute,
    from 0 through 94. Admin controls start the clock; finishing the match
    freezes it at 94.
    """
    status = doc.get("status")
    if status == "finished":
        return min(94, max(0, int(doc.get("minute", 94) or 0)))
    if status != "live" or not doc.get("clock_started_at"):
        return min(94, max(0, int(doc.get("minute", 0) or 0)))
    try:
        started = datetime.fromisoformat(str(doc["clock_started_at"]))
        elapsed = max(0, int((datetime.now(timezone.utc) - started).total_seconds() // 60))
    except (TypeError, ValueError):
        elapsed = 0
    # Start Live displays minute 1 immediately. The clock then advances once
    # per real minute and remains within 1–94. The elapsed timer itself is still
    # a full 94 real minutes, so a match is never accelerated.
    base = min(94, max(1, int(doc.get("clock_base_minute", 1) or 1)))
    return min(94, base + elapsed)


def event_public(doc: dict) -> dict:
    minute = live_event_minute(doc)
    return {
        "id": doc["id"],
        "sport": doc["sport"],
        "league": doc["league"],
        "home": doc["home"],
        "away": doc["away"],
        "home_logo_url": doc.get("home_logo_url"),
        "away_logo_url": doc.get("away_logo_url"),
        "odds": {
            "home": round(doc["odds_home"], 2),
            "draw": round(doc["odds_draw"], 2),
            "away": round(doc["odds_away"], 2),
        },
        "status": doc["status"],
        "phase": "live" if doc.get("status") == "live" else ("finished" if doc.get("status") == "finished" else "scheduled"),
        "minute": minute,
        "score": {"home": int(doc.get("home_score", 0) or 0), "away": int(doc.get("away_score", 0) or 0)},
        "halftime_score": {"home": doc.get("halftime_home_score"), "away": doc.get("halftime_away_score")},
        "result": doc.get("result"),
        "booking_code": doc.get("booking_code") or f"NBM-{doc['id'][:8].upper()}",
        "kickoff_at": doc.get("kickoff_at"),
        "created_at": doc.get("created_at"),
    }

async def hydrate_event_team_assets(doc: dict) -> dict:
    if not doc.get("sport") or str(doc.get("sport")).lower() == "virtual football":
        return doc
    home = await team_asset(doc.get("home", ""), doc.get("league"))
    away = await team_asset(doc.get("away", ""), doc.get("league"))
    updates = {}
    if not doc.get("home_logo_url") and home.get("logo_url"): updates["home_logo_url"] = home["logo_url"]
    if not doc.get("away_logo_url") and away.get("logo_url"): updates["away_logo_url"] = away["logo_url"]
    if not doc.get("home_team_id") and home.get("team_id"): updates["home_team_id"] = home["team_id"]
    if not doc.get("away_team_id") and away.get("team_id"): updates["away_team_id"] = away["team_id"]
    if updates:
        await db.events.update_one({"_id": doc["_id"]}, {"$set": updates})
        doc.update(updates)
    return doc

@api_router.get("/leagues")
async def list_leagues():
    rows=[]
    for slug, league in LEAGUE_CATALOG.items():
        teams = await db.teams.find({"league_slug": slug, "season": league["season"]}).sort("name", 1).to_list(30)
        if not teams:
            teams=[{"name":name, "logo_url":None, "provider_team_id":None} for name in league["teams"]]
        rows.append({"slug":slug,"name":league["name"],"country":league["country"],"season":league["season"],"team_count":len(teams),"teams":[{"name":t.get("name"),"logo_url":t.get("logo_url"),"team_id":t.get("provider_team_id")} for t in teams]})
    return rows

@api_router.get("/leagues/{slug}")
async def league_detail(slug: str):
    league=LEAGUE_CATALOG.get(slug)
    if not league:
        raise HTTPException(status_code=404, detail="League not found")
    teams=await db.teams.find({"league_slug":slug,"season":league["season"]}).sort("name",1).to_list(30)
    if not teams:
        teams=[{"name":name,"logo_url":None,"provider_team_id":None} for name in league["teams"]]
    return {"slug":slug,"name":league["name"],"country":league["country"],"season":league["season"],"team_count":len(teams),"teams":[{"name":t.get("name"),"logo_url":t.get("logo_url"),"team_id":t.get("provider_team_id")} for t in teams]}

@api_router.get("/events")
async def list_events(sport: Optional[str] = None, q: Optional[str] = None,
                      status: Optional[str] = "open", limit: int = 40, skip: int = 0):
    query = {}
    if status in ("open", "live", "finished", "cancelled"):
        query["status"] = status
    elif status == "all":
        query["status"] = {"$in": ["open", "live", "finished", "cancelled"]}
    if sport and sport != "all":
        query["sport"] = sport
    if q:
        query["$or"] = [
            {"home": {"$regex": q, "$options": "i"}},
            {"away": {"$regex": q, "$options": "i"}},
            {"league": {"$regex": q, "$options": "i"}},
        ]
    limit = max(1, min(limit, 120))
    docs = await db.events.find(query).sort("created_at", -1).skip(max(0, skip)).limit(limit).to_list(limit)
    docs = await asyncio.gather(*(hydrate_event_team_assets(d) for d in docs))
    return [event_public(d) for d in docs]

@api_router.get("/events/meta")
async def events_meta():
    pipeline = [
        {"$match": {"status": "open"}},
        {"$group": {"_id": "$sport", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    rows = await db.events.aggregate(pipeline).to_list(50)
    sports = [{"sport": r["_id"], "count": r["count"]} for r in rows if r["_id"]]
    return {"sports": sports, "total": sum(s["count"] for s in sports)}


@api_router.post("/admin/events")
async def create_event(body: EventInput, staff: dict = Depends(require_permission("events.manage"))):
    doc = {
        "id": str(uuid.uuid4()),
        "sport": body.sport,
        "league": body.league,
        "home": body.home,
        "away": body.away,
        "odds_home": body.odds_home,
        "odds_draw": body.odds_draw,
        "odds_away": body.odds_away,
        "status": "open",
        "minute": 0,
        "home_score": 0,
        "away_score": 0,
        "halftime_home_score": None,
        "halftime_away_score": None,
        "result": None,
        "booking_code": f"NBM-{uuid.uuid4().hex[:8].upper()}",
        "kickoff_at": body.kickoff_at.isoformat() if body.kickoff_at else None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.events.insert_one(doc)
    doc = await hydrate_event_team_assets(doc)
    return event_public(doc)


@api_router.put("/admin/events/{event_id}")
async def update_event(event_id: str, body: EventInput, staff: dict = Depends(require_permission("events.manage"))):
    values = {
        "sport": body.sport.strip(), "league": body.league.strip(),
        "home": body.home.strip(), "away": body.away.strip(),
        "odds_home": round(body.odds_home, 2), "odds_draw": round(body.odds_draw, 2),
        "odds_away": round(body.odds_away, 2),
        "kickoff_at": body.kickoff_at.isoformat() if body.kickoff_at else None,
    }
    if not all(values[k] for k in ("sport", "league", "home", "away")):
        raise HTTPException(status_code=400, detail="Sport, league and team names are required")
    result = await db.events.update_one({"id": event_id}, {"$set": values})
    if result.matched_count != 1:
        raise HTTPException(status_code=404, detail="Event not found")
    doc = await db.events.find_one({"id": event_id})
    doc = await hydrate_event_team_assets(doc)
    return event_public(doc)


@api_router.delete("/admin/events/{event_id}")
async def delete_event(event_id: str, staff: dict = Depends(require_permission("events.manage"))):
    await db.events.delete_one({"id": event_id})
    return {"ok": True}


@api_router.get("/admin/permissions")
async def available_permissions(admin: dict = Depends(require_admin)):
    return {"permissions": ALL_SUBADMIN_PERMISSIONS, "groups": ROLE_PERMISSIONS}


@api_router.put("/admin/users/{user_id}/permissions")
async def set_user_permissions(user_id: str, body: PermissionsInput, admin: dict = Depends(require_admin)):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user id")
    target = await db.users.find_one({"_id": ObjectId(user_id)})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if target.get("role") != "sub_admin":
        raise HTTPException(status_code=400, detail="Permissions can only be assigned to sub-admins")
    permissions = sorted(set(body.permissions))
    invalid = [p for p in permissions if p not in ALL_SUBADMIN_PERMISSIONS]
    if invalid:
        raise HTTPException(status_code=400, detail={"invalid_permissions": invalid})
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"permissions": permissions}})
    return {"ok": True, "permissions": permissions}


# ------------------------------------------------------------------ startup and demo data
async def seed_admin():
    admin_email = os.environ["ADMIN_EMAIL"].lower()
    admin_password = os.environ["ADMIN_PASSWORD"]
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        referral_code = await unique_code(db.users, "referral_code", 8)
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Super Admin",
            "role": "super_admin",
            "balance": STAFF_STARTING_DEMO_BALANCE,
            "total_deposited": 0.0,
            "commission_total": 0.0,
            "referral_code": referral_code,
            "permissions": ALL_SUBADMIN_PERMISSIONS,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    else:
        updates = {"role": "super_admin" if existing.get("role") == "admin" else existing.get("role", "super_admin")}
        if not existing.get("referral_code"):
            updates["referral_code"] = await unique_code(db.users, "referral_code", 8)
        updates["commission_total"] = existing.get("commission_total", 0.0)
        if not verify_password(admin_password, existing["password_hash"]):
            updates["password_hash"] = hash_password(admin_password)
        await db.users.update_one({"email": admin_email}, {"$set": updates})


async def normalize_legacy_football_events():
    # Replace the fake football team names shipped by earlier builds while
    # preserving event IDs so existing tickets continue to resolve.
    replacements = {
        "Cyber City FC": "Arsenal", "Neon United": "Manchester United",
        "Real Volt": "FC Barcelona", "Atletico Pulse": "Real Madrid",
        "Inter Circuit": "Inter", "AC Matrix": "AC Milan",
    }
    for old, new in replacements.items():
        await db.events.update_many({"home": old}, {"$set": {"home": new}})
        await db.events.update_many({"away": old}, {"$set": {"away": new}})


async def seed_events():
    if await db.events.count_documents({}) > 0:
        return
    samples = [
        ("Football", "Premier League", "Arsenal", "Manchester United", 2.10, 3.40, 3.25),
        ("Football", "LaLiga", "FC Barcelona", "Real Madrid", 1.85, 3.60, 4.10),
        ("Basketball", "NBA Nexus", "Los Angeles Lakers", "Chicago Bulls", 1.65, 12.0, 2.30),
        ("Tennis", "Grand Circuit", "A. Volkov", "M. Reyes", 1.55, 15.0, 2.55),
        ("eSports", "Valorant Masters", "Team Flux", "Team Cipher", 1.95, 20.0, 1.90),
        ("Football", "Serie A", "Inter", "AC Milan", 2.40, 3.20, 2.95),
    ]
    for sport, league, home, away, oh, od, oa in samples:
        await db.events.insert_one({
            "id": str(uuid.uuid4()),
            "sport": sport, "league": league, "home": home, "away": away,
            "odds_home": oh, "odds_draw": od, "odds_away": oa,
            "status": "open", "result": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })


@app.on_event("startup")
async def on_startup():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("referral_code", unique=True, sparse=True)
    await db.events.create_index("id", unique=True)
    await db.events.create_index("kickoff_at")
    await seed_admin()
    await normalize_legacy_football_events()
    await seed_events()
    await sync_league_catalog()
    await db.settings.update_one({"_id": "global"}, {"$setOnInsert": DEFAULT_SETTINGS}, upsert=True)
    logger.info("NexusBet backend ready")


@api_router.get("/")
async def root():
    return {"message": "NexusBet API"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
