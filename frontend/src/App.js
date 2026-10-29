import React, { useEffect, useState } from "react";
import "@/App.css";
import { Toaster } from "sonner";
import { motion } from "framer-motion";
import { Zap, TrendingUp, Wallet, ArrowRight, Home as HomeIcon, Search, Gamepad2, ListChecks, UserRound, CircleHelp, Activity, Gift, Bell, ShieldCheck, Settings, Headphones, Flame, Menu, Radio, Trophy, CalendarDays, Timer, Globe2, Flag, CircleDot, Dribbble, Target } from "lucide-react";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import AuthModal from "@/components/AuthModal";
import TicketTools from "@/components/TicketTools";
import SportsPage from "@/pages/SportsPage";
import LiveSports from "@/components/LiveSports";
import CashierPage from "@/pages/CashierPage";
import AdminPage from "@/pages/AdminPage";
import MyBetsPage from "@/pages/MyBetsPage";
import OpenBetPage from "@/pages/OpenBetPage";
import TicketVerificationModal from "@/components/TicketVerificationModal";

const SPORTS_BG = "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1800&q=80";

function Landing({ onSignup, onLogin }) {
  const features = [
    { icon: TrendingUp, title: "Sports Information", desc: "Browse sports information across football, basketball, tennis and virtual sports." },
    { icon: Wallet, title: "Wallet & Cashier", desc: "Track demo deposits, withdrawals and transaction reviews." },
  ];
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-3xl nx-card mt-6 mb-10">
        <img src={SPORTS_BG} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(120deg,#0F0C20 20%,rgba(15,12,32,0.5) 100%)" }} />
        <div className="relative px-6 sm:px-12 py-16 sm:py-24 max-w-2xl">
          <motion.span
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#00E5FF] bg-[#00E5FF]/10 border border-[#00E5FF]/30 rounded-full px-3 py-1"
          >
            <Zap size={13} fill="#00E5FF" /> NexusBet Sports Hub
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="font-display text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mt-5 leading-[1.05]"
          >
            Explore <span className="text-[#00E5FF]" style={{ textShadow: "0 0 30px rgba(0,229,255,0.5)" }}>sports information</span> with <span className="text-[#FFD700]">NexusBet</span>.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
            className="text-[#A29DBE] text-base sm:text-lg mt-4 max-w-lg"
          >
            Explore football, basketball, tennis and virtual sports information with NexusBet.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
            className="flex flex-wrap gap-3 mt-8"
          >
            <button data-testid="landing-signup-button" onClick={onSignup} className="nx-btn-primary px-7 py-3.5 text-base flex items-center gap-2">
              Get started <ArrowRight size={18} />
            </button>
            <button data-testid="landing-login-button" onClick={onLogin} className="px-7 py-3.5 rounded-xl font-semibold border border-[#00E5FF]/30 text-[#F0EEF9] hover:border-[#00E5FF] hover:text-[#00E5FF] transition-colors">
              Log in
            </button>
          </motion.div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-16">
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}
              className="nx-card p-6"
            >
              <div className="w-12 h-12 rounded-xl bg-[#00E5FF]/10 flex items-center justify-center mb-4 border border-[#00E5FF]/20">
                <Icon size={24} className="text-[#00E5FF]" />
              </div>
              <h3 className="font-display font-bold text-lg">{f.title}</h3>
              <p className="text-[#A29DBE] text-sm mt-1.5">{f.desc}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function Shell() {
  const { user, ready, setUser } = useAuth();
  const [tab, setTab] = useState("sports");
  const [section, setSection] = useState("home");
  const [searchTerm, setSearchTerm] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("signup");
  const [verifyTicketOpen, setVerifyTicketOpen] = useState(false);
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) { setAuthMode("signup"); setAuthOpen(true); }
  }, []);

  useEffect(() => {
    const syncBalance = (event) => {
      if (event.detail != null) setUser((u) => u ? { ...u, balance: event.detail, demo_balance: event.detail } : u);
    };
    window.addEventListener("nexus:balance-updated", syncBalance);
    return () => window.removeEventListener("nexus:balance-updated", syncBalance);
  }, [setUser]);
  const [winnerTicket, setWinnerTicket] = useState(null);
  useEffect(() => {
    const fn=()=>setTab("cashier");
    const load=()=>setTab("sports");
    const openBets=()=>setTab("open-bets");
    const verify=()=>setVerifyTicketOpen(true);
    const won=(event)=>{ if (event.detail) { setWinnerTicket(event.detail); setVerifyTicketOpen(true); } };
    window.addEventListener("nexus:go-wallet",fn);
    window.addEventListener("nexus:load-ticket",load);
    window.addEventListener("nexus:open-bets",openBets);
    window.addEventListener("nexus:verify-ticket",verify);
    window.addEventListener("nexus:ticket-won",won);
    return()=>{
      window.removeEventListener("nexus:go-wallet",fn);
      window.removeEventListener("nexus:load-ticket",load);
      window.removeEventListener("nexus:open-bets",openBets);
      window.removeEventListener("nexus:verify-ticket",verify);
      window.removeEventListener("nexus:ticket-won",won);
    };
  }, []);

  const openAuth = (mode) => { setAuthMode(mode); setAuthOpen(true); };
  const isAuthed = user && typeof user === "object";

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Zap size={40} className="text-[#00E5FF] animate-pulse" fill="#00E5FF" />
      </div>
    );
  }

  return (
    <div className="App min-h-screen">
      <Navbar tab={tab} setTab={setTab} onLogin={() => openAuth("login")} onSignup={() => openAuth("signup")} onVerifyTicket={() => { setWinnerTicket(null); setVerifyTicketOpen(true); }} onSearch={setSearchTerm} />

      {!isAuthed ? (
        <Landing onSignup={() => openAuth("signup")} onLogin={() => openAuth("login")} />
      ) : (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-5 text-xs font-black uppercase tracking-wide">{[{label:"Home",Icon:HomeIcon},{label:"Live score update",Icon:Radio},{label:"Sports",Icon:Trophy},{label:"Real-world odds",Icon:Activity},{label:"Today matches",Icon:CalendarDays},{label:"Countdown",Icon:Timer},{label:"Leagues",Icon:Globe2},{label:"Countries",Icon:Flag},{label:"Virtual football",Icon:CircleDot}].map(({label,Icon}) => { const key = label.toLowerCase().replaceAll(" ", "-"); return <button type="button" key={label} onClick={() => { setSection(key); setTab("sports"); }} className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-left transition-colors ${section === key ? "border-[#00E5FF] bg-[#00E5FF]/10 text-[#00E5FF]" : "border-white/10 bg-white/[0.03] text-[#A29DBE] hover:border-[#00E5FF] hover:text-[#00E5FF]"}`} aria-label={`Open ${label}`}><Icon size={17}/><span>{label}</span></button>; })}</div>
          <TicketTools />
          {tab === "my-bets" ? (
            <MyBetsPage />
          ) : tab === "open-bets" ? (
            <OpenBetPage />
          ) : tab === "sports" ? (
            section === "real-world-odds" ? <LiveSports /> : <SportsPage activeSection={section} teamSearch={searchTerm} />
          ) : tab === "cashier" ? (
            <CashierPage />
          ) : tab === "admin" && ["super_admin", "admin", "sub_admin"].includes(user.role) ? (
            <AdminPage />
          ) : (
            <SportsPage activeSection={section} teamSearch={searchTerm} />
          )}
        </main>
      )}

      {isAuthed && <nav className="nx-bottom-nav" aria-label="Main navigation">
        <button onClick={() => {setTab("sports");setSection("home");}} className={tab==="sports"&&section==="home"?"active":""}><span className="nx-home-n">N</span><small>Home</small></button>
        <button onClick={() => {setTab("sports");setSection("countries");}} className={section==="countries"?"active":""}><Menu size={20}/><small>A-Z Menu</small></button>
        <button onClick={() => {setTab("sports");setSection("virtual-football");}} className={section==="virtual-football"?"active":""}><Gamepad2 size={20}/><small>Games</small></button>
        <button onClick={() => setTab("open-bets")} className={tab==="open-bets"?"active":""}><ListChecks size={20}/><small>Open Bets</small></button>
        <button onClick={() => setTab("me")} className={tab==="me"?"active":""}><UserRound size={20}/><small>Me</small></button>
      </nav>}
      {isAuthed && tab === "me" && <div className="fixed inset-0 z-[60] overflow-y-auto bg-[#070d1a] px-4 pt-20 pb-28"><div className="mx-auto max-w-3xl space-y-5"><div className="nx-card p-5"><div className="text-xs uppercase tracking-widest text-[#00E5FF] font-black">My account</div><h1 className="text-2xl font-black mt-1">Hello, {user.name || user.username || "there"}</h1><p className="text-sm text-[#A29DBE] mt-1">Your account activity, balance and support tools in one place.</p><button onClick={() => setTab("cashier")} className="mt-4 w-full rounded-xl border border-[#00E5FF]/30 bg-[#00E5FF]/10 p-4 text-left"><span className="text-xs text-[#A29DBE]">Total balance</span><span className="block text-2xl font-black text-[#FFD700]">₵{Number(user.balance||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</span><span className="text-xs text-[#00E5FF]">Tap to open Wallet / Deposit →</span></button></div><div className="nx-card p-5"><h2 className="font-black text-lg mb-3">Activity</h2><div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{[{label:"Bet History",desc:"Review your previous tickets and outcomes",Icon:Activity,fn:()=>setTab("my-bets")},{label:"Daily streaks",desc:"Keep a consistent visit streak and track your activity",Icon:Flame,fn:()=>{}},{label:"Gifts",desc:"Promotional gifts and rewards available to your account",Icon:Gift,fn:()=>{}},{label:"Notifications",desc:"Updates about your account, tickets and wallet",Icon:Bell,fn:()=>{}}].map(x=><button key={x.label} onClick={x.fn} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[.03] p-3 text-left"><x.Icon size={20} className="text-[#00E5FF] mt-1"/><span><b className="block">{x.label}</b><small className="text-[#A29DBE]">{x.desc}</small></span></button>)}</div></div><div className="nx-card p-5"><h2 className="font-black text-lg mb-3">Account information</h2><div className="space-y-2">{[{label:"Safety & Security",desc:"Protect your sign-in details and account access",Icon:ShieldCheck},{label:"Account Settings",desc:"Manage your profile and personal preferences",Icon:Settings},{label:"Customer Support",desc:"Get help with your account, bets or wallet",Icon:Headphones},{label:"NexusBet Help",desc:"Responsible play guidance and answers to common questions",Icon:CircleHelp}].map(x=><div key={x.label} className="flex items-center gap-3 rounded-xl border border-white/10 p-3"><x.Icon size={20} className="text-[#00E5FF]"/><span><b className="block">{x.label}</b><small className="text-[#A29DBE]">{x.desc}</small></span></div>)}</div><button onClick={()=>window.dispatchEvent(new CustomEvent("nexus:open-help"))} className="mt-3 w-full rounded-xl border border-[#00E5FF]/30 py-3 text-sm font-bold text-[#00E5FF]">Open NexusBet Help</button></div><button onClick={()=>window.dispatchEvent(new CustomEvent("nexus:logout"))} className="w-full rounded-xl border border-red-400/30 bg-red-500/10 py-3 font-bold text-red-300">Sign out / Log out</button></div></div>}
      <AuthModal open={authOpen} mode={authMode} onClose={() => setAuthOpen(false)} onSwitchMode={setAuthMode} />
      <TicketVerificationModal open={verifyTicketOpen} initialWinner={winnerTicket} onClose={() => { setVerifyTicketOpen(false); setWinnerTicket(null); }} />
      <Toaster
        position="top-center"
        theme="dark"
        toastOptions={{ style: { background: "#1E183E", border: "1px solid rgba(0,229,255,0.25)", color: "#F0EEF9" } }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}
