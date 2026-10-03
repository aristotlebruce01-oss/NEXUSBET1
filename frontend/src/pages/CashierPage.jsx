import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, Gift, History, CheckCircle2, X, Copy, Upload } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiErrorDetail } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const fmt = (v) => `₵${Number(v || 0).toFixed(2)}`;
const DEPOSIT_IMAGES = {
  mtn_manual: "/payment-methods/mtn-momo.png",
  telecel_manual: "/payment-methods/telecel-cash.png",
  bank_transfer_manual: "/payment-methods/ghipss.png",
};
const WITHDRAW_METHODS = [
  { id: "mtn", label: "MTN MoMo", image: "/payment-methods/mtn-momo.png" },
  { id: "telecel", label: "Telecel Cash", image: "/payment-methods/telecel-cash.png" },
  { id: "airteltigo", label: "AirtelTigo Money", image: "/payment-methods/airteltigo-money.png" },
  { id: "bank", label: "Bank Transfer", image: "/payment-methods/ghipss.png" },
];

export default function CashierPage() {
  const { user, setBalance, reload } = useAuth();
  const [status, setStatus] = useState(null);
  const [txns, setTxns] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [depositMethod, setDepositMethod] = useState("mtn_manual");
  const [withdrawMethod, setWithdrawMethod] = useState("mtn");
  const [depAmt, setDepAmt] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [senderAccountName, setSenderAccountName] = useState("");
  const [transactionReference, setTransactionReference] = useState("");
  const [proofDataUrl, setProofDataUrl] = useState("");
  const [wdAmt, setWdAmt] = useState("");
  const [wdPhone, setWdPhone] = useState("");
  const [destination, setDestination] = useState("");
  const [busy, setBusy] = useState(false);
  const [withdrawRequirementError, setWithdrawRequirementError] = useState("");
  const [withdrawReceipt, setWithdrawReceipt] = useState(null);

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
  const selectedDeposit = useMemo(
    () => paymentMethods.find((x) => x.id === depositMethod) || paymentMethods[0],
    [paymentMethods, depositMethod]
  );
  const selectedWithdraw = useMemo(
    () => WITHDRAW_METHODS.find((x) => x.id === withdrawMethod) || WITHDRAW_METHODS[0],
    [withdrawMethod]
  );

  const copyText = async (value) => {
    try {
      await navigator.clipboard?.writeText(value);
      toast.success("Copied");
    } catch {
      toast.error("Could not copy");
    }
  };

  const handleProof = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Proof must be an image");
    if (file.size > 2 * 1024 * 1024) return toast.error("Proof image must be 2MB or smaller");
    const reader = new FileReader();
    reader.onload = () => setProofDataUrl(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const resetDepositForm = () => {
    setDepAmt("");
    setSenderName("");
    setSenderPhone("");
    setSenderAccountName("");
    setTransactionReference("");
    setProofDataUrl("");
  };

  const deposit = async () => {
    const amount = Number(depAmt);
    if (!Number.isFinite(amount) || amount < Number(status?.min_deposit || 300)) {
      return toast.error(`Minimum deposit is ${fmt(status?.min_deposit || 300)}`);
    }
    if (!selectedDeposit) return toast.error("No manual deposit method is available");
    if (!senderName.trim()) return toast.error("Enter the sender name");
    if (!senderPhone.trim()) return toast.error("Enter the sender phone number");
    if (selectedDeposit.id === "bank_transfer_manual" && !senderAccountName.trim()) {
      return toast.error("Enter the sender/account name");
    }
    if (!transactionReference.trim()) return toast.error("Enter the transaction/reference ID");
    setBusy(true);
    try {
      const r = await api.post("/wallet/deposit", {
        amount,
        method: depositMethod,
        sender_name: senderName.trim(),
        sender_phone: senderPhone.trim(),
        sender_account_name: senderAccountName.trim(),
        transaction_reference: transactionReference.trim(),
        proof_data_url: proofDataUrl || null,
      });
      toast.success("Deposit submitted. Waiting for Admin/Super Admin approval.");
      resetDepositForm();
      await load();
      await reload();
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
      <div className="mb-6"><h1 className="text-3xl font-black">Wallet / Deposit</h1><p className="text-sm text-[#A29DBE] mt-1">Manual deposits are reviewed before your wallet is credited.</p></div>

      {bonusAvailable && (
        <div className="nx-card mb-5 overflow-hidden border border-[#FFD700]/30 bg-gradient-to-r from-[#2c2454] to-[#1b1740]">
          <div className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"><div className="flex items-center gap-3"><div className="h-11 w-11 rounded-full bg-[#FFD700]/15 flex items-center justify-center"><Gift className="text-[#FFD700]" size={23} /></div><div><div className="text-[#FFD700] font-black tracking-wide">FIRST DEPOSIT BONUS</div><div className="text-sm text-white/80">Eligible first deposit receives up to {fmt(bonusCap)} after approval.</div></div></div><div className="text-left md:text-right"><div className="text-xs text-[#A29DBE]">BONUS CAP</div><div className="text-2xl font-black text-[#00FF87]">+{fmt(bonusCap)}</div></div></div>
        </div>
      )}

      <div className="nx-card p-5 mb-5 flex flex-wrap justify-between gap-4"><div><span className="text-xs text-[#A29DBE]">Wallet balance</span><div className="text-3xl font-black text-[#FFD700]">{fmt(status?.balance)}</div></div><div className="text-sm text-[#A29DBE]">Minimum deposit {fmt(status?.min_deposit)}<br />Minimum withdrawal {fmt(status?.min_withdrawal)}</div></div>

      <div className="mb-5">
        <div className="flex items-center justify-between mb-2"><h2 className="font-black">Deposit Methods</h2><span className="text-[10px] uppercase text-[#6E688D]">Manual review only</span></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {paymentMethods.map((m) => (
            <button key={m.id} onClick={() => setDepositMethod(m.id)} className={`rounded-2xl px-3 py-3 border transition-all text-left ${depositMethod === m.id ? "bg-[#00E5FF] text-black border-[#00E5FF]" : "bg-[#221c46] border-white/10 hover:border-[#00E5FF]/40"}`}>
              <div className="h-12 rounded-xl bg-white flex items-center justify-center overflow-hidden mb-2"><img src={DEPOSIT_IMAGES[m.id]} alt={m.label} className="max-h-10 max-w-[88%] object-contain" /></div>
              <div className="text-sm font-bold">{m.label}</div>
            </button>
          ))}
        </div>
      </div>

      {selectedDeposit && (
        <div className="nx-card mb-5 p-5 border border-[#00E5FF]/20">
          <div className="flex items-center gap-3 mb-4"><div className="h-12 w-16 rounded-lg bg-white flex items-center justify-center overflow-hidden shrink-0"><img src={DEPOSIT_IMAGES[selectedDeposit.id]} alt={selectedDeposit.label} className="max-h-9 max-w-[90%] object-contain" /></div><div><div className="text-xs text-[#A29DBE]">Send money to</div><div className="font-black">{selectedDeposit.label}</div></div></div>
          {selectedDeposit.id !== "bank_transfer_manual" ? (
            <div className="grid sm:grid-cols-2 gap-3"><div className="bg-[#221c46] rounded-xl p-3"><div className="text-[10px] uppercase text-[#6E688D]">Receiving Number</div><div className="font-mono font-black mt-1">{selectedDeposit.receiving_number}</div><button onClick={() => copyText(selectedDeposit.receiving_number)} className="text-xs text-[#00E5FF] mt-2 flex gap-1 items-center"><Copy size={13}/> Copy</button></div><div className="bg-[#221c46] rounded-xl p-3"><div className="text-[10px] uppercase text-[#6E688D]">Recipient Name</div><div className="font-semibold mt-1">{selectedDeposit.recipient_name}</div></div></div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">{[["Bank",selectedDeposit.bank_name],["Account Number",selectedDeposit.account_number],["Account Name",selectedDeposit.account_name],["Branch",selectedDeposit.branch || "Not specified"]].map(([label,value])=><div key={label} className="bg-[#221c46] rounded-xl p-3"><div className="text-[10px] uppercase text-[#6E688D]">{label}</div><div className="font-semibold mt-1 break-words">{value || "—"}</div>{label === "Account Number" && <button onClick={() => copyText(value)} className="text-xs text-[#00E5FF] mt-2 flex gap-1 items-center"><Copy size={13}/> Copy</button>}</div>)}</div>
          )}
          <p className="text-xs text-[#A29DBE] mt-4">{selectedDeposit.instructions}</p>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="nx-card p-5 lg:col-span-2">
          <h2 className="font-black flex gap-2 items-center"><ArrowDownToLine className="text-[#00FF87" /> Submit Manual Deposit</h2>
          <label className="text-xs text-[#A29DBE] block mt-4">Amount</label>
          <input type="number" min={status?.min_deposit || 300} value={depAmt} onChange={(e) => setDepAmt(e.target.value)} className="mt-1 w-full rounded-xl bg-[#221c46] border border-white/10 px-3 py-3" placeholder="300 or more" />
          {bonusAvailable && depositAmount >= Number(status?.min_deposit || 300) && <div className="mt-3 rounded-xl bg-[#00FF87]/10 border border-[#00FF87]/20 p-3 text-sm"><div className="flex justify-between"><span>Deposit</span><b>{fmt(depositAmount)}</b></div><div className="flex justify-between text-[#00FF87] mt-1"><span>Potential first-deposit bonus after approval</span><b>+{fmt(previewBonus)}</b></div></div>}
          <div className="grid md:grid-cols-2 gap-3 mt-3">
            <div><label className="text-xs text-[#A29DBE]">Sender name</label><input value={senderName} onChange={(e) => setSenderName(e.target.value)} className="mt-1 w-full rounded-xl bg-[#221c46] border border-white/10 px-3 py-3" placeholder="Your name" /></div>
            <div><label className="text-xs text-[#A29DBE]">Sender phone</label><input value={senderPhone} onChange={(e) => setSenderPhone(e.target.value)} className="mt-1 w-full rounded-xl bg-[#221c46] border border-white/10 px-3 py-3" placeholder="0240000000" /></div>
          </div>
          {selectedDeposit?.id === "bank_transfer_manual" && <div className="mt-3"><label className="text-xs text-[#A29DBE]">Sender/account name</label><input value={senderAccountName} onChange={(e) => setSenderAccountName(e.target.value)} className="mt-1 w-full rounded-xl bg-[#221c46] border border-white/10 px-3 py-3" placeholder="Name on bank account" /></div>}
          <label className="text-xs text-[#A29DBE] block mt-3">Transaction / Reference ID</label>
          <input value={transactionReference} onChange={(e) => setTransactionReference(e.target.value)} className="mt-1 w-full rounded-xl bg-[#221c46] border border-white/10 px-3 py-3 font-mono" placeholder="Payment transaction ID" />
          <label className="text-xs text-[#A29DBE] block mt-3">Proof screenshot <span className="text-[#6E688D]">(optional)</span></label>
          <div className="mt-1 flex flex-wrap items-center gap-3"><label className="cursor-pointer rounded-xl bg-[#221c46] border border-white/10 px-4 py-3 text-sm font-semibold flex items-center gap-2"><Upload size={16}/> Choose image<input type="file" accept="image/*" className="hidden" onChange={(e) => handleProof(e.target.files?.[0])} /></label>{proofDataUrl && <span className="text-xs text-[#00FF87]">Proof attached</span>}</div>
          <p className="text-[11px] text-[#6E688D] mt-3">Your wallet is not credited when you submit. Admin or Super Admin must verify the payment first.</p>
          <button disabled={busy || !selectedDeposit} onClick={deposit} className="nx-btn-primary w-full mt-4 py-3">{busy ? "Submitting..." : "Submit Deposit for Review"}</button>
        </div>

        <div className="nx-card p-5">
          <h2 className="font-black flex gap-2 items-center"><History /> History</h2>
          <div className="mt-3 space-y-2 max-h-96 overflow-auto">{txns.map((t) => <div key={t.id} className="rounded-xl bg-[#221c46] p-3 text-xs"><div className="flex justify-between"><b className={t.type === "deposit" ? "text-[#00FF87]" : t.type === "first_deposit_bonus" ? "text-[#FFD700]" : "text-[#00E5FF]"}>{t.type === "first_deposit_bonus" ? "FIRST DEPOSIT BONUS" : t.type}</b><b>{fmt(t.amount)}</b></div><div className="text-[#A29DBE] mt-1">{t.method} · {t.status}</div><div className="text-[#6E688D]">{t.reference}</div></div>)}{!txns.length && <p className="text-sm text-[#6E688D]">No transactions yet.</p>}</div>
        </div>
      </div>

      <div className="nx-card p-5 mt-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4"><h2 className="font-black flex gap-2 items-center"><ArrowUpFromLine className="text-[#00E5FF" /> Withdraw</h2><span className="text-[10px] uppercase text-[#6E688D]">Existing withdrawal methods</span></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{WITHDRAW_METHODS.map((m) => <button key={m.id} onClick={() => setWithdrawMethod(m.id)} className={`rounded-xl px-3 py-2 border text-left ${withdrawMethod === m.id ? "bg-[#00E5FF] text-black border-[#00E5FF]" : "bg-[#221c46] border-white/10"}`}><div className="text-xs font-bold">{m.label}</div></button>)}</div>
        {withdrawRequirementError && <div role="alert" className="mt-3 rounded-xl border border-[#FF3366]/40 bg-[#FF3366]/10 px-3 py-2.5 text-sm font-black uppercase text-[#FF3366]">{withdrawRequirementError}</div>}
        <div className="grid md:grid-cols-3 gap-3 mt-3"><div><label className="text-xs text-[#A29DBE]">Amount</label><input type="number" value={wdAmt} onChange={(e) => { setWdAmt(e.target.value); setWithdrawRequirementError(""); }} className="mt-1 w-full rounded-xl bg-[#221c46] border border-white/10 px-3 py-3" placeholder="3000 or more" /></div><div><label className="text-xs text-[#A29DBE]">Phone number</label><input value={wdPhone} onChange={(e) => { setWdPhone(e.target.value); setWithdrawRequirementError(""); }} className="mt-1 w-full rounded-xl bg-[#221c46] border border-white/10 px-3 py-3" placeholder="0240000000" /></div><div><label className="text-xs text-[#A29DBE]">Destination / account</label><input value={destination} onChange={(e) => { setDestination(e.target.value); setWithdrawRequirementError(""); }} className="mt-1 w-full rounded-xl bg-[#221c46] border border-white/10 px-3 py-3" placeholder="MoMo number or bank account" /></div></div>
        <button disabled={busy} onClick={withdraw} className="nx-btn-primary w-full mt-4 py-3">Withdraw</button>
      </div>
    </div>
  );
}
