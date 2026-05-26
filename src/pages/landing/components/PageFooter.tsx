import { BookOpen } from "lucide-react";

export default function PageFooter() {
  return (
    <footer className="relative z-10 border-t border-terminal-border/40 py-8 px-4">
      <div className="max-w-6xl mx-auto text-center flex flex-col items-center justify-center gap-6 flex-wrap">
        <div className="font-dm-mono font-black text-xl text-terminal-text">
          Main<span className="text-terminal-accent">stay</span>
        </div>
        <div className="flex items-center justify-center gap-6 flex-wrap">
          <a
            href="https://mainstay.pro"
            className="font-dm-mono text-xs text-terminal-dim/50 hover:text-terminal-dim transition-colors"
          >
            mainstay.pro
          </a>
          <a
            href="/documentation"
            className="font-dm-mono text-xs text-terminal-dim/50 hover:text-terminal-dim transition-colors flex items-center gap-1.5"
          >
            <BookOpen size={12} />
            Documentation
          </a>
          <a
            href="https://dflow.net"
            target="_blank"
            rel="noopener noreferrer"
            className="font-dm-mono text-xs text-terminal-dim/50 hover:text-terminal-dim transition-colors"
          >
            DFlow Protocol
          </a>
          <span className="font-dm-mono text-xs text-terminal-dim/25">
            Powered by DFlow Protocol · MIT License
          </span>
        </div>
      </div>
    </footer>
  );
}
