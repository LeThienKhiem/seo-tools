"use client";
import { useState } from "react";
import { ToolHeader } from "@/components/ToolHeader";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

export default function IndexNowTool() {
  const [host, setHost] = useState("www.invoicetodata.com");
  const [key, setKey] = useState("");
  const [urls, setUrls] = useState("");
  const [engine, setEngine] = useState<"bing"|"yandex"|"indexnow">("bing");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const go = async () => {
    setLoading(true); setError(""); setResult(null);
    try {
      const urlList = urls.split("\n").map(s=>s.trim()).filter(Boolean);
      const res = await fetch("/api/indexnow", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ host, key, urlList, engine }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setResult(d);
    } catch(e) { setError((e as Error).message); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <ToolHeader eyebrow="Workflows" title="IndexNow Submitter"
        description="Push URLs to Bing and Yandex instantly. Bing index feeds Microsoft Copilot."/>
      <div className="card bg-amber-50/50 border-amber-200 mb-6">
        <div className="flex gap-3">
          <AlertTriangle size={16} className="text-warning shrink-0 mt-0.5"/>
          <div className="text-sm space-y-2">
            <p className="font-medium">One-time setup</p>
            <ol className="list-decimal list-inside text-muted space-y-1 text-xs">
              <li>Generate API key (UUID) at <a href="https://www.bing.com/indexnow" target="_blank" rel="noopener" className="text-ink underline">bing.com/indexnow</a></li>
              <li>Put <code>{`<key>.txt`}</code> at root with the key value (e.g., <code>https://www.invoicetodata.com/abc123.txt</code>)</li>
              <li>Verify accessible publicly → submit below</li>
            </ol>
          </div>
        </div>
      </div>
      <div className="card space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-eyebrow block mb-2">Host</label>
            <input value={host} onChange={e=>setHost(e.target.value)} placeholder="www.example.com" className="input"/>
          </div>
          <div>
            <label className="text-eyebrow block mb-2">Engine</label>
            <select value={engine} onChange={e=>setEngine(e.target.value as any)} className="input">
              <option value="bing">Bing</option>
              <option value="yandex">Yandex</option>
              <option value="indexnow">IndexNow (broadcast)</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-eyebrow block mb-2">IndexNow API key</label>
          <input value={key} onChange={e=>setKey(e.target.value)} className="input font-mono"/>
        </div>
        <div>
          <label className="text-eyebrow block mb-2">URLs to submit</label>
          <textarea value={urls} onChange={e=>setUrls(e.target.value)} rows={8} placeholder="One URL per line" className="input font-mono text-xs"/>
        </div>
        <button onClick={go} disabled={loading} className="btn btn-primary">{loading?"Submitting…":"Submit"}</button>
        {error && <p className="text-danger text-sm">{error}</p>}
        {result && (
          <div className={`flex gap-2 p-3 rounded-lg text-sm border ${result.status>=200 && result.status<300?"bg-green-50 border-green-200 text-success":"bg-amber-50 border-amber-200 text-warning"}`}>
            <CheckCircle2 size={16} className="shrink-0 mt-0.5"/>
            <span>Status: {result.status} {result.statusText}</span>
          </div>
        )}
      </div>
    </div>
  );
}
