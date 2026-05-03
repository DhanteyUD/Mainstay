import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ChevronDown, LogIn, UserPlus, AlertTriangle } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { VscGithubInverted } from "react-icons/vsc";
import { useAuth } from "../lib/auth-context";
import logo from "../assets/mainstay-logo.png";

export default function LoginScreen() {
  const { signInWithGoogle, signInWithGitHub, signIn, signUp } = useAuth();

  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(null); // "google" | "github" | "email"
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  async function handleOAuth(provider) {
    setError(null);
    setLoading(provider);
    try {
      if (provider === "google") await signInWithGoogle();
      else await signInWithGitHub();
    } catch (e) {
      setError(e.message || "OAuth sign-in failed.");
      setLoading(null);
    }
  }

  async function handleEmailSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading("email");
    try {
      if (mode === "signin") {
        await signIn(email, password);
      } else {
        const data = await signUp(email, password);
        if (!data?.session) {
          setSuccess("Check your inbox to confirm your email, then sign in.");
          setLoading(null);
          return;
        }
      }
    } catch (e) {
      setError(e.message || "Authentication failed.");
      setLoading(null);
    }
  }

  return (
    <motion.div
      className="fixed inset-0 bg-terminal-bg z-50 flex flex-col items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Background grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,229,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Top glow */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none animate-pulse-glow"
        style={{
          background:
            "radial-gradient(ellipse at center top, rgba(0,229,255,0.07) 0%, transparent 70%)",
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <motion.div
          className="flex items-center justify-center gap-2 mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <img src={logo} alt="Mainstay" className="w-9 h-9" />
          <span className="font-mono font-bold text-xl text-terminal-text tracking-wider">
            Main<span className="text-terminal-accent">stay</span>
          </span>
        </motion.div>

        <motion.div
          className="bg-terminal-card border border-terminal-border rounded-2xl p-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {/* Header */}
          <div className="mb-6 text-center">
            <h1 className="font-mono font-bold text-terminal-text text-sm tracking-widest uppercase">
              Secure Access
            </h1>
            <p className="font-mono text-xs text-terminal-dim mt-1">
              Sign in to continue trading
            </p>
          </div>

          {/* OAuth buttons */}
          <div className="space-y-3 mb-5">
            <OAuthButton
              icon={<FcGoogle size={18} />}
              label="Continue with Google"
              loading={loading === "google"}
              disabled={!!loading}
              onClick={() => handleOAuth("google")}
              accent="terminal-accent"
            />
            <OAuthButton
              icon={<VscGithubInverted size={17} className="text-terminal-text" />}
              label="Continue with GitHub"
              loading={loading === "github"}
              disabled={!!loading}
              onClick={() => handleOAuth("github")}
              accent="terminal-dim"
            />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-terminal-border" />
            <span className="font-mono text-xs text-terminal-dim/50">or</span>
            <div className="flex-1 h-px bg-terminal-border" />
          </div>

          {/* Email toggle */}
          <button
            onClick={() => setShowEmail((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-terminal-border bg-terminal-surface text-terminal-dim hover:border-terminal-accent/30 hover:text-terminal-text transition-all duration-200 font-mono text-xs"
          >
            <span className="flex items-center gap-2">
              <Mail size={13} />
              Email &amp; password
            </span>
            <motion.div animate={{ rotate: showEmail ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={13} />
            </motion.div>
          </button>

          {/* Email form */}
          <AnimatePresence>
            {showEmail && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <form onSubmit={handleEmailSubmit} className="mt-4 space-y-3">
                  {/* Mode toggle */}
                  <div className="flex rounded-lg border border-terminal-border overflow-hidden text-xs font-mono">
                    {["signin", "signup"].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => { setMode(m); setError(null); setSuccess(null); }}
                        className={`flex-1 py-1.5 transition-all duration-200 ${
                          mode === m
                            ? "bg-terminal-accent/10 text-terminal-accent"
                            : "text-terminal-dim hover:text-terminal-text"
                        }`}
                      >
                        {m === "signin" ? "Sign In" : "Sign Up"}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <Mail size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-terminal-dim pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full pl-8 pr-3 py-2.5 rounded-lg border border-terminal-border bg-terminal-surface text-terminal-text font-mono text-xs placeholder:text-terminal-dim/40 focus:outline-none focus:border-terminal-accent/50 transition-colors"
                    />
                  </div>

                  <div className="relative">
                    <Lock size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-terminal-dim pointer-events-none" />
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      required
                      className="w-full pl-8 pr-9 py-2.5 rounded-lg border border-terminal-border bg-terminal-surface text-terminal-text font-mono text-xs placeholder:text-terminal-dim/40 focus:outline-none focus:border-terminal-accent/50 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-terminal-dim hover:text-terminal-text transition-colors"
                    >
                      {showPw ? <EyeOff size={12} /> : <Eye size={12} />}
                    </button>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={!!loading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-mono font-bold text-xs bg-terminal-accent/10 border border-terminal-accent/40 text-terminal-accent hover:bg-terminal-accent/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                  >
                    {loading === "email" ? (
                      <span className="animate-pulse">Authenticating…</span>
                    ) : mode === "signin" ? (
                      <><LogIn size={12} /> Sign In</>
                    ) : (
                      <><UserPlus size={12} /> Create Account</>
                    )}
                  </motion.button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error / success */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 flex items-start gap-2 rounded-lg border border-terminal-red/30 bg-terminal-red/5 px-3 py-2.5"
              >
                <AlertTriangle size={13} className="text-terminal-red shrink-0 mt-px" />
                <p className="font-mono text-xs text-terminal-red leading-snug">{error}</p>
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 rounded-lg border border-terminal-green/30 bg-terminal-green/5 px-3 py-2.5"
              >
                <p className="font-mono text-xs text-terminal-green leading-snug">{success}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Footer note */}
        <motion.p
          className="mt-4 text-center font-mono text-xs text-terminal-dim/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          MEV-protected trading on Solana
        </motion.p>
      </div>
    </motion.div>
  );
}

function OAuthButton({ icon, label, loading, disabled, onClick, accent }) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border font-mono text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
        border-terminal-border bg-terminal-surface text-terminal-text hover:border-terminal-accent/30 hover:bg-terminal-accent/5`}
      whileHover={{ scale: disabled ? 1 : 1.01 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
    >
      <span className="w-5 flex items-center justify-center">{icon}</span>
      <span className="flex-1 text-left text-xs">
        {loading ? <span className="animate-pulse">Redirecting…</span> : label}
      </span>
    </motion.button>
  );
}
