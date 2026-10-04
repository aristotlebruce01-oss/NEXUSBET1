import React,{useEffect,useState} from "react";
import { Trophy, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiErrorDetail } from "@/lib/api";
import TeamLogo from "@/components/TeamLogo";

const money=v=>`₵${Number(v||0).toFixed(2)}`;
const marketLabel=(m,s)=>m==="match_result"?({home:"Home",draw:"Draw",away:"Away"}[s]||s):m==="double_chance"?(s==="dc_team_1"?"DC Team 1 / Draw":"DC Team 2 / Draw"):m==="correct_score"?`Correct score ${s}`:`HT Draw / ${s==="win1"?"Win 1":"Win 2"}`;

export default function OpenBetPage(){
  const[tickets,setTickets]=useState([]),[loading,setLoading]=useState(true);
  const load=async()=>{
    try{const r=await api.get("/tickets");setTickets(Array.isArray(r.data)?r.data:[])}
    catch(e){toast.error(formatApiErrorDetail(e?.response?.data?.detail)||"Unable to load Open Bets")}
    finally{setLoading(false)}
  };
  useEffect(()=>{load();const t=setInterval(load,3000);return()=>clearInterval(t)},[]);

  const open=tickets.filter(t=>t.status==="open");
  const history=tickets.filter(t=>["won","lost"].includes(t.status));

  const ticketCard=t=><div key={t.id} className={`nx-card p-5 border ${t.status==="won"?"border-[#00FF87]/50":t.status==="lost"?"border-[#FF3366]/40":"border-white/10"}`}>
    <div className="flex justify-between gap-3">
      <div><h3 className="font-black">{t.bet_type}</h3><p className="text-xs text-[#A29DBE]">Verify Code: {t.verify_code || t.booking_code}</p></div>
      <b className={t.status==="won"?"text-[#00FF87]":t.status==="lost"?"text-[#FF3366]":"text-[#FFD700]"}>{t.status.toUpperCase()} {t.status==="won"?"✅":t.status==="lost"?"❌":""}</b>
    </div>
    <div className="mt-3 space-y-2">{(t.selections||[]).map((s,i)=><div key={s.event_id+i} className="rounded-lg bg-black/20 p-3 text-sm">
      <div className="flex items-center gap-2"><TeamLogo name={s.home} size={30}/><div className="font-bold flex-1 truncate">{s.home}</div><span className="text-[10px] text-[#FFD700]">VS</span><div className="font-bold flex-1 text-right truncate">{s.away}</div><TeamLogo name={s.away} size={30}/></div>
      <div className="text-xs text-[#A29DBE] mt-2">{marketLabel(s.market,s.selection)} · Odds {Number(s.odds||0).toFixed(2)} · <span className={s.event_status==="live"?"text-[#00FF87] font-black":"text-[#A29DBE]"}>{s.event_status==="live"?"LIVE":s.status}</span></div>
      <div className="text-xs mt-1">Score {s.score?.home??0}:{s.score?.away??0} {s.event_status==="live"&&<span className="text-[#00E5FF] font-black">· {s.minute??0}'</span>}</div>
    </div>)}</div>
    <div className="grid grid-cols-3 gap-3 mt-4 text-sm"><div><span className="text-xs text-[#A29DBE] block">Stake</span><b>{money(t.stake)}</b></div><div><span className="text-xs text-[#A29DBE] block">Total odds</span><b>{Number(t.total_odds||1).toFixed(2)}</b></div><div><span className="text-xs text-[#A29DBE] block">{t.status==="won"?"Total return":"Potential win"}</span><b className="text-[#00FF87]">{money(t.status==="won"?t.payout:t.potential_win)}</b></div></div>
    {open.includes(t)&&<button disabled className="mt-4 w-full rounded-lg border border-white/10 py-2 text-xs text-[#A29DBE]">Cashout · Unavailable</button>}
    {t.status==="won"&&<div className="mt-5 rounded-3xl bg-gradient-to-b from-[#FFD700]/20 via-[#FFD700]/10 to-transparent border-2 border-[#FFD700]/50 p-7 text-center shadow-[0_0_35px_rgba(255,215,0,.18)]"><div className="text-[11px] font-black uppercase tracking-[0.35em] text-[#FFD700]">Bet Won</div><div className="mt-2 text-7xl sm:text-8xl leading-none drop-shadow-[0_8px_20px_rgba(255,215,0,.35)]">🏆</div><div className="mt-2 text-3xl sm:text-4xl font-black tracking-wide text-[#FFD700]">NexusBet</div><div className="mt-1 text-2xl sm:text-3xl font-black text-white">CONGRATULATIONS!</div><div className="mt-4 text-sm text-[#A29DBE]">You won</div><div className="mt-1 text-3xl sm:text-4xl font-black text-[#00FF87]">{money(t.payout)}</div><div className="mt-2 text-xs text-[#A29DBE]">Exact total return credited to your wallet</div><Trophy className="mx-auto mt-4 text-[#FFD700]" size={32}/></div>}
  </div>;

  return <section className="space-y-5">
    <div className="nx-card p-5 flex justify-between items-center"><div><span className="text-xs uppercase font-black text-[#00E5FF]">Live ticket monitor</span><h1 className="text-3xl font-black mt-1">Open Bets</h1><p className="text-sm text-[#A29DBE] mt-1">Active tickets, settlement status and bet history appear here.</p></div><button onClick={load} className="nx-btn-primary p-2"><RefreshCw size={16}/></button></div>
    {loading?<div className="nx-card p-6">Loading...</div>:<>
      <div className="nx-card p-5"><div className="text-xs uppercase font-black text-[#00E5FF] mb-3">Open Bets</div>{open.length===0?<div className="text-sm text-[#A29DBE]">No open bets.</div>:<div className="space-y-4">{open.map(ticketCard)}</div>}</div>
      <div className="nx-card p-5"><div className="text-xs uppercase font-black text-[#00E5FF] mb-3">Bet History</div>{history.length===0?<div className="text-sm text-[#A29DBE]">No settled bets yet.</div>:<div className="space-y-4">{history.map(ticketCard)}</div>}</div>
    </>}
  </section>;
}
