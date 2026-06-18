"use client";
import { useEffect, useState } from "react";
import { ToolHeader } from "@/components/ToolHeader";
import { ResultPanel } from "@/components/ResultPanel";
import { Badge } from "@/components/Badge";
import { Camera, ArrowRight } from "lucide-react";

export default function DriftTool() {
  const [url, setUrl] = useState("https://www.invoicetodata.com/");
  const [label, setLabel] = useState("pre-launch");
  const [baselines, setBaselines] = useState<any[]>([]);
  const [diffResult, setDiffResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadBaselines = async () => {
    const r = await fetch("/api/drift/baseline");
    const d = await r.json();
    setBaselines(d.baselines || []);
  };
  useEffect(() => { loadBaselines(); }, []);

  const capture = async () => {
    setLoading(true); setError("");
    try {
      const r = await fetch("/api/drift/baseline", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, label }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      await loadBaselines();
    } catch(e) { setError((e as Error).message); }
    finally { setLoading(false); }
  };

  const compare = async (baselineId: string) => {
    setLoading(true); setError(""); setDiffResult(null);
    try {
      const r = await fetch("/api/drift/compare", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baselineId }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setDiffResult(d);
    } catch(e) { setError((e as Error).message); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <ToolHeader eyebrow="Workflows" title="Drift Monitor"
        description="Capture SEO snapshot before deploy. Compare against current state anytime."/>
      <div className="card space-y-4">
        <h3 className="text-eyebrow flex items-center gap-2"><Camera size={13}/> Capture baseline</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="URL" className="input"/>
          <input value={label} onChange={e=>setLabel(e.target.value)} placeholder="Label (e.g. pre-launch)" className="input"/>
        </div>
        <button onClick={capture} disabled={loading} className="btn btn-primary">{loading?"Capturing…":"Capture now"}</button>
      </div>

      <div className="card mt-4">
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="text-eyebrow">Baselines</h3>
          <span className="text-xs text-subtle">{baselines.length} stored</span>
        </div>
        {baselines.length === 0 ? (
          <p className="text-sm text-muted">No baselines yet.</p>
        ) : (
          <div className="space-y-1">
            {baselines.map((b:any)=>(
              <div key={b.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-bg transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{b.url}</p>
                  <p className="text-xs text-muted">{b.label} · {new Date(b.created_at).toLocaleString()}</p>
                </div>
                <button onClick={()=>compare(b.id)} className="btn btn-secondary text-xs px-3 py-1.5">
                  Compare <ArrowRight size={12}/>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-danger text-sm mt-4">{error}</p>}

      {diffResult && (
        <div className="space-y-4 mt-6 animate-slide-up">
          <div className="card">
            <div className="flex items-center gap-3 mb-2">
              <Badge variant={diffResult.diff.overallDelta==="degraded"?"danger":diffResult.diff.overallDelta==="improved"?"success":"warning"}>
                {diffResult.diff.overallDelta}
              </Badge>
              <span className="text-sm">
                <span className="text-danger">{diffResult.diff.regressionCount} regressions</span>
                <span className="text-muted"> · </span>
                <span className="text-success">{diffResult.diff.improvementCount} improvements</span>
              </span>
            </div>
            <p className="text-sm text-muted">{diffResult.diff.summary}</p>
          </div>
          {Array.isArray(diffResult.diff.changes) && (
            <div className="space-y-2">
              {diffResult.diff.changes.map((c:any,i:number)=>(
                <div key={i} className="card">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={c.severity==="critical"?"danger":c.severity==="major"?"warning":"default"}>
                      {c.severity}
                    </Badge>
                    <span className="font-medium text-sm">{c.field}</span>
                  </div>
                  <div className="text-sm space-y-1 ml-1">
                    <p className="text-muted"><span className="text-xs uppercase tracking-wider mr-2">Before</span> <span className="text-ink line-through opacity-60">{String(c.before).slice(0,160)}</span></p>
                    <p className="text-muted"><span className="text-xs uppercase tracking-wider mr-2">After</span> <span className="text-ink">{String(c.after).slice(0,160)}</span></p>
                    <p className="text-xs text-muted pt-2"><strong>Impact:</strong> {c.impact}</p>
                    <p className="text-xs"><strong>Fix:</strong> {c.recommendation}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <ResultPanel title="Full diff" data={diffResult}/>
        </div>
      )}
    </div>
  );
}
