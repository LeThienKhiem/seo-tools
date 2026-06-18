"use client";
import { useState } from "react";
import { ToolHeader } from "@/components/ToolHeader";
import { ResultPanel } from "@/components/ResultPanel";

export default function CrawlTool() {
  const [url, setUrl] = useState("https://www.invoicetodata.com/");
  const [limit, setLimit] = useState(20);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const go = async () => {
    setLoading(true); setError(""); setData(null);
    try {
      const res = await fetch("/api/crawl", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, limit }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setData(d);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  };

  const statLabel = (k: string) => k.replace(/([A-Z])/g, " $1").replace(/^./, c=>c.toUpperCase());

  return (
    <div>
      <ToolHeader eyebrow="Analyze" title="Multi-page Crawler"
        description={`Crawl up to ${limit} pages. Detect duplicate titles/descriptions, missing meta, schema coverage.`}/>
      <div className="card space-y-4">
        <div>
          <label className="text-eyebrow block mb-2">Start URL</label>
          <input value={url} onChange={e=>setUrl(e.target.value)} className="input"/>
        </div>
        <div>
          <label className="text-eyebrow block mb-2">Page limit ({limit})</label>
          <input type="range" min={5} max={100} value={limit} onChange={e=>setLimit(Number(e.target.value))} className="w-full"/>
        </div>
        <button onClick={go} disabled={loading} className="btn btn-primary">{loading?"Crawling…":"Start crawl"}</button>
        {error && <p className="text-danger text-sm">{error}</p>}
      </div>
      {data && (
        <div className="space-y-4 mt-6 animate-slide-up">
          <div className="card">
            <h3 className="text-eyebrow mb-4">Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(data.summary).map(([k,v])=>(
                <div key={k} className="border-l-2 border-border pl-3">
                  <div className="font-serif text-2xl">{String(v)}</div>
                  <div className="text-xs text-muted mt-0.5">{statLabel(k)}</div>
                </div>
              ))}
            </div>
          </div>
          <ResultPanel title="Pages crawled" data={data}/>
        </div>
      )}
    </div>
  );
}
