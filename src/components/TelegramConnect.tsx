import { Send, Loader2, Check } from "lucide-react";
import { useTelegramLink } from "../hooks/useTelegramLink";
import { notify } from "../lib/toast";

export default function TelegramConnect() {
  const { available, state, username, busy, error, connect, disconnect, sendTest } =
    useTelegramLink();

  if (!available) return null;

  const linked = state === "linked";
  const waiting = state === "pending";

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-terminal-border bg-terminal-surface px-3 py-2.5 font-mono text-xs">
      <Send
        size={14}
        className={linked ? "text-terminal-green" : "text-terminal-accent"}
      />
      <div className="min-w-0 flex-1">
        <div className="font-bold text-terminal-text">
          {linked ? "Telegram alerts on" : "Telegram alerts"}
        </div>
        <div className="text-terminal-dim">
          {linked
            ? `Connected${username ? ` as @${username}` : ""}. Get notified even when Mainstay is closed.`
            : waiting
              ? "Finish in Telegram: tap Start in the chat that just opened."
              : "Get a message when a limit order's target price is hit."}
        </div>
        {error && <div className="mt-1 text-terminal-red">{error}</div>}
      </div>

      {linked ? (
        <div className="flex gap-2">
          <button
            disabled={busy}
            onClick={async () =>
              (await sendTest())
                ? notify.success("Test message sent to Telegram")
                : notify.error("Could not send test message")
            }
            className="rounded-lg border border-terminal-border px-2.5 py-1 text-terminal-dim hover:text-terminal-text disabled:opacity-50"
          >
            Test
          </button>
          <button
            disabled={busy}
            onClick={disconnect}
            className="rounded-lg border border-terminal-border px-2.5 py-1 text-terminal-dim hover:text-terminal-red disabled:opacity-50"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          disabled={busy || waiting}
          onClick={connect}
          className="inline-flex items-center gap-1.5 rounded-lg border border-terminal-accent/40 bg-terminal-accent/10 px-3 py-1.5 font-bold text-terminal-accent hover:bg-terminal-accent/20 disabled:opacity-60"
        >
          {busy || waiting ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Check size={12} />
          )}
          {waiting ? "Waiting…" : "Connect Telegram"}
        </button>
      )}
    </div>
  );
}
