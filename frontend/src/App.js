import React, { useEffect, useState } from "react";
import "@/App.css";
import { Toaster } from "sonner";
import { motion } from "framer-motion";
import { Zap, TrendingUp, Wallet, ArrowRight } from "lucide-react";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import AuthModal from "@/components/AuthModal";
import TicketTools from "@/components/TicketTools";
import SportsPage from "@/pages/SportsPage";
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
      <Navbar tab={tab} setTab={setTab} onLogin={() => openAuth("login")} onSignup={() => openAuth("signup")} onVerifyTicket={() => { setWinnerTicket(null); setVerifyTicketOpen(true); }} />

      {!isAuthed ? (
        <Landing onSignup={() => openAuth("signup")} onLogin={() => openAuth("login")} />
      ) : (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-wrap gap-2 mb-5 text-xs font-black uppercase tracking-wide">{["Home", "Live score update", "Sports", "Today matches", "Countdown", "Leagues", "Countries", "Virtual football"].map((label) => { const key = label.toLowerCase().replaceAll(" ", "-"); return <button type="button" key={label} onClick={() => { setSection(key); setTab("sports"); }} className={`rounded-full border px-3 py-2 transition-colors ${section === key ? "border-[#00E5FF] bg-[#00E5FF]/10 text-[#00E5FF]" : "border-white/10 bg-white/[0.03] text-[#A29DBE] hover:border-[#00E5FF] hover:text-[#00E5FF]"}`} aria-label={`Open ${label}`}>{label}</button>; })}</div>
          <TicketTools />
          {tab === "my-bets" ? (
            <MyBetsPage />
          ) : tab === "open-bets" ? (
            <OpenBetPage />
          ) : tab === "sports" ? (
            <SportsPage activeSection={section} />
          ) : tab === "cashier" ? (
            <CashierPage />
          ) : tab === "admin" && ["super_admin", "admin", "sub_admin"].includes(user.role) ? (
            <AdminPage />
          ) : (
            <SportsPage activeSection={section} />
          )}
        </main>
      )}

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
