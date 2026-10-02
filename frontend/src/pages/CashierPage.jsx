import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, Gift, History, X } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiErrorDetail } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const fmt = (v) => `₵${Number(v || 0).toFixed(2)}`;
const METHODS = [
  { id: "mtn", label: "MTN MoMo", image: "/payment-methods/mtn-momo.png" },
  { id: "telecel", label: "Telecel Cash", image: "/payment-methods/telecel-cash.png" },
  { id: "airteltigo", label: "AirtelTigo Money", image: "/payment-methods/airteltigo-money.png" },
  { id: "bank", label: "Bank Transfer", image: "/payment-methods/ghipss.png" },
];

export default function CashierPage() {
  const { user, setBalance, reload } = useAuth();
  const [status, setStatus] = useState(null);
  const [txns, setTxns] = useState([]);
  const [method, setMethod] = useState("mtn");
  const [depAmt, setDepAmt] = useState("");
  const [depPhone, setDepPhone] = useState("");
  const [wdAmt, setWdAmt] = useState("");
  const [wdPhone, setWdPhone] = useState("");
  const [destination, setDestination] = useState("");
  const [busy, setBusy] = useState(false);
  const [withdrawRequirementError, setWithdrawRequirementError] = useState("");
  const [withdrawReceipt, setWithdrawReceipt] = useState(null);
  const canViewWithdrawalReceipt = ["super_admin", "admin", "sub_admin"].includes(user?.role);

  const load = useCallback(async () => {
    try {
      const [s, t] = await Promise.all([api.get("/wallet/status"), api.get("/wallet/transactions")]);
      setStatus(s.data);
      setTxns(t.data || []);
    } catch (e) {
      toast.error(formatApiErrorDetail(e?.response?.data?.detail) || "Unable to load wallet");
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 4000);
    return () => clearInterval(timer);
  }, [load]);

  const bonusAvailable = Boolean(status?.first_deposit_bonus_available);
  const bonusCap = Number(status?.first_deposit_bonus_cap || 100);
  const depositAmount = Number(depAmt || 0);
  const previewBonus = bonusAvailable && depositAmount >= Number(status?.min_deposit || 300)
    ? Math.min(depositAmount, bonusCap)
    : 0;
  const previewTotal = depositAmount + previewBonus;
  const selectedMethod = useMemo(() => METHODS.find((x) => x.id === method) || METHODS[0], [method]);

  const deposit = async () => {
    const amount = Number(depAmt);
    if (!Number.isFinite(amount) || amount < Number(status?.min_deposit || 300)) {
      return toast.error(`Minimum deposit is ${fmt(status?.min_deposit || 300)}`);
    }
    if (!depPhone.trim()) return toast.error("Enter the deposit phone number");
    setBusy(true);
    try {
      const r = await api.post("/wallet/deposit", { amount, method, phone_number: depPhone.trim() });
      setBalance(r.data.balance);
      if (r.data.first_deposit_bonus) {
        toast.success(`Deposit successful — ${fmt(r.data.bonus_amount)} first-deposit bonus added!`);
      } else {
        toast.success("Deposit credited successfully");
      }
      setDepAmt("");
      await Promise.all([load(), reload()]);
    } catch (e) {
      toast.error(formatApiErrorDetail(e?.response?.data?.detail) || "Deposit failed");
    } finally {
      setBusy(false);
    }
  };

  const withdraw = async () => {
    setWithdrawRequirementError("");
    const amount = Number(wdAmt);
    if (amount < Number(status?.min_withdrawal || 3000)) return toast.error(`Minimum withdrawal is ${fmt(status?.min_withdrawal || 3000)}`);
    if (!wdPhone.trim()) return toast.error("Enter the withdrawal phone number");
    if (!destination.trim()) return toast.error("Enter payout destination");
    if (Number(status?.deposits_remaining || 0) > 0) {
      setWithdrawRequirementError("MAKE 3 MORE DEPOSIT BEFORE YOU CAN WITHDRAW YOUR WINNINGS");
      return;
    }
    if (amount > Number(status?.available_balance || 0)) return toast.error("Insufficient available balance");
    setBusy(true);
    try {
      const r = await api.post("/wallet/withdraw", { amount, method, phone_number: wdPhone.trim(), destination: destination.trim() });
      setBalance(r.data.balance);
      setWithdrawReceipt({ amount: Number(r.data.withdrawn || amount), balance: Number(r.data.balance || 0), reference: r.data.reference || "NexusBet", status: r.data.status || "pending" });
      toast.success("Withdrawal request submitted");
      setWdAmt(""); setWdPhone(""); setDestination("");
      await Promise.all([load(), reload()]);
    } catch (e) {
      const detail = formatApiErrorDetail(e?.response?.data?.detail) || "Withdrawal failed";
      if (String(detail).toLowerCase().includes("3 more deposits")) {
        setWithdrawRequirementError("MAKE 3 MORE DEPOSIT BEFORE YOU CAN WITHDRAW YOUR WINNINGS");
      } else {
        toast.error(detail);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-black">Wallet / Deposit</h1>
        <p className="text-sm text-[#A29DBE] mt-1">Deposit directly into your wallet or request a withdrawal.</p>
      </div>

      {bonusAvailable && (
        <div className="nx-card mb-5 overflow-hidden border border-[#FFD700]/30 bg-gradient-to-r from-[#2c2454] to-[#1b1740]">
          <div className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-[#FFD700]/15 flex items-center justify-center"><Gift className="text-[#FFD700]" size={23} /></div>
              <div>
                <div className="text-[#FFD700] font-black tracking-wide">FIRST DEPOSIT BONUS</div>
                <div className="text-sm text-white/80">Get 100% extra on your first deposit, up to {fmt(bonusCap)}.</div>
              </div>
            </div>
            <div className="text-left md:text-right"><div className="text-xs text-[#A29DBE]">FREE BONUS</div><div className="text-2xl font-black text-[#00FF87]">+{fmt(bonusCap)}</div></div>
          </div>
        </div>
      )}


      {canViewWithdrawalReceipt && withdrawReceipt && (
        <div className="fixed inset-0 z-[140] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Withdrawal receipt">
          <div className="w-full max-w-md nx-card border border-[#00E5FF]/30 p-5 shadow-2xl">
            <div className="flex items-center justify-between"><div><div className="text-xs uppercase tracking-wider font-black text-[#00E5FF]">Withdrawal receipt</div><h2 className="text-xl font-black mt-1">Withdrawal submitted</h2></div><button type="button" onClick={() => setWithdrawReceipt(null)} className="p-2 rounded-lg bg-white/5 text-[#A29DBE]"><X size={18}/></button></div>
            <div className="mt-5 rounded-xl bg-[#221c46] p-4 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-[#A29DBE]">Amount requested</span><b>{fmt(withdrawReceipt.amount)}</b></div>
              <div className="flex justify-between"><span className="text-[#A29DBE]">Current balance</span><b>{fmt(withdrawReceipt.balance)}</b></div>
              <div className="flex justify-between"><span className="text-[#A29DBE]">Available balance</span><b>{fmt(withdrawReceipt.balance)}</b></div>
              <div className="flex justify-between"><span className="text-[#A29DBE]">Reference</span><b>{withdrawReceipt.reference}</b></div>
              <div className="flex justify-between"><span className="text-[#A29DBE]">Status</span><b className="text-[#FFD700] uppercase">{withdrawReceipt.status}</b></div>
            </div>
            <p className="text-xs text-[#6E688D] mt-3">This receipt confirms the withdrawal request. It does not represent a payment received or add funds to the wallet.</p>
          </div>
        </div>
      )}

      <div className="nx-card p-5 mb-5 flex flex-wrap justify-between gap-4">
        <div><span className="text-xs text-[#A29DBE]">Wallet balance</span><div className="text-3xl font-black text-[#FFD700]">{fmt(status?.balance)}</div></div>
        <div className="text-sm text-[#A29DBE]">Minimum deposit {fmt(status?.min_deposit)}<br />Minimum withdrawal {fmt(status?.min_withdrawal)}</div>
      </div>

      <div className="mb-5 grid grid-cols-2 md:grid-cols-4 gap-3">
        {METHODS.map((m) => (
          <button key={m.id} onClick={() => setMethod(m.id)} className={`rounded-2xl px-3 py-3 border transition-all text-left ${method === m.id ? "bg-[#00E5FF] text-black border-[#00E5FF] shadow-[0_0_20px_rgba(0,229,255,.18)]" : "bg-[#221c46] border-white/10 hover:border-[#00E5FF]/40"}`}>
            <div className="h-12 rounded-xl bg-white flex items-center justify-center overflow-hidden mb-2"><img src={m.image} alt={m.label} className="max-h-10 max-w-[88%] object-contain" /></div>
            <div className="text-sm font-bold truncate">{m.label}</div>
          </button>
        ))}
      </div>

      <div className="nx-card mb-5 p-3 flex items-center gap-3">
        <div className="h-12 w-16 rounded-lg bg-white flex items-center justify-center overflow-hidden shrink-0"><img src={selectedMethod.image} alt={selectedMethod.label} className="max-h-9 max-w-[90%] object-contain" /></div>
        <div><div className="text-xs text-[#A29DBE]">Selected deposit method</div><div className="font-black">{selectedMethod.label}</div></div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="nx-card p-5">
          <h2 className="font-black flex gap-2 items-center"><ArrowDownToLine className="text-[#00FF87" /> Deposit</h2>
          <label className="text-xs text-[#A29DBE] block mt-4">Amount</label>
          <input type="number" value={depAmt} onChange={(e) => setDepAmt(e.target.value)} className="mt-1 w-full rounded-xl bg-[#221c46] border border-white/10 px-3 py-3" placeholder="300 or more" />
          {bonusAvailable && depositAmount >= Number(status?.min_deposit || 300) && (
            <div className="mt-3 rounded-xl bg-[#00FF87]/10 border border-[#00FF87]/20 p-3 text-sm">
              <div className="flex justify-between"><span>Deposit</span><b>{fmt(depositAmount)}</b></div>
              <div className="flex justify-between text-[#00FF87] mt-1"><span>First deposit bonus</span><b>+{fmt(previewBonus)}</b></div>
              <div className="border-t border-white/10 mt-2 pt-2 flex justify-between font-black"><span>Total wallet credit</span><b>{fmt(previewTotal)}</b></div>
            </div>
          )}
          <label className="text-xs text-[#A29DBE] block mt-3">Phone number</label>
          <input value={depPhone} onChange={(e) => setDepPhone(e.target.value)} className="mt-1 w-full rounded-xl bg-[#221c46] border border-white/10 px-3 py-3" placeholder="0240000000" />
          <p className="text-[11px] text-[#6E688D] mt-2">Network: {selectedMethod.label}</p>
          <button disabled={busy} onClick={deposit} className="nx-btn-primary w-full mt-4 py-3">Deposit</button>
        </div>

        <div className="nx-card p-5">
          <h2 className="font-black flex gap-2 items-center"><ArrowUpFromLine className="text-[#00E5FF" /> Withdraw</h2>
          {withdrawRequirementError && (
            <div role="alert" className="mt-3 rounded-xl border border-[#FF3366]/40 bg-[#FF3366]/10 px-3 py-2.5 text-sm font-black uppercase text-[#FF3366]">
              {withdrawRequirementError}
            </div>
          )}
          <label className="text-xs text-[#A29DBE] block mt-4">Amount</label>
          <input type="number" value={wdAmt} onChange={(e) => { setWdAmt(e.target.value); setWithdrawRequirementError(""); }} className="mt-1 w-full rounded-xl bg-[#221c46] border border-white/10 px-3 py-3" placeholder="3000 or more" />
          <label className="text-xs text-[#A29DBE] block mt-3">Phone number</label>
          <input value={wdPhone} onChange={(e) => { setWdPhone(e.target.value); setWithdrawRequirementError(""); }} className="mt-1 w-full rounded-xl bg-[#221c46] border border-white/10 px-3 py-3" placeholder="0240000000" />
          <label className="text-xs text-[#A29DBE] block mt-3">Destination / account</label>
          <input value={destination} onChange={(e) => { setDestination(e.target.value); setWithdrawRequirementError(""); }} className="mt-1 w-full rounded-xl bg-[#221c46] border border-white/10 px-3 py-3" placeholder="MoMo number or bank account" />
          <p className="text-[11px] text-[#6E688D] mt-2">Network: {selectedMethod.label}</p>
          <button disabled={busy} onClick={withdraw} className="nx-btn-primary w-full mt-4 py-3">Withdraw</button>
        </div>

        <div className="nx-card p-5">
          <h2 className="font-black flex gap-2 items-center"><History /> History</h2>
          <div className="mt-3 space-y-2 max-h-96 overflow-auto">
            {txns.map((t) => (
              <div key={t.id} className="rounded-xl bg-[#221c46] p-3 text-xs">
                <div className="flex justify-between"><b className={t.type === "deposit" ? "text-[#00FF87]" : t.type === "first_deposit_bonus" ? "text-[#FFD700]" : "text-[#00E5FF]"}>{t.type === "first_deposit_bonus" ? "FIRST DEPOSIT BONUS" : t.type}</b><b>{fmt(t.amount)}</b></div>
                <div className="text-[#A29DBE] mt-1">{t.method} · {t.status}</div>
                <div className="text-[#6E688D]">{t.reference}</div>
              </div>
            ))}
            {!txns.length && <p className="text-sm text-[#6E688D]">No transactions yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
