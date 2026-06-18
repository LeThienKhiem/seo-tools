"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check } from "lucide-react";

interface Step {
  num: number;
  label: string;
  href: string;
  active?: boolean;
  done?: boolean;
}

export function StepNav({ steps }: { steps: Step[] }) {
  return (
    <div className="flex items-center gap-0 mb-8 overflow-x-auto pb-1">
      {steps.map((s, i) => {
        const isLast = i === steps.length - 1;
        return (
          <div key={s.num} className="flex items-center shrink-0">
            <Link
              href={s.href}
              className="flex items-center gap-2 group"
            >
              <div
                className={
                  s.done
                    ? "w-6 h-6 rounded-full bg-success text-white flex items-center justify-center text-xs font-medium"
                    : s.active
                    ? "w-6 h-6 rounded-full bg-ink text-bg flex items-center justify-center text-xs font-medium"
                    : "w-6 h-6 rounded-full bg-bg border border-border text-subtle flex items-center justify-center text-xs font-medium"
                }
              >
                {s.done ? <Check size={12} /> : s.num}
              </div>
              <span
                className={
                  s.active
                    ? "text-sm font-medium text-ink"
                    : s.done
                    ? "text-sm text-muted"
                    : "text-sm text-subtle group-hover:text-muted transition-colors"
                }
              >
                {s.label}
              </span>
            </Link>
            {!isLast && <div className="w-8 md:w-12 h-px bg-border mx-3" />}
          </div>
        );
      })}
    </div>
  );
}

export function GlobalSteps({ current }: { current: number }) {
  return (
    <StepNav
      steps={[
        { num: 1, label: "Setup", href: "/setup", active: current === 1, done: current > 1 },
        { num: 2, label: "Audit", href: "/", active: current === 2, done: current > 2 },
      ]}
    />
  );
}

export function AuditSteps({
  auditId,
  current,
}: {
  auditId: string;
  current: 3 | 4 | 5;
}) {
  return (
    <StepNav
      steps={[
        { num: 1, label: "Setup", href: "/setup", done: true },
        { num: 2, label: "Audit", href: "/", done: true },
        {
          num: 3,
          label: "Results",
          href: `/audit/${auditId}`,
          active: current === 3,
          done: current > 3,
        },
        {
          num: 4,
          label: "Actions",
          href: `/audit/${auditId}/actions`,
          active: current === 4,
          done: current > 4,
        },
        {
          num: 5,
          label: "Track",
          href: `/audit/${auditId}/track`,
          active: current === 5,
        },
      ]}
    />
  );
}
