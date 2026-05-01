import React, { useState, useCallback } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  LayoutGrid,
  GripVertical,
  Eye,
  EyeOff,
  RotateCcw,
  Check,
  X,
} from "lucide-react";

export const WIDGET_DEFS = [
  { id: "wallet", label: "Wallet Card" },
  { id: "chart", label: "Price Chart" },
  { id: "trading", label: "Trading Panel" },
];

const STORAGE_KEY = "mainstay_dashboard_layout";
const DEFAULT_ORDER = WIDGET_DEFS.map((w) => w.id);
const DEFAULT_VISIBILITY = Object.fromEntries(WIDGET_DEFS.map((w) => [w.id, true]));

function loadStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function useDashboardLayout() {
  const stored = loadStored();

  const [order, setOrder] = useState(() => {
    if (!stored?.order) return DEFAULT_ORDER;
    const valid = stored.order.filter((id) => DEFAULT_ORDER.includes(id));
    const missing = DEFAULT_ORDER.filter((id) => !valid.includes(id));
    return [...valid, ...missing];
  });

  const [visibility, setVisibility] = useState(() => ({
    ...DEFAULT_VISIBILITY,
    ...(stored?.visibility ?? {}),
  }));

  const saveLayout = useCallback((newOrder, newVisibility) => {
    setOrder(newOrder);
    setVisibility(newVisibility);
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ order: newOrder, visibility: newVisibility })
      );
    } catch {}
  }, []);

  return { order, visibility, saveLayout };
}

export default function DashboardCustomizer({ order, visibility, onSave }) {
  const [open, setOpen] = useState(false);
  const [draftOrder, setDraftOrder] = useState(order);
  const [draftVisibility, setDraftVisibility] = useState(visibility);

  function openPanel() {
    setDraftOrder([...order]);
    setDraftVisibility({ ...visibility });
    setOpen(true);
  }

  function handleSave() {
    onSave(draftOrder, draftVisibility);
    setOpen(false);
  }

  function handleReset() {
    setDraftOrder([...DEFAULT_ORDER]);
    setDraftVisibility({ ...DEFAULT_VISIBILITY });
  }

  function toggleVisibility(id) {
    setDraftVisibility((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <>
      {/* Floating button */}
      <div className="fixed bottom-6 left-6 z-[1500]">
        <AnimatePresence>
          {!open && (
            <motion.button
              key="customize-btn"
              onClick={openPanel}
              className="flex items-center gap-2 px-2.5 sm:px-4 py-2.5 rounded-full border border-terminal-border shadow-lg backdrop-blur-sm bg-terminal-surface/90 font-mono text-xs text-terminal-dim hover:text-terminal-green hover:border-terminal-green/40 transition-colors"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <LayoutGrid size={13} />
              <span className="hidden sm:flex tracking-wide whitespace-nowrap">Customize</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-[1400] bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Side panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            className="fixed right-0 top-0 h-full z-[1500] w-full sm:w-72 bg-terminal-bg border-l border-terminal-border flex flex-col shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-terminal-border">
              <div className="flex items-center gap-2">
                <LayoutGrid size={13} className="text-terminal-green" />
                <span className="font-mono font-bold text-xs tracking-wider text-terminal-green">
                  CUSTOMIZE LAYOUT
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-terminal-dim hover:text-terminal-text transition-colors p-1 rounded"
              >
                <X size={14} />
              </button>
            </div>

            {/* Instructions */}
            <div className="px-4 py-3 border-b border-terminal-border/50">
              <p className="font-mono text-[10px] text-terminal-dim leading-relaxed">
                Drag to reorder · click{" "}
                <Eye size={9} className="inline mb-0.5" /> to show / hide
              </p>
            </div>

            {/* Sortable list */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <Reorder.Group
                axis="y"
                values={draftOrder}
                onReorder={setDraftOrder}
                className="flex flex-col gap-2"
              >
                {draftOrder.map((id) => {
                  const def = WIDGET_DEFS.find((w) => w.id === id);
                  if (!def) return null;
                  const visible = draftVisibility[id];
                  return (
                    <Reorder.Item
                      key={id}
                      value={id}
                      className={`flex items-center gap-3 rounded-xl px-3 py-3 border select-none transition-colors ${
                        visible
                          ? "bg-terminal-card border-terminal-border cursor-grab active:cursor-grabbing"
                          : "bg-terminal-bg border-terminal-border/40 cursor-grab active:cursor-grabbing opacity-50"
                      }`}
                      whileDrag={{
                        scale: 1.03,
                        boxShadow: "0 0 24px rgba(0,229,255,0.12)",
                        zIndex: 999,
                      }}
                    >
                      <GripVertical
                        size={14}
                        className="text-terminal-dim/40 shrink-0"
                      />
                      <span className="font-mono text-xs text-terminal-text flex-1">
                        {def.label}
                      </span>
                      <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleVisibility(id);
                        }}
                        className={`shrink-0 p-1 rounded transition-colors ${
                          visible
                            ? "text-terminal-green hover:text-terminal-green/60"
                            : "text-terminal-dim/30 hover:text-terminal-dim"
                        }`}
                      >
                        {visible ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                    </Reorder.Item>
                  );
                })}
              </Reorder.Group>
            </div>

            {/* Footer */}
            <div className="px-4 py-4 border-t border-terminal-border flex flex-col gap-2">
              <motion.button
                onClick={handleSave}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-terminal-green/10 border border-terminal-green/40 rounded-xl font-mono text-xs text-terminal-green hover:bg-terminal-green/20 transition-colors"
                whileTap={{ scale: 0.98 }}
              >
                <Check size={13} />
                Save Layout
              </motion.button>
              <motion.button
                onClick={handleReset}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-terminal-card border border-terminal-border rounded-xl font-mono text-xs text-terminal-dim hover:text-terminal-text transition-colors"
                whileTap={{ scale: 0.98 }}
              >
                <RotateCcw size={13} />
                Reset to Default
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
