"use client";

import { useState } from "react";
import { ToolHeader } from "@/components/ToolHeader";
import { Copy, Check } from "lucide-react";

interface Alt { text: string; length: number; rationale: string; }

export default function RewriteTool() {
  const [kind, setKind] = useState<"title" | "meta_description">("title");
  const [current, setCurrent] = useState("Invoice OCR — Convert PDF Invoices to Excel & Google Sheets Free | InvoiceToData");
  const [context, setContext] = useState("InvoiceToData = free AI invoice OCR. Users upload PDF; output Excel/Google Sheets. Free 3 credits, $9.99 packs. 4.8/5 (127 reviews).");
  const [result, setResult] = useState<Alt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedIdx, setCopiedIdx] = useState(-1);

  const max = kind === "title" ? 60 : 160;

  const generate = async () => {
    setLoading(true); setError(""); setResult([]);
    try {
      const res = await fetch("/api/generate/rewrite", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, current, context, maxLength: max }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setResult(data.alternatives || []);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  };

  const copy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(-1), 1500);
  };

  return (
    <div>
      <ToolHeader
        eyebrow="Generate"
        title="Title & Meta Rewriter"
        description="Paste a too-long or weak SEO string. Get 5 better alternatives within length limits, with rationale."
      />

      <div className="card space-y-5">
        <div className="flex gap-1 p-1 bg-bg rounded-lg w-fit">
          <button
            onClick={() => setKind("title")}
            className={kind === "title" ? "px-4 py-1.5 bg-surface rounded-md text-sm font-medium shadow-soft" : "px-4 py-1.5 text-sm text-muted hover:text-ink"}
          >Title (60)</button>
          <button
            onClick={() => setKind("meta_description")}
            className={kind === "meta_description" ? "px-4 py-1.5 bg-surface rounded-md text-sm font-medium shadow-soft" : "px-4 py-1.5 text-sm text-muted hover:text-ink"}
          >Meta description (160)</button>
        </div>

        <div>
          <label className="text-eyebrow block mb-2">
            Current — <span className={current.length > max ? "text-danger" : "text-muted"}>{current.length} chars</span>
          </label>
          <textarea value={current} onChange={(e) => setCurrent(e.target.value)} rows={2} className="input" />
        </div>

        <div>
          <label className="text-eyebrow block mb-2">Context</label>
          <textarea value={context} onChange={(e) => setContext(e.target.value)} rows={3} className="input" />
        </div>

        <div className="flex items-center gap-3">
          <button onClick={generate} disabled={loading || !current.trim()} className="btn btn-primary">
            {loading ? "Generating…" : "Generate 5 alternatives"}
          </button>
          {error && <p className="text-danger text-sm">{error}</p>}
        </div>
      </div>

      {result.length > 0 && (
        <div className="space-y-2 mt-6 animate-slide-up">
          {result.map((alt, i) => (
            <div key={i} className="card group hover:border-ink/20 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono text-muted">#{i + 1}</span>
                    <span className={alt.length <= max ? "badge-success" : "badge-danger"}>
                      {alt.length} chars
                    </span>
                  </div>
                  <p className="font-medium text-ink leading-snug">{alt.text}</p>
                  <p className="text-sm text-muted mt-2 leading-relaxed">{alt.rationale}</p>
                </div>
                <button
                  onClick={() => copy(alt.text, i)}
                  className="btn-ghost text-xs px-2 py-1 gap-1.5 opacity-50 group-hover:opacity-100 transition-opacity"
                >
                  {copiedIdx === i ? <Check size={13} /> : <Copy size={13} />}
                  {copiedIdx === i ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
