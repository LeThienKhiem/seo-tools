"use client";
import { useState } from "react";
import { ToolHeader } from "@/components/ToolHeader";
import { ResultPanel } from "@/components/ResultPanel";

export default function RobotsTool() {
  const [sitemaps, setSitemaps] = useState("https://www.invoicetodata.com/sitemap.xml");
  const [host, setHost] = useState("www.invoicetodata.com");
  const [blockAi, setBlockAi] = useState(false);
  const [disallow, setDisallow] = useState("/api/\n/admin/");
  const [allow, setAllow] = useState("/");
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState("");

  const go = async () => {
    setError(""); setResult("");
    try {
      const res = await fetch("/api/generate/robots", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userAgents: [{
            name: "*",
            allow: allow.split("\n").map(s=>s.trim()).filter(Boolean),
            disallow: disallow.split("\n").map(s=>s.trim()).filter(Boolean),
          }],
          sitemaps: sitemaps.split("\n").map(s=>s.trim()).filter(Boolean),
          host: host || undefined,
          blockAiCrawlers: blockAi,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setResult(d.robots);
    } catch(e) { setError((e as Error).message); }
  };

  return (
    <div>
      <ToolHeader eyebrow="Generate" title="Robots.txt Generator"
        description="Generate robots.txt with optional AI crawler blocking."/>
      <div className="card space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-eyebrow block mb-2">Allow paths</label>
            <textarea value={allow} onChange={e=>setAllow(e.target.value)} rows={3} className="input font-mono text-xs"/>
          </div>
          <div>
            <label className="text-eyebrow block mb-2">Disallow paths</label>
            <textarea value={disallow} onChange={e=>setDisallow(e.target.value)} rows={3} className="input font-mono text-xs"/>
          </div>
        </div>
        <div>
          <label className="text-eyebrow block mb-2">Sitemaps</label>
          <textarea value={sitemaps} onChange={e=>setSitemaps(e.target.value)} rows={2} className="input font-mono text-xs"/>
        </div>
        <div>
          <label className="text-eyebrow block mb-2">Host (optional)</label>
          <input value={host} onChange={e=>setHost(e.target.value)} className="input"/>
        </div>
        <label className="flex items-center gap-2.5 text-sm cursor-pointer">
          <input type="checkbox" checked={blockAi} onChange={e=>setBlockAi(e.target.checked)}/>
          Block AI training crawlers (GPTBot, ClaudeBot, CCBot, Google-Extended…)
        </label>
        <button onClick={go} className="btn btn-primary">Generate robots.txt</button>
        {error && <p className="text-danger text-sm">{error}</p>}
      </div>
      {result && <div className="mt-6"><ResultPanel title="public/robots.txt" data={result} copyAs="text"/></div>}
    </div>
  );
}
