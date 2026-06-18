"use client";
import { useState } from "react";
import { ToolHeader } from "@/components/ToolHeader";
import { ResultPanel } from "@/components/ResultPanel";

export default function ProgrammaticTool() {
  const [siteUrl, setSiteUrl] = useState("https://www.invoicetodata.com");
  const [ctx, setCtx] = useState("InvoiceToData: AI invoice OCR. Existing: bank-specific pages (Chase, BoA…) and industry pages (law, healthcare, ecommerce).");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const go = async () => {
    setLoading(true); setError(""); setData(null);
    try {
      const res = await fetch("/api/generate/programmatic", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteUrl, businessContext: ctx }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setData(d);
    } catch(e) { setError((e as Error).message); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <ToolHeader eyebrow="Generate" title="Programmatic SEO Planner"
        description="Detect existing URL patterns from sitemap and propose scaled expansion (template, data source, anti-thin-content guards)."/>
      <div className="card space-y-4">
        <div>
          <label className="text-eyebrow block mb-2">Site URL</label>
          <input value={siteUrl} onChange={e=>setSiteUrl(e.target.value)} className="input"/>
        </div>
        <div>
          <label className="text-eyebrow block mb-2">Business context</label>
          <textarea value={ctx} onChange={e=>setCtx(e.target.value)} rows={3} className="input"/>
        </div>
        <button onClick={go} disabled={loading} className="btn btn-primary">{loading?"Analyzing…":"Analyze & plan"}</button>
        {error && <p className="text-danger text-sm">{error}</p>}
      </div>
      {data && (
        <div className="space-y-4 mt-6 animate-slide-up">
          {data.sourceUrls && (
            <p className="text-xs text-muted">Analyzed {data.sourceUrls} URLs from sitemap</p>
          )}
          <ResultPanel title="Programmatic plan" data={data.plan}/>
        </div>
      )}
    </div>
  );
}
