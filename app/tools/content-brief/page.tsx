"use client";
import { useState } from "react";
import { ToolHeader } from "@/components/ToolHeader";
import { ResultPanel } from "@/components/ResultPanel";

export default function ContentBriefTool() {
  const [topic, setTopic] = useState("How to convert PDF bank statement to Excel");
  const [keyword, setKeyword] = useState("convert bank statement to excel");
  const [audience, setAudience] = useState("Small business owners, accountants, bookkeepers managing many bank statements monthly");
  const [intent, setIntent] = useState<"informational"|"transactional"|"navigational"|"commercial">("informational");
  const [competitors, setCompetitors] = useState("");
  const [brief, setBrief] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const go = async () => {
    setLoading(true); setError(""); setBrief(null);
    try {
      const res = await fetch("/api/generate/content-brief", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic, targetKeyword: keyword, audience, intent,
          competitorUrls: competitors.split("\n").map(s=>s.trim()).filter(Boolean),
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setBrief(d.brief);
    } catch(e) { setError((e as Error).message); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <ToolHeader eyebrow="Generate" title="Content Brief"
        description="Detailed brief for one blog or landing page: outline, keywords, FAQ, internal links, schema."/>
      <div className="card space-y-4">
        <div>
          <label className="text-eyebrow block mb-2">Topic</label>
          <input value={topic} onChange={e=>setTopic(e.target.value)} className="input"/>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-eyebrow block mb-2">Target keyword</label>
            <input value={keyword} onChange={e=>setKeyword(e.target.value)} className="input"/>
          </div>
          <div>
            <label className="text-eyebrow block mb-2">Intent</label>
            <select value={intent} onChange={e=>setIntent(e.target.value as any)} className="input">
              <option value="informational">Informational</option>
              <option value="transactional">Transactional</option>
              <option value="commercial">Commercial investigation</option>
              <option value="navigational">Navigational</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-eyebrow block mb-2">Audience</label>
          <textarea value={audience} onChange={e=>setAudience(e.target.value)} rows={2} className="input"/>
        </div>
        <div>
          <label className="text-eyebrow block mb-2">Competitor URLs (optional)</label>
          <textarea value={competitors} onChange={e=>setCompetitors(e.target.value)} rows={3} placeholder="One per line" className="input font-mono text-xs"/>
        </div>
        <button onClick={go} disabled={loading} className="btn btn-primary">{loading?"Generating…":"Generate brief"}</button>
        {error && <p className="text-danger text-sm">{error}</p>}
      </div>
      {brief && (
        <div className="mt-6 animate-slide-up">
          {brief.title && (
            <div className="card mb-4">
              <div className="text-eyebrow mb-2">Title</div>
              <h2 className="font-serif text-xl">{brief.title}</h2>
              {brief.metaDescription && <p className="text-sm text-muted mt-2">{brief.metaDescription}</p>}
              {brief.urlSlug && <p className="text-xs text-muted mt-2">URL: <code className="bg-bg px-1 rounded">/{brief.urlSlug}</code></p>}
            </div>
          )}
          <ResultPanel title="Full brief" data={brief}/>
        </div>
      )}
    </div>
  );
}
