"use client";

import { useState } from "react";
import { ToolHeader } from "@/components/ToolHeader";
import { ResultPanel } from "@/components/ResultPanel";

export default function OgImageTool() {
  const [brand, setBrand] = useState("InvoiceToData");
  const [title, setTitle] = useState("Free AI Invoice OCR — PDF to Excel in Seconds");
  const [subtitle, setSubtitle] = useState("Extract data from invoices, bank statements, receipts.");
  const [accent, setAccent] = useState("#0a0a0a");
  const [style, setStyle] = useState<"minimal"|"bold"|"gradient"|"product">("gradient");
  const [url, setUrl] = useState("https://www.invoicetodata.com");
  const [description, setDescription] = useState("Free AI-powered invoice OCR. Extract data from PDF invoices into Excel or Google Sheets in seconds.");
  const [ogImageCode, setOgImageCode] = useState("");
  const [metadataCode, setMetadataCode] = useState("");
  const [error, setError] = useState("");

  const generate = async () => {
    setError("");
    try {
      const res = await fetch("/api/generate/og-image", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand, title, subtitle, accent, style, url, description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setOgImageCode(data.ogImageCode);
      setMetadataCode(data.metadataCode || "");
    } catch (e) { setError((e as Error).message); }
  };

  const bg = style==="gradient" ? `linear-gradient(135deg, ${accent} 0%, #000 100%)`
    : style==="bold" ? accent
    : style==="minimal" ? "#ffffff"
    : "linear-gradient(135deg, #f5f5f5 0%, #e5e5e5 100%)";
  const fg = style==="minimal" ? "#1a1a1a" : "#ffffff";

  return (
    <div>
      <ToolHeader
        eyebrow="Generate"
        title="OG Image Kit"
        description="Generate a Next.js opengraph-image.tsx file. Next.js renders 1200×630 PNG at build time — no Figma."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-eyebrow block mb-2">Brand</label>
              <input value={brand} onChange={e=>setBrand(e.target.value)} className="input"/>
            </div>
            <div>
              <label className="text-eyebrow block mb-2">Accent</label>
              <input type="color" value={accent} onChange={e=>setAccent(e.target.value)} className="input h-[42px] p-1 cursor-pointer"/>
            </div>
          </div>
          <div>
            <label className="text-eyebrow block mb-2">Title</label>
            <input value={title} onChange={e=>setTitle(e.target.value)} className="input"/>
          </div>
          <div>
            <label className="text-eyebrow block mb-2">Subtitle</label>
            <input value={subtitle} onChange={e=>setSubtitle(e.target.value)} className="input"/>
          </div>
          <div>
            <label className="text-eyebrow block mb-2">Style</label>
            <div className="grid grid-cols-4 gap-1 p-1 bg-bg rounded-lg">
              {(["gradient","bold","minimal","product"] as const).map(s=>(
                <button key={s} onClick={()=>setStyle(s)}
                  className={style===s ? "px-3 py-1.5 bg-surface rounded-md text-xs font-medium shadow-soft" : "px-3 py-1.5 text-xs text-muted hover:text-ink"}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <details className="border-t border-border pt-4">
            <summary className="cursor-pointer text-eyebrow">Full metadata export</summary>
            <div className="mt-3 space-y-3">
              <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="Site URL" className="input"/>
              <textarea value={description} onChange={e=>setDescription(e.target.value)} rows={2} placeholder="Meta description" className="input"/>
            </div>
          </details>
          <button onClick={generate} className="btn btn-primary w-full">Generate</button>
          {error && <p className="text-danger text-sm">{error}</p>}
        </div>

        {/* Live preview */}
        <div>
          <div className="text-eyebrow mb-2">Preview · 1200 × 630</div>
          <div
            className="rounded-xl border border-border overflow-hidden aspect-[1200/630] p-10 flex flex-col justify-center shadow-elevated"
            style={{ background: bg, color: fg }}
          >
            <div className="text-base opacity-70 mb-3">{brand}</div>
            <div className="font-serif text-3xl md:text-4xl leading-tight mb-3" style={{ fontWeight: 600 }}>
              {title}
            </div>
            {subtitle && <div className="text-base opacity-85 leading-relaxed">{subtitle}</div>}
          </div>
        </div>
      </div>

      {ogImageCode && (
        <div className="space-y-4 mt-6">
          <ResultPanel title="app/opengraph-image.tsx" data={ogImageCode} copyAs="text"/>
          {metadataCode && <ResultPanel title="app/layout.tsx — metadata export" data={metadataCode} copyAs="text"/>}
        </div>
      )}
    </div>
  );
}
