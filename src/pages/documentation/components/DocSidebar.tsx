import type { Section } from "../types";

interface DocSidebarProps {
  sections: Section[];
  active: string;
  onSelect: (id: string) => void;
}

export default function DocSidebar({ sections, active, onSelect }: DocSidebarProps) {
  return (
    <aside className="hidden md:flex flex-col gap-1 w-52 shrink-0 sticky top-[4.5rem] self-start max-h-[calc(100vh-6rem)] overflow-y-auto pr-2">
      <p className="font-mono text-[10px] text-terminal-dim/80 tracking-[0.2em] uppercase mb-2 px-2">
        Contents
      </p>
      {sections.map((s) => (
        <button
          key={s.id}
          onClick={() => onSelect(s.id)}
          className={`flex items-center gap-2 px-2 py-1.5 rounded-lg font-mono text-xs transition-all text-left ${
            active === s.id
              ? "bg-terminal-accent/10 text-terminal-accent border border-terminal-accent/20"
              : "text-terminal-dim/60 hover:text-terminal-dim hover:bg-terminal-card"
          }`}
        >
          <span className={active === s.id ? "text-terminal-accent" : "text-terminal-dim/40"}>
            {s.icon}
          </span>
          {s.label}
        </button>
      ))}
    </aside>
  );
}
