"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { AuditSteps } from "@/components/StepNav";
import { ToolHeader } from "@/components/ToolHeader";
import { Badge } from "@/components/Badge";
import { ScoreRing } from "@/components/Score";
import {
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
} from "lucide-react";

export default function TrackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [current, setCurrent] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [actions, setActions] = useState<any[]>([]);
  const [reauditing, setReauditing] = useState(false);

  const load = async () => {
    const r = await fetch(`/api/audit/${id}`);
    const d = await r.json();
    setCurrent(d);
    const a = await fetch(`/api/audit/${id}/actions`);
    const ad = await a.json();
    if (a.ok) setActions(ad.actions || []);
    // Load history for same URL
    if (d.url) {
      const list = await fetch("/api/audit");
      const ld = await list.json();
      const same = (ld.audits || []).filter((x:any) => x.url === d.url);
      setHistory(same);
    }
  };
  useEffect(() => { load(); }, [id]);

  const reaudit = async () => {
    setReauditing(true);
    try {
      const r = await fetch(`/api/audit/${id}/reaudit`, { method: "POST" });
      const d = await r.json();
      if (r.ok) router.push(`/audit/${d.id}`);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setReauditing(false);
    }
  };

  if (!current) return <div className="skeleton h-40 rounded-xl"/>;

  const done = actions.filter(a=>a.status === "completed").length;
  const total = actions.length;
  const currentScore = current.report?.overallScore;
  const previous = history.find(h => h.id !== id && h.status === "completed");

  return (
    <div>
      <AuditSteps auditId={id} current={5}/>
      <ToolHeader eyebrow="Step 5 · Track" title="Track progress"
        description="Re-audit để đo điểm số sau khi áp dụng action. So sánh với baseline."/>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="card text-center py-6">
          <p className="text-eyebrow mb-3">Current score</p>
          {currentScore != null ? (
            <ScoreRing value={currentScore} size={100} label="overall"/>
          ) : (
            <p className="text-sm text-muted">Audit not complete</p>
          )}
        </div>
        <div className="card">
          <p className="text-eyebrow mb-3">Actions completed</p>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-4xl">{done}</span>
            <span className="text-muted">/ {total}</span>
          </div>
          <div className="h-1.5 bg-bg rounded-full overflow-hidden mt-3">
            <div className="h-full bg-success rounded-full transition-all" style={{width: total ? `${(done/total)*100}%` : "0%"}}/>
          </div>
        </div>
        <div className="card">
          <p className="text-eyebrow mb-3">Audit lineage</p>
          <div className="text-3xl font-serif">{history.length}</div>
          <p className="text-xs text-muted mt-1">audits for this URL</p>
        </div>
      </div>

      {/* Re-audit CTA */}
      <div className="card border-dashed mb-8 text-center py-8">
        <RotateCcw size={28} className="text-muted mx-auto mb-3"/>
        <h3 className="font-serif text-xl mb-2">Re-audit this URL</h3>
        <p className="text-sm text-muted mb-5 max-w-md mx-auto">
          Sau khi bạn (hoặc dev) đã apply các action, chạy audit lại để đo điểm số mới và xem thay đổi so với báo cáo này.
        </p>
        <button onClick={reaudit} disabled={reauditing} className="btn btn-primary">
          {reauditing ? "Starting…" : <>Run new audit <ArrowRight size={14}/></>}
        </button>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div>
          <h3 className="h-section mb-4">Audit history for {current.url}</h3>
          <div className="space-y-2">
            {history.map((h, idx)=>{
              const isCurrent = h.id === id;
              const prevH = history[idx + 1];
              return (
                <div key={h.id} className={isCurrent ? "card border-ink/30" : "card"}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-subtle">#{history.length - idx}</span>
                      <div>
                        <p className="text-sm font-medium">
                          {new Date(h.created_at).toLocaleString()}
                          {isCurrent && <Badge variant="info">current</Badge>}
                        </p>
                        <p className="text-xs text-muted mt-0.5">Audit {h.id.slice(0,8)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={h.status==="completed"?"success":h.status==="failed"?"danger":"warning"}>
                        {h.status}
                      </Badge>
                      <a href={`/audit/${h.id}`} className="btn-ghost text-xs px-2 py-1">
                        Open <ArrowRight size={11}/>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex justify-between pt-8 mt-8 border-t border-border">
        <a href={`/audit/${id}/actions`} className="btn btn-secondary text-sm">← Actions</a>
        <a href="/" className="btn btn-secondary text-sm">Dashboard</a>
      </div>
    </div>
  );
}
