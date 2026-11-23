import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Radio, RefreshCw, Clock3, Trophy, ChevronDown, ChevronUp, Copy, Ticket, X, WalletCards, Shield, MapPin, Search } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiErrorDetail } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const money = (v) => `₵${Number(v || 0).toFixed(2)}`;
const pickOdds = (e, s) => Number(e?.odds?.[s] ?? e?.[`odds_${s}`] ?? 0);
const scoreOf = (e) => ({ home:Number(e?.score?.home ?? e?.home_score ?? 0), away:Number(e?.score?.away ?? e?.away_score ?? 0) });
// Derive double-chance prices from this event's 1X2 odds. The more likely
// combined outcome (home+draw or away+draw) receives the lower price.
const doubleChanceOdds = (homeOdd, drawOdd, awayOdd) => {
  const values = [homeOdd, drawOdd, awayOdd].map(Number);
  if (values.some((v) => !Number.isFinite(v) || v <= 1)) return { homeDraw: 1.25, awayDraw: 1.25 };
  const implied = values.map((v) => 1 / v);
  const total = implied.reduce((sum, value) => sum + value, 0);
  const probs = implied.map((value) => value / total);
  const margin = 1.04;
  const price = (probability) => Math.max(1.01, Number((margin / probability).toFixed(2)));
  return { homeDraw: price(probs[0] + probs[1]), awayDraw: price(probs[1] + probs[2]) };
};
const SCORE_OPTIONS = ["0-0","1-0","0-1","1-1","2-0","0-2","2-1","1-2","2-2","3-0","0-3","3-1","1-3","3-2","2-3","3-3"];
const poisson = (n, lambda) => Math.exp(-lambda) * Math.pow(lambda, n) / [1,1,2,6,24,120][n];
const fixtureMarketOdds = (event, selection) => {
  const homeOdd = Math.max(1.05, pickOdds(event,"home") || 1.9);
  const awayOdd = Math.max(1.05, pickOdds(event,"away") || 3.6);
  const drawOdd = Math.max(1.05, pickOdds(event,"draw") || 3.3);
  const idSeed = [...String(event?.id || `${event?.home}-${event?.away}`)].reduce((a,c)=>a+c.charCodeAt(0),0);
  const homeStrength = awayOdd / homeOdd;
  const total = 2.45 + ((idSeed % 13)-6)*0.025;
  const homeLambda = Math.max(0.65, Math.min(2.35, total * (0.5 + 0.5 * homeStrength/(1+homeStrength))));
  const awayLambda = Math.max(0.45, total-homeLambda);
  const margin = 1.08;
  if (/^\d-\d$/.test(selection)) {
    const [h,a]=selection.split("-").map(Number);
    const probability=poisson(h,homeLambda)*poisson(a,awayLambda);
    return Math.max(2.8, Math.min(80, Number((margin/Math.max(probability,0.0001)).toFixed(2))));
  }
  if (selection.startsWith("over_") || selection.startsWith("under_")) {
    const line=Number(selection.split("_")[1]); const threshold=Math.floor(line);
    let over=0; for(let h=0;h<=5;h++) for(let a=0;a<=5;a++) if(h+a>threshold) over+=poisson(h,homeLambda)*poisson(a,awayLambda);
    const prob=selection.startsWith("over_")?over:1-over;
    return Math.max(1.12,Math.min(9,Number((margin/Math.max(prob,0.02)).toFixed(2))));
  }
  if(selection==="yes"||selection==="no"){
    const both=(1-Math.exp(-homeLambda))*(1-Math.exp(-awayLambda));
    const prob=selection==="yes"?both:1-both;
    return Math.max(1.18,Math.min(4.8,Number((margin/Math.max(prob,0.03)).toFixed(2))));
  }
  if(selection==="win1"||selection==="win2") return Number((selection==="win1"?Math.max(3.2,6.1+(idSeed%17)*0.11):Math.max(3.2,6.4+(idSeed%19)*0.10)).toFixed(2));
  return 0;
};
const marketLabel = (m,s) => m === "match_result" ? ({home:"Home",draw:"Draw",away:"Away"}[s]||s) : m === "double_chance" ? (s === "dc_team_1" ? "DC Team 1 / Draw" : "DC Team 2 / Draw") : m === "correct_score" ? `Correct score ${s}` : m === "goals_over_under" ? (s.startsWith("over_") ? `Over ${s.slice(5)}` : `Under ${s.slice(6)}`) : m === "both_teams_score" ? (s === "yes" ? "GG Yes" : "NG No") : `HT Draw / ${s === "win1" ? "Win 1" : "Win 2"}`;

