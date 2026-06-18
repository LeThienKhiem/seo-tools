"use client";

export function ScoreRing({
  value,
  size = 120,
  stroke = 8,
  label,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  const color = value >= 80 ? "var(--success)" : value >= 50 ? "var(--warning)" : "var(--danger)";

  return (
    <div className="inline-flex items-center justify-center relative">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--border)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-serif text-3xl" style={{ color }}>
          {value}
        </span>
        {label && <span className="text-[10px] text-muted uppercase tracking-wider mt-0.5">{label}</span>}
      </div>
    </div>
  );
}

export function ScoreBar({ value, label }: { value: number; label: string }) {
  const color = value >= 80 ? "var(--success)" : value >= 50 ? "var(--warning)" : "var(--danger)";
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-sm text-ink">{label}</span>
        <span className="font-mono text-sm font-medium" style={{ color }}>
          {value}
        </span>
      </div>
      <div className="h-1.5 bg-bg rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
    </div>
  );
}
