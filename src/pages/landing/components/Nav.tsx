import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";
import logo from "../../../assets/mainstay-logo.png";
import type { Props } from "../types";

export default function Nav({ onLaunch }: Props) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-terminal-border/50 bg-terminal-bg/85 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Mainstay" className="w-7 h-7" />
          <span className="font-dm-mono font-bold text-base text-terminal-text tracking-wider">
            Main<span className="text-terminal-accent">stay</span>
          </span>
        </div>
        <div className="flex items-center">
          <span className="hidden sm:block font-dm-mono text-xs text-terminal-dim/50 border border-terminal-border/50 px-2.5 py-1 rounded tracking-widest">
            Powered by DFlow Protocol
          </span>
        </div>
        <div className="flex items-center gap-5">
          <a
            href="/documentation"
            className="hidden sm:flex items-center gap-1.5 font-dm-mono text-xs text-terminal-dim hover:text-terminal-text transition-colors"
          >
            <BookOpen size={14} />
            Documentation
          </a>
          <motion.button
            onClick={onLaunch}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-dm-mono font-bold text-xs bg-terminal-accent text-terminal-bg hover:opacity-85 transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            LAUNCH APP
          </motion.button>
        </div>
      </div>
    </nav>
  );
}
