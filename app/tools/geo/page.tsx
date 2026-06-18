"use client";
import { useState } from "react";
import { ToolHeader } from "@/components/ToolHeader";
import { ResultPanel } from "@/components/ResultPanel";
import { ScoreRing, ScoreBar } from "@/components/Score";
import { Badge } from "@/components/Badge";

export default function GeoTool() {
  const [url, setUrl] = useState("https://www.invoicetodata.com/");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const go = async () => {
    setLoading(true); setError(""); setData(null);
    try {
      const res = await fetch("/api/generate/geo", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setData(d);
    } catch(e) { setError((e as Error).message); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <ToolHeader eyebrow="Analyze" title="GEO / AI Search Checker"
        description="Assess your page's readiness for Google AI Overviews, ChatGPT web search, Perplexity, and Bing Copilot."/>
      <div className="card space-y-4">
        <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="URL" className="input"/>
        <button onClick={go} disabled={loading} className="btn btn-primary">{loading?"Analyzing…":"Run check"}</button>
        {error && <p className="text-danger text-sm">{error}</p>}
      </div>
      {data && (
        <div className="space-y-4 mt-6 animate-slide-up">
          <div className="card flex flex-col items-center text-center py-8">
            <ScoreRing value={data.overallGeoScore} size={140} label="GEO score"/>
          </div>
          {data.dimensions && (
            <div className="card">
              <h3 className="text-eyebrow mb-4">Dimensions</h3>
              <div className="space-y-4">
                {Object.entries(data.dimensions).map(([k,v]:[string,any])=>(
                  <div key={k}>
                    <ScoreBar value={v.score} label={k.replace(/([A-Z])/g," $1").replace(/^./,c=>c.toUpperCase())}/>
                    <p className="text-xs text-muted mt-1">{v.notes}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {Array.isArray(data.topActions) && data.topActions.length>0 && (
            <div className="card">
              <h3 className="text-eyebrow mb-3">Top actions</h3>
              <ul className="space-y-3">
                {data.topActions.map((a:any,i:number)=>(
                  <li key={i} className="flex gap-3 text-sm">
                    <Badge variant={a.priority==="high"?"danger":a.priority==="medium"?"warning":"default"}>{a.priority}</Badge>
                    <div className="flex-1">
                      <p>{a.action}</p>
                      <p className="text-xs text-muted mt-0.5">{a.estimatedImpact}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {Array.isArray(data.citableSnippets) && data.citableSnippets.length>0 && (
            <div className="card">
              <h3 className="text-eyebrow mb-3">Citable snippets — AI will likely quote these</h3>
              <ul className="space-y-2">
                {data.citableSnippets.map((s:string,i:number)=>(
                  <li key={i} className="text-sm italic text-muted border-l-2 border-border pl-3">"{s}"</li>
                ))}
              </ul>
            </div>
          )}
          <ResultPanel title="Raw report" data={data}/>
        </div>
      )}
    </div>
  );
}
