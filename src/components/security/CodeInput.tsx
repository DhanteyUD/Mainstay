import { useEffect, useRef } from "react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onComplete: (code: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

export default function CodeInput({
  value,
  onChange,
  onComplete,
  disabled,
  autoFocus,
}: Props) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  const set = (raw: string) => {
    const v = raw.replace(/\D/g, "").slice(0, 6);
    onChange(v);
    if (v.length === 6) onComplete(v);
  };

  return (
    <div className="relative cursor-text" onClick={() => ref.current?.focus()}>
      <input
        ref={ref}
        value={value}
        disabled={disabled}
        onChange={(e) => set(e.target.value)}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        aria-label="6-digit authentication code"
        className="absolute inset-0 h-full w-full opacity-0"
      />
      <div className="grid grid-cols-6 gap-2">
        {Array.from({ length: 6 }).map((_, i) => {
          const active = i === Math.min(value.length, 5) && !disabled;
          return (
            <div
              key={i}
              className={`flex h-14 items-center justify-center rounded-xl border bg-white/5 font-mono text-2xl font-black text-white transition-colors ${
                active
                  ? "border-terminal-accent shadow-[0_0_14px_rgba(0,229,255,0.35)]"
                  : "border-white/15"
              } ${disabled ? "opacity-60" : ""}`}
            >
              {value[i] ?? ""}
            </div>
          );
        })}
      </div>
    </div>
  );
}
