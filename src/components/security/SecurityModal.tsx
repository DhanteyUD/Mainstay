import { useCallback, useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Copy,
  Loader2,
  ShieldCheck,
  ShieldOff,
  X,
} from "lucide-react";
import { useAuth } from "../../lib/auth-context";
import {
  friendlyMfaError,
  getTotpFactors,
  removeFactor,
  startEnroll,
  verifyCode,
} from "../../lib/mfa";
import type { EnrollData } from "../../lib/mfa";
import { notify } from "../../lib/toast";
import CodeInput from "./CodeInput";

type View = "loading" | "off" | "enrolling" | "on";

/** Turn two-factor authentication on or off for the signed-in account. */
export default function SecurityModal({ onClose }: { onClose: () => void }) {
  const { refreshMfa } = useAuth();
  const [view, setView] = useState<View>("loading");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [enroll, setEnroll] = useState<EnrollData | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOff, setConfirmOff] = useState(false);

  const load = useCallback(async () => {
    try {
      const verified = (await getTotpFactors()).find(
        (f) => f.status === "verified",
      );
      setFactorId(verified?.id ?? null);
      setView(verified ? "on" : "off");
    } catch {
      setError("Could not load your security settings.");
      setView("off");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const begin = async () => {
    setBusy(true);
    setError(null);
    try {
      setEnroll(await startEnroll());
      setCode("");
      setView("enrolling");
    } catch (e) {
      setError(
        (e as Error).message ||
          "Could not start setup. Is 2FA enabled for this project?",
      );
    } finally {
      setBusy(false);
    }
  };

  const confirm = async (value: string) => {
    if (!enroll || busy) return;
    setBusy(true);
    setError(null);
    try {
      await verifyCode(enroll.factorId, value);
      await refreshMfa();
      notify.success("Two-factor authentication is on");
      setEnroll(null);
      await load();
    } catch (e) {
      setError(friendlyMfaError(e));
      setCode("");
    } finally {
      setBusy(false);
    }
  };

  const turnOff = async () => {
    if (!factorId) return;
    setBusy(true);
    setError(null);
    try {
      await removeFactor(factorId);
      await refreshMfa();
      notify.success("Two-factor authentication is off");
      setConfirmOff(false);
      await load();
    } catch (e) {
      setError((e as Error).message || "Could not turn off 2FA.");
    } finally {
      setBusy(false);
    }
  };

  const node = (
    <motion.div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-3xl border border-white/15 p-6 font-mono"
        style={{
          background:
            "linear-gradient(145deg, rgba(255,255,255,0.10), rgba(255,255,255,0.03) 50%, rgba(0,229,255,0.07)), rgba(14,16,24,0.92)",
          backdropFilter: "blur(18px) saturate(150%)",
          boxShadow:
            "0 24px 60px -12px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.2)",
        }}
      >
        <button
          onClick={onClose}
          disabled={busy}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/5 text-terminal-dim hover:bg-white/10 hover:text-terminal-text disabled:opacity-40"
        >
          <X size={13} />
        </button>

        <div className="mb-4 flex items-center gap-2.5">
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
              view === "on"
                ? "border-terminal-green/40 bg-terminal-green/15 text-terminal-green"
                : "border-terminal-accent/30 bg-terminal-accent/15 text-terminal-accent"
            }`}
          >
            {view === "on" ? (
              <ShieldCheck size={17} />
            ) : (
              <ShieldOff size={17} />
            )}
          </span>
          <div>
            <h2 className="text-sm font-black text-white">
              Two-factor authentication
            </h2>
            <div className="text-[11px] text-terminal-dim">
              {view === "on"
                ? "On: sign-in needs a code"
                : view === "loading"
                  ? "Checking…"
                  : "Off"}
            </div>
          </div>
        </div>

        {view === "loading" && (
          <div className="flex justify-center py-8 text-terminal-dim">
            <Loader2 size={18} className="animate-spin" />
          </div>
        )}

        {view === "off" && (
          <>
            <p className="text-xs leading-relaxed text-slate-300/80">
              Add a second lock to your account. After your normal sign-in,
              Mainstay will ask for a 6-digit code from an authenticator app
              (Google Authenticator, Authy, 1Password…) before letting you in.
            </p>
            <button
              disabled={busy}
              onClick={begin}
              className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/30 bg-gradient-to-br from-terminal-accent to-cyan-300 py-3 text-xs font-black text-terminal-bg shadow-[0_0_18px_rgba(0,229,255,0.4)] disabled:opacity-60"
            >
              {busy && <Loader2 size={13} className="animate-spin" />} Set up
              2FA
            </button>
          </>
        )}

        {view === "enrolling" && enroll && (
          <>
            <ol className="space-y-1 text-xs leading-relaxed text-slate-300/80 sm:whitespace-nowrap">
              <li>
                <b className="text-terminal-accent">1.</b> Scan this QR code
                with your authenticator app.
              </li>
              <li>
                <b className="text-terminal-accent">2.</b> Enter the 6-digit
                code it shows.
              </li>
            </ol>
            <div className="mx-auto mt-4 w-44 rounded-2xl bg-white p-2.5">
              <img
                src={enroll.qr}
                alt="Scan with your authenticator app"
                className="h-full w-full"
              />
            </div>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(enroll.secret);
                notify.success("Setup key copied");
              }}
              className="mx-auto mt-3 flex cursor-pointer items-center gap-1.5 text-[11px] text-terminal-dim hover:text-terminal-text"
              title="Copy setup key"
            >
              <Copy size={11} /> Can't scan? Copy setup key
            </button>
            <div className="mt-4">
              <CodeInput
                value={code}
                onChange={setCode}
                onComplete={confirm}
                disabled={busy}
                autoFocus
              />
            </div>
            <button
              disabled={busy || code.length !== 6}
              onClick={() => confirm(code)}
              className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/30 bg-gradient-to-br from-terminal-accent to-cyan-300 py-3 text-xs font-black text-terminal-bg disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy && <Loader2 size={13} className="animate-spin" />} Turn on
              2FA
            </button>
          </>
        )}

        {view === "on" && (
          <>
            <div className="flex items-start gap-2 rounded-xl border border-terminal-green/25 bg-terminal-green/5 px-3 py-2.5 text-xs leading-relaxed text-slate-300/80">
              <CheckCircle2
                size={14}
                className="mt-0.5 shrink-0 text-terminal-green"
              />
              Your account is protected. You'll be asked for a code each time
              you sign in.
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-terminal-dim">
              Keep access to your authenticator app. If you lose it you won't be
              able to sign in until 2FA is reset by support.
            </p>
            {confirmOff ? (
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setConfirmOff(false)}
                  className="cursor-pointer rounded-xl border border-white/15 bg-white/5 py-2.5 text-xs text-slate-200 hover:bg-white/10"
                >
                  Keep it on
                </button>
                <button
                  disabled={busy}
                  onClick={turnOff}
                  className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-terminal-red/50 bg-terminal-red/15 py-2.5 text-xs font-bold text-terminal-red hover:bg-terminal-red/25 disabled:opacity-60"
                >
                  {busy && <Loader2 size={12} className="animate-spin" />} Turn
                  off
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmOff(true)}
                className="mt-4 w-full cursor-pointer rounded-xl border border-white/15 bg-white/5 py-2.5 text-xs text-terminal-dim hover:border-terminal-red/40 hover:text-terminal-red"
              >
                Turn off 2FA
              </button>
            )}
          </>
        )}

        {error && (
          <div className="mt-3 text-[11px] text-terminal-red">{error}</div>
        )}
      </motion.div>
    </motion.div>
  );

  return ReactDOM.createPortal(node, document.body);
}
