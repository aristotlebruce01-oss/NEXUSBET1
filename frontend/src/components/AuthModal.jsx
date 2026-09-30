import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap } from "lucide-react";
import { useAuth, formatApiErrorDetail } from "@/context/AuthContext";

export default function AuthModal({ open, mode, onClose, onSwitchMode }) {
  const { login, register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [referralLocked, setReferralLocked] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isSignup = mode === "signup";

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) { setReferralCode(ref.toUpperCase()); setReferralLocked(true); }
  }, [open]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isSignup) await register(name, email, phone, password, confirmPassword, referralCode);
      else await login(email, password);
      onClose();
      setName(""); setEmail(""); setPhone(""); setPassword(""); setConfirmPassword(""); if (!referralLocked) setReferralCode("");
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  const useDemo = () => { setEmail("admin@nexusbet.com"); setPassword("admin123"); };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ background: "rgba(6,4,18,0.8)", backdropFilter: "blur(6px)" }}
          onClick={onClose}
        >
          <motion.div
            data-testid="auth-modal"
            className="nx-card w-full max-w-md p-8 relative"
            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button data-testid="auth-modal-close" onClick={onClose} className="absolute top-5 right-5 text-[#A29DBE] hover:text-[#00E5FF]">
              <X size={22} />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <Zap size={22} className="text-[#00E5FF]" fill="#00E5FF" />
              <span className="font-display text-xl font-extrabold tracking-tight">
                NEXUS<span className="text-[#00E5FF]">BET</span>
              </span>
            </div>
            <h2 className="font-display text-2xl font-bold mt-4">{isSignup ? "Create account" : "Welcome back"}</h2>
            <p className="text-[#A29DBE] text-sm mt-1">
              {isSignup ? "Create your NexusBet demo account with a virtual wallet." : "Log in to access your wallet and account tools."}
            </p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              {isSignup && (
                <div>
                  <label className="text-xs text-[#A29DBE] uppercase tracking-wider">Name</label>
                  <input
                    data-testid="auth-modal-name-input"
                    value={name} onChange={(e) => setName(e.target.value)} required
                    className="mt-1 w-full bg-[#221c46] border border-[#00E5FF]/20 rounded-xl px-4 py-3 text-[#F0EEF9] outline-none focus:border-[#00E5FF] transition-colors"
                    placeholder="Neo Player"
                  />
                </div>
              )}
              <div>
                <label className="text-xs text-[#A29DBE] uppercase tracking-wider">{isSignup ? "Email address" : "Email address or phone number"}</label>
                <input
                  data-testid="auth-modal-email-input" type={isSignup ? "email" : "text"}
                  value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="mt-1 w-full bg-[#221c46] border border-[#00E5FF]/20 rounded-xl px-4 py-3 text-[#F0EEF9] outline-none focus:border-[#00E5FF] transition-colors"
                  placeholder={isSignup ? "you@nexus.gg" : "Email or phone number"}
                />
              </div>
              {isSignup && (
                <div>
                  <label className="text-xs text-[#A29DBE] uppercase tracking-wider">Phone number</label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} required className="mt-1 w-full bg-[#221c46] border border-[#00E5FF]/20 rounded-xl px-4 py-3 text-[#F0EEF9] outline-none focus:border-[#00E5FF]" placeholder="024 000 0000" />
                </div>
              )}
              {isSignup && (
                <div>
                  <label className="text-xs text-[#A29DBE] uppercase tracking-wider">Referral Code</label>
                  <input
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    required
                    readOnly={referralLocked}
                    className={`mt-1 w-full bg-[#221c46] border rounded-xl px-4 py-3 text-[#F0EEF9] outline-none ${referralLocked ? "border-[#00FF87]/40 text-[#00FF87]" : "border-[#00E5FF]/20 focus:border-[#00E5FF]"}`}
                    placeholder="Enter Admin or Sub-Admin code"
                  />
                  <p className="text-[10px] text-[#6E688D] mt-1">{referralLocked ? "Referral code locked from your invitation link." : "A valid Admin or Sub-Admin referral code is required."}</p>
                </div>
              )}

              <div>
                <label className="text-xs text-[#A29DBE] uppercase tracking-wider">Password</label>
                <input
                  data-testid="auth-modal-password-input" type="password"
                  value={password} onChange={(e) => setPassword(e.target.value)} required
                  className="mt-1 w-full bg-[#221c46] border border-[#00E5FF]/20 rounded-xl px-4 py-3 text-[#F0EEF9] outline-none focus:border-[#00E5FF] transition-colors"
                  placeholder="••••••••"
                />
              </div>

              {isSignup && (
                <div>
                  <label className="text-xs text-[#A29DBE] uppercase tracking-wider">Confirm password</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="mt-1 w-full bg-[#221c46] border border-[#00E5FF]/20 rounded-xl px-4 py-3 text-[#F0EEF9] outline-none focus:border-[#00E5FF]" placeholder="Repeat your password" />
                </div>
              )}

              {error && (
                <p data-testid="auth-modal-error" className="text-[#FF3366] text-sm">{error}</p>
              )}

              <button
                data-testid="auth-modal-submit-button" type="submit" disabled={loading}
                className="nx-btn-primary w-full py-3 text-base"
              >
                {loading ? "Please wait..." : isSignup ? "Create account" : "Log in"}
              </button>
            </form>

            {!isSignup && (
              <button onClick={useDemo} data-testid="auth-demo-fill" className="mt-3 w-full text-xs text-[#00E5FF] hover:underline">
                Use admin demo credentials
              </button>
            )}

            <p className="text-center text-sm text-[#A29DBE] mt-5">
              {isSignup ? "Already have an account?" : "New to NexusBet?"}{" "}
              <button
                data-testid="auth-switch-mode"
                onClick={() => onSwitchMode(isSignup ? "login" : "signup")}
                className="text-[#00E5FF] font-semibold hover:underline"
              >
                {isSignup ? "Log in" : "Sign up"}
              </button>
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
