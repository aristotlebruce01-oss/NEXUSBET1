import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Settings2, Users, Save, ShieldCheck, RefreshCw, Check, X, Pencil, Copy, Link2, WalletCards, Landmark, Database, UserPlus, Clock3, Crown } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiErrorDetail } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const EMPTY_PAYOUT = {mtn_name:"",mtn_number:"",telecel_name:"",telecel_number:"",bank_name:"",bank_account_name:"",bank_account_number:"",bank_branch:""};
const EMPTY = { sport: "Football", league: "", home: "", away: "", odds_home: "2.00", odds_draw: "3.20", odds_away: "3.00", kickoff_at: "" };
const SPORTS = ["Football", "Basketball", "Tennis", "Virtual Sports"];
const roleName = { super_admin: "Super Admin", admin: "Admin", sub_admin: "Sub-Admin", user: "User" };

const money = (n) => `GH₵${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const localDateTime = (iso) => iso ? new Date(iso).toLocaleString() : "Not scheduled";
const toIso = (value) => value ? new Date(value).toISOString() : null;

function CashierSettings() {
  const [settings, setSettings] = useState(null); const [saving, setSaving] = useState(false);
  useEffect(() => { api.get("/settings").then(({data}) => setSettings(data)).catch(() => {}); }, []);
  const save = async () => { setSaving(true); try { const {data} = await api.put("/admin/settings", { min_deposit:Number(settings.min_deposit), min_withdrawal:Number(settings.min_withdrawal) }); setSettings(data); toast.success("Cashier settings updated"); } catch(err) { toast.error(formatApiErrorDetail(err.response?.data?.detail)); } finally { setSaving(false); } };
  if (!settings) return null;
  return <div className="nx-card p-5"><h2 className="font-display font-bold text-lg flex items-center gap-2 mb-4"><Settings2 size={18} className="text-[#00E5FF]"/> Cashier Settings</h2><div className="grid grid-cols-2 gap-3">{[["min_deposit","Minimum Deposit","300"],["min_withdrawal","Minimum Withdrawal","3000"]].map(([key,label,min]) => <div key={key}><label className="text-xs text-[#A29DBE] uppercase tracking-wider">{label}</label><input type="number" step="0.01" min={min} value={settings[key]} onChange={e=>setSettings({...settings,[key]:e.target.value})} className="mt-1 w-full bg-[#221c46] border border-[#00E5FF]/20 rounded-xl px-3 py-2.5 text-[#F0EEF9] font-mono outline-none focus:border-[#00E5FF]"/></div>)}</div><p className="text-[11px] text-[#6E688D] mt-3">Minimums cannot be lowered below GH₵300 deposit or GH₵3,000 withdrawal.</p><button onClick={save} disabled={saving} className="nx-btn-primary w-full py-2.5 mt-4 flex items-center justify-center gap-2"><Save size={16}/>{saving ? "Saving...":"Save Settings"}</button></div>;
}

function ReferralPanel({ user }) {
  const [data, setData] = useState(null);
  const [commissions, setCommissions] = useState(null);
  const [loading, setLoading] = useState(false);

  const link = data?.referral_code
    ? `${window.location.origin}/signup?ref=${encodeURIComponent(data.referral_code)}`
    : "";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: referralData }, { data: commissionData }] = await Promise.all([
        api.get("/referrals/me"),
        api.get("/staff/commissions"),
      ]);
      setData(referralData);
      setCommissions(commissionData);
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const copy = async () => {
    if (!link) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
      } else {
        const area = document.createElement("textarea");
        area.value = link;
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        document.execCommand("copy");
        area.remove();
      }
      toast.success("Referral link copied");
    } catch {
      toast.error("Clipboard access is unavailable");
    }
  };

  return (
    <div className="nx-card p-5 lg:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="font-display font-bold text-lg flex items-center gap-2">
            <Link2 size={18} className="text-[#00E5FF]" /> Referral & Commission Center
          </h2>
          <p className="text-xs text-[#A29DBE] mt-1">
            {roleName[user?.role]} referral code · {user?.role === "sub_admin"
              ? "70% commission on approved referred deposits"
              : "referral code for user onboarding"}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="text-xs text-[#00E5FF] flex items-center gap-1"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-[#221c46] rounded-xl p-4">
              <span className="text-[10px] uppercase text-[#6E688D]">Your Referral Code</span>
              <div className="flex gap-2 mt-2">
                <input
                  readOnly
                  value={data.referral_code}
                  className="min-w-0 flex-1 bg-[#100d22] border border-[#00E5FF]/20 rounded-lg px-3 py-2 font-mono font-bold text-[#FFD700]"
                />
                <button
                  onClick={copy}
                  className="px-3 rounded-lg bg-[#00E5FF]/10 text-[#00E5FF]"
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>

            <div className="bg-[#221c46] rounded-xl p-4">
              <span className="text-[10px] uppercase text-[#6E688D]">Copy Referral Link</span>
              <button
                onClick={copy}
                className="mt-2 w-full rounded-lg bg-[#00E5FF] text-[#04121a] font-bold py-2 flex items-center justify-center gap-2"
              >
                <Link2 size={16} /> Copy Referral Link
              </button>
              <p className="text-[10px] text-[#6E688D] mt-2 break-all">{link}</p>
            </div>

            <div className="bg-[#221c46] rounded-xl p-4">
              <span className="text-[10px] uppercase text-[#6E688D]">Referred Deposits</span>
              <b className="block text-2xl text-[#00FF87] mt-2">{data.referred_deposit_count}</b>
              <span className="text-[10px] text-[#6E688D]">approved deposits</span>
            </div>
          </div>

          {user?.role === "sub_admin" && (
            <>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="bg-[#221c46] rounded-xl p-4">
                  <span className="text-[10px] uppercase text-[#6E688D]">Today's Commission</span>
                  <b className="block text-xl text-[#FFD700] mt-1">{money(commissions?.today)}</b>
                </div>
                <div className="bg-[#221c46] rounded-xl p-4">
                  <span className="text-[10px] uppercase text-[#6E688D]">All-Time Commission</span>
                  <b className="block text-xl text-[#FFD700] mt-1">{money(commissions?.all_time)}</b>
                </div>
              </div>

              <div className="mt-4">
                <h3 className="text-sm font-bold mb-2">Dated Commission Ledger</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-[#6E688D] border-b border-white/10">
                        <th className="text-left p-2">Date / Time</th>
                        <th className="text-left p-2">Referred User</th>
                        <th className="text-right p-2">Deposit</th>
                        <th className="text-right p-2">70% Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(commissions?.ledger || []).map((row) => (
                        <tr key={row.id} className="border-b border-white/5">
                          <td className="p-2">{localDateTime(row.created_at)}</td>
                          <td className="p-2">
                            {row.user?.name || row.user?.email || row.user?.phone || "User"}
                            <div className="text-[10px] text-[#6E688D]">
                              {row.user?.email || row.user?.phone || ""}
                            </div>
                          </td>
                          <td className="p-2 text-right">{money(row.deposit_amount)}</td>
                          <td className="p-2 text-right text-[#00FF87] font-bold">
                            {money(row.commission)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!commissions?.ledger?.length && (
                    <p className="text-xs text-[#6E688D] py-4">No commission entries yet.</p>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function DemoWalletPanel({ user }) {
  const [amount,setAmount]=useState(""); const [saving,setSaving]=useState(false);
  const credit=async()=>{const value=Number(amount);if(!Number.isFinite(value)||value<=0){toast.error("Enter a valid demo amount");return;}setSaving(true);try{const {data}=await api.post('/staff/demo-credit',{amount:value});toast.success(`Demo balance credited: ${money(value)}`);setAmount("");window.dispatchEvent(new CustomEvent('nexus:balance-updated',{detail:data.demo_balance}));}catch(err){toast.error(formatApiErrorDetail(err.response?.data?.detail))}finally{setSaving(false)}};
  return <div className="nx-card p-5"><h2 className="font-display font-bold text-lg flex items-center gap-2"><WalletCards size={18} className="text-[#FFD700]"/> Staff Demo Wallet</h2><p className="text-xs text-[#A29DBE] mt-1">Staff-only testing wallet. Regular users cannot access demo credits.</p><div className="bg-[#221c46] rounded-xl p-4 mt-4"><span className="text-[10px] uppercase text-[#6E688D]">Current Demo Balance</span><b className="block text-2xl text-[#FFD700] mt-1">{money(user?.demo_balance ?? user?.balance)}</b></div><div className="flex gap-2 mt-3"><input type="number" min="0.01" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="Custom amount (e.g. 50000)" className="flex-1 bg-[#221c46] border border-[#00E5FF]/20 rounded-xl px-3 py-2.5 outline-none"/><button onClick={credit} disabled={saving} className="nx-btn-primary px-4">{saving?"...":"Top Up"}</button></div></div>;
}

function PayoutAccountsPanel({ canEdit }) {
  const [data,setData]=useState(EMPTY_PAYOUT); const [saving,setSaving]=useState(false);
  useEffect(()=>{api.get('/admin/payout-accounts').then(({data})=>setData({...EMPTY_PAYOUT,...data})).catch(()=>{})},[]);
  const save=async()=>{setSaving(true);try{const {data}=await api.put('/admin/payout-accounts',data);setData(data);toast.success('Settlement payout accounts saved')}catch(err){toast.error(formatApiErrorDetail(err.response?.data?.detail))}finally{setSaving(false)}};
  const field=(key,label)=> <div><label className="text-[10px] uppercase tracking-wider text-[#A29DBE]">{label}</label><input readOnly={!canEdit} value={data[key]} onChange={e=>setData({...data,[key]:e.target.value})} className="mt-1 w-full bg-[#221c46] border border-[#00E5FF]/20 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#00E5FF] disabled:opacity-70"/></div>;
  return <div className="nx-card p-5 lg:col-span-2"><h2 className="font-display font-bold text-lg flex items-center gap-2"><Landmark size={18} className="text-[#00E5FF]"/> Company Settlement Payout Accounts</h2><p className="text-xs text-[#A29DBE] mt-1">Secure destination details for revenue settlements from payment gateways. Admins and Super Admins can view these details.</p><div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4"><div className="bg-[#221c46] rounded-2xl p-4"><h3 className="font-bold mb-3">MTN MoMo</h3>{field('mtn_name','Account Name')}{field('mtn_number','MoMo Number')}</div><div className="bg-[#221c46] rounded-2xl p-4"><h3 className="font-bold mb-3">Telecel Cash</h3>{field('telecel_name','Account Name')}{field('telecel_number','Cash Number')}</div><div className="bg-[#221c46] rounded-2xl p-4 md:col-span-2"><h3 className="font-bold mb-3">Bank</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-3">{field('bank_name','Bank Name')}{field('bank_branch','Branch')}{field('bank_account_name','Account Name')}{field('bank_account_number','Account Number')}</div></div></div>{canEdit&&<button onClick={save} disabled={saving} className="nx-btn-primary w-full mt-4 py-2.5"><Save size={16} className="inline mr-2"/>{saving?'Saving...':'Save Settlement Accounts'}</button>}</div>;
}

function DepositCleanupPanel() {
  const [before,setBefore]=useState(""); const [busy,setBusy]=useState(false);
  const cleanup=async()=>{if(!before){toast.error('Choose a cutoff date and time');return;}if(!window.confirm('Soft-delete deposit log entries before this date? User balances will remain untouched.'))return;setBusy(true);try{const {data}=await api.post('/admin/deposits/cleanup',{before:new Date(before).toISOString()});toast.success(`${data.soft_deleted} historical deposit logs cleared`);setBefore("")}catch(err){toast.error(formatApiErrorDetail(err.response?.data?.detail))}finally{setBusy(false)}};
  return <div className="nx-card p-5"><h2 className="font-display font-bold text-lg flex items-center gap-2"><Database size={18} className="text-[#FF3366]"/> Deposit Log Cleanup</h2><p className="text-xs text-[#A29DBE] mt-1">Super Admin only. Soft-deletes old deposit log records without changing balances.</p><input type="datetime-local" value={before} onChange={e=>setBefore(e.target.value)} className="mt-4 w-full bg-[#221c46] border border-[#00E5FF]/20 rounded-xl px-3 py-2.5"/><button onClick={cleanup} disabled={busy} className="w-full mt-3 rounded-xl bg-[#FF3366]/10 text-[#FF6B8F] py-2.5 font-bold">{busy?'Cleaning...':'Clear Older Deposit Logs'}</button></div>;
}

function GlobalUsersPanel() {
  const [users,setUsers]=useState([]);
  const load=useCallback(async()=>{try{setUsers((await api.get('/admin/users')).data)}catch(err){toast.error(formatApiErrorDetail(err.response?.data?.detail))}},[]);
  useEffect(()=>{load()},[load]);
  return <div className="nx-card p-5 lg:col-span-2"><div className="flex items-center justify-between mb-4"><div><h2 className="font-display font-bold text-lg flex items-center gap-2"><Users size={18} className="text-[#00E5FF]"/> Global User Profiles</h2><p className="text-xs text-[#A29DBE] mt-1">Staff overview of user contact details, balances and referral ownership.</p></div><button onClick={load}><RefreshCw size={16}/></button></div><div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="text-[#6E688D] border-b border-white/10"><th className="text-left p-2">User</th><th className="text-left p-2">Contact</th><th className="text-left p-2">Referral Used</th><th className="text-right p-2">Balance</th><th className="text-left p-2">Role</th></tr></thead><tbody>{users.filter(u=>u.role==='user').map(u=><tr key={u.id} className="border-b border-white/5"><td className="p-2 font-semibold">{u.name||'Unnamed'}</td><td className="p-2">{u.email}<div className="text-[10px] text-[#6E688D]">{u.phone||''}</div></td><td className="p-2 font-mono text-[#00E5FF]">{u.referral_code||'—'}</td><td className="p-2 text-right">{money(u.balance)}</td><td className="p-2">{roleName[u.role]}</td></tr>)}</tbody></table>{!users.filter(u=>u.role==='user').length&&<p className="text-xs text-[#6E688D] py-4">No regular user accounts yet.</p>}</div></div>;
}

function StaffManager({ user }) {
  const isSuper=user?.role==='super_admin'; const [staff,setStaff]=useState([]); const [form,setForm]=useState({name:"",email:"",phone:"",password:"",role:"sub_admin"}); const [editing,setEditing]=useState(null); const [saving,setSaving]=useState(false);
  const load=useCallback(async()=>{try{setStaff((await api.get('/admin/staff')).data)}catch(err){toast.error(formatApiErrorDetail(err.response?.data?.detail))}},[]); useEffect(()=>{load()},[load]);
  const create=async()=>{setSaving(true);try{await api.post('/admin/staff',form);toast.success(`${roleName[form.role]} created`);setForm({name:"",email:"",phone:"",password:"",role:"sub_admin"});load()}catch(err){toast.error(formatApiErrorDetail(err.response?.data?.detail))}finally{setSaving(false)}};
  const saveEdit=async()=>{try{await api.put(`/admin/staff/${editing.id}`,{name:editing.name,email:editing.email,phone:editing.phone,password:editing.password||undefined});toast.success('Staff account updated');setEditing(null);load()}catch(err){toast.error(formatApiErrorDetail(err.response?.data?.detail))}};
  const remove=async(s)=>{if(!window.confirm(`Remove ${s.role_label} ${s.name||s.email}?`))return;try{await api.delete(`/admin/staff/${s.id}`);toast.success('Staff account removed');load()}catch(err){toast.error(formatApiErrorDetail(err.response?.data?.detail))}};
  const invite=async(s)=>{const hours=Number(window.prompt('Invitation expiry in hours', '24'));if(!Number.isFinite(hours)||hours<1)return;try{const {data}=await api.post(`/admin/staff/${s.id}/invite?expires_hours=${Math.min(720,Math.max(1,Math.floor(hours)))}`);const link=`${window.location.origin}/staff/invite/${data.token}`;if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(link)}else{const area=document.createElement("textarea");area.value=link;area.style.position="fixed";area.style.opacity="0";document.body.appendChild(area);area.select();document.execCommand("copy");area.remove()}toast.success('Invitation link copied')}catch(err){toast.error(formatApiErrorDetail(err.response?.data?.detail))}};
  return <div className="nx-card p-5 lg:col-span-2"><div className="flex items-center justify-between mb-4"><div><h2 className="font-display font-bold text-lg flex items-center gap-2"><Users size={18} className="text-[#00E5FF]"/> Staff & Access Control</h2><p className="text-xs text-[#A29DBE] mt-1">{isSuper?'Super Admin can manage Admins and Sub-Admins.':'Admin can onboard Sub-Admins.'}</p></div><button onClick={load} className="text-[#00E5FF]"><RefreshCw size={16}/></button></div><div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-5">{['name','email','phone','password'].map(k=><input key={k} type={k==='password'?'password':'text'} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} maxLength={k==='phone'?40:k==='name'?80:k==='password'?128:160} placeholder={k==='name'?'Full name':k==='password'?'Temporary password':k[0].toUpperCase()+k.slice(1)} className="bg-[#221c46] border border-[#00E5FF]/20 rounded-xl px-3 py-2.5 text-sm"/>)}<div className="flex gap-2"><select value={form.role} disabled={!isSuper} onChange={e=>setForm({...form,role:e.target.value})} className="flex-1 bg-[#221c46] border border-[#00E5FF]/20 rounded-xl px-3 py-2.5 text-sm"><option value="sub_admin">Sub-Admin</option>{isSuper&&<option value="admin">Admin</option>}</select><button onClick={create} disabled={saving} className="nx-btn-primary px-4"><UserPlus size={16}/></button></div></div><div className="space-y-2 max-h-96 overflow-y-auto">{staff.map(s=><div key={s.id} className="bg-[#221c46] rounded-xl p-3"><div className="flex flex-wrap items-center justify-between gap-3"><div className="min-w-0"><div className="flex items-center gap-2"><span className="font-semibold">{s.name||s.email}</span><span className="text-[10px] px-2 py-1 rounded-full bg-[#00E5FF]/10 text-[#00E5FF]">{s.role_label}</span></div><p className="text-xs text-[#6E688D] mt-1">{s.email} · {s.phone||'no phone'} · Demo {money(s.demo_balance)}</p><p className="text-[10px] text-[#FFD700] mt-1">Referral: {s.referral_code||'—'} · Commission: {money(s.commission_total)}</p></div><div className="flex items-center gap-2"><button onClick={()=>setEditing({...s,password:""})} className="text-xs text-[#00E5FF] flex items-center gap-1"><Pencil size={13}/>Edit</button><button onClick={()=>invite(s)} className="text-xs text-[#A29DBE] flex items-center gap-1"><Link2 size={13}/>Invite</button>{s.role!=='super_admin'&&<button onClick={()=>remove(s)} className="text-xs text-[#FF6B8F] flex items-center gap-1"><Trash2 size={13}/>Remove</button>}</div></div>{editing?.id===s.id&&<div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-2"><input value={editing.name} onChange={e=>setEditing({...editing,name:e.target.value})} className="bg-[#100d22] rounded-lg px-2 py-2 text-xs" placeholder="Name"/><input value={editing.email} onChange={e=>setEditing({...editing,email:e.target.value})} className="bg-[#100d22] rounded-lg px-2 py-2 text-xs" placeholder="Email"/><input value={editing.phone||''} onChange={e=>setEditing({...editing,phone:e.target.value})} className="bg-[#100d22] rounded-lg px-2 py-2 text-xs" maxLength={40} placeholder="Phone"/><div className="flex gap-2"><input type="password" value={editing.password||''} onChange={e=>setEditing({...editing,password:e.target.value})} className="min-w-0 flex-1 bg-[#100d22] rounded-lg px-2 py-2 text-xs" placeholder="New password"/><button onClick={saveEdit} className="px-3 rounded-lg bg-[#00FF87]/10 text-[#00FF87]">Save</button><button onClick={()=>setEditing(null)} className="px-3 rounded-lg bg-white/5">×</button></div></div>}</div>)}</div></div>;
}

function PermissionManager() {
  const [users,setUsers]=useState([]),[groups,setGroups]=useState({}),[selected,setSelected]=useState(''),[permissions,setPermissions]=useState([]),[saving,setSaving]=useState(false);
  const load=useCallback(async()=>{try{const [{data:u},{data:p}]=await Promise.all([api.get('/admin/users'),api.get('/admin/permissions')]);setUsers(u.filter(x=>x.role==='sub_admin'));setGroups(p.groups||{});if(selected){const c=u.find(x=>x.id===selected);setPermissions(c?.permissions||[])}}catch(err){toast.error(formatApiErrorDetail(err.response?.data?.detail))}},[selected]); useEffect(()=>{load()},[load]);
  const choose=id=>{setSelected(id);setPermissions(users.find(u=>u.id===id)?.permissions||[])}; const toggle=x=>setPermissions(v=>v.includes(x)?v.filter(y=>y!==x):[...v,x]); const save=async()=>{if(!selected)return;setSaving(true);try{await api.put(`/admin/users/${selected}/permissions`,{permissions});toast.success('Permissions updated');load()}catch(err){toast.error(formatApiErrorDetail(err.response?.data?.detail))}finally{setSaving(false)}};
  return <div className="nx-card p-5"><div className="flex items-center justify-between mb-4"><h2 className="font-display font-bold text-lg flex items-center gap-2"><ShieldCheck size={18} className="text-[#00E5FF]"/> Sub-Admin Permissions</h2><button onClick={load}><RefreshCw size={16}/></button></div>{users.length===0?<p className="text-sm text-[#A29DBE]">No Sub-Admin accounts found.</p>:<><select value={selected} onChange={e=>choose(e.target.value)} className="w-full bg-[#221c46] border border-[#00E5FF]/20 rounded-xl px-3 py-2.5"><option value="">Choose an account</option>{users.map(u=><option key={u.id} value={u.id}>{u.name||u.email}</option>)}</select>{selected&&<div className="mt-4 space-y-3">{Object.entries(groups).map(([group,items])=><div key={group}><p className="text-xs text-[#A29DBE] uppercase tracking-wider mb-2">{group.replaceAll('_',' ')}</p><div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{items.map(x=><label key={x} className="flex items-center gap-2 text-sm bg-[#221c46] rounded-lg px-3 py-2"><input type="checkbox" checked={permissions.includes(x)} onChange={()=>toggle(x)}/>{x}</label>)}</div></div>)}<button onClick={save} disabled={saving} className="nx-btn-primary w-full py-2.5">{saving?'Saving...':'Save Permissions'}</button></div>}</>}</div>;
}

function TransactionReview() {
  const [transactions,setTransactions]=useState([]),[loading,setLoading]=useState(false); const load=async()=>{setLoading(true);try{setTransactions((await api.get('/admin/transactions?status=pending')).data)}catch(err){toast.error(formatApiErrorDetail(err.response?.data?.detail))}finally{setLoading(false)}}; useEffect(()=>{load()},[]);
  const review=async(id,action)=>{const reason=action==='reject'?window.prompt('Enter rejection reason:'):(window.prompt('Optional approval note:')||'');if(action==='reject'&&!reason?.trim())return;try{await api.post(`/admin/transactions/${id}/review?action=${action}&reason=${encodeURIComponent(reason||'')}`);toast.success(action==='approve'?'Transaction approved':'Transaction rejected');load()}catch(err){toast.error(formatApiErrorDetail(err.response?.data?.detail))}};
  return <div className="nx-card p-5"><div className="flex items-center justify-between mb-4"><h2 className="font-display font-bold text-lg">Deposit & Withdrawal Review</h2><button onClick={load} disabled={loading}><RefreshCw size={16} className={loading?'animate-spin':''}/></button></div>{transactions.length===0?<p className="text-sm text-[#A29DBE]">No pending transactions.</p>:<div className="space-y-3 max-h-96 overflow-y-auto">{transactions.map(tx=><div key={tx.id} className="bg-[#221c46] rounded-xl p-3"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">{money(tx.amount)}</p><p className="text-xs text-[#A29DBE]">{tx.user?.name||tx.user?.email||tx.user_id}</p><p className="text-[10px] text-[#6E688D]">{tx.type} · {tx.method} · {tx.reference||'no reference'}</p></div><span className="text-[10px] uppercase text-[#FFD700]">{tx.status}</span></div><div className="flex gap-2 mt-3"><button onClick={()=>review(tx.id,'approve')} className="flex-1 rounded-lg bg-[#00FF87]/10 text-[#00FF87] py-1.5 text-xs font-semibold flex items-center justify-center gap-1"><Check size={13}/>Approve</button><button onClick={()=>review(tx.id,'reject')} className="flex-1 rounded-lg bg-[#FF3366]/10 text-[#FF3366] py-1.5 text-xs font-semibold flex items-center justify-center gap-1"><X size={13}/>Reject</button></div></div>)}</div>}</div>;
}

function ReportsPanel() { const [report,setReport]=useState(null); useEffect(()=>{api.get('/admin/reports/summary').then(({data})=>setReport(data)).catch(()=>setReport(null));},[]); if(!report)return null; return <div className="nx-card p-5"><h2 className="font-display font-bold text-lg mb-4">Reports</h2><div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center"><div className="bg-[#221c46] rounded-xl p-3"><b className="block text-xl">{report.users}</b><span className="text-xs text-[#6E688D]">Users</span></div><div className="bg-[#221c46] rounded-xl p-3"><b className="block text-xl">{report.events}</b><span className="text-xs text-[#6E688D]">Events</span></div><div className="bg-[#221c46] rounded-xl p-3"><b className="block text-xl">{money(report.approved_deposits.total)}</b><span className="text-xs text-[#6E688D]">Deposits</span></div><div className="bg-[#221c46] rounded-xl p-3"><b className="block text-xl">{money(report.paid_withdrawals.total)}</b><span className="text-xs text-[#6E688D]">Withdrawals</span></div></div></div>; }

function VirtualFootballPanel() {
  const [matches,setMatches]=useState([]),[bulk,setBulk]=useState(''),[loading,setLoading]=useState(false); const load=async()=>{try{setMatches((await api.get('/virtual-football/matches?limit=200')).data)}catch(err){toast.error(formatApiErrorDetail(err.response?.data?.detail))}}; useEffect(()=>{load()},[]);
  const upload=async()=>{if(!bulk.trim()){toast.error('Choose a JSON file or paste JSON matches.');return;}setLoading(true);try{const parsed=JSON.parse(bulk);const payload=Array.isArray(parsed)?parsed:parsed.matches;if(!Array.isArray(payload)||!payload.length)throw new Error('Provide a JSON array of matches');await api.post('/admin/virtual-football/bulk',{matches:payload});toast.success(`${payload.length} virtual matches uploaded`);setBulk('');load()}catch(err){toast.error(err.message||formatApiErrorDetail(err.response?.data?.detail))}finally{setLoading(false)}};
  const readJsonFile=e=>{const file=e.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>setBulk(String(reader.result||''));reader.onerror=()=>toast.error('Could not read that file');reader.readAsText(file)};
  const control=async(id,values)=>{try{await api.patch(`/admin/virtual-football/matches/${id}`,values);load()}catch(err){toast.error(formatApiErrorDetail(err.response?.data?.detail))}};
  return <div className="nx-card p-5 lg:col-span-2"><div className="flex items-center justify-between gap-3 mb-3"><h2 className="font-display font-bold text-lg">Virtual Football Control Room</h2><button onClick={load} className="text-xs text-[#00E5FF]"><RefreshCw size={14}/></button></div><p className="text-xs text-[#A29DBE] mb-3">Upload JSON with up to 5,000 matches. Live clock uses server time.</p><div className="space-y-2"><input type="file" accept=".json,application/json" onChange={readJsonFile} className="block w-full text-xs text-[#A29DBE] file:mr-3 file:rounded-lg file:border-0 file:bg-[#00E5FF] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-black"/><textarea value={bulk} onChange={e=>setBulk(e.target.value)} placeholder='Or paste JSON here: [{"home":"Team A","away":"Team B","league":"Virtual League","odds_home":2,"odds_draw":3.2,"odds_away":3}]' className="w-full h-24 bg-[#221c46] border border-[#00E5FF]/20 rounded-xl p-3 text-xs font-mono"/><button disabled={loading} onClick={upload} className="nx-btn-primary w-full py-2">{loading?'Uploading...':'Upload JSON Matches'}</button></div><div className="space-y-2 mt-4 max-h-[28rem] overflow-y-auto">{matches.map(m=><div key={m.id} className="bg-[#221c46] rounded-xl p-3"><div className="flex justify-between gap-2"><div><p className="text-sm font-semibold">{m.home} vs {m.away}</p><p className="text-[10px] text-[#A29DBE]">{m.league} · {m.phase} · minute {m.minute}</p></div><span className="text-xs text-[#00E5FF]">{m.status}</span></div><p className="text-sm mt-2">{m.score.home} - {m.score.away}</p><div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2"><button onClick={()=>control(m.id,{status:'live'})} className="text-xs rounded-lg bg-[#00FF87]/10 text-[#00FF87] py-1">Start</button><button onClick={()=>control(m.id,{status:'paused'})} className="text-xs rounded-lg bg-[#FFD700]/10 text-[#FFD700] py-1">Pause</button><button onClick={()=>control(m.id,{status:'halftime'})} className="text-xs rounded-lg bg-[#00E5FF]/10 text-[#00E5FF] py-1">Half-time</button><button onClick={()=>control(m.id,{status:'finished',minute:94})} className="text-xs rounded-lg bg-[#FF3366]/10 text-[#FF3366] py-1">Finish</button></div></div>)}</div></div>;
}

export default function AdminPage(){
  const {user}=useAuth();
  const isSuper=user?.role==='super_admin'; const isAdmin=['super_admin','admin'].includes(user?.role); const canEvents=isAdmin||user?.permissions?.includes('events.manage');
  const [events,setEvents]=useState([]),[form,setForm]=useState(EMPTY),[saving,setSaving]=useState(false),[editing,setEditing]=useState(null);
  const load=useCallback(async()=>{try{setEvents((await api.get('/events?status=all&limit=120')).data)}catch(err){toast.error(formatApiErrorDetail(err.response?.data?.detail))}},[]); useEffect(()=>{load()},[load]);
  const create=async e=>{e.preventDefault();setSaving(true);try{await api.post('/admin/events',{...form,odds_home:Number(form.odds_home),odds_draw:Number(form.odds_draw),odds_away:Number(form.odds_away),kickoff_at:toIso(form.kickoff_at)});toast.success('Event created');setForm(EMPTY);load()}catch(err){toast.error(formatApiErrorDetail(err.response?.data?.detail))}finally{setSaving(false)}};
  const update=async()=>{try{await api.put(`/admin/events/${editing.id}`,{sport:editing.sport,league:editing.league,home:editing.home,away:editing.away,odds_home:Number(editing.odds_home),odds_draw:Number(editing.odds_draw),odds_away:Number(editing.odds_away),kickoff_at:editing.kickoff_at?toIso(editing.kickoff_at):null});toast.success('Event updated');setEditing(null);load()}catch(err){toast.error(formatApiErrorDetail(err.response?.data?.detail))}};
  const remove=async id=>{if(!window.confirm('Delete this event?'))return;try{await api.delete(`/admin/events/${id}`);toast.success('Event deleted');load()}catch(err){toast.error(formatApiErrorDetail(err.response?.data?.detail))}};
  const control=async(ev, status)=>{try{if(status==='live'){await api.patch(`/admin/events/${ev.id}/control`,{status:'live'});toast.success(`${ev.home} vs ${ev.away} is now LIVE`);load();return;}if(status==='finished'){await api.patch(`/admin/events/${ev.id}/control`,{status:'finished',home_score:Number(ev.score?.home??0),away_score:Number(ev.score?.away??0)});toast.success('Match finished and tickets settled');load();return;}const homeScore=Number(window.prompt('Home score',String(ev.score?.home??0)));const awayScore=Number(window.prompt('Away score',String(ev.score?.away??0)));const minute=Number(window.prompt('Match minute',String(ev.minute??0)));if(![homeScore,awayScore,minute].every(Number.isFinite)||homeScore<0||awayScore<0||minute<0)return;await api.patch(`/admin/events/${ev.id}/control`,{status,home_score:homeScore,away_score:awayScore,minute});toast.success(`Match set to ${status}`);load()}catch(err){toast.error(formatApiErrorDetail(err.response?.data?.detail))}};
  const incrementScore=async(ev,side)=>{try{const score={home_score:Number(ev.score?.home||0),away_score:Number(ev.score?.away||0),minute:Number(ev.minute||0)};score[side==='home'?'home_score':'away_score']+=1;await api.patch(`/admin/events/${ev.id}/control`,score);load()}catch(err){toast.error(formatApiErrorDetail(err.response?.data?.detail))}};
  const field=(k,l,props={})=><div><label className="text-xs text-[#A29DBE] uppercase tracking-wider">{l}</label><input value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} className="mt-1 w-full bg-[#221c46] border border-[#00E5FF]/20 rounded-xl px-3 py-2.5 text-[#F0EEF9] outline-none focus:border-[#00E5FF]" {...props}/></div>;
  return <div><div className="mb-6"><div className="flex items-center gap-2"><h1 className="font-display text-2xl sm:text-3xl font-black">{isSuper?'Super Admin':'Admin'} · Dashboard</h1>{isSuper&&<Crown size={22} className="text-[#FFD700]"/>}</div><p className="text-[#A29DBE] text-sm mt-1">Role-based access, referrals, settlement accounts, staff testing and match operations.</p></div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <DemoWalletPanel user={user}/>
      {isAdmin&&<CashierSettings/>}
      <ReferralPanel user={user}/>
      <PayoutAccountsPanel canEdit={isAdmin}/>
      {isSuper&&<DepositCleanupPanel/>}
      {(isAdmin||user?.permissions?.includes('transactions.view'))&&<TransactionReview/>}
      {(isAdmin||user?.permissions?.includes('reports.view'))&&<ReportsPanel/>}
      {(isAdmin||user?.permissions?.includes('users.view'))&&<GlobalUsersPanel/>}
      {isAdmin&&<StaffManager user={user}/>} 
      {isSuper&&<PermissionManager/>}
    </div>
    {canEvents&&<><VirtualFootballPanel/><div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6"><form onSubmit={create} className="nx-card p-5 space-y-4 h-fit"><h2 className="font-display font-bold text-lg flex items-center gap-2"><Plus size={18}/> New Match Event</h2><div><label className="text-xs text-[#A29DBE] uppercase tracking-wider">Sport</label><select value={form.sport} onChange={e=>setForm({...form,sport:e.target.value})} className="mt-1 w-full bg-[#221c46] border border-[#00E5FF]/20 rounded-xl px-3 py-2.5 text-[#F0EEF9]">{SPORTS.map(s=><option key={s}>{s}</option>)}</select></div>{field('league','League',{required:true})}<div className="grid grid-cols-2 gap-3">{field('home','Home',{required:true})}{field('away','Away',{required:true})}</div><div className="bg-[#00E5FF]/5 border border-[#00E5FF]/15 rounded-2xl p-3"><label className="text-xs text-[#A29DBE] uppercase tracking-wider flex items-center gap-1"><Clock3 size={14}/> Match Start Time</label><input type="datetime-local" value={form.kickoff_at} onChange={e=>setForm({...form,kickoff_at:e.target.value})} className="mt-1 w-full bg-[#221c46] border border-[#00E5FF]/20 rounded-xl px-3 py-2.5 text-[#F0EEF9]"/><p className="text-[10px] text-[#6E688D] mt-2">Set any date/time you want, including 1:00 PM, 7:00 PM or 11:30 PM. The selected local time is stored consistently for the server.</p></div><div className="grid grid-cols-3 gap-3">{field('odds_home','Home Odds',{type:'number',step:'0.01',min:'1.01',required:true})}{field('odds_draw','Draw Odds',{type:'number',step:'0.01',min:'1.01',required:true})}{field('odds_away','Away Odds',{type:'number',step:'0.01',min:'1.01',required:true})}</div><button type="submit" disabled={saving} className="nx-btn-primary w-full py-3">{saving?'Creating...':'Create Event'}</button></form><div className="space-y-3"><div className="flex items-center justify-between"><h2 className="font-display font-bold text-lg">Events ({events.length})</h2><button onClick={load}><RefreshCw size={16}/></button></div>{events.map(ev=><motion.div layout key={ev.id} className="nx-card p-4"><div className="flex justify-between mb-2"><span className="text-xs text-[#00E5FF]">{ev.sport} · {ev.league}</span><span className={`text-xs ${ev.status==='live'?'text-[#00FF87]':ev.status==='finished'?'text-[#FFD700]':'text-[#A29DBE]'}`}>{ev.status}</span></div><p className="text-sm font-semibold">{ev.home} <span className="text-[#6E688D]">vs</span> {ev.away}</p><div className="flex items-center gap-2 text-xs text-[#A29DBE] mt-1"><Clock3 size={13}/>{localDateTime(ev.kickoff_at)}</div><p className="text-lg font-black text-[#FFD700] mt-2">{ev.score?.home??0} : {ev.score?.away??0} <span className="text-xs text-[#A29DBE]">· {ev.minute??0}'</span></p><div className="grid grid-cols-3 gap-2 mt-3 text-xs text-center"><span>Home {Number(ev.odds?.home).toFixed(2)}</span><span>Draw {Number(ev.odds?.draw).toFixed(2)}</span><span>Away {Number(ev.odds?.away).toFixed(2)}</span></div><div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3"><button onClick={()=>control(ev,'live')} className="text-xs rounded-lg bg-[#00FF87]/10 text-[#00FF87] py-2">Start live</button><button onClick={()=>incrementScore(ev,'home')} className="text-xs rounded-lg bg-[#342b60] py-2">Home +1</button><button onClick={()=>incrementScore(ev,'away')} className="text-xs rounded-lg bg-[#342b60] py-2">Away +1</button><button onClick={()=>control(ev,'finished')} className="text-xs rounded-lg bg-[#FF3366]/10 text-[#FF3366] py-2">Finish Match</button></div><div className="flex gap-3 mt-3"><button onClick={()=>setEditing({...ev,odds_home:ev.odds.home,odds_draw:ev.odds.draw,odds_away:ev.odds.away,kickoff_at:ev.kickoff_at?new Date(ev.kickoff_at).toISOString().slice(0,16):''})} className="text-xs text-[#00E5FF] flex gap-1 items-center"><Pencil size={13}/>Edit</button><button onClick={()=>control(ev,'open')} className="text-xs text-[#A29DBE] flex gap-1 items-center"><Settings2 size={13}/>Set score</button><button onClick={()=>remove(ev.id)} className="text-xs text-[#6E688D] flex gap-1 items-center"><Trash2 size={13}/>Delete</button></div>{editing?.id===ev.id&&<div className="mt-3 space-y-2 border-t border-[#00E5FF]/10 pt-3"><div className="grid grid-cols-2 gap-2">{['league','home','away'].map(k=><input key={k} value={editing[k]} onChange={e=>setEditing({...editing,[k]:e.target.value})} className="bg-[#221c46] border border-[#00E5FF]/20 rounded-lg px-2 py-2 text-xs" placeholder={k}/>)}</div><input type="datetime-local" value={editing.kickoff_at||''} onChange={e=>setEditing({...editing,kickoff_at:e.target.value})} className="w-full bg-[#221c46] border border-[#00E5FF]/20 rounded-lg px-2 py-2 text-xs"/><div className="grid grid-cols-3 gap-2">{['odds_home','odds_draw','odds_away'].map(k=><input key={k} type="number" min="1.01" step="0.01" value={editing[k]} onChange={e=>setEditing({...editing,[k]:e.target.value})} className="bg-[#221c46] border border-[#00E5FF]/20 rounded-lg px-2 py-2 text-xs"/>)}</div><div className="flex gap-2"><button onClick={update} className="text-xs px-3 py-1.5 rounded-lg bg-[#00FF87]/10 text-[#00FF87]">Save</button><button onClick={()=>setEditing(null)} className="text-xs px-3 py-1.5 rounded-lg bg-[#221c46] text-[#A29DBE]">Cancel</button></div></div>}</motion.div>)}</div></div></>}
  </div>;
}
