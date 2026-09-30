import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Radio, RefreshCw, Clock3, Trophy, ChevronDown, ChevronUp, Copy, Ticket, X, WalletCards, Shield, MapPin } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiErrorDetail } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const money = (v) => `₵${Number(v || 0).toFixed(2)}`;
const pickOdds = (e, s) => Number(e?.odds?.[s] ?? e?.[`odds_${s}`] ?? 0);
const scoreOf = (e) => ({ home:Number(e?.score?.home ?? e?.home_score ?? 0), away:Number(e?.score?.away ?? e?.away_score ?? 0) });
const MARKET_ODDS = { dc_team_1:1.25, dc_team_2:1.45, "0-0":6, "1-0":5.5, "0-1":6.5, "1-1":5, "2-0":7, "2-1":8, win1:7, win2:7.5 };
const marketLabel = (m,s) => m === "match_result" ? ({home:"Home",draw:"Draw",away:"Away"}[s]||s) : m === "double_chance" ? (s === "dc_team_1" ? "DC Team 1 / Draw" : "DC Team 2 / Draw") : m === "correct_score" ? `Correct score ${s}` : `HT Draw / ${s === "win1" ? "Win 1" : "Win 2"}`;

import TeamLogo from "@/components/TeamLogo";
import LeagueCrest from "../components/LeagueCrest";

const HERO = [
  "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?auto=format&fit=crop&w=1100&q=85",
  "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1100&q=85",
  "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1100&q=85",
];

