import { ChevronRight } from "lucide-react";
import logo from "../../../assets/mainstay-logo.png";

export default function DocHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-terminal-border bg-terminal-surface/90 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => (window.location.href = "/")}
            className="flex items-center gap-1.5 text-terminal-dim hover:text-terminal-text transition-colors"
          >
            <img src={logo} alt="Mainstay" className="w-6 h-6" />
            <span className="font-mono text-sm font-bold text-terminal-bright">
              Main<span className="text-terminal-accent">stay</span>
            </span>
          </button>
          <ChevronRight size={12} className="text-terminal-bright" />
          <span className="block md:hidden font-mono text-xs text-terminal-dim tracking-wider">
            Doc
          </span>
          <span className="hidden md:block font-mono text-xs text-terminal-dim tracking-wider">
            Documentation
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:block font-mono text-xs text-terminal-dim/80 border border-terminal-border/80 px-2 py-1 rounded tracking-widest">
            v1.0.0
          </span>
          <button
            onClick={() => {
              try {
                localStorage.setItem("mainstay_app_launched", "true");
              } catch {
                /* silent */
              }
              window.location.href = "/";
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono font-bold text-xs bg-terminal-accent text-terminal-bg hover:opacity-85 transition-all"
          >
            LAUNCH APP
          </button>
        </div>
      </div>
    </header>
  );
}
