import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ClipboardCheck, Clock3, Copy, Loader2, Search, ShieldCheck, TicketCheck, X, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { api, formatApiErrorDetail } from "@/lib/api";

const CUP_IMAGE = "/congratulations-cup.png";
const money = (value) => `₵${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function Confetti() {
  const pieces = useMemo(() => Array.from({ length: 72 }, (_, i) => ({
    id: i,
    left: `${(i * 37) % 101}%`,
    delay: `${(i % 12) * 0.08}s`,
    duration: `${2.8 + (i % 7) * 0.25}s`,
    rotate: `${(i * 53) % 360}deg`,
    size: `${6 + (i % 4) * 2}px`,
    "--piece-size": `${6 + (i % 4) * 2}px`,
    "--piece-duration": `${2.8 + (i % 7) * 0.25}s`,
    "--piece-delay": `${(i % 12) * 0.08}s`,
  })), []);
  return <div className="nx-confetti" aria-hidden="true">{pieces.map((piece) => <span key={piece.id} style={piece} />)}</div>;
}

function ResultState({ status, message, onVerifyAnother, onClose }) {
  const config = {
    Lost: { icon: XCircle, title: "Ticket Settled — Lost", tone: "text-[#FF5C7A]", bg: "bg-[#FF3366]/10 border-[#FF3366]/25" },
    Pending: { icon: Clock3, title: "Ticket Pending", tone: "text-[#FFD700]", bg: "bg-[#FFD700]/10 border-[#FFD700]/25" },
    Invalid: { icon: XCircle, title: "Invalid Ticket Code", tone: "text-[#FF5C7A]", bg: "bg-[#FF3366]/10 border-[#FF3366]/25" },
  }[status] || { icon: ShieldCheck, title: "Ticket Status", tone: "text-[#00E5FF]", bg: "bg-[#00E5FF]/10 border-[#00E5FF]/25" };
  const Icon = config.icon;
  return <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="text-center py-6">
    <div className={`mx-auto w-16 h-16 rounded-2xl border flex items-center justify-center ${config.bg}`}><Icon size={34} className={config.tone} /></div>
    <h3 className="mt-5 text-2xl font-black">{config.title}</h3>
    <p className="mt-2 text-sm leading-6 text-[#A29DBE] max-w-md mx-auto">{message}</p>
    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
      <button type="button" onClick={onVerifyAnother} className="nx-btn-primary py-3.5 font-black">Verify Another Ticket</button>
      <button type="button" onClick={onClose} className="rounded-xl border border-white/10 bg-white/[0.03] py-3.5 font-black text-[#E7E3F2]">Close</button>
    </div>
  </motion.div>;
}

function WinnerModal({ ticket, onVerifyAnother, onClose }) {
  const verifyCode = ticket?.verify_code || ticket?.booking_code || ticket?.ticket_id || ticket?.id || "—";
  const ticketId = ticket?.ticket_id || ticket?.id || "—";
  const verifiedAt = ticket?.verification_timestamp || ticket?.settled_at || ticket?.created_at;
  const timestamp = verifiedAt ? new Date(verifiedAt).toLocaleString() : "—";
  const receiptText = [
    "NexusBet — Winning Ticket Receipt",
    `Ticket ID: ${ticketId}`,
    `Verify Code: ${verifyCode}`,
    `Stake: ${money(ticket?.stake)}`,
    `Odds: ${Number(ticket?.total_odds || 0).toFixed(2)}`,
    `Total Payout: ${money(ticket?.payout)}`,
    `Verified: ${timestamp}`,
  ].join("\n");

  const copyReceipt = async () => {
    try {
      await navigator.clipboard.writeText(receiptText);
      toast.success("Winning receipt copied");
    } catch {
      toast.error("Could not copy the receipt");
    }
  };

  return <motion.div className="fixed inset-0 z-[160] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto" role="dialog" aria-modal="true" aria-label="Congratulations winning ticket">
    <Confetti />
    <motion.div initial={{ opacity: 0, scale: 0.88, y: 25 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 180, damping: 18 }} className="relative w-full max-w-3xl overflow-hidden rounded-[30px] border border-[#FFD700]/45 bg-[#08070b] shadow-[0_0_90px_rgba(255,215,0,0.25)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,215,0,0.2),transparent_42%)] pointer-events-none" />
      <button type="button" onClick={onClose} className="absolute right-4 top-4 z-20 p-2 rounded-full bg-black/50 border border-white/10 text-white/70 hover:text-white" aria-label="Close"><X size={22} /></button>
      <div className="relative px-4 pt-7 sm:px-8 sm:pt-9 text-center">
        <div className="text-[10px] sm:text-xs font-black uppercase tracking-[0.28em] text-[#FFD700]">NexusBet Winner</div>
        <h2 className="mt-2 text-3xl sm:text-5xl font-black tracking-tight">Congratulations! Ticket Verified</h2>
        <p className="mt-2 text-sm text-[#A29DBE]">Your ticket has been verified as a winning ticket.</p>
      </div>

      <div className="relative mx-auto mt-3 w-[min(330px,82vw)] aspect-square overflow-hidden rounded-2xl">
        <img src={CUP_IMAGE} alt="NexusBet Congratulations Cup" className="w-full h-full object-contain mix-blend-screen" />
        <div className="absolute left-[18%] right-[18%] bottom-[8%] rounded-xl border border-[#FFD700]/55 bg-black/75 backdrop-blur px-3 py-2 shadow-[0_0_24px_rgba(255,215,0,0.3)]">
          <div className="text-[9px] uppercase tracking-[0.2em] text-[#C9C1A4]">Verify Code</div>
          <div className="mt-1 font-mono text-sm sm:text-base font-black tracking-widest text-[#FFD700] break-all">{verifyCode}</div>
        </div>
      </div>

      <div className="relative mx-4 sm:mx-8 mb-5 rounded-2xl border border-[#FFD700]/25 bg-[#FFD700]/[0.06] overflow-hidden">
        <div className="grid grid-cols-2 sm:grid-cols-3">
          <Detail label="Ticket ID" value={ticketId} mono />
          <Detail label="Stake" value={money(ticket?.stake)} />
          <Detail label="Odds" value={Number(ticket?.total_odds || 0).toFixed(2)} />
          <Detail label="Total Payout" value={money(ticket?.payout)} green />
          <Detail label="Status" value="WON" gold />
          <Detail label="Verified" value={timestamp} small />
        </div>
      </div>

      <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-3 px-4 sm:px-8 pb-7">
        <button type="button" onClick={copyReceipt} className="rounded-xl border border-[#FFD700]/40 bg-[#FFD700]/10 py-3.5 font-black text-[#FFD700] hover:bg-[#FFD700]/15"><Copy size={16} className="inline mr-2" />Copy Winning Receipt</button>
        <button type="button" onClick={onVerifyAnother} className="nx-btn-primary py-3.5 font-black">Verify Another Ticket</button>
      </div>
    </motion.div>
  </motion.div>;
}

function Detail({ label, value, mono, green, gold, small }) {
  return <div className="p-3 sm:p-4 border-b border-r border-white/10 min-w-0">
    <div className="text-[9px] uppercase tracking-wider text-[#77718D]">{label}</div>
    <div className={`mt-1 font-bold truncate ${small ? "text-[11px]" : "text-sm sm:text-base"} ${mono ? "font-mono text-[#F0EEF9]" : ""} ${green ? "text-[#00FF87] text-lg sm:text-xl" : ""} ${gold ? "text-[#FFD700]" : ""}`}>{value}</div>
  </div>;
}

export default function TicketVerificationModal({ open, onClose, initialWinner = null }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (open) {
      setCode("");
      setResult(initialWinner ? { status: "Won", ticket: initialWinner } : null);
    }
  }, [open, initialWinner]);

  if (!open) return null;

  const verify = async (event) => {
    event?.preventDefault();
    const value = code.trim();
    if (!value) return toast.error("Enter a Ticket ID or Verify Code");
    if (value.length < 4) return toast.error("Enter a valid Ticket ID or Verify Code");
    setLoading(true);
    setResult(null);
    try {
      const response = await api.post("/tickets/verify", { identifier: value });
      setResult(response.data.verification || { status: response.data.ticket?.status, ticket: response.data.ticket });
    } catch (error) {
      setResult({ status: "Invalid", message: formatApiErrorDetail(error?.response?.data?.detail) || "We could not find a ticket with that code." });
    } finally {
      setLoading(false);
    }
  };

  const verifyAnother = () => {
    setResult(null);
    setCode("");
  };

  const status = result?.status;
  if (status === "Won") return <WinnerModal ticket={result.ticket} onVerifyAnother={verifyAnother} onClose={onClose} />;

  return <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Verify Ticket">
    <motion.div initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="relative w-full max-w-xl nx-card border border-[#00E5FF]/30 shadow-2xl overflow-hidden">
      <div className="flex items-start justify-between gap-4 p-5 sm:p-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-[#00E5FF]"><TicketCheck size={15} /> Verify Ticket</div>
          <h2 className="mt-2 text-2xl sm:text-3xl font-black">Check your ticket result</h2>
          <p className="mt-2 text-sm leading-6 text-[#A29DBE]">Verify Ticket: Enter your unique Verify Code below to validate your bet slip and check for winning payouts.</p>
        </div>
        <button type="button" onClick={onClose} className="p-2 rounded-full bg-white/5 text-[#A29DBE] hover:text-white" aria-label="Close"><X size={22} /></button>
      </div>

      <div className="p-5 sm:p-6">
        <form onSubmit={verify}>
          <label htmlFor="nexus-verify-code" className="text-xs font-black uppercase tracking-wider text-[#A29DBE]">Ticket ID / Verify Code</label>
          <div className="mt-2 flex flex-col sm:flex-row gap-2">
            <input id="nexus-verify-code" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} autoFocus className="flex-1 rounded-xl bg-black/25 border border-white/10 focus:border-[#00E5FF] outline-none px-4 py-3.5 text-sm font-mono tracking-wide" placeholder="Enter Ticket ID or Verify Code..." autoComplete="off" />
            <button type="submit" disabled={loading} className="nx-btn-primary px-5 py-3.5 font-black flex items-center justify-center gap-2 min-w-[145px]">{loading ? <Loader2 size={17} className="animate-spin" /> : <Search size={17} />} {loading ? "Checking..." : "Verify Now"}</button>
          </div>
        </form>

        {!result && <div className="mt-5 rounded-2xl border border-[#00E5FF]/15 bg-[#00E5FF]/[0.04] p-4 text-sm text-[#A29DBE] flex gap-3"><ShieldCheck size={20} className="text-[#00E5FF] shrink-0" /><span>Use the Ticket ID or Verify Code shown on your NexusBet slip. Winning tickets will open the Congratulations Cup automatically.</span></div>}

        {result && <ResultState status={status} message={result.message || (status === "Pending" ? "This ticket has not reached a final result yet. Check again after all selections are settled." : "This ticket did not win. You can verify another ticket at any time.")} onVerifyAnother={verifyAnother} onClose={onClose} />}
      </div>
    </motion.div>
  </div>;
}
