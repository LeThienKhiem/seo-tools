"use client";
import { useState } from "react";
import { ToolHeader } from "@/components/ToolHeader";
import { ResultPanel } from "@/components/ResultPanel";

export default function SitemapTool() {
  const [mode, setMode] = useState<"crawl"|"manual">("crawl");
  const [crawlUrl, setCrawlUrl] = useState("https://www.invoicetodata.com");
  const [limit, setLimit] = useState(50);
  const [manualUrls, setManualUrls] = useState("");
  const [result, setResult] = useState<string>("");
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const go = async () => {
    setLoading(true); setError(""); setResult("");
    try {
      const body: any = { mode };
      if (mode === "crawl") { body.crawlUrl = crawlUrl; body.limit = limit; }
      else { body.urls = manualUrls.split("\n").map(u=>({loc:u.trim()})).filter(u=>u.loc); }
      const res = await fetch("/api/generate/sitemap", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setResult(d.xml); setCount(d.count || 0);
    } catch(e) { setError((e as Error).message); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <ToolHeader eyebrow="Generate" title="Sitemap Generator" description="XML sitemap from crawl or URL list."/>
      <div className="card space-y-4">
        <div className="flex gap-1 p-1 bg-bg rounded-lg w-fit">
          <button onClick={()=>setMode("crawl")} className={mode==="crawl"?"px-4 py-1.5 bg-surface rounded-md text-sm font-medium shadow-soft":"px-4 py-1.5 text-sm text-muted hover:text-ink"}>Crawl site</button>
          <button onClick={()=>setMode("manual")} className={mode==="manual"?"px-4 py-1.5 bg-surface rounded-md text-sm font-medium shadow-soft":"px-4 py-1.5 text-sm text-muted hover:text-ink"}>Manual URLs</button>
        </div>
        {mode==="crawl" ? (
          <>
            <input value={crawlUrl} onChange={e=>setCrawlUrl(e.target.value)} placeholder="https://example.com" className="input"/>
            <div>
              <label className="text-eyebrow block mb-2">Page limit ({limit})</label>
              <input type="range" min={10} max={200} value={limit} onChange={e=>setLimit(Number(e.target.value))} className="w-full"/>
            </div>
          </>
        ) : (
          <textarea value={manualUrls} onChange={e=>setManualUrls(e.target.value)} placeholder="One URL per line" rows={8} className="input font-mono text-xs"/>
        )}
        <button onClick={go} disabled={loading} className="btn btn-primary">{loading?"Generating…":"Generate XML"}</button>
        {error && <p className="text-danger text-sm">{error}</p>}
      </div>
      {result && <div className="mt-6"><ResultPanel title={`public/sitemap.xml${count?` (${count} URLs)`:""}`} data={result} copyAs="text"/></div>}
    </div>
  );
}
