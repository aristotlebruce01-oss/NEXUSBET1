import React, { useEffect, useState } from "react";
import { CircleHelp, Search, Wallet, Home, ListFilter, Gamepad2, ListChecks, UserRound, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

export default function Navbar({ tab, setTab, onLogin, onSignup, onTeamSearch }) {
  const { user } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [openBetCount, setOpenBetCount] = useState(0);
  const isAuthed = user && typeof user === "object";
  const isStaff = isAuthed && ["super_admin", "admin", "sub_admin"].includes(user.role);

  useEffect(() => {
    onTeamSearch?.(search);
  }, [search, onTeamSearch]);

  useEffect(() => {
    if (!isAuthed) return undefined;
    let active = true;
    const loadCount = async () => {
      try {
        const r = await api.get("/tickets");
        if (active) setOpenBetCount((Array.isArray(r.data) ? r.data : []).filter((t) => ["open", "active"].includes(String(t.status).toLowerCase())).length);
      } catch { if (active) setOpenBetCount(0); }
    };
    loadCount();
    const timer = setInterval(loadCount, 4000);
    return () => { active = false; clearInterval(timer); };
  }, [isAuthed]);

  const navItems = [
    { id: "sports", label: "Home", icon: Home },
    { id: "az-menu", label: "A-Z Menu", icon: ListFilter },
    { id: "games", label: "Games", icon: Gamepad2 },
    { id: "open-bets", label: "Open Bets", icon: ListChecks, badge: openBetCount },
    { id: "me", label: "Me", icon: UserRound },
  ];
  const openBrand = () => setTab(isStaff ? "admin" : "sports");
  const goWallet = () => setTab("cashier");

  return (
    <>
      <header className="sticky top-0 z-50 nx-glass border-b border-[#00E5FF]/20">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-[62px] sm:h-16 flex items-center gap-2 sm:gap-3">
          <button type="button" onClick={openBrand} aria-label={isStaff ? "Open admin dashboard" : "Go home"} title={isStaff ? `Open ${user.role.replaceAll("_", " ")} dashboard` : "Home"} className="flex items-center gap-2 shrink-0 min-w-0">
            <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-[#00E5FF] text-[#00E5FF] flex items-center justify-center font-black text-xl sm:text-2xl leading-none">N</span>
            <span className="font-display text-[17px] sm:text-xl font-extrabold tracking-tight whitespace-nowrap">NEXUS<span className="text-[#00E5FF]">BET</span></span>
          </button>
          <div className="flex-1" />
          {isAuthed && searchOpen && <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search teams, leagues, matches" aria-label="Search teams, leagues and matches" className="min-w-0 w-[34vw] max-w-xs rounded-full border border-[#00E5FF]/40 bg-[#0B1020] px-3 py-2 text-xs sm:text-sm text-white outline-none focus:border-[#00E5FF]" />}
          {isAuthed && <button type="button" onClick={() => { setSearchOpen((v) => !v); if (searchOpen) { setSearch(""); onTeamSearch?.(""); } }} aria-label="Search teams, leagues and matches" title="Search" className="shrink-0 p-2 text-[#A29DBE] hover:text-[#00E5FF]"><Search size={21} /></button>}
          {isAuthed ? <button type="button" onClick={goWallet} data-testid="navbar-wallet-balance" aria-label="Open wallet and deposit" title="Wallet / Deposit" className="max-w-[126px] sm:max-w-[170px] shrink-0 flex items-center gap-1.5 rounded-full border border-[#FFD700]/35 bg-[#221c46] px-2.5 sm:px-3 py-2 hover:border-[#FFD700]">
            <Wallet size={16} className="text-[#FFD700] shrink-0" />
            <span className="font-mono font-bold text-[#FFD700] text-xs sm:text-sm whitespace-nowrap overflow-hidden text-ellipsis">₵{Number(user.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </button> : <div className="flex items-center gap-1.5"><button data-testid="navbar-login-button" onClick={onLogin} className="text-xs sm:text-sm font-semibold text-[#F0EEF9] px-2 py-2">Log in</button><button data-testid="navbar-signup-button" onClick={onSignup} className="nx-btn-primary text-xs sm:text-sm px-3 py-2">Sign up</button></div>}
        </div>
      </header>

      {isAuthed && <nav aria-label="Main navigation" className="nx-bottom-nav md:hidden fixed bottom-0 inset-x-0 z-[80] grid grid-cols-5 border-t border-[#00E5FF]/20 bg-[#070d19]/95 backdrop-blur-lg pb-[env(safe-area-inset-bottom)]">
        {navItems.map(({ id, label, icon: Icon, badge }) => <button key={id} type="button" onClick={() => setTab(id)} aria-current={tab === id ? "page" : undefined} className={`relative min-w-0 flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-bold ${tab === id ? "text-[#00E5FF]" : "text-[#A29DBE]"}`}>
          <span className="relative"><Icon size={21} strokeWidth={tab === id ? 2.5 : 2} />{id === "open-bets" && badge > 0 && <span className="absolute -right-2 -top-2 min-w-[16px] h-4 px-1 rounded-full bg-[#FF3366] text-white text-[9px] leading-4 text-center">{badge > 99 ? "99+" : badge}</span>}</span>
          <span className="truncate max-w-full">{label}</span>
        </button>)}
      </nav>}
    </>
  );
}