import TeamLogo from "@/components/TeamLogo";
import VirtualTeamLogo from "@/components/VirtualTeamLogo";
import LeagueCrest from "../components/LeagueCrest";
import HeroCarousel from "@/components/HeroCarousel";
import HomeFooter from "@/components/HomeFooter";

const HERO = "/nexusbet-player-banner.jpg";

export default function SportsPage({ activeSection="home", teamSearch="" }) {
  const { user, setBalance, reload } = useAuth();
  const [events,setEvents]=useState([]), [virtual,setVirtual]=useState([]), [loading,setLoading]=useState(true), [filter,setFilter]=useState("all"), [now,setNow]=useState(Date.now());
  const [leagues,setLeagues]=useState([]), [leagueOpen,setLeagueOpen]=useState(null);
  const [expanded,setExpanded]=useState({}), [selections,setSelections]=useState([]), [stake,setStake]=useState(""), [bookingCode,setBookingCode]=useState(""), [loadedTicket,setLoadedTicket]=useState(null), [busy,setBusy]=useState(false), [placedBetSummary,setPlacedBetSummary]=useState(null), [showMinimumStakeNotice,setShowMinimumStakeNotice]=useState(false), [myBetOpen,setMyBetOpen]=useState(false), [myBetPosition,setMyBetPosition]=useState(null);
  const myBetDragRef = useRef(null);
  const suppressMyBetClickRef = useRef(false);
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
  useEffect(()=>{load();const r=setInterval(load,5000),t=setInterval(()=>setNow(Date.now()),1000);return()=>{clearInterval(r);clearInterval(t)}},[load]);
  useEffect(()=>{const fn=(e)=>{const ticket=e.detail;setLoadedTicket(ticket);setBookingCode(ticket?.booking_code||"");setSelections(ticket?.selections||[]);setStake(Number(ticket?.stake||0)>0?String(ticket.stake):"");setMyBetOpen(true);};window.addEventListener("nexus:load-ticket",fn);return()=>window.removeEventListener("nexus:load-ticket",fn)},[]);
  const all=[...events,...virtual.map(x=>({...x,sport:"Virtual Football"}))];
  const sports=useMemo(()=>["all",...Array.from(new Set(["Football","Basketball","Tennis",...events.map(e=>e.sport).filter(Boolean)]))],[events]);
  const normalized=activeSection==="live-score-update"?"live":activeSection;
  const isLive=e=>["live","halftime"].includes(String(e.status||"").toLowerCase())||["live","halftime"].includes(String(e.phase||"").toLowerCase())||e.is_live===true;
  const todayKey=new Date().toISOString().slice(0,10); const isToday=e=>String(e.start_time||e.kickoff_at||e.kickoff||e.created_at||"").slice(0,10)===todayKey;
  const sectionEvents=normalized==="live"?events.filter(isLive):normalized==="today-matches"?events.filter(e=>isToday(e)&&String(e.status||"").toLowerCase()!=="finished"):events.filter(e=>String(e.status||"").toLowerCase()!=="finished");
  const searchTerm=String(teamSearch||"").trim().toLowerCase();
  const matchesTeamSearch=(event)=>!searchTerm||`${event.home||""} ${event.away||""} ${event.league||""} ${event.name||""} ${event.sport||""}`.toLowerCase().includes(searchTerm);
  const visible=(filter==="all"?sectionEvents:sectionEvents.filter(e=>e.sport===filter)).filter(matchesTeamSearch);
  const visibleVirtual=(normalized==="live"?virtual.filter(isLive):virtual.filter(e=>String(e.status||"").toLowerCase()!=="finished")).filter(matchesTeamSearch);
  const toggleSelection=(event,market,selection)=>{
    if (String(event.phase||event.status||"").toLowerCase().includes("live") || event.is_live===true) return toast.error("Odds are locked while the match is live");
    const odds=market==="match_result"?pickOdds(event,selection):market==="double_chance"?doubleChanceOdds(pickOdds(event,"home"),pickOdds(event,"draw"),pickOdds(event,"away"))[selection==="dc_team_1"?"homeDraw":"awayDraw"]:fixtureMarketOdds(event,selection);
    if(!odds)return toast.error("Odds unavailable for this selection");
    setLoadedTicket(null); setSelections(cur=>{const other=cur.filter(x=>x.event_id!==event.id);const existing=cur.find(x=>x.event_id===event.id);return existing?.market===market&&existing?.selection===selection?other:[...other,{event_id:event.id,market,selection,odds,home:event.home,away:event.away,league:event.league}]});
  };
  const calculatedSelectionOdds=selections.reduce((a,x)=>a*Number(x.odds||1),1); const totalOdds=(loadedTicket?.booking_code===bookingCode.trim().toUpperCase() && Number(loadedTicket?.total_odds)>0) ? Number(loadedTicket.total_odds) : calculatedSelectionOdds; const amount=Number(stake||0); const potential=amount*totalOdds;
  const createBooking=async()=>{if(!selections.length)return toast.error("Select at least one match");setBusy(true);try{const r=await api.post("/tickets",{selections:selections.map(({event_id,market,selection})=>({event_id,market,selection})),stake:0});setBookingCode(r.data.ticket.booking_code);setLoadedTicket(r.data.ticket);toast.success(`Booking code ${r.data.ticket.booking_code} generated`)}catch(e){toast.error(formatApiErrorDetail(e?.response?.data?.detail)||"Could not generate booking code")}finally{setBusy(false)}};
  const placeTicket=async()=>{if(!selections.length&&!loadedTicket)return toast.error("Select matches or load a booking code");if(amount<200){setShowMinimumStakeNotice(true);return;}setBusy(true);try{let code=bookingCode;if(!code){const r=await api.post("/tickets",{selections:selections.map(({event_id,market,selection})=>({event_id,market,selection})),stake:0});code=r.data.ticket.booking_code;setBookingCode(code)}const r=await api.post(`/tickets/${encodeURIComponent(code)}/place`,{stake:amount});const placed=r.data.ticket;setBalance(r.data.balance);setLoadedTicket(placed);setSelections([]);setStake("");setPlacedBetSummary({booking_code:placed.booking_code,verify_code:placed.verify_code || placed.booking_code,stake:Number(placed.stake||amount),potential_win:Number(placed.potential_win||0),bet_type:placed.bet_type||((placed.selections||[]).length>1?"Multiple":"Singles")});await reload()}catch(e){const detail=formatApiErrorDetail(e?.response?.data?.detail)||"Bet placement failed";toast.error(detail);if(String(detail).toLowerCase().includes("deposit"))toast.info("Go to Wallet /Deposit to fund your wallet")}finally{setBusy(false)}};
  const loadCode=async()=>{if(!bookingCode.trim())return;try{const r=await api.get(`/tickets/verify/${encodeURIComponent(bookingCode.trim())}`);const ticket=r.data.ticket;setLoadedTicket(ticket);setSelections((ticket.selections||[]).map(s=>({...s,odds:Number(s.odds||0)})));setStake(ticket.stake>0?String(ticket.stake):"");toast.success(`Booking code loaded into My Bet · ${Number(ticket.total_odds||1).toFixed(2)} odds`) }catch(e){toast.error(formatApiErrorDetail(e?.response?.data?.detail)||"Booking code not found")}};
  const Market=({event,market,selection,label,odds})=>{const locked=isLive(event);return <button type="button" disabled={locked} aria-disabled={locked} title={locked?"Odds locked for live matches":"Select odds"} onClick={()=>toggleSelection(event,market,selection)} className={`rounded-lg p-2 text-center text-xs border ${locked?"opacity-40 cursor-not-allowed bg-black/40 border-white/5":""} ${selections.find(x=>x.event_id===event.id)?.selection===selection?"bg-[#00E5FF] text-black border-[#00E5FF]":"bg-[#221c46] border-white/10"}`}><div className="opacity-80">{label}</div><b>{locked?"LOCKED":Number(odds).toFixed(2)}</b></button>};
  const Card=({event,isVirtual=false})=>{const sc=scoreOf(event);const odds=event.odds||{};const validOdd=(value,fallback)=>{const n=Number(value);return Number.isFinite(n)&&n>1?n:fallback;};const home=validOdd(odds.home ?? pickOdds(event,"home"),1.85),draw=validOdd(odds.draw ?? pickOdds(event,"draw"),3.4),away=validOdd(odds.away ?? pickOdds(event,"away"),3.75);const dcOdds=doubleChanceOdds(home,draw,away);const liveNow=isLive(event);const Logo=isVirtual?VirtualTeamLogo:TeamLogo;return <div className="nx-card p-4">
    <div className="flex items-center justify-between"><span className="text-[10px] font-black uppercase tracking-wider text-[#00E5FF]">{event.sport||"Football"}</span><span className="text-[10px] text-[#A29DBE]"><Radio size={11} className="inline mr-1"/>{event.status==="halftime"?"HT":(event.phase||event.status||"scheduled")}{event.status==="live"?` · ${event.minute??0}'`:""}</span></div>
    <button type="button" className="w-full text-left mt-3" onClick={()=>setExpanded(c=>({...c,[event.id]:!c[event.id]}))}><div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2"><div className="flex items-center gap-2"><Logo name={event.home} logoUrl={isVirtual?undefined:event.home_logo_url} size={38}/><span className="font-semibold text-sm">{event.home}</span></div><span className="text-[#FFD700] font-black">{["live","halftime"].includes(String(event.status||"").toLowerCase()) ? `${sc.home}:${sc.away}` : "VS"}</span><div className="flex items-center justify-end gap-2"><span className="font-semibold text-sm text-right">{event.away}</span><Logo name={event.away} logoUrl={isVirtual?undefined:event.away_logo_url} size={38}/></div></div><p className="text-xs text-[#6E688D] mt-2">{event.league||"League"} · {event.status==="halftime" ? "Half Time" : event.status==="live" ? `${event.minute??0}' live` : event.kickoff_at ? new Date(event.kickoff_at).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"}) : "Scheduled"}</p></button>
    {liveNow?<div className="mt-3 rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-center text-xs font-black tracking-wide text-amber-300"><Shield size={14} className="inline mr-1"/> {event.status==="halftime"?"HALF TIME · ODDS LOCKED":"LIVE SCORE UPDATE · ODDS LOCKED"}</div>:<div className={`grid ${["basketball","tennis"].includes(String(event.sport||"").toLowerCase())?"grid-cols-2":"grid-cols-3"} gap-2 mt-3`}><Market event={event} market="match_result" selection="home" label={["basketball","tennis"].includes(String(event.sport||"").toLowerCase())?"Home Win":"Home"} odds={home}/>{!["basketball","tennis"].includes(String(event.sport||"").toLowerCase())&&<Market event={event} market="match_result" selection="draw" label="Draw" odds={draw}/>}<Market event={event} market="match_result" selection="away" label={["basketball","tennis"].includes(String(event.sport||"").toLowerCase())?"Away Win":"Away"} odds={away}/></div>}
    {!liveNow&&expanded[event.id]&&!["basketball","tennis"].includes(String(event.sport||"").toLowerCase())&&<div className="mt-4 border-t border-white/10 pt-4 space-y-4"><div><div className="text-xs font-black uppercase text-[#00E5FF] mb-2">Double Chance</div><div className="grid grid-cols-2 gap-2"><Market event={event} market="double_chance" selection="dc_team_1" label={`${event.home} / Draw`} odds={dcOdds.homeDraw}/><Market event={event} market="double_chance" selection="dc_team_2" label={`${event.away} / Draw`} odds={dcOdds.awayDraw}/></div></div><div><div className="text-xs font-black uppercase text-[#00E5FF] mb-2">Over / Under Goals</div><div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{["0.5","1.5","2.5","3.5","4.5","5.5"].flatMap(line=>[<Market key={`o${line}`} event={event} market="goals_over_under" selection={`over_${line}`} label={`Over ${line}`} odds={fixtureMarketOdds(event,`over_${line}`)}/>,<Market key={`u${line}`} event={event} market="goals_over_under" selection={`under_${line}`} label={`Under ${line}`} odds={fixtureMarketOdds(event,`under_${line}`)}/>])}</div></div><div><div className="text-xs font-black uppercase text-[#00E5FF] mb-2">GG / NG</div><div className="grid grid-cols-2 gap-2"><Market event={event} market="both_teams_score" selection="yes" label="GG Yes" odds={fixtureMarketOdds(event,"yes")}/><Market event={event} market="both_teams_score" selection="no" label="NG No" odds={fixtureMarketOdds(event,"no")}/></div></div><div><div className="text-xs font-black uppercase text-[#00E5FF] mb-2">Correct Score</div><div className="grid grid-cols-3 sm:grid-cols-4 gap-2">{SCORE_OPTIONS.map(s=><Market key={s} event={event} market="correct_score" selection={s} label={s} odds={fixtureMarketOdds(event,s)}/>)}</div></div><div><div className="text-xs font-black uppercase text-[#00E5FF] mb-2">HT / FT</div><div className="grid grid-cols-2 gap-2"><Market event={event} market="ht_draw_ft" selection="win1" label="HT Draw / Win 1" odds={fixtureMarketOdds(event,"win1")}/><Market event={event} market="ht_draw_ft" selection="win2" label="HT Draw / Win 2" odds={fixtureMarketOdds(event,"win2")}/></div></div></div>}
    <div className="mt-3 flex justify-between text-[11px] text-[#A29DBE]"><span><Clock3 size={12} className="inline mr-1"/>{event.status||"scheduled"}</span>{!liveNow&&<button onClick={()=>setExpanded(c=>({...c,[event.id]:!c[event.id]}))} className="text-[#00E5FF]">{expanded[event.id]?<><ChevronUp size={13} className="inline"/> Hide markets</>:<><ChevronDown size={13} className="inline"/> More markets</>}</button>}</div>
  </div>};
  if(activeSection==="leagues") return <section className="space-y-6">
    <div className="nx-card p-6 sm:p-8"><div className="flex items-start justify-between gap-4"><div><span className="text-xs font-black uppercase tracking-[.22em] text-[#00E5FF]">Football Leagues</span><h1 className="text-3xl sm:text-4xl font-black mt-2">2026/27 League Clubs</h1><p className="text-sm text-[#A29DBE] mt-2">Tap a league to view its current clubs, official display names and real club crests.</p></div><Shield className="text-[#FFD700]" size={32}/></div></div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{leagues.map(l=><div key={l.slug} className="nx-card overflow-hidden"><button type="button" onClick={()=>setLeagueOpen(leagueOpen===l.slug?null:l.slug)} className="w-full p-5 text-left hover:bg-white/[.03]"><div className="flex items-center justify-between gap-3"><div><div className="text-xs uppercase tracking-wider font-black text-[#00E5FF]">{l.country} · {l.season}</div><h2 className="text-xl sm:text-2xl font-black mt-1">{l.name}</h2><p className="text-xs text-[#A29DBE] mt-1">{l.team_count} clubs</p></div><ChevronDown className={`transition-transform ${leagueOpen===l.slug?"rotate-180":""}`} /></div></button>{leagueOpen===l.slug&&<div className="px-5 pb-5 border-t border-white/10"><div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4">{l.teams.map(team=><div key={team.name} className="rounded-xl bg-black/20 border border-white/10 p-3 flex items-center gap-3 min-w-0"><LeagueCrest name={team.name} logoUrl={team.logo_url} size={38}/><div className="min-w-0"><div className="font-bold text-xs sm:text-sm leading-tight">{team.name}</div><div className="text-[9px] text-[#6E688D] mt-1">Official crest</div></div></div>)}</div></div>}</div>)}</div>
  </section>;
  return <div className="space-y-6">
    <HeroCarousel />
    <div className="flex flex-wrap gap-2">{sports.map(s=>{const label=s==="all"?"All sports":s;const symbol=s==="all"?"🏅":s==="Football"?"⚽":s==="Basketball"?"🏀":s==="Tennis"?"🎾":"🏟️";return <button key={s} onClick={()=>setFilter(s)} aria-label={`Filter ${label}`} className={`rounded-full px-4 py-2 text-xs font-bold border inline-flex items-center gap-2 ${filter===s?"bg-[#00E5FF] text-black border-[#00E5FF]":"border-white/10 text-[#A29DBE]"}`}><span aria-hidden="true" className="text-sm leading-none">{symbol}</span><span>{label}</span></button>})}</div>
    {loading?<div className="nx-card p-8 text-center">Loading matches...</div>:<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{visible.map(e=><Card key={e.id} event={e}/>)}{visibleVirtual.map(e=><Card key={e.id} event={{...e,sport:"Virtual Football"}} isVirtual/>)}{!visible.length&&!visibleVirtual.length&&<div className="nx-card p-8 text-center lg:col-span-2"><Search size={22} className="mx-auto text-[#00E5FF] mb-2"/><p className="font-bold">{filter!=="all"&&["Basketball","Tennis"].includes(filter)?`No ${filter.toLowerCase()} matches scheduled at the moment`:"No matches found"}</p><p className="text-xs text-[#A29DBE] mt-1">{filter!=="all"&&["Basketball","Tennis"].includes(filter)?"Please check back when an event has been scheduled.":"Try another team name."}</p></div>}</div>}
    {activeSection==="home" && <HomeFooter />}
    <div className={`fixed z-40 ${myBetOpen?"w-[min(430px,calc(100vw-1.5rem))]":"w-16"}`} style={myBetPosition ? {left:myBetPosition.x,top:myBetPosition.y,right:"auto",bottom:"auto",touchAction:"none"} : {right:12,bottom:76,touchAction:"none"}}>
      <div className="nx-card border-2 border-[#00E5FF]/50 shadow-2xl">
        <button type="button" onClick={()=>setMyBetOpen(v=>!v)} aria-expanded={myBetOpen} className="w-full p-4 flex items-center justify-between text-left hover:bg-white/[0.03] transition-colors">
          <div className={`flex items-center ${myBetOpen?"gap-3":"justify-center"} min-w-0`}><span className="relative block w-12 h-12 shrink-0"><img src="/my-bet-slip-icon.jpeg" alt="My Bet" className="w-12 h-12 object-contain rounded-md"/><span className="absolute -right-1 -top-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#079BEA] border border-white text-white text-[10px] font-black flex items-center justify-center shadow">{loadedTicket?.selections?.length ?? selections.length}</span></span>{myBetOpen&&<span className="min-w-0"><span className="block text-xs font-black uppercase tracking-wider text-[#00E5FF]">My Bet</span><b className="block truncate">{loadedTicket?.bet_type || (selections.length>1 ? "Multiple" : selections.length===1 ? "Singles" : "No selection")}</b><span className="block text-[10px] text-[#6E688D] mt-1">Tap to close</span></span>}</div>
          {myBetOpen&&<div className="flex items-center gap-2"><ChevronDown size={18}/></div>}
        </button>
        {myBetOpen && <>
        <div className="px-4 pt-3">
          <form onSubmit={e=>{e.preventDefault();loadCode()}} className="flex gap-2">
            <input value={bookingCode} onChange={e=>setBookingCode(e.target.value.toUpperCase())} placeholder="Load booking code" aria-label="Load booking code into My Bet" className="min-w-0 flex-1 rounded-lg bg-black/20 border border-white/10 px-2 py-2 text-xs"/>
            <button type="submit" disabled={busy||!bookingCode.trim()} className="rounded-lg bg-[#00E5FF] text-black px-3 text-xs font-black">Load</button>
          </form>
        </div>
        <div className="px-4 py-3 max-h-56 overflow-y-auto space-y-2">
          {(loadedTicket?.selections || selections).map((x,i)=>{
            const ev = all.find(e=>String(e.id)===String(x.event_id));
            const home = x.home || ev?.home || "Home";
            const away = x.away || ev?.away || "Away";
            return <div key={String(x.event_id)+String(i)} className="team-names-only rounded-xl bg-black/20 border border-white/10 p-3">
              <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                <div className="min-w-0 font-bold text-xs truncate">{home}</div>
                <span className="text-[10px] font-black text-[#FFD700]">VS</span>
                <div className="min-w-0 font-bold text-xs text-right truncate">{away}</div>
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
      {showMinimumStakeNotice&&<div className="fixed inset-0 z-[110] bg-black/65 backdrop-blur-sm flex items-center justify-center p-5" role="alertdialog" aria-modal="true" aria-label="Minimum stake required">
        <div className="w-full max-w-sm rounded-2xl bg-white text-[#242424] p-5 text-center shadow-2xl">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B68B00]">Minimum Amount</div>
          <h2 className="mt-2 text-lg font-black">Minimum stake is GHS 200.00.</h2>
          <p className="mt-2 text-sm text-[#666]">Please enter a stake of GHS 200.00 or more to place your bet.</p>
          <button type="button" onClick={()=>setShowMinimumStakeNotice(false)} className="mt-5 w-full rounded-xl bg-[#079B4B] py-3 font-black text-white">OK</button>
        </div>
      </div>}
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
