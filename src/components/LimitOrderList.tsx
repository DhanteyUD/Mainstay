import React, { useEffect, useState } from "react";
import {
  ExternalLink,
  Pencil,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Target,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { LimitOrder } from "../types";

type OrderStatus = LimitOrder["status"];

interface StatusConfig {
  label: string;
  color: string;
  bg: string;
  border: string;
  Icon: React.ComponentType<{ size?: number | string; className?: string }>;
}

const STATUS: Record<OrderStatus, StatusConfig> = {
  pending: {
    label: "Pending",
    color: "text-terminal-yellow",
    bg: "bg-terminal-yellow/10",
    border: "border-terminal-yellow/30",
    Icon: Clock,
  },
  executing: {
    label: "Executing",
    color: "text-terminal-accent",
    bg: "bg-terminal-accent/10",
    border: "border-terminal-accent/30",
    Icon: Loader2,
  },
  executed: {
    label: "Executed",
    color: "text-terminal-green",
    bg: "bg-terminal-green/10",
    border: "border-terminal-green/30",
    Icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelled",
    color: "text-terminal-dim",
    bg: "bg-terminal-surface",
    border: "border-terminal-border",
    Icon: XCircle,
  },
  failed: {
    label: "Failed",
    color: "text-terminal-red",
    bg: "bg-terminal-red/10",
    border: "border-terminal-red/30",
    Icon: AlertCircle,
  },
};

interface TabDef {
  id: string;
  label: string;
}

const TABS: TabDef[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "executed", label: "Executed" },
  { id: "cancelled", label: "Cancelled" },
];

function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtUsd(n: number | null | undefined): string {
  return (
    n?.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }) ?? "—"
  );
}

interface LimitOrderListProps {
  orders: LimitOrder[];
  currentPrices: Record<string, { usdPrice?: number }>;
  onCancel: (id: string) => void;
  onEdit: (
    id: string,
    values: { targetPrice: string; inputAmount: string },
  ) => Promise<{ ok: boolean; error?: string }>;
}

