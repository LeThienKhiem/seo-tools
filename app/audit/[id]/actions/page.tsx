"use client";

import { useEffect, useState, use } from "react";
import { AuditSteps } from "@/components/StepNav";
import { Badge } from "@/components/Badge";
import { ToolHeader } from "@/components/ToolHeader";
import {
  Check,
  Copy,
  ArrowRight,
  Download,
  FileCode,
  Sparkles,
  Image as ImageIcon,
  Code2,
  Bot,
  ChevronDown,
} from "lucide-react";

const categoryToTool: Record<string, { href: string; label: string; icon: any }> = {
  schema: { href: "/tools/schema", label: "Schema Builder", icon: FileCode },
  title_meta: { href: "/tools/rewrite", label: "Rewriter", icon: Sparkles },
  social: { href: "/tools/og-image", label: "OG Image Kit", icon: ImageIcon },
  technical: { href: "/tools/robots", label: "Robots / Sitemap", icon: Code2 },
  geo_ai: { href: "/tools/geo", label: "GEO Checker", icon: Bot },
};

interface Action {
  id: string;
  issue_idx: number;
  status: string;
  notes: string | null;
  payload: any;
}

export default function ActionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<{ audit: any; actions: Action[] } | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = async () => {
    const r = await fetch(`/api/audit/${id}/actions`);
    const d = await r.json();
    if (r.ok) setData(d);
  };
  useEffect(() => { load(); }, [id]);

  const updateStatus = async (actionId: string, status: string, notes?: string) => {
    await fetch(`/api/audit/${id}/actions`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actionId, status, notes }),
    });
    await load();
  };

  if (!data) return <div className="skeleton h-40 rounded-xl"/>;

  const completed = data.actions.filter(a=>a.status === "completed").length;
  const total = data.actions.length;
  const progress = total ? Math.round((completed/total)*100) : 0;

  return (
    <div>
      <AuditSteps auditId={id} current={4}/>
      <ToolHeader eyebrow="Step 4 · Take action" title="Action items"
        description="Mỗi issue thành 1 action card. Click 'Open tool' để generate code, hoặc 'Export ticket' để gửi developer."/>

      {/* Progress */}
      <div className="card mb-6">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-eyebrow">Progress</span>
          <span className="text-sm font-medium">{completed}/{total} actions</span>
        </div>
        <div className="h-2 bg-bg rounded-full overflow-hidden">
          <div className="h-full bg-ink rounded-full transition-all duration-500" style={{width: `${progress}%`}}/>
        </div>
      </div>

      {data.actions.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-sm text-muted">No actions for this audit.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.actions.map((a)=>{
            const iss = a.payload;
            const tool = categoryToTool[iss.category];
            const isExpanded = expanded === a.id;
            const isDone = a.status === "completed";
            return (
              <div key={a.id} className={isDone ? "card opacity-60" : "card"}>
                <button
                  onClick={()=>setExpanded(isExpanded ? null : a.id)}
                  className="w-full flex items-start gap-3 text-left"
                >
                  <button
                    onClick={(e)=>{e.stopPropagation(); updateStatus(a.id, isDone ? "pending" : "completed");}}
                    className={isDone
                      ? "w-5 h-5 rounded-full bg-success text-white flex items-center justify-center shrink-0 mt-0.5"
                      : "w-5 h-5 rounded-full border-2 border-border hover:border-ink shrink-0 mt-0.5 transition-colors"
                    }
                    aria-label="toggle done"
                  >
                    {isDone && <Check size={11}/>}
                  </button>
                  <Badge variant={iss.priority==="high"?"danger":iss.priority==="medium"?"warning":"default"}>
                    {iss.priority}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-sm font-medium ${isDone ? "line-through" : ""}`}>{iss.title}</h3>
                    <p className="text-xs text-muted mt-0.5 line-clamp-1">{iss.impact}</p>
                  </div>
                  <ChevronDown size={16} className={`text-muted transition-transform ${isExpanded ? "rotate-180" : ""}`}/>
                </button>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-border space-y-3 animate-slide-up">
                    <div className="text-sm">
                      <span className="text-eyebrow mr-2">Fix</span>
                      <span>{iss.fix}</span>
                    </div>
                    {iss.filePath && (
                      <div className="text-xs text-muted">
                        <FileCode size={11} className="inline mr-1"/>
                        <code className="bg-bg px-1.5 py-0.5 rounded">{iss.filePath}</code>
                      </div>
                    )}
                    {iss.code && (
                      <pre className="code max-h-64">{iss.code}</pre>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      {tool && (
                        <a href={tool.href} className="btn btn-primary text-xs px-3 py-1.5">
                          <tool.icon size={12}/> Open {tool.label} <ArrowRight size={11}/>
                        </a>
                      )}
                      {iss.filePath && iss.code && (
                        <a
                          href={`/tools/patch?file=${encodeURIComponent(iss.filePath)}`}
                          className="btn btn-secondary text-xs px-3 py-1.5"
                        >
                          Apply to project <ArrowRight size={11}/>
                        </a>
                      )}
                      {iss.code && (
                        <CopyButton text={iss.code} label="Copy code"/>
                      )}
                      <ExportTicketButton issue={iss} auditId={id} actionId={a.id}/>
                    </div>

                    <details className="pt-2">
                      <summary className="text-xs text-muted cursor-pointer hover:text-ink">Notes</summary>
                      <textarea
                        defaultValue={a.notes || ""}
                        onBlur={(e)=>updateStatus(a.id, a.status, e.target.value)}
                        placeholder="Internal notes — devops, dev assigned, deploy date, etc."
                        rows={2}
                        className="input mt-2 text-xs"
                      />
                    </details>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-8 mt-8 border-t border-border">
        <a href={`/audit/${id}`} className="btn btn-secondary text-sm">Back to results</a>
        <a href={`/audit/${id}/track`} className="btn btn-primary text-sm">
          Step 5: Track progress <ArrowRight size={14}/>
        </a>
      </div>
    </div>
  );
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={()=>{navigator.clipboard.writeText(text); setCopied(true); setTimeout(()=>setCopied(false), 1500);}}
      className="btn btn-ghost text-xs px-3 py-1.5">
      {copied ? <Check size={12}/> : <Copy size={12}/>}
      {copied ? "Copied" : label}
    </button>
  );
}

function ExportTicketButton({ issue, auditId, actionId }: any) {
  const exportTicket = () => {
    const ticket = {
      ticket_type: "seo_fix",
      audit_id: auditId,
      action_id: actionId,
      priority: issue.priority,
      title: issue.title,
      category: issue.category,
      description: issue.impact,
      fix: issue.fix,
      file_path: issue.filePath || null,
      code: issue.code || null,
      generated_at: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(ticket, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ticket-${actionId.slice(0,8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <button onClick={exportTicket} className="btn btn-ghost text-xs px-3 py-1.5">
      <Download size={12}/> Export ticket
    </button>
  );
}
