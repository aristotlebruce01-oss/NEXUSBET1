import React,{useEffect,useMemo,useState} from "react";
import { Ticket, WalletCards, Search, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiErrorDetail } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import TeamLogo from "@/components/TeamLogo";

const money=v=>`₵${Number(v||0).toFixed(2)}`;
const marketLabel=(m,s)=>m==="match_result"?({home:"Home",draw:"Draw",away:"Away"}[s]||s):m==="double_chance"?(s==="dc_team_1"?"DC Team 1 / Draw":"DC Team 2 / Draw"):m==="correct_score"?`Correct score ${s}`:`HT Draw / ${s==="win1"?"Win 1":"Win 2"}`;

// My Bets is intentionally only the user's betting slip/selection area.
// Open Bets owns the ticket history, settlement status, cashout state and win/loss display.
export default function MyBetsPage({onRefresh}){
  const {user,setBalance,reload}=useAuth();
  const [selections,setSelections]=useState([]),[loadedTicket,setLoadedTicket]=useState(null),[stake,setStake]=useState(""),[code,setCode]=useState(""),[busy,setBusy]=useState(false),[panelOpen,setPanelOpen]=useState(false);
  const totalOdds=useMemo(()=>selections.reduce((a,x)=>a*Number(x.odds||1),1),[selections]);
  const potential=Number(stake||0)*totalOdds;

  const loadCode=async()=>{
    if(!code.trim()) return;
    setBusy(true);
    try{
      const r=await api.get(`/tickets/verify/${encodeURIComponent(code.trim())}`);
      const ticket=r.data.ticket;
      setLoadedTicket(ticket);
      setSelections(ticket.selections||[]);
      setStake(Number(ticket.stake||0)>0?String(ticket.stake):"");
      toast.success("Booking code loaded into My Bet");
    }catch(e){toast.error(formatApiErrorDetail(e?.response?.data?.detail)||"Booking code not found")}
    finally{setBusy(false)}
  };

  useEffect(()=>{
    const fn=e=>{
      const t=e.detail;
      setLoadedTicket(t);
      setSelections(t?.selections||[]);
      setCode(t?.booking_code||"");
      setStake(Number(t?.stake||0)>0?String(t.stake):"");
      // Loading a booking code never opens the slip automatically.
      setPanelOpen(false);
    };
    window.addEventListener("nexus:load-ticket",fn);
    return()=>window.removeEventListener("nexus:load-ticket",fn);
  },[]);

  const createBooking=async()=>{
    if(!selections.length) return toast.error("Select at least one match");
    setBusy(true);
    try{
      const r=await api.post("/tickets",{selections:selections.map(({event_id,market,selection})=>({event_id,market,selection})),stake:0});
      const t=r.data.ticket;
      setLoadedTicket(t);setCode(t.booking_code);
      toast.success(`Booking code ${t.booking_code} generated`);
    }catch(e){toast.error(formatApiErrorDetail(e?.response?.data?.detail)||"Could not generate booking code")}
    finally{setBusy(false)}
  };

  const placeTicket=async()=>{
    if(!selections.length) return toast.error("Load or select a ticket first");
    const amount=Number(stake||0);
    if(amount<=0) return toast.error("Enter a valid stake");
    setBusy(true);
    try{
      let booking=code.trim();
      if(!booking){
        const r=await api.post("/tickets",{selections:selections.map(({event_id,market,selection})=>({event_id,market,selection})),stake:0});
        booking=r.data.ticket.booking_code;setCode(booking);
      }
      const r=await api.post(`/tickets/${encodeURIComponent(booking)}/place`,{stake:amount});
      setLoadedTicket(r.data.ticket);setSelections(r.data.ticket.selections||[]);setBalance(r.data.balance);setStake("");
      await reload();onRefresh?.();
      toast.success("Bet placed successfully");
      window.dispatchEvent(new CustomEvent("nexus:open-bets"));
    }catch(e){
      const detail=formatApiErrorDetail(e?.response?.data?.detail)||"Bet placement failed";
      toast.error(detail);
      if(String(detail).toLowerCase().includes("deposit")||String(detail).toLowerCase().includes("insufficient")) toast.info("Go to Wallet /Deposit");
    }finally{setBusy(false)}
  };

  return <section className="space-y-5">
    <div className="nx-card border-2 border-[#00E5FF]/50 shadow-xl">
      <button type="button" onClick={()=>setPanelOpen(v=>!v)} aria-expanded={panelOpen} className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-white/[0.03] transition-colors">
        <div>
          <div className="text-xs font-black uppercase tracking-wider text-[#00E5FF]">My Bet</div>
          <div className="text-xl font-black">{loadedTicket?.bet_type||(selections.length>1?"Multiple":selections.length===1?"Singles":"No selection")}</div>
          <div className="text-xs text-[#6E688D] mt-1">Tap to {panelOpen?"close":"open"} betting controls</div>
        </div>
        <div className="flex items-center gap-2"><div className="rounded-full bg-[#00E5FF]/15 px-4 py-2 text-xs font-black">{loadedTicket?.selections?.length||selections.length}</div>{panelOpen?<ChevronUp size={18}/>:<ChevronDown size={18}/>}</div>
      </button>

      {panelOpen && <>
        <div className="p-5 border-t border-white/10">
          <div className="text-xs font-black uppercase text-[#00E5FF] mb-2"><Search size={14} className="inline mr-1"/>Load booking code</div>
          <div className="flex gap-2"><input value={code} onChange={e=>setCode(e.target.value.toUpperCase())} className="flex-1 rounded-xl bg-black/20 border border-white/10 px-3 py-2 text-sm" placeholder="NBM-XXXXXXXXXX"/><button onClick={loadCode} disabled={busy||!code.trim()} className="nx-btn-primary px-4 py-2">Load</button></div>
        </div>

        <div className="p-5 max-h-[420px] overflow-y-auto space-y-3">
          {selections.map((x,i)=>{const home=x.home||"Home",away=x.away||"Away";return <div key={String(x.event_id)+i} className="rounded-xl bg-black/20 border border-white/10 p-4">
            <div className="flex items-center gap-3"><TeamLogo name={home} size={40}/><div className="min-w-0 flex-1 font-bold text-sm truncate">{home}</div><span className="text-[10px] font-black text-[#FFD700]">VS</span><div className="min-w-0 flex-1 font-bold text-sm text-right truncate">{away}</div><TeamLogo name={away} size={40}/></div>
            <div className="mt-3 flex items-center justify-between text-xs"><span className="text-[#A29DBE]">{marketLabel(x.market,x.selection)}</span><b className="text-[#00E5FF]">@ {Number(x.odds||0).toFixed(2)}</b></div>
          </div>})}
          {!selections.length&&<div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-[#6E688D]">Load a booking code or add selections from Sports. They will appear here.</div>}
        </div>

        <div className="p-5 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div><span className="text-xs text-[#A29DBE] block mb-1">Total Stake</span><input value={stake} onChange={e=>setStake(e.target.value)} type="number" min="0" className="w-full rounded-xl bg-[#221c46] border border-white/10 px-3 py-3" placeholder="0.00"/></div>
          <div><span className="text-xs text-[#A29DBE] block mb-1">Total Odds</span><b className="block py-3 text-lg">{totalOdds.toFixed(2)}</b></div>
          <div className="sm:col-span-2 flex justify-between items-center"><span>Potential Win</span><b className="text-[#00FF87] text-xl">{money(potential)}</b></div>
        </div>

        {loadedTicket?.booking_code&&<div className="px-5 pb-5"><div className="rounded-xl border-2 border-[#FFD700]/60 bg-[#FFD700]/10 p-4 text-center"><div className="text-[10px] font-black uppercase tracking-[0.22em] text-[#A29DBE]">Booking Code</div><div className="mt-2 text-3xl sm:text-5xl font-black tracking-[0.18em] text-[#FFD700] leading-none break-all">{loadedTicket.booking_code}</div></div></div>}

        <div className="px-5 pb-5 grid grid-cols-2 gap-3"><button disabled={busy||!selections.length} onClick={createBooking} className="rounded-xl border border-[#FFD700]/40 bg-[#FFD700]/10 py-3 text-xs font-black text-[#FFD700]"><Ticket size={15} className="inline mr-1"/>Book Bet</button><button disabled={busy||!selections.length} onClick={placeTicket} className="nx-btn-primary py-3 text-xs font-black">Place Bet</button></div>

        {selections.length>0&&<button onClick={()=>window.dispatchEvent(new CustomEvent("nexus:go-wallet"))} className="mx-5 mb-5 w-[calc(100%-2.5rem)] rounded-xl bg-[#FFD700]/10 border border-[#FFD700]/30 py-3 text-xs font-bold text-[#FFD700]"><WalletCards size={14} className="inline mr-1"/>Go to deposit</button>}
      </>}
    </div>
  </section>;
}
