import { ExternalLink, ChevronRight } from "lucide-react";

export function SectionHeader({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-5 pb-3 border-b border-terminal-border/50">
      <span className="text-terminal-accent">{icon}</span>
      <h2 className="text-base font-bold tracking-wide text-terminal-text">
        {title}
      </h2>
    </div>
  );
}

export function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-bold tracking-widest text-terminal-dim uppercase mb-2 mt-5">
      {children}
    </h3>
  );
}

export function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="bg-terminal-card border border-terminal-border px-1.5 py-0.5 rounded text-terminal-accent text-xs">
      {children}
    </code>
  );
}

export function ExternalAnchor({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-0.5 text-terminal-accent hover:underline"
    >
      {children}
      <ExternalLink size={10} className="inline" />
    </a>
  );
}

export function CallOut({
  type,
  children,
}: {
  type: "tip" | "info" | "warning";
  children: React.ReactNode;
}) {
  const styles = {
    tip: "border-terminal-green/30 bg-terminal-green/5 text-terminal-green",
    info: "border-terminal-accent/30 bg-terminal-accent/5 text-terminal-accent",
    warning:
      "border-terminal-yellow/30 bg-terminal-yellow/5 text-terminal-yellow",
  };
  const labels = { tip: "TIP", info: "INFO", warning: "WARNING" };
  return (
    <div className={`border rounded-xl p-4 mt-4 mb-2 ${styles[type]}`}>
      <span className="text-[10px] font-bold tracking-widest block mb-1">
        {labels[type]}
      </span>
      <p className="text-xs text-terminal-dim leading-relaxed">{children}</p>
    </div>
  );
}

export function Steps({ items }: { items: { title: string; desc: string }[] }) {
  return (
    <ol className="space-y-4 mb-4">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span className="flex-none flex items-center justify-center w-5 h-5 rounded-full bg-terminal-accent/15 text-terminal-accent text-[10px] font-bold mt-0.5">
            {i + 1}
          </span>
          <div>
            <p className="text-sm font-semibold text-terminal-text">
              {item.title}
            </p>
            <p className="text-xs text-terminal-dim mt-0.5">{item.desc}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function FeatureGrid({
  items,
}: {
  items: { icon: React.ReactNode; title: string; desc: string }[];
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
      {items.map((item) => (
        <div
          key={item.title}
          className="bg-terminal-card border border-terminal-border rounded-xl p-4 flex gap-3"
        >
          <span className="mt-0.5 shrink-0">{item.icon}</span>
          <div>
            <p className="text-xs font-bold text-terminal-text mb-1">
              {item.title}
            </p>
            <p className="text-xs text-terminal-dim leading-relaxed">
              {item.desc}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 mb-4">
      {items.map((item) => (
        <li
          key={item}
          className="flex items-start gap-2 text-xs md:text-sm text-terminal-dim"
        >
          <ChevronRight
            size={12}
            className="text-terminal-accent mt-0.5 shrink-0"
          />
          {item}
        </li>
      ))}
    </ul>
  );
}

export function NamedBulletList({
  items,
}: {
  items: { name: string; desc: string }[];
}) {
  return (
    <ul className="space-y-2 mb-4">
      {items.map((w) => (
        <li key={w.name} className="flex items-start gap-2 text-xs md:text-sm">
          <ChevronRight
            size={12}
            className="text-terminal-accent mt-0.5 shrink-0"
          />
          <span>
            <strong className="text-terminal-text">{w.name}</strong>{" "}
            <span className="text-terminal-dim">— {w.desc}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