export default function LimitOrderList({
  orders,
  currentPrices,
  onCancel,
  onEdit,
}: LimitOrderListProps) {
  const [activeTab, setActiveTab] = useState("all");

  const counts = {
    pending: orders.filter((o) => o.status === "pending").length,
    executed: orders.filter((o) => o.status === "executed").length,
  };

  const filtered = orders.filter((o) => {
    if (activeTab === "all") return true;
    if (activeTab === "cancelled")
      return o.status === "cancelled" || o.status === "failed";
    return o.status === activeTab;
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-terminal-card border border-terminal-border rounded-xl p-1">
        {TABS.map((tab) => {
          const badge =
            tab.id === "pending"
              ? counts.pending
              : tab.id === "executed"
                ? counts.executed
                : null;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1 py-2 px-2 rounded-lg border font-mono text-xs font-bold tracking-wider transition-all duration-150 ${
                activeTab === tab.id
                  ? "bg-terminal-surface border border-terminal-border text-terminal-text"
                  : "text-terminal-dim hover:text-terminal-text border-transparent"
              }`}
            >
              <span>{tab.label}</span>
              <AnimatePresence>
                {badge != null && badge > 0 && (
                  <motion.span
                    className={`inline-flex items-center justify-center min-w-[14px] h-3.5 px-1 rounded-full text-xs leading-none font-bold ${
                      tab.id === "pending"
                        ? "bg-terminal-yellow/20 text-terminal-yellow"
                        : "bg-terminal-green/20 text-terminal-green"
                    }`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  >
                    {badge > 99 ? "99+" : badge}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-14">
          <Target size={30} className="text-terminal-border mx-auto mb-3" />
          <p className="font-mono text-sm text-terminal-dim">
            No {activeTab === "all" ? "" : activeTab + " "}orders
          </p>
          <p className="font-mono text-xs text-terminal-dim/50 mt-1">
            {activeTab === "all" || activeTab === "pending"
              ? "Create a limit order to get started"
              : "Nothing here yet"}
          </p>
        </div>
      ) : (
        <div className="overflow-y-auto max-h-[700px] pr-1 scrollbar-thin scrollbar-thumb-terminal-border scrollbar-track-transparent">
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {filtered.map((order) => (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <OrderRow
                    order={order}
                    currentPrice={
                      currentPrices[order.inputToken.mint]?.usdPrice
                    }
                    onCancel={onCancel}
                    onEdit={onEdit}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}

interface OrderRowProps {
  order: LimitOrder;
  currentPrice: number | undefined;
  onCancel: (id: string) => void;
  onEdit: LimitOrderListProps["onEdit"];
}

function OrderRow({ order, currentPrice, onCancel, onEdit }: OrderRowProps) {
  const cfg = STATUS[order.status] ?? STATUS.pending;
  const { Icon } = cfg;

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [draftTarget, setDraftTarget] = useState("");
  const [draftAmount, setDraftAmount] = useState("");

  useEffect(() => {
    if (order.status !== "pending") setEditing(false);
  }, [order.status]);

  const startEdit = () => {
    setDraftTarget(String(order.targetPrice));
    setDraftAmount(String(order.inputAmount));
    setEditError(null);
    setEditing(true);
  };

  const saveEdit = async () => {
    setSaving(true);
    setEditError(null);
    const res = await onEdit(order.id, {
      targetPrice: draftTarget,
      inputAmount: draftAmount,
    });
    setSaving(false);
    if (res.ok) setEditing(false);
    else setEditError(res.error ?? "Could not save the change.");
  };

  const progressPct =
    currentPrice != null && order.targetPrice > 0
      ? order.direction === "above"
        ? Math.min(Math.max((currentPrice / order.targetPrice) * 100, 0), 100)
        : Math.min(Math.max((order.targetPrice / currentPrice) * 100, 0), 100)
      : null;

  const pctFromTarget =
    currentPrice != null
      ? ((currentPrice / order.targetPrice - 1) * 100).toFixed(1)
      : null;

  return (
    <div className={`rounded-xl border ${cfg.border} ${cfg.bg} p-3.5`}>
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5 min-w-0">
          {order.inputToken.logo && (
            <img
              src={order.inputToken.logo}
              alt={order.inputToken.symbol}
              className="w-5 h-5 rounded-full shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          )}
          <span className="font-mono font-bold text-sm text-terminal-text">
            {order.inputToken.symbol}
          </span>
          <span className="text-terminal-dim text-xs">→</span>
          {order.outputToken.logo && (
            <img
              src={order.outputToken.logo}
              alt={order.outputToken.symbol}
              className="w-5 h-5 rounded-full shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          )}
          <span className="font-mono font-bold text-sm text-terminal-text">
            {order.outputToken.symbol}
          </span>
        </div>

        <div
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full border shrink-0 ${cfg.border} ${cfg.bg}`}
        >
          <Icon
            size={10}
            className={`${cfg.color} ${order.status === "executing" ? "animate-spin" : ""}`}
          />
          <span className={`font-mono text-xs font-bold ${cfg.color}`}>
            {cfg.label}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-mono mb-2.5">
        <div>
          <div className="text-terminal-dim mb-0.5">Amount</div>
          <div className="text-terminal-text font-semibold">
            {order.inputAmount} {order.inputToken.symbol}
          </div>
        </div>
        <div>
          <div className="text-terminal-dim mb-0.5">Target price</div>
          <div className="text-terminal-text font-semibold">
            ${fmtUsd(order.targetPrice)}{" "}
            <span
              className={`text-xs font-normal ${order.direction === "above" ? "text-terminal-green" : "text-terminal-yellow"}`}
            >
              ↑ {order.direction}
            </span>
          </div>
        </div>

        {currentPrice != null && order.status === "pending" && (
          <div className="col-span-2">
            <div className="text-terminal-dim mb-0.5">Current price</div>
            <div className="text-terminal-accent font-semibold">
              ${fmtUsd(currentPrice)}{" "}
              <span className="text-terminal-dim/60 font-normal">
                ({pctFromTarget != null ? Math.abs(Number(pctFromTarget)) : "—"}
                %{" "}
                {pctFromTarget != null && Number(pctFromTarget) >= 0
                  ? "above"
                  : "below"}{" "}
                target)
              </span>
            </div>
          </div>
        )}

        {order.status === "executing" && (
          <div className="col-span-2 flex items-center gap-1.5">
            <Loader2 size={10} className="text-terminal-accent animate-spin" />
            <span className="text-terminal-accent">
              Price hit — approve in your wallet
            </span>
          </div>
        )}

        {order.executedAt && (
          <div className="col-span-2">
            <div className="text-terminal-dim mb-0.5">Executed</div>
            <div className="text-terminal-text">{fmt(order.executedAt)}</div>
          </div>
        )}

        {order.error && (
          <div className="col-span-2">
            <div className="text-terminal-dim mb-0.5">Error</div>
            <div className="text-terminal-red break-words">{order.error}</div>
          </div>
        )}
      </div>

      {order.status === "pending" && progressPct != null && (
        <div className="mb-2.5">
          <div className="h-1 bg-terminal-border rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${order.direction === "above" ? "bg-terminal-green" : "bg-terminal-yellow"}`}
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs font-mono text-terminal-dim/50">
            <span>$0</span>
            <span>target ${fmtUsd(order.targetPrice)}</span>
          </div>
        </div>
      )}

      {editing && (
        <div className="mb-2.5 rounded-lg border border-terminal-border bg-terminal-surface p-3 font-mono text-xs">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-terminal-dim">
                Amount ({order.inputToken.symbol})
              </span>
              <input
                type="number"
                min="0"
                value={draftAmount}
                onChange={(e) => setDraftAmount(e.target.value)}
                className="w-full rounded-md border border-terminal-border bg-terminal-bg px-2 py-1.5 text-terminal-text outline-none focus:border-terminal-yellow/50"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-terminal-dim">
                Target price (USD)
              </span>
              <input
                type="number"
                min="0"
                value={draftTarget}
                onChange={(e) => setDraftTarget(e.target.value)}
                className="w-full rounded-md border border-terminal-border bg-terminal-bg px-2 py-1.5 text-terminal-text outline-none focus:border-terminal-yellow/50"
              />
            </label>
          </div>
          {editError && <div className="mt-2 text-terminal-red">{editError}</div>}
          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={() => setEditing(false)}
              disabled={saving}
              className="rounded-md border border-terminal-border px-3 py-1 text-terminal-dim hover:text-terminal-text disabled:opacity-50"
            >
              Discard
            </button>
            <button
              onClick={saveEdit}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-md bg-terminal-yellow px-3 py-1 font-bold text-black hover:bg-terminal-yellow/85 disabled:opacity-60"
            >
              {saving && <Loader2 size={10} className="animate-spin" />}
              Save
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-0.5">
        <span className="font-mono text-xs text-terminal-dim/50">
          {fmt(order.createdAt)}
        </span>
        <div className="flex items-center gap-3">
          {order.explorerUrl && (
            <a
              href={order.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-terminal-accent text-xs font-mono hover:underline"
            >
              <ExternalLink size={10} />
              <span>View tx</span>
            </a>
          )}
          {order.status === "pending" && !editing && (
            <button
              onClick={startEdit}
              className="flex items-center gap-1 text-terminal-dim hover:text-terminal-accent text-xs font-mono transition-colors"
            >
              <Pencil size={10} />
              <span>Edit</span>
            </button>
          )}
          {order.status === "pending" && (
            <button
              onClick={() => onCancel(order.id)}
              className="flex items-center gap-1 text-terminal-dim hover:text-terminal-red text-xs font-mono transition-colors"
            >
              <X size={10} />
              <span>Cancel</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
