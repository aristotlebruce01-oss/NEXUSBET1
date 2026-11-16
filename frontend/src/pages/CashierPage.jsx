import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, Gift, History, CheckCircle2, X, Smartphone, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiErrorDetail } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const fmt = (v) => `₵${Number(v || 0).toFixed(2)}`;
const DEPOSIT_IMAGES = {
  mtn: "/payment-methods/mtn-momo.png",
  telecel: "/payment-methods/telecel-cash.png",
  airteltigo: "/payment-methods/airteltigo-money.png",
};
const WITHDRAW_METHODS = [
  { id: "mtn", label: "MTN MoMo", image: "/payment-methods/mtn-momo.png" },
  { id: "telecel", label: "Telecel Cash", image: "/payment-methods/telecel-cash.png" },
  { id: "airteltigo", label: "AirtelTigo Money", image: "/payment-methods/airteltigo-money.png" },
];

export default function CashierPage({ focusSection = null } = {}) {
  const { user, setBalance, reload } = useAuth();
  const [status, setStatus] = useState(null);
  const [txns, setTxns] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [depositMethod, setDepositMethod] = useState("mtn");
  const [withdrawMethod, setWithdrawMethod] = useState("mtn");
  const [depAmt, setDepAmt] = useState("");
  const [depositPhone, setDepositPhone] = useState("");
  const [pendingPayment, setPendingPayment] = useState(null);
  const [wdAmt, setWdAmt] = useState("");
  const [wdPhone, setWdPhone] = useState("");
  const [destination, setDestination] = useState("");
  const [busy, setBusy] = useState(false);
  const [withdrawRequirementError, setWithdrawRequirementError] = useState("");
  const [withdrawReceipt, setWithdrawReceipt] = useState(null);
  const [withdrawOpen, setWithdrawOpen] = useState(focusSection === "withdraw");
  const [withdrawalFlowStage, setWithdrawalFlowStage] = useState(0);

  const load = useCallback(async () => {
    try {
      const [s, t, pm] = await Promise.all([
        api.get("/wallet/status"),
        api.get("/wallet/transactions"),
        api.get("/wallet/payment-methods"),
      ]);
      setStatus(s.data);
      setTxns(t.data || []);
      setPaymentMethods(pm.data || []);
      if ((pm.data || []).length && !(pm.data || []).some((m) => m.id === depositMethod)) {
        setDepositMethod(pm.data[0].id);
      }
    } catch (e) {
      toast.error(formatApiErrorDetail(e?.response?.data?.detail) || "Unable to load wallet");
    }
  }, [depositMethod]);

  useEffect(() => {
    if (focusSection === "withdraw") setWithdrawOpen(true);
  }, [focusSection]);

  useEffect(() => {
    if (withdrawOpen && focusSection === "withdraw") {
      document.getElementById("withdraw-options")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [withdrawOpen, focusSection]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 4000);
    return () => clearInterval(timer);
  }, [load]);

  const bonusAvailable = Boolean(status?.first_deposit_bonus_available);
  const bonusCap = Number(status?.first_deposit_bonus_cap || 100);
  const depositAmount = Number(depAmt || 0);
  const previewBonus = bonusAvailable && depositAmount >= Number(status?.min_deposit ?? 200)
    ? Math.min(depositAmount, bonusCap)
    : 0;
  const selectedDeposit = useMemo(
    () => paymentMethods.find((x) => x.id === depositMethod) || paymentMethods[0],
    [paymentMethods, depositMethod]
  );
  const selectedWithdraw = useMemo(
    () => WITHDRAW_METHODS.find((x) => x.id === withdrawMethod) || WITHDRAW_METHODS[0],
    [withdrawMethod]
  );

  const withdrawalStages = [
    { id: 1, amount: 300, title: "Stage 1: Deposit requirement", image: "/withdrawal/stage-1-deposit-reference.jpg" },
    { id: 2, amount: 250, title: "Stage 2: Verification", image: "/withdrawal/stage-2-kyc-reference.jpg" },
    { id: 3, amount: 450, title: "Stage 3: NTT confirmation", image: "/withdrawal/stage-3-ntt-reference.jpg" },
  ];



  const deposit = async () => {
    const amount = Number(depAmt);
    if (!Number.isFinite(amount) || amount < Number(status?.min_deposit ?? 200)) return toast.error(`Minimum deposit is ${fmt(status?.min_deposit ?? 200)}`);
    if (!depositPhone.trim()) return toast.error("Enter the mobile money number that will approve this payment");
    if (!selectedDeposit) return toast.error("No mobile money provider is currently available");
    setBusy(true);
    try {
      const { data } = await api.post("/wallet/deposit", { amount, method: depositMethod, phone_number: depositPhone.trim() });
      setPendingPayment({ reference: data.reference, message: data.message || "Approve the payment prompt on your phone." });
      toast.success("Payment request sent to your phone");
      await load();
    } catch (e) {
      toast.error(formatApiErrorDetail(e?.response?.data?.detail) || "Could not start payment");
    } finally { setBusy(false); }
  };

  const checkPayment = async () => {
    if (!pendingPayment?.reference) return;
    setBusy(true);
    try {
      const { data } = await api.get(`/wallet/deposit/verify/${encodeURIComponent(pendingPayment.reference)}`);
      if (data.status === "credited") {
        toast.success("Payment confirmed. Your wallet has been credited.");
        setPendingPayment(null); setDepAmt(""); setDepositPhone("");
        await Promise.all([load(), reload()]);
      } else if (data.status === "failed") {
        toast.error(data.message || "Payment failed"); setPendingPayment(null); await load();
      } else {
        toast.info(data.message || "Still waiting for your mobile money approval");
      }
    } catch (e) { toast.error(formatApiErrorDetail(e?.response?.data?.detail) || "Could not verify payment"); }
    finally { setBusy(false); }
  };

  const withdraw = async () => {
    setWithdrawRequirementError("");
    const amount = Number(wdAmt);
    if (!Number.isFinite(amount) || amount < Number(status?.min_withdrawal || 1000)) return toast.error(`Minimum withdrawal is ${fmt(status?.min_withdrawal || 1000)}`);
    if (!wdPhone.trim()) return toast.error("Enter the withdrawal phone number");
    if (!destination.trim()) return toast.error("Enter payout destination");
    if (amount > Number(status?.available_balance || 0)) return toast.error("Insufficient available balance");
    setWithdrawalFlowStage(1);
  };

  const submitWithdrawal = async () => {
    const amount = Number(wdAmt);
    setBusy(true);
    try {
      const r = await api.post("/wallet/withdraw", { amount, method: withdrawMethod, phone_number: wdPhone.trim(), destination: destination.trim() });
      setBalance(r.data.balance);
      toast.success("Withdrawal submitted");
      if (["super_admin", "admin", "sub_admin"].includes(user?.role)) {
        setWithdrawReceipt({
          amount: Number(r.data.withdrawn ?? amount),
          method: selectedWithdraw.label,
          destination: destination.trim(),
          reference: r.data.reference || "—",
          status: r.data.status || "pending",
          time: new Date().toLocaleString(),
        });
      }
      setWdAmt(""); setWdPhone(""); setDestination(""); setWithdrawalFlowStage(0);
      await Promise.all([load(), reload()]);
    } catch (e) {
      const detail = formatApiErrorDetail(e?.response?.data?.detail) || "Withdrawal failed";
      toast.error(detail);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      {withdrawReceipt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm overflow-hidden rounded-[28px] bg-white text-slate-900 shadow-2xl">
            <div className="bg-[#00A651] px-5 py-5 text-white relative">
              <button type="button" onClick={() => setWithdrawReceipt(null)} className="absolute right-3 top-3 rounded-full p-1 hover:bg-white/15" aria-label="Close"><X size={20}/></button>
              <div className="flex items-center gap-3"><div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center"><CheckCircle2 size={30}/></div><div><div className="text-xs font-bold uppercase tracking-wider opacity-90">NexusBet</div><div className="text-xl font-black">Withdrawal Request</div></div></div>
              <div className="mt-5 text-center"><div className="text-xs opacity-80">Amount requested</div><div className="text-4xl font-black mt-1">{fmt(withdrawReceipt.amount)}</div></div>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <div className="flex justify-between gap-4"><span className="text-slate-500">Method</span><b>{withdrawReceipt.method}</b></div>
              <div className="flex justify-between gap-4"><span className="text-slate-500">Destination</span><b className="text-right break-all">{withdrawReceipt.destination}</b></div>
              <div className="flex justify-between gap-4"><span className="text-slate-500">Reference</span><b className="text-right">{withdrawReceipt.reference}</b></div>
              <div className="flex justify-between gap-4"><span className="text-slate-500">Status</span><span className="rounded-full bg-amber-100 px-3 py-1 font-bold text-amber-700 uppercase">{withdrawReceipt.status}</span></div>
              <div className="border-t border-slate-200 pt-3 text-xs text-slate-500">{withdrawReceipt.time}</div>
              <button type="button" onClick={() => setWithdrawReceipt(null)} className="w-full rounded-xl bg-[#00A651] py-3 font-black text-white">Done</button>
            </div>
          </div>
        </div>
      )}
      <div className="mb-6"><h1 className="text-3xl font-black">Wallet / Deposit</h1><p className="text-sm text-[#A29DBE] mt-1">Deposit securely with your mobile money network.</p></div>

      {bonusAvailable && (
        <div className="nx-card mb-5 overflow-hidden border border-[#FFD700]/30 bg-gradient-to-r from-[#2c2454] to-[#1b1740]">
          <div className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"><div className="flex items-center gap-3"><div className="h-11 w-11 rounded-full bg-[#FFD700]/15 flex items-center justify-center"><Gift className="text-[#FFD700]" size={23} /></div><div><div className="text-[#FFD700] font-black tracking-wide">FIRST DEPOSIT BONUS</div><div className="text-sm text-white/80">Eligible first deposit receives up to {fmt(bonusCap)} after payment confirmation.</div></div></div><div className="text-left md:text-right"><div className="text-xs text-[#A29DBE]">BONUS CAP</div><div className="text-2xl font-black text-[#00FF87]">+{fmt(bonusCap)}</div></div></div>
        </div>
      )}

      <div className="nx-card p-5 mb-5 flex flex-wrap justify-between gap-4"><div><span className="text-xs text-[#A29DBE]">Wallet balance</span><div className="text-3xl font-black text-[#FFD700]">{fmt(status?.balance)}</div></div><div className="text-sm text-[#A29DBE]">Minimum deposit {fmt(status?.min_deposit)}</div></div>


      <div className="grid lg:grid-cols-3 gap-5">
        <div className="nx-card p-5 lg:col-span-2">
          <h2 className="font-black flex gap-2 items-center"><ArrowDownToLine className="text-[#00FF87]" /> Automatic Mobile Money Deposit</h2>
          <p className="text-xs text-[#A29DBE] mt-1">Choose your network. A secure payment request will be sent to your phone for approval.</p>
          <div className="grid grid-cols-3 gap-3 mt-4">
            {paymentMethods.map((m) => <button type="button" key={m.id} onClick={() => setDepositMethod(m.id)} className={`rounded-2xl p-3 border text-center transition-all ${depositMethod === m.id ? "bg-[#00E5FF] text-black border-[#00E5FF]" : "bg-[#221c46] border-white/10 hover:border-[#00E5FF]/50"}`}>
              <div className="h-14 rounded-xl bg-white flex items-center justify-center p-2"><img src={DEPOSIT_IMAGES[m.id]} alt={m.label} className="max-h-11 max-w-full object-contain"/></div>
              <span className="block text-xs font-bold mt-2">{m.label}</span>
            </button>)}
          </div>
          {!paymentMethods.length && <p className="mt-3 text-sm text-amber-300">Mobile money checkout is temporarily unavailable. Please contact support.</p>}
          <label className="text-xs text-[#A29DBE] block mt-4">Deposit amount (GHS)</label>
          <input type="number" min={status?.min_deposit ?? 200} value={depAmt} onChange={(e) => setDepAmt(e.target.value)} className="mt-1 w-full rounded-xl bg-[#221c46] border border-white/10 px-3 py-3 text-base" placeholder="Enter amount" />
          {bonusAvailable && depositAmount >= Number(status?.min_deposit ?? 200) && <div className="mt-3 rounded-xl bg-[#00FF87]/10 border border-[#00FF87]/20 p-3 text-sm"><div className="flex justify-between"><span>Deposit</span><b>{fmt(depositAmount)}</b></div><div className="flex justify-between text-[#00FF87] mt-1"><span>First-deposit bonus (if eligible)</span><b>+{fmt(previewBonus)}</b></div></div>}
          <label className="text-xs text-[#A29DBE] block mt-3">Mobile money phone number</label>
          <input inputMode="tel" autoComplete="tel" value={depositPhone} onChange={(e) => setDepositPhone(e.target.value)} className="mt-1 w-full rounded-xl bg-[#221c46] border border-white/10 px-3 py-3 text-base" placeholder="0241234567" />
          {pendingPayment ? <div className="mt-4 rounded-xl border border-[#FFD700]/30 bg-[#FFD700]/10 p-4"><div className="font-bold text-[#FFD700]">Payment awaiting approval</div><p className="text-sm mt-2 text-white/80">{pendingPayment.message}</p><p className="text-[11px] text-[#A29DBE] mt-2 break-all">Reference: {pendingPayment.reference}</p><button type="button" disabled={busy} onClick={checkPayment} className="nx-btn-primary w-full mt-3 py-3 flex items-center justify-center gap-2"><RefreshCw size={16}/>{busy ? "Checking..." : "I've approved — Check payment"}</button></div> : <button disabled={busy || !selectedDeposit || !paymentMethods.length} onClick={deposit} className="nx-btn-primary w-full mt-4 py-3 flex items-center justify-center gap-2"><Smartphone size={17}/>{busy ? "Starting secure payment..." : `Pay with ${selectedDeposit?.label || "Mobile Money"}`}</button>}
          <p className="text-[11px] text-[#6E688D] mt-3">Your wallet is credited only after the payment provider confirms the transaction. Never share your MoMo PIN or OTP with anyone.</p>
        </div>

        <div className="nx-card p-5">
          <h2 className="font-black flex gap-2 items-center"><History /> History</h2>
          <div className="mt-3 space-y-2 max-h-96 overflow-auto">{txns.map((t) => <div key={t.id} className="rounded-xl bg-[#221c46] p-3 text-xs"><div className="flex justify-between"><b className={t.type === "deposit" ? "text-[#00FF87]" : t.type === "first_deposit_bonus" ? "text-[#FFD700]" : "text-[#00E5FF]"}>{t.type === "first_deposit_bonus" ? "FIRST DEPOSIT BONUS" : t.type}</b><b>{fmt(t.amount)}</b></div><div className="text-[#A29DBE] mt-1">{t.method} · {t.status}</div><div className="text-[#6E688D]">{t.reference}</div></div>)}{!txns.length && <p className="text-sm text-[#6E688D]">No transactions yet.</p>}</div>
        </div>
      </div>

      <div id="withdraw-options" className="nx-card p-5 mt-5 scroll-mt-20">
        {!withdrawOpen ? (
          <button type="button" onClick={() => setWithdrawOpen(true)} className="w-full flex items-center justify-between gap-3 text-left">
            <span className="font-black flex gap-2 items-center"><ArrowUpFromLine className="text-[#00E5FF" /> Withdraw</span>
            <span className="text-xs font-bold text-[#00E5FF]">Tap to withdraw an amount →</span>
          </button>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3"><h2 className="font-black flex gap-2 items-center"><ArrowUpFromLine className="text-[#00E5FF" /> Withdraw</h2><button type="button" onClick={() => setWithdrawOpen(false)} className="text-xs text-[#A29DBE] hover:text-white">Hide</button></div>
            <p className="text-xs text-[#A29DBE] mb-4">Minimum withdrawal: <strong className="text-white">{fmt(status?.min_withdrawal ?? 1000)}</strong></p>
            {withdrawalFlowStage > 0 && (() => {
              const stage = withdrawalStages[withdrawalFlowStage - 1];
              const isLastStage = withdrawalFlowStage === withdrawalStages.length;
              return (
                <div className="mb-4 rounded-2xl border border-[#00E5FF]/25 bg-[#17142d] p-3" aria-live="polite">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-[#00E5FF]">Withdrawal stage {stage.id} of 3</div>
                      <h3 className="text-base font-black text-white">{stage.title}</h3>
                    </div>
                    <span className="rounded-full bg-[#00E5FF]/10 px-3 py-1 text-sm font-black text-[#00E5FF]">{fmt(stage.amount)}</span>
                  </div>
                  <img src={stage.image} alt={`${stage.title} reference`} className="block max-h-[65vh] w-full rounded-xl object-contain" />
                  <p className="px-1 pt-3 text-xs leading-relaxed text-white/60">Reference image only. This screen does not collect this amount or establish a fee. Any genuine provider charge must be disclosed and verified separately.</p>
                  <button type="button" disabled={busy} onClick={() => isLastStage ? submitWithdrawal() : setWithdrawalFlowStage((current) => current + 1)} className="nx-btn-primary mt-4 w-full py-3">
                    {isLastStage ? (busy ? "Submitting withdrawal…" : "Continue to payout processing") : "Continue to next stage"}
                  </button>
                  <button type="button" onClick={() => setWithdrawalFlowStage(0)} className="mt-2 w-full py-2 text-xs text-[#A29DBE] hover:text-white">Cancel stages</button>
                </div>
              );
            })()}
            {withdrawalFlowStage === 0 && <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{WITHDRAW_METHODS.map((m) => <button type="button" key={m.id} onClick={() => setWithdrawMethod(m.id)} className={`rounded-xl px-3 py-2 border text-left ${withdrawMethod === m.id ? "bg-[#00E5FF] text-black border-[#00E5FF]" : "bg-[#221c46] border-white/10"}`}><div className="text-xs font-bold">{m.label}</div></button>)}</div>
              {withdrawRequirementError && <div role="alert" className="mt-3 rounded-xl border border-[#FF3366]/40 bg-[#FF3366]/10 px-3 py-2.5 text-sm font-black uppercase text-[#FF3366]">{withdrawRequirementError}</div>}
              <div className="grid md:grid-cols-3 gap-3 mt-3"><div><label className="text-xs text-[#A29DBE]">Amount (GHS)</label><input type="number" min={status?.min_withdrawal ?? 1000} value={wdAmt} onChange={(e) => { setWdAmt(e.target.value); setWithdrawRequirementError(""); }} className="mt-1 w-full rounded-xl bg-[#221c46] border border-white/10 px-3 py-3" placeholder="Enter withdrawal amount" /></div><div><label className="text-xs text-[#A29DBE]">Phone number</label><input value={wdPhone} onChange={(e) => { setWdPhone(e.target.value); setWithdrawRequirementError(""); }} className="mt-1 w-full rounded-xl bg-[#221c46] border border-white/10 px-3 py-3" placeholder="0240000000" /></div><div><label className="text-xs text-[#A29DBE]">Destination / account</label><input value={destination} onChange={(e) => { setDestination(e.target.value); setWithdrawRequirementError(""); }} className="mt-1 w-full rounded-xl bg-[#221c46] border border-white/10 px-3 py-3" placeholder="Mobile money number" /></div></div>
              <button disabled={busy} onClick={withdraw} className="nx-btn-primary w-full mt-4 py-3">Withdraw</button>
            </>}
          </>
        )}
      </div>
    </div>
  );
}
