"use client";

import { useState } from "react";
import { ToolHeader } from "@/components/ToolHeader";
import { ResultPanel } from "@/components/ResultPanel";

const TYPES = [
  "HowTo", "FAQPage", "BreadcrumbList", "Product", "Article",
  "Organization", "LocalBusiness", "SoftwareApplication",
] as const;

const EXAMPLES: Record<string, string> = {
  HowTo: "How users convert a PDF invoice to Excel using InvoiceToData. Steps: upload PDF, AI extracts data, download Excel/Google Sheets. Total time ~30s.",
  FAQPage: "5 FAQs for InvoiceToData: 1) Is it free? 2) What file types? 3) How accurate? 4) Is data secure? 5) Can I export to Google Sheets?",
  BreadcrumbList: "Breadcrumb for /tools/bank/chase: Home > Tools > Bank Statements > Chase",
  Product: "InvoiceToData Pro credit pack: 100 credits for $9.99, in stock, 4.8/5 rating.",
  Article: "Blog: 'How to Convert PDF Bank Statement to Excel in 2026', author Khiem Le, published 2026-06-18.",
  Organization: "InvoiceToData — SaaS AI invoice OCR. www.invoicetodata.com, support@invoicetodata.com.",
  LocalBusiness: "(not applicable to SaaS)",
  SoftwareApplication: "InvoiceToData web app, business application, free tier 3 credits, 4.8 rating, 127 reviews.",
};

export default function SchemaTool() {
  const [type, setType] = useState<(typeof TYPES)[number]>("HowTo");
  const [context, setContext] = useState(EXAMPLES.HowTo);
  const [result, setResult] = useState<unknown | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/generate/schema", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, context }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setResult(data.schema);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  };

  const reactSnippet = result ? `<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify(${JSON.stringify(result, null, 2)})
  }}
/>` : "";

  return (
    <div>
      <ToolHeader
        eyebrow="Generate"
        title="Schema Builder"
        description="Generate valid Schema.org JSON-LD for rich results and AI citations."
      />

      <div className="card space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-5">
          <div>
            <label className="text-eyebrow block mb-2">Type</label>
            <select
              value={type}
              onChange={(e) => {
                const t = e.target.value as (typeof TYPES)[number];
                setType(t); setContext(EXAMPLES[t] || "");
              }}
              className="input"
            >
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-eyebrow block mb-2">Context</label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={5}
              className="input"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={generate}
            disabled={loading || !context.trim()}
            className="btn btn-primary"
          >
            {loading ? "Generating…" : "Generate JSON-LD"}
          </button>
          {error && <p className="text-danger text-sm">{error}</p>}
        </div>
      </div>

      {result != null && (
        <div className="space-y-4 mt-6">
          <ResultPanel title="JSON-LD" data={result} />
          <ResultPanel title="Next.js snippet" data={reactSnippet} copyAs="text" />
          <div className="card bg-bg">
            <p className="text-sm text-muted">
              Validate: <a href="https://validator.schema.org/" target="_blank" rel="noopener" className="text-ink underline underline-offset-2">validator.schema.org</a>
              {" · "}
              <a href="https://search.google.com/test/rich-results" target="_blank" rel="noopener" className="text-ink underline underline-offset-2">Google Rich Results Test</a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
