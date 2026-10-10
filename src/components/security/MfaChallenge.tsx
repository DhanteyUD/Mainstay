import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, LogOut } from "lucide-react";
import { useAuth } from "../../lib/auth-context";
import { friendlyMfaError, getTotpFactors, verifyCode } from "../../lib/mfa";
import CodeInput from "./CodeInput";
import logo from "../../assets/mainstay-logo.png";

export default function MfaChallenge() {
  const { signOut, refreshMfa, user } = useAuth();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTotpFactors()
      .then((f) =>
        setFactorId(f.find((x) => x.status === "verified")?.id ?? null),
      )
      .catch(() =>
        setError("Could not load your 2FA settings. Try signing in again."),
      );
  }, []);

  const submit = async (value: string) => {
    if (!factorId || busy) return;
    setBusy(true);
    setError(null);
    try {
      await verifyCode(factorId, value);
      await refreshMfa();
    } catch (e) {
      setError(friendlyMfaError(e));
      setCode("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-terminal-bg px-4">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,229,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-terminal-accent/15 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative w-full max-w-sm rounded-3xl border border-white/15 p-7 text-center font-mono"
        style={{
          background:
            "linear-gradient(145deg, rgba(255,255,255,0.10), rgba(255,255,255,0.03) 50%, rgba(0,229,255,0.07)), rgba(14,16,24,0.86)",
          backdropFilter: "blur(18px) saturate(150%)",
          boxShadow:
            "0 24px 60px -12px rgba(0,0,0,0.65), 0 0 40px -8px rgba(0,229,255,0.25), inset 0 1px 0 rgba(255,255,255,0.2)",
        }}
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-terminal-accent/30 bg-terminal-accent/10 shadow-[0_0_24px_rgba(0,229,255,0.25)]">
          <img src={logo} alt="Mainstay" className="h-10 w-10" />
        </div>
        <h1 className="text-lg font-black text-white">
          Two-factor authentication
        </h1>
        <p className="mt-2 text-xs leading-relaxed text-slate-300/80">
          Open your authenticator app and enter the 6-digit code for Mainstay
          {user?.email ? ` (${user.email})` : ""}.
        </p>

        <div className="mt-6">
          <CodeInput
            value={code}
            onChange={setCode}
            onComplete={submit}
            disabled={busy || !factorId}
            autoFocus
          />
        </div>

        <div className="mt-3 min-h-[2.5rem] text-[11px] text-terminal-red">
          {error}
        </div>

        <button
          disabled={busy || code.length !== 6 || !factorId}
          onClick={() => submit(code)}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/30 bg-gradient-to-br from-terminal-accent to-cyan-300 py-3 text-sm font-black text-terminal-bg shadow-[0_0_18px_rgba(0,229,255,0.4)] transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy && <Loader2 size={14} className="animate-spin" />}
          {busy ? "Verifying…" : "Unlock Mainstay"}
        </button>

        <button
          onClick={() => signOut()}
          className="mt-4 inline-flex cursor-pointer items-center gap-1.5 text-[11px] text-terminal-dim transition-colors hover:text-terminal-text"
        >
          <LogOut size={11} /> Sign out
        </button>
      </motion.div>
    </div>
  );
}
