import React,{useEffect,useState} from "react";
import { Trophy, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiErrorDetail } from "@/lib/api";

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
  const history=tickets.filter(t=>["won","lost","void","cancelled"].includes(t.status));
  const deleteOne=async(t)=>{if(!window.confirm("Delete this settled bet from your history? Transaction and wallet audit records will remain unchanged."))return;try{await api.delete(`/tickets/${encodeURIComponent(t.id)}`);setTickets(rows=>rows.filter(x=>x.id!==t.id));toast.success("Settled bet removed from history")}catch(e){toast.error(formatApiErrorDetail(e?.response?.data?.detail)||"Could not delete settled bet")}};
  const clearHistory=async()=>{if(!history.length)return;if(!window.confirm("Clear all settled bets from your history? Open bets will not be deleted and wallet records will remain unchanged."))return;try{await api.delete("/tickets/history");setTickets(rows=>rows.filter(x=>!["won","lost","void","cancelled"].includes(x.status)));toast.success("Bet history cleared")}catch(e){toast.error(formatApiErrorDetail(e?.response?.data?.detail)||"Could not clear bet history")}};

  const ticketCard=t=>{
    const settled=history.includes(t);
    if(settled){
      const when=t.settled_at||t.updated_at||t.created_at;
      const date=when?new Date(when):null;
      const dateLabel=date&&!Number.isNaN(date.getTime())?date.toLocaleDateString(undefined,{day:"2-digit",month:"short",year:"numeric"}):"Bet history";
      const timeLabel=date&&!Number.isNaN(date.getTime())?date.toLocaleTimeString(undefined,{hour:"2-digit",minute:"2-digit",hour12:false}):"";
      return <div key={t.id} className="overflow-hidden rounded-2xl border border-white/10 bg-[#111111] shadow-lg">
        <div className="px-4 pt-3 pb-2 text-center text-sm font-bold text-[#60A5FA]">{dateLabel}</div>
        <div className="flex items-center justify-between gap-3 bg-[#292929] px-4 py-3 text-sm"><div className="flex items-center gap-3 min-w-0"><span className="text-xs text-[#B8B8B8]">{timeLabel}</span><b className="truncate">{t.bet_type||((t.selections||[]).length>1?"Multiple":"Single")}</b></div><b className={t.status==="won"?"text-[#22C55E]":"text-[#EF4444]"}>{t.status==="won"?"🏆 Won":t.status.toUpperCase()}</b></div>
        <div className="px-4 py-3 space-y-3">{(t.selections||[]).map((s,i)=><div key={s.event_id+i} className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto] items-center gap-2 text-sm"><span className="min-w-0"><span className="block truncate text-[#D4D4D4]">{s.home||"Home"}</span><span className="block text-[10px] text-[#22C55E]">Score {s.score?.home ?? "—"}:{s.score?.away ?? "—"}</span></span><span className="text-xs text-[#777]">vs</span><span className="min-w-0"><span className="block truncate text-[#D4D4D4]">{s.away||"Away"}</span><span className="block text-[10px] text-[#22C55E]">&nbsp;</span></span><span className="text-[11px] text-[#A3A3A3] text-right">({marketLabel(s.market,s.selection)})</span></div>)}
          <div className="border-t border-white/10 pt-3 space-y-2 text-sm"><div className="flex justify-between gap-4"><span className="text-[#A3A3A3]">Stake</span><b>{money(t.stake)}</b></div><div className="flex justify-between gap-4"><span className="text-[#A3A3A3]">Total Odds</span><b>{Number(t.total_odds||1).toFixed(2)}</b></div><div className="flex justify-between gap-4"><span className="text-[#A3A3A3]">Total Return</span><b className={t.status==="won"?"text-[#22C55E]":"text-[#D4D4D4]"}>{money(t.status==="won"?t.payout:0)}</b></div></div>
          <div className="flex items-center justify-between gap-3 pt-1"><span className="text-[10px] text-[#777]">Verify Code: {t.verify_code||t.booking_code||"—"}</span><button onClick={()=>deleteOne(t)} className="shrink-0 rounded-lg border border-rose-400/30 bg-rose-400/5 px-3 py-2 text-xs text-rose-300"><Trash2 size={13} className="inline mr-1"/>Delete</button></div>
        </div>
      </div>;
    }
    return <div key={t.id} className="nx-card p-5 border border-white/10"><div className="flex justify-between gap-3"><div><h3 className="font-black">{t.bet_type}</h3><p className="text-xs text-[#A29DBE]">Verify Code: {t.verify_code || t.booking_code}</p></div><b className="text-[#FFD700]">{t.status.toUpperCase()}</b></div>
      <div className="mt-3 space-y-2">{(t.selections||[]).map((s,i)=><div key={s.event_id+i} className="team-names-only rounded-lg bg-black/20 p-3 text-sm"><div className="flex items-center gap-2"><div className="font-bold flex-1 truncate">{s.home}</div><span className="text-[10px] text-[#FFD700]">VS</span><div className="font-bold flex-1 text-right truncate">{s.away}</div></div><div className="text-xs text-[#A29DBE] mt-2">{marketLabel(s.market,s.selection)} · Odds {Number(s.odds||0).toFixed(2)} · <span className={s.event_status==="live"?"text-[#00FF87] font-black":"text-[#A29DBE]"}>{s.event_status==="live"?"LIVE":s.status}</span></div><div className="text-xs mt-1">Score {s.score?.home??0}:{s.score?.away??0} {s.event_status==="live"&&<span className="text-[#00E5FF] font-black">· {s.minute??0}'</span>}</div></div>)}</div>
      <div className="grid grid-cols-3 gap-3 mt-4 text-sm"><div><span className="text-xs text-[#A29DBE] block">Stake</span><b>{money(t.stake)}</b></div><div><span className="text-xs text-[#A29DBE] block">Total odds</span><b>{Number(t.total_odds||1).toFixed(2)}</b></div><div><span className="text-xs text-[#A29DBE] block">Potential win</span><b className="text-[#00FF87]">{money(t.potential_win)}</b></div></div><button disabled className="mt-4 w-full rounded-lg border border-white/10 py-2 text-xs text-[#A29DBE]">Cashout · Unavailable</button>
    </div>;
  };

  return <section className="space-y-5">
    <div className="nx-card p-5 flex justify-between items-center"><div><span className="text-xs uppercase font-black text-[#00E5FF]">Live ticket monitor</span><h1 className="text-3xl font-black mt-1">Open Bets</h1><p className="text-sm text-[#A29DBE] mt-1">Active tickets, settlement status and bet history appear here.</p></div><button onClick={load} className="nx-btn-primary p-2"><RefreshCw size={16}/></button></div>
    {loading?<div className="nx-card p-6">Loading...</div>:<>
      <div className="nx-card p-5"><div className="text-xs uppercase font-black text-[#00E5FF] mb-3">Open Bets</div>{open.length===0?<div className="text-sm text-[#A29DBE]">No open bets.</div>:<div className="space-y-4">{open.map(ticketCard)}</div>}</div>
      <div className="nx-card p-5"><div className="flex items-center justify-between gap-3 mb-3"><div className="text-xs uppercase font-black text-[#00E5FF]">Bet History</div>{history.length>0&&<button onClick={clearHistory} className="text-xs text-rose-300 border border-rose-400/30 rounded-lg px-3 py-2"><Trash2 size={13} className="inline mr-1"/>Clear history</button>}</div>{history.length===0?<div className="text-sm text-[#A29DBE]">No settled bets yet.</div>:<div className="space-y-4">{history.map(ticketCard)}</div>}</div>
    </>}
  </section>;
}
