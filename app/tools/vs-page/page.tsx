"use client";
import { useState } from "react";
import { ToolHeader } from "@/components/ToolHeader";
import { ResultPanel } from "@/components/ResultPanel";

export default function VsTool() {
  const [product, setProduct] = useState("InvoiceToData");
  const [competitor, setCompetitor] = useState("Docparser");
  const [ctx, setCtx] = useState("InvoiceToData = free AI invoice OCR, no signup, $9.99 credit packs. Docparser = $39+/mo template-based parser.");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const go = async () => {
    setLoading(true); setError(""); setData(null);
    try {
      const res = await fetch("/api/generate/vs-page", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product, competitor, productContext: ctx }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setData(d.page);
    } catch(e) { setError((e as Error).message); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <ToolHeader eyebrow="Generate" title="Competitor /vs Page"
        description="Generate SEO + conversion-optimized 'X vs Y' page content with feature matrix and JSON-LD."/>
      <div className="card space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-eyebrow block mb-2">Your product</label>
            <input value={product} onChange={e=>setProduct(e.target.value)} className="input"/>
          </div>
          <div>
            <label className="text-eyebrow block mb-2">Competitor</label>
            <input value={competitor} onChange={e=>setCompetitor(e.target.value)} className="input"/>
          </div>
        </div>
        <div>
          <label className="text-eyebrow block mb-2">Context</label>
          <textarea value={ctx} onChange={e=>setCtx(e.target.value)} rows={3} className="input"/>
        </div>
        <button onClick={go} disabled={loading} className="btn btn-primary">{loading?"Generating…":"Generate /vs page"}</button>
        {error && <p className="text-danger text-sm">{error}</p>}
      </div>
      {data && (
        <div className="space-y-4 mt-6 animate-slide-up">
          <div className="card">
            <p className="text-eyebrow mb-2">Page preview</p>
            <h2 className="font-serif text-2xl mb-2">{data.h1}</h2>
            <p className="text-sm text-muted">URL: <code className="bg-bg px-1 rounded">/{data.urlSlug}</code></p>
            <p className="mt-4 text-sm leading-relaxed">{data.intro}</p>
            <div className="mt-4 pt-4 border-t border-border text-xs text-muted space-y-1">
              <p><strong>Title:</strong> {data.title} <span>({data.title?.length}c)</span></p>
              <p><strong>Meta:</strong> {data.metaDescription} <span>({data.metaDescription?.length}c)</span></p>
            </div>
          </div>
          {Array.isArray(data.featureMatrix) && (
            <div className="card overflow-x-auto">
              <h3 className="text-eyebrow mb-3">Feature comparison</h3>
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr className="text-left text-xs text-muted uppercase">
                    <th className="py-2 pr-3">Feature</th>
                    <th className="py-2 px-3">{product}</th>
                    <th className="py-2 px-3">{competitor}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.featureMatrix.map((row:any,i:number)=>(
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="py-2 pr-3 font-medium">{row.feature}</td>
                      <td className="py-2 px-3">{row.product}</td>
                      <td className="py-2 px-3">{row.competitor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <ResultPanel title="Full /vs page content" data={data}/>
        </div>
      )}
    </div>
  );
}