export default function SportsPage({ activeSection="home" }) {
  const { user, setBalance, reload } = useAuth();
  const [events,setEvents]=useState([]), [virtual,setVirtual]=useState([]), [loading,setLoading]=useState(true), [filter,setFilter]=useState("all"), [now,setNow]=useState(Date.now());
  const [leagues,setLeagues]=useState([]), [leagueOpen,setLeagueOpen]=useState(null);
  const [expanded,setExpanded]=useState({}), [selections,setSelections]=useState([]), [stake,setStake]=useState(""), [bookingCode,setBookingCode]=useState(""), [loadedTicket,setLoadedTicket]=useState(null), [hero,setHero]=useState(0), [busy,setBusy]=useState(false), [placedBetSummary,setPlacedBetSummary]=useState(null), [myBetOpen,setMyBetOpen]=useState(false);
  const ticketStatusesRef = useRef(null);
  const load=useCallback(async()=>{try{
    const requests=[api.get("/events?status=all&limit=120"),api.get("/virtual-football/matches?limit=120")];
    if(user) requests.push(api.get("/tickets"));
    const [a,b,ticketsResponse]=await Promise.all(requests);
    setEvents(Array.isArray(a.data)?a.data:[]);setVirtual(Array.isArray(b.data)?b.data:[]);
    if(activeSection==="leagues"){ const lr=await api.get("/leagues"); setLeagues(Array.isArray(lr.data)?lr.data:[]); }
    if(user && Array.isArray(ticketsResponse?.data)){
      const nextStatuses=Object.fromEntries(ticketsResponse.data.map((ticket)=>[ticket.id || ticket.booking_code, ticket.status]));
      const winnerKey=`nexus_seen_winners_${user.id}`;
      let seen=[];
      try { seen=JSON.parse(localStorage.getItem(winnerKey)||"[]"); } catch {}
      const newlyWon = ticketsResponse.data.find((ticket)=>String(ticket.status).toLowerCase()==="won" && !seen.includes(ticket.id || ticket.booking_code) && (ticket.settled_at || ticket.created_at));
      if(newlyWon){
        const id=newlyWon.id || newlyWon.booking_code;
        localStorage.setItem(winnerKey, JSON.stringify([...seen, id].slice(-50)));
        window.dispatchEvent(new CustomEvent("nexus:ticket-won", { detail: { ...newlyWon, ticket_id: newlyWon.id, verify_code: newlyWon.verify_code || newlyWon.booking_code, verification_timestamp: newlyWon.settled_at || new Date().toISOString() } }));
      }
      ticketStatusesRef.current=nextStatuses;
    }
  }catch(e){toast.error(formatApiErrorDetail(e?.response?.data?.detail)||"Unable to load matches")}finally{setLoading(false)}}, [user, activeSection]);
  useEffect(()=>{load();const r=setInterval(load,5000),t=setInterval(()=>setNow(Date.now()),1000),h=setInterval(()=>setHero(x=>(x+1)%HERO.length),6500);return()=>{clearInterval(r);clearInterval(t);clearInterval(h)}},[load]);
  useEffect(()=>{const fn=(e)=>{setLoadedTicket(e.detail);setBookingCode(e.detail?.booking_code||"");};window.addEventListener("nexus:load-ticket",fn);return()=>window.removeEventListener("nexus:load-ticket",fn)},[]);
  const all=[...events,...virtual.map(x=>({...x,sport:"Virtual Football"}))];
  const sports=useMemo(()=>["all",...Array.from(new Set(events.map(e=>e.sport).filter(Boolean)))],[events]);
  const normalized=activeSection==="live-score-update"?"live":activeSection;
  const isLive=e=>String(e.phase||e.status||"").toLowerCase().includes("live")||e.is_live===true;
  const todayKey=new Date().toISOString().slice(0,10); const isToday=e=>String(e.start_time||e.kickoff_at||e.kickoff||e.created_at||"").slice(0,10)===todayKey;
  const sectionEvents=normalized==="live"?events.filter(isLive):normalized==="today-matches"?events.filter(isToday):events;
  const visible=(filter==="all"?sectionEvents:sectionEvents.filter(e=>e.sport===filter));
  const toggleSelection=(event,market,selection)=>{
    const odds=market==="match_result"?pickOdds(event,selection):MARKET_ODDS[selection]||0;
    if(!odds)return toast.error("Odds unavailable for this selection");
    setLoadedTicket(null); setSelections(cur=>{const other=cur.filter(x=>x.event_id!==event.id);const existing=cur.find(x=>x.event_id===event.id);return existing?.market===market&&existing?.selection===selection?other:[...other,{event_id:event.id,market,selection,odds,home:event.home,away:event.away,league:event.league}]});
  };
  const calculatedSelectionOdds=selections.reduce((a,x)=>a*Number(x.odds||1),1); const totalOdds=(loadedTicket?.booking_code===bookingCode.trim().toUpperCase() && Number(loadedTicket?.total_odds)>0) ? Number(loadedTicket.total_odds) : calculatedSelectionOdds; const amount=Number(stake||0); const potential=amount*totalOdds;
  const createBooking=async()=>{if(!selections.length)return toast.error("Select at least one match");setBusy(true);try{const r=await api.post("/tickets",{selections:selections.map(({event_id,market,selection})=>({event_id,market,selection})),stake:0});setBookingCode(r.data.ticket.booking_code);setLoadedTicket(r.data.ticket);toast.success(`Booking code ${r.data.ticket.booking_code} generated`)}catch(e){toast.error(formatApiErrorDetail(e?.response?.data?.detail)||"Could not generate booking code")}finally{setBusy(false)}};
  const placeTicket=async()=>{if(!selections.length&&!loadedTicket)return toast.error("Select matches or load a booking code");if(amount<=0)return toast.error("Enter a valid stake");setBusy(true);try{let code=bookingCode;if(!code){const r=await api.post("/tickets",{selections:selections.map(({event_id,market,selection})=>({event_id,market,selection})),stake:0});code=r.data.ticket.booking_code;setBookingCode(code)}const r=await api.post(`/tickets/${encodeURIComponent(code)}/place`,{stake:amount});const placed=r.data.ticket;setBalance(r.data.balance);setLoadedTicket(placed);setSelections([]);setStake("");setPlacedBetSummary({booking_code:placed.booking_code,verify_code:placed.verify_code || placed.booking_code,stake:Number(placed.stake||amount),potential_win:Number(placed.potential_win||0),bet_type:placed.bet_type||((placed.selections||[]).length>1?"Multiple":"Singles")});await reload()}catch(e){const detail=formatApiErrorDetail(e?.response?.data?.detail)||"Bet placement failed";toast.error(detail);if(String(detail).toLowerCase().includes("deposit"))toast.info("Go to Wallet /Deposit to fund your wallet")}finally{setBusy(false)}};
  const loadCode=async()=>{if(!bookingCode.trim())return;try{const r=await api.get(`/tickets/verify/${encodeURIComponent(bookingCode.trim())}`);const ticket=r.data.ticket;setLoadedTicket(ticket);setSelections((ticket.selections||[]).map(s=>({...s,odds:Number(s.odds||0)})));setStake(ticket.stake>0?String(ticket.stake):"");toast.success(`Booking code loaded into My Bet · ${Number(ticket.total_odds||1).toFixed(2)} odds`) }catch(e){toast.error(formatApiErrorDetail(e?.response?.data?.detail)||"Booking code not found")}};
  const Market=({event,market,selection,label,odds})=><button type="button" onClick={()=>toggleSelection(event,market,selection)} className={`rounded-lg p-2 text-center text-xs border ${selections.find(x=>x.event_id===event.id)?.selection===selection?"bg-[#00E5FF] text-black border-[#00E5FF]":"bg-[#221c46] border-white/10"}`}><div className="opacity-80">{label}</div><b>{Number(odds).toFixed(2)}</b></button>;
  const Card=({event,isVirtual=false})=>{const sc=scoreOf(event);const odds=event.odds||{};const home=Number(odds.home ?? (pickOdds(event,"home") || 1.85)),draw=Number(odds.draw ?? (pickOdds(event,"draw") || 3.4)),away=Number(odds.away ?? (pickOdds(event,"away") || 3.75));return <div className="nx-card p-4">
    <div className="flex items-center justify-between"><span className="text-[10px] font-black uppercase tracking-wider text-[#00E5FF]">{event.sport||"Football"}</span><span className="text-[10px] text-[#A29DBE]"><Radio size={11} className="inline mr-1"/>{event.phase||event.status||"scheduled"}{event.status==="live"?` · ${event.minute??0}'`:""}</span></div>
    <button type="button" className="w-full text-left mt-3" onClick={()=>setExpanded(c=>({...c,[event.id]:!c[event.id]}))}><div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2"><div className="flex items-center gap-2"><TeamLogo name={event.home}/><span className="font-semibold text-sm">{event.home}</span></div><span className="text-[#FFD700] font-black">{sc.home}:{sc.away}</span><div className="flex items-center justify-end gap-2"><span className="font-semibold text-sm text-right">{event.away}</span><TeamLogo name={event.away}/></div></div><p className="text-xs text-[#6E688D] mt-2">{event.league||"League"} · {isVirtual?`${event.minute??0}'`:"live refresh"}</p></button>
    <div className="grid grid-cols-3 gap-2 mt-3"><Market event={event} market="match_result" selection="home" label="Home" odds={home}/><Market event={event} market="match_result" selection="draw" label="Draw" odds={draw}/><Market event={event} market="match_result" selection="away" label="Away" odds={away}/></div>
    {expanded[event.id]&&<div className="mt-4 border-t border-white/10 pt-4 space-y-3"><div className="text-xs font-black uppercase text-[#00E5FF]">Double Chance</div><div className="grid grid-cols-2 gap-2"><Market event={event} market="double_chance" selection="dc_team_1" label="DC Team 1 / Draw" odds={1.25}/><Market event={event} market="double_chance" selection="dc_team_2" label="DC Team 2 / Draw" odds={1.45}/></div><div className="text-xs font-black uppercase text-[#00E5FF]">Correct Score</div><div className="grid grid-cols-3 gap-2">{["0-0","1-0","0-1","1-1","2-0","2-1"].map(s=><Market key={s} event={event} market="correct_score" selection={s} label={s} odds={MARKET_ODDS[s]}/>)}</div><div className="text-xs font-black uppercase text-[#00E5FF]">HT / FT</div><div className="grid grid-cols-2 gap-2"><Market event={event} market="ht_draw_ft" selection="win1" label="HT Draw / Win 1" odds={7}/><Market event={event} market="ht_draw_ft" selection="win2" label="HT Draw / Win 2" odds={7.5}/></div></div>}
    <div className="mt-3 flex justify-between text-[11px] text-[#A29DBE]"><span><Clock3 size={12} className="inline mr-1"/>{event.status||"scheduled"}</span><button onClick={()=>setExpanded(c=>({...c,[event.id]:!c[event.id]}))} className="text-[#00E5FF]">{expanded[event.id]?<><ChevronUp size={13} className="inline"/> Hide markets</>:<><ChevronDown size={13} className="inline"/> More markets</>}</button></div>
  </div>};
  if(activeSection==="leagues") return <section className="space-y-6">
    <div className="nx-card p-6 sm:p-8"><div className="flex items-start justify-between gap-4"><div><span className="text-xs font-black uppercase tracking-[.22em] text-[#00E5FF]">Football Leagues</span><h1 className="text-3xl sm:text-4xl font-black mt-2">2026/27 League Clubs</h1><p className="text-sm text-[#A29DBE] mt-2">Tap a league to view its current clubs, official display names and real club crests.</p></div><Shield className="text-[#FFD700]" size={32}/></div></div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{leagues.map(l=><div key={l.slug} className="nx-card overflow-hidden"><button type="button" onClick={()=>setLeagueOpen(leagueOpen===l.slug?null:l.slug)} className="w-full p-5 text-left hover:bg-white/[.03]"><div className="flex items-center justify-between gap-3"><div><div className="text-xs uppercase tracking-wider font-black text-[#00E5FF]">{l.country} · {l.season}</div><h2 className="text-xl sm:text-2xl font-black mt-1">{l.name}</h2><p className="text-xs text-[#A29DBE] mt-1">{l.team_count} clubs</p></div><ChevronDown className={`transition-transform ${leagueOpen===l.slug?"rotate-180":""}`} /></div></button>{leagueOpen===l.slug&&<div className="px-5 pb-5 border-t border-white/10"><div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4">{l.teams.map(team=><div key={team.name} className="rounded-xl bg-black/20 border border-white/10 p-3 flex items-center gap-3 min-w-0"><LeagueCrest name={team.name} logoUrl={team.logo_url} size={38}/><div className="min-w-0"><div className="font-bold text-xs sm:text-sm leading-tight">{team.name}</div><div className="text-[9px] text-[#6E688D] mt-1">Official crest</div></div></div>)}</div></div>}</div>)}</div>
  </section>;
  return <div className="space-y-6">
    <section className="nx-card overflow-hidden"><div className="relative h-64 sm:h-80"><div className="absolute inset-0 grid grid-cols-3">{HERO.map((src,i)=><img key={src} src={src} alt="NexusBet soccer player" className={`w-full h-full object-cover transition-opacity duration-1000 ${i===hero?"opacity-100":"opacity-55"}`}/>)}</div><div className="absolute inset-0 bg-gradient-to-r from-[#0F0C20]/90 via-[#0F0C20]/35 to-[#0F0C20]/80"/><div className="absolute inset-0 flex items-end p-6 sm:p-10"><div><span className="text-xs font-black uppercase tracking-[.22em] text-[#00E5FF]">NexusBet sports hub</span><h1 className="text-3xl sm:text-5xl font-black mt-2">My Bet · Live Sports · Virtual Football</h1><p className="text-sm text-[#A29DBE] mt-2">Select your matches first. Nothing is staked until you press Place Bet.</p></div></div></div></section>
    <div className="flex flex-wrap gap-2">{sports.map(s=><button key={s} onClick={()=>setFilter(s)} className={`rounded-full px-4 py-2 text-xs font-bold border ${filter===s?"bg-[#00E5FF] text-black border-[#00E5FF]":"border-white/10 text-[#A29DBE]"}`}>{s==="all"?"All sports":s}</button>)}</div>
    {loading?<div className="nx-card p-8 text-center">Loading matches...</div>:<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{visible.map(e=><Card key={e.id} event={e}/>)}{virtual.map(e=><Card key={e.id} event={{...e,sport:"Virtual Football"}} isVirtual/>)}</div>}
    <div className="fixed right-4 bottom-4 z-40 w-[min(430px,calc(100vw-2rem))]">
      <div className="nx-card border-2 border-[#00E5FF]/50 shadow-2xl">
        <button type="button" onClick={()=>setMyBetOpen(v=>!v)} aria-expanded={myBetOpen} className="w-full p-4 flex items-center justify-between text-left hover:bg-white/[0.03] transition-colors">
          <div><div className="text-xs font-black uppercase tracking-wider text-[#00E5FF]">My Bet</div><b>{loadedTicket?.bet_type || (selections.length>1 ? "Multiple" : selections.length===1 ? "Singles" : "No selection")}</b><div className="text-[10px] text-[#6E688D] mt-1">Tap to {myBetOpen?"close":"open"}</div></div>
          <div className="flex items-center gap-2"><span className="rounded-full bg-[#00E5FF]/15 px-3 py-1 text-xs font-black">{loadedTicket?.selections?.length || selections.length}</span>{myBetOpen?<ChevronDown size={18}/>:<ChevronUp size={18}/>}</div>
        </button>
        {myBetOpen && <>
        <div className="px-4 py-3 max-h-56 overflow-y-auto space-y-2">
          {(loadedTicket?.selections || selections).map((x,i)=>{
            const ev = all.find(e=>String(e.id)===String(x.event_id));
            const home = x.home || ev?.home || "Home";
            const away = x.away || ev?.away || "Away";
            return <div key={String(x.event_id)+String(i)} className="rounded-xl bg-black/20 border border-white/10 p-3">
              <div className="flex items-center gap-2">
                <TeamLogo name={home} size={32}/><div className="min-w-0 flex-1 font-bold text-xs truncate">{home}</div>
                <span className="text-[10px] font-black text-[#FFD700]">VS</span>
                <div className="min-w-0 flex-1 font-bold text-xs text-right truncate">{away}</div><TeamLogo name={away} size={32}/>
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px]"><span className="text-[#A29DBE]">{marketLabel(x.market,x.selection)}</span><b className="text-[#00E5FF]">@ {Number(x.odds).toFixed(2)}</b></div>
            </div>
          })}
          {!selections.length&&!loadedTicket&&<div className="text-xs text-[#6E688D] py-2">Tap a market to add it here.</div>}
        </div>
        <div className="p-4 border-t border-white/10 grid grid-cols-2 gap-2 text-sm">
          <div><span className="text-[10px] text-[#A29DBE] block">Total Stake</span><input value={stake} onChange={e=>setStake(e.target.value)} type="number" min="0" className="w-full rounded-lg bg-[#221c46] border border-white/10 px-2 py-2" placeholder="0.00"/></div>
          <div><span className="text-[10px] text-[#A29DBE] block">Total Odds</span><b className="block py-2">{totalOdds.toFixed(2)}</b></div>
          <div className="col-span-2 flex justify-between"><span>Potential Win</span><b className="text-[#00FF87]">{money(potential)}</b></div>
        </div>
        <div className="p-4 pt-0 grid grid-cols-2 gap-2"><button disabled={busy||!selections.length} onClick={createBooking} className="rounded-lg border border-[#FFD700]/40 bg-[#FFD700]/10 py-2 text-xs font-black text-[#FFD700]"><Ticket size={14} className="inline mr-1"/>Book Bet</button><button disabled={busy||(!selections.length&&!loadedTicket)} onClick={placeTicket} className="nx-btn-primary py-2 text-xs font-black">Place Bet</button></div>
        {loadedTicket?.booking_code&&<div className="px-4 pb-5"><div className="rounded-xl border-2 border-[#FFD700]/60 bg-[#FFD700]/10 p-4 text-center shadow-[0_0_24px_rgba(255,215,0,0.12)]"><div className="text-[10px] font-black uppercase tracking-[0.22em] text-[#A29DBE]">Verify Code</div><div className="mt-2 text-3xl sm:text-4xl md:text-5xl font-black tracking-[0.18em] text-[#FFD700] leading-none break-all">{loadedTicket.booking_code}</div><div className="mt-2 text-[10px] font-semibold text-[#A29DBE]">Save this code to load this booking later</div></div></div>}
        {user?.total_deposited===0&&(selections.length>0||loadedTicket?.selections?.length>0)&&<button onClick={()=>window.dispatchEvent(new CustomEvent("nexus:go-wallet"))} className="mx-4 mb-4 w-[calc(100%-2rem)] rounded-lg bg-[#FFD700]/10 border border-[#FFD700]/30 py-2 text-xs font-bold text-[#FFD700]"><WalletCards size={14} className="inline mr-1"/>Go to deposit</button>}
        </>}
      </div>
    </div>
      {placedBetSummary&&<div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-5" role="dialog" aria-modal="true" aria-label="Bet placed successfully">
        <div className="w-full sm:max-w-xl bg-white text-[#26232F] rounded-t-[28px] sm:rounded-[28px] shadow-2xl overflow-hidden">
          <div className="relative px-6 pt-8 pb-5 sm:px-8 sm:pt-10 text-center">
            <button type="button" onClick={()=>setPlacedBetSummary(null)} className="absolute right-5 top-5 text-[#666] hover:text-black" aria-label="Close"><X size={28}/></button>
            <div className="mx-auto w-24 h-24 rounded-full bg-[#00C875] flex items-center justify-center shadow-lg"><span className="text-white text-6xl font-black leading-none">✓</span></div>
            <h2 className="mt-6 text-3xl sm:text-4xl font-black">Bet Placed Successfully!</h2>
            <p className="mt-2 text-sm text-[#777]">Your bet has been placed and is now available in Open Bets.</p>
          </div>
          <div className="mx-5 sm:mx-8 mb-5 rounded-2xl border border-[#E8E8E8] bg-[#FAFAFA] overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between border-b border-[#E5E5E5]"><span className="text-base text-[#666]">Bet Type</span><b className="text-base">{placedBetSummary.bet_type}</b></div>
            <div className="px-5 py-4 flex items-center justify-between border-b border-[#E5E5E5]"><span className="text-base text-[#666]">Verify Code</span><b className="text-xl sm:text-2xl tracking-wider">{placedBetSummary.verify_code || placedBetSummary.booking_code}</b></div>
            <div className="px-5 py-4 flex items-center justify-between border-b border-[#E5E5E5]"><span className="text-base text-[#666]">Stake</span><b className="text-lg">{money(placedBetSummary.stake)}</b></div>
            <div className="px-5 py-4 flex items-center justify-between border-b border-[#E5E5E5]"><span className="text-base text-[#666]">Total Bonus</span><b className="text-lg">+₵0.00</b></div>
            <div className="px-5 py-5 flex items-center justify-between"><span className="text-base text-[#666]">Total Return</span><b className="text-xl sm:text-2xl text-[#00A866]">{money(placedBetSummary.potential_win)}</b></div>
          </div>
          <div className="grid grid-cols-2 gap-3 px-5 sm:px-8 pb-7">
            <button type="button" onClick={()=>setPlacedBetSummary(null)} className="rounded-2xl py-4 bg-[#FFD21F] text-black font-black text-lg">OK</button>
            <button type="button" onClick={()=>{setPlacedBetSummary(null);window.dispatchEvent(new CustomEvent("nexus:open-bets"))}} className="rounded-2xl py-4 border-2 border-[#FFD21F] text-black font-black text-lg">Open Bets</button>
          </div>
        </div>
      </div>}
  </div>;
}
