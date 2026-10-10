import { useEffect, useRef, useState } from "react";
import { Compass, Route, Target } from "lucide-react";
import { TOURS } from "./tours";
import type { TourId } from "./tours";

export default function GuideMenu({
  onStart,
}: {
  onStart: (id: TourId) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const icons: Record<TourId, React.ReactNode> = {
    app: <Compass size={14} className="text-terminal-accent" />,
    predict: <Target size={14} className="text-terminal-accent" />,
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title="Walkthroughs"
        data-tour="guide"
        className="flex items-center gap-1.5 rounded-lg border border-terminal-border bg-terminal-card px-2.5 py-1.5 text-terminal-dim transition-all duration-200 hover:border-terminal-accent/40 hover:text-terminal-accent"
      >
        <Route size={11} />
        <span className="hidden font-mono text-xs tracking-wider sm:inline">
          GUIDE
        </span>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-terminal-border bg-terminal-card p-1.5 shadow-2xl">
          {(Object.keys(TOURS) as TourId[]).map((id) => (
            <button
              key={id}
              onClick={() => {
                setOpen(false);
                onStart(id);
              }}
              className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-terminal-surface"
            >
              <span className="mt-0.5">{icons[id]}</span>
              <span>
                <span className="block font-mono text-xs font-bold text-terminal-text">
                  {TOURS[id].label}
                </span>
                <span className="block font-mono text-[11px] text-terminal-dim">
                  {TOURS[id].blurb}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
