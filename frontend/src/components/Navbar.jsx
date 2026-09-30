import React, { useState } from "react";
import { motion } from "framer-motion";
import { Zap, Wallet, LogOut, Trophy, ShieldCheck, Landmark, ClipboardList, ListChecks, HelpCircle, X, TicketCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const TABS = [
  { id: "sports", label: "Sports", icon: Trophy, testid: "nav-sports-tab" },
  { id: "cashier", label: "Wallet /Deposit", icon: Landmark, testid: "nav-cashier-tab" },
  { id: "my-bets", label: "My Bets", icon: ClipboardList, testid: "nav-my-bets-tab" },
  { id: "open-bets", label: "Open Bets", icon: ListChecks, testid: "nav-open-bets-tab" },
];

export default function Navbar({ tab, setTab, onLogin, onSignup, onVerifyTicket }) {
  const { user, logout } = useAuth();
  const [helpOpen, setHelpOpen] = useState(false);
  const isAuthed = user && typeof user === "object";
  const isStaff = isAuthed && ["super_admin", "admin", "sub_admin"].includes(user.role);
  const tabs = isStaff ? [...TABS, { id: "admin", label: "Admin", icon: ShieldCheck, testid: "nav-admin-tab" }] : TABS;

  return (
    <>
      <header className="sticky top-0 z-50 nx-glass border-b border-[#00E5FF]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <button data-testid="navbar-brand-nexusbet" onClick={() => setTab("sports")} className="flex items-center gap-2 shrink-0">
            <Zap size={24} className="text-[#00E5FF]" fill="#00E5FF" />
            <span className="font-display text-lg sm:text-xl font-extrabold tracking-tight">NEXUS<span className="text-[#00E5FF]">BET</span></span>
          </button>

          {isAuthed && (
            <nav className="hidden md:flex items-center gap-1 bg-[#0F0C20]/60 rounded-full p-1 border border-[#00E5FF]/10">
              {tabs.map((t) => {
                const Icon = t.icon;
                const active = tab === t.id;
                return <button key={t.id} data-testid={t.testid} onClick={() => setTab(t.id)} className={`relative px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1.5 transition-colors ${active ? "text-[#04121a]" : "text-[#A29DBE] hover:text-[#F0EEF9]"}`}>
                  {active && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-full" style={{ background: "linear-gradient(135deg,#00E5FF,#00a6ff)" }} transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
                  <Icon size={15} className="relative z-10" /><span className="relative z-10">{t.label}</span>
                </button>;
              })}
              <button type="button" data-testid="nav-verify-ticket" onClick={onVerifyTicket} className="relative px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1.5 text-[#A29DBE] hover:text-[#F0EEF9] transition-colors">
                <TicketCheck size={15} /><span>Verify Ticket</span>
              </button>
            </nav>
          )}

          <div className="flex items-center gap-2 sm:gap-3">
            <button data-testid="navbar-help-button" onClick={() => setHelpOpen(true)} title="Help & Responsible Betting" className="flex items-center gap-1.5 text-sm font-semibold text-[#F0EEF9] px-2 sm:px-3 py-2 hover:text-[#00E5FF] transition-colors">
              <HelpCircle size={18} /><span className="hidden sm:inline">Help</span>
            </button>
            {isAuthed ? <>
              <div data-testid="navbar-wallet-balance" className="flex items-center gap-2 bg-[#221c46] border border-[#FFD700]/30 rounded-full px-3 sm:px-4 py-1.5"><Wallet size={16} className="text-[#FFD700]" /><span className="font-mono font-bold text-[#FFD700] text-sm">₵{Number(user.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
              <button data-testid="navbar-logout-button" onClick={logout} title="Log out" className="text-[#A29DBE] hover:text-[#FF3366] transition-colors p-2"><LogOut size={18} /></button>
            </> : <>
              <button data-testid="navbar-login-button" onClick={onLogin} className="text-sm font-semibold text-[#F0EEF9] px-3 sm:px-4 py-2 hover:text-[#00E5FF] transition-colors">Log in</button>
              <button data-testid="navbar-signup-button" onClick={onSignup} className="nx-btn-primary text-sm px-4 py-2">Sign up</button>
            </>}
          </div>
        </div>

        {isAuthed && <nav className="md:hidden flex items-center gap-1 px-3 pb-2 overflow-x-auto">
          {tabs.map((t) => { const Icon=t.icon; const active=tab===t.id; return <button key={t.id} data-testid={`${t.testid}-mobile`} onClick={()=>setTab(t.id)} className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors ${active?"bg-[#00E5FF] text-[#04121a]":"text-[#A29DBE] bg-[#221c46]"}`}><Icon size={14}/> {t.label}</button>; })}
          <button type="button" data-testid="nav-verify-ticket-mobile" onClick={onVerifyTicket} className="px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap text-[#A29DBE] bg-[#221c46]"><TicketCheck size={14}/> Verify Ticket</button>
        </nav>}
      </header>

      {helpOpen && <div className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-sm flex items-start sm:items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Help and responsible betting">
        <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl nx-card border border-[#00E5FF]/30 shadow-2xl">
          <div className="sticky top-0 z-10 flex items-center justify-between p-5 sm:p-6 bg-[#100d22]/95 backdrop-blur border-b border-white/10">
            <div><div className="text-xs font-black uppercase tracking-[.2em] text-[#00E5FF]">NexusBet Help</div><h2 className="text-2xl sm:text-3xl font-black mt-1">Responsible Betting & Support</h2></div>
            <button onClick={()=>setHelpOpen(false)} aria-label="Close help" className="p-2 rounded-full bg-white/5 text-[#A29DBE] hover:text-white"><X size={24}/></button>
          </div>
          <div className="p-5 sm:p-7 space-y-5 text-sm sm:text-base leading-7 text-[#E7E3F2]">
            <div>🔞 <b>Age & KYC:</b> You must be 18+ to register; Bet verification is strictly required before betting or withdrawing. And bet responsibly.</div>
            <div>💳 <b>Deposit & Loss Limits:</b> Set daily, weekly, or monthly spend caps to keep your gaming budget strictly under control.</div>
            <div>⏱️ <b>Time-Out & Reality Checks:</b> Set automated session reminders or take short breaks to manage your time responsibly.</div>
            <div>🚫 <b>Self-Exclusion & Support:</b> Easily block your account or access free, confidential helpline resources whenever you need.</div>
          </div>
          <div className="px-5 sm:px-7 pb-6 text-xs text-[#A29DBE]">If betting stops feeling manageable, take a break and seek support.</div>
        </div>
      </div>}
    </>
  );
}
