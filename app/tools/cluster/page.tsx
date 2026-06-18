"use client";
import { useState } from "react";
import { ToolHeader } from "@/components/ToolHeader";
import { ResultPanel } from "@/components/ResultPanel";

export default function ClusterTool() {
  const [seed, setSeed] = useState("invoice OCR");
  const [ctx, setCtx] = useState("InvoiceToData — SaaS AI invoice OCR tool. Free + paid. Target: SMB owners, accountants, bookkeepers globally.");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const go = async () => {
    setLoading(true); setError(""); setData(null);
    try {
      const res = await fetch("/api/generate/cluster", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seedKeyword: seed, businessContext: ctx }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setData(d.cluster);
    } catch(e) { setError((e as Error).message); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <ToolHeader eyebrow="Generate" title="Topic Cluster Planner"
        description="One pillar page + 8–12 spokes with internal link matrix and build order."/>
      <div className="card space-y-4">
        <div>
          <label className="text-eyebrow block mb-2">Seed keyword</label>
          <input value={seed} onChange={e=>setSeed(e.target.value)} className="input"/>
        </div>
        <div>
          <label className="text-eyebrow block mb-2">Business context</label>
          <textarea value={ctx} onChange={e=>setCtx(e.target.value)} rows={3} className="input"/>
        </div>
        <button onClick={go} disabled={loading} className="btn btn-primary">{loading?"Planning…":"Plan cluster"}</button>
        {error && <p className="text-danger text-sm">{error}</p>}
      </div>
      {data && (
        <div className="space-y-4 mt-6 animate-slide-up">
          {data.pillarPage && (
            <div className="card border-ink/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-1 bg-ink text-bg text-xs font-medium">PILLAR</div>
              <h3 className="font-serif text-xl mb-2">{data.pillarPage.title}</h3>
              <p className="text-sm text-muted">Keyword: <span className="text-ink font-mono">{data.pillarPage.targetKeyword}</span></p>
              <p className="text-sm text-muted mt-1">URL: <code className="bg-bg px-1 rounded">{data.pillarPage.url}</code></p>
            </div>
          )}
          {Array.isArray(data.spokes) && (
            <div>
              <h3 className="text-eyebrow mb-3">Spokes ({data.spokes.length})</h3>
              <div className="space-y-2">
                {data.spokes.map((s:any,i:number)=>(
                  <div key={i} className="card py-3">
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{s.title}</p>
                        <p className="text-xs text-muted mt-0.5"><code>{s.url}</code> · {s.intent} · {s.wordCountTarget}w</p>
                      </div>
                      <span className="badge-default whitespace-nowrap">{s.targetKeyword}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <ResultPanel title="Full cluster JSON" data={data}/>
        </div>
      )}
    </div>
  );
}
