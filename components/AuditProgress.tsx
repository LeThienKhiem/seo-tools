"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";

interface Phase {
  id: string;
  label: string;
  detail: string;
  matchers: RegExp[]; // log patterns indicating this phase started
}

const PHASES: Phase[] = [
  {
    id: "init",
    label: "Khởi động",
    detail: "Chuẩn bị môi trường audit",
    matchers: [/Starting audit/i],
  },
  {
    id: "fetch",
    label: "Fetch trang",
    detail: "Tải HTML và parse cấu trúc",
    matchers: [/Fetching homepage/i, /Parsed:/i],
  },
  {
    id: "crawl",
    label: "Crawl metadata",
    detail: "robots.txt, sitemap, schema",
    matchers: [/Fetching robots/i, /Fetching sitemap/i, /Sitemap:/i],
  },
  {
    id: "ai",
    label: "Claude phân tích",
    detail: "Đánh giá 10 category SEO + sinh fix",
    matchers: [/Sending data to Claude/i],
  },
  {
    id: "finalize",
    label: "Hoàn tất",
    detail: "Lưu báo cáo, đo điểm",
    matchers: [/Received response/i, /Audit completed/i],
  },
];

function detectCurrentPhase(logs: string[]): number {
  // Find the highest-indexed phase whose matcher hits the most recent logs
  let phase = 0;
  for (let i = PHASES.length - 1; i >= 0; i--) {
    const p = PHASES[i];
    for (const log of logs) {
      if (p.matchers.some((m) => m.test(log))) {
        return Math.max(phase, i);
      }
    }
  }
  return phase;
}

export function AuditProgress({
  logs,
  status,
  startedAt,
}: {
  logs: string[];
  status: string;
  startedAt: number;
}) {
  const [elapsed, setElapsed] = useState(0);
  const phaseIdx = detectCurrentPhase(logs);
  const isRunning = status === "pending" || status === "running";
  const isDone = status === "completed";

  useEffect(() => {
    if (!isRunning) return;
    const tick = () => setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, [isRunning, startedAt]);

  const completedPhases = isDone ? PHASES.length : phaseIdx;
  const progressPct = isDone ? 100 : ((phaseIdx + 0.5) / PHASES.length) * 100;

  const fmt = (s: number) => {
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    return `${m}m ${s % 60}s`;
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          {isRunning ? (
            <>
              <Loader2 size={16} className="animate-spin text-ink" />
              <span className="font-medium text-sm">Đang phân tích…</span>
            </>
          ) : isDone ? (
            <>
              <Check size={16} className="text-success" />
              <span className="font-medium text-sm">Hoàn tất</span>
            </>
          ) : (
            <span className="font-medium text-sm">Trạng thái: {status}</span>
          )}
        </div>
        <div className="text-xs font-mono text-muted tabular-nums">
          {fmt(elapsed)}
        </div>
      </div>

      {/* Animated progress bar */}
      <div className="relative h-1 bg-bg rounded-full overflow-hidden mb-6">
        <div
          className="absolute inset-y-0 left-0 bg-ink rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progressPct}%` }}
        />
        {isRunning && (
          <div
            className="absolute inset-y-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            style={{
              width: "30%",
              animation: "shimmer 1.5s linear infinite",
              transform: `translateX(${progressPct - 30}%)`,
            }}
          />
        )}
      </div>

      {/* Phase steps */}
      <div className="grid grid-cols-5 gap-2 mb-5">
        {PHASES.map((p, i) => {
          const isPast = i < completedPhases;
          const isCurrent = isRunning && i === phaseIdx;
          return (
            <div key={p.id} className="text-center">
              <div className="flex justify-center mb-2">
                <div
                  className={
                    isPast
                      ? "w-6 h-6 rounded-full bg-success text-white flex items-center justify-center text-xs"
                      : isCurrent
                      ? "w-6 h-6 rounded-full bg-ink text-bg flex items-center justify-center text-xs relative"
                      : "w-6 h-6 rounded-full bg-bg border border-border text-subtle flex items-center justify-center text-xs"
                  }
                >
                  {isPast ? (
                    <Check size={12} />
                  ) : isCurrent ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-bg animate-pulse" />
                  ) : (
                    i + 1
                  )}
                  {isCurrent && (
                    <span className="absolute -inset-1 rounded-full border-2 border-ink/30 animate-ping" />
                  )}
                </div>
              </div>
              <div
                className={
                  isCurrent
                    ? "text-xs font-medium text-ink"
                    : isPast
                    ? "text-xs text-muted"
                    : "text-xs text-subtle"
                }
              >
                {p.label}
              </div>
              {isCurrent && (
                <div className="text-[10px] text-muted mt-1 animate-pulse">
                  {p.detail}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Live log tail */}
      {logs.length > 0 && (
        <details className="border-t border-border pt-4" open={isRunning}>
          <summary className="text-eyebrow cursor-pointer hover:text-ink select-none">
            Live log ({logs.length} dòng)
          </summary>
          <pre className="mt-3 text-[11px] leading-relaxed text-muted font-mono max-h-48 overflow-y-auto p-3 bg-bg rounded-lg border border-border">
            {logs.slice(-15).join("\n")}
          </pre>
        </details>
      )}

      {/* Hint khi chậm */}
      {isRunning && elapsed > 45 && phaseIdx === 3 && (
        <div className="mt-4 text-xs text-muted bg-amber-50/50 border border-amber-200 rounded-lg px-3 py-2 animate-fade-in">
          ⏱ Claude đang xử lý lượng lớn dữ liệu. Bình thường mất 30–90 giây cho phân tích đầy đủ.
        </div>
      )}
    </div>
  );
}
