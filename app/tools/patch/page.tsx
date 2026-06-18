"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ToolHeader } from "@/components/ToolHeader";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

function PatchToolInner() {
  const params = useSearchParams();
  const [projectRoot, setProjectRoot] = useState("/Users/lethienkhiem/Documents/CodeProject/pdf-converter");
  const [filePath, setFilePath] = useState("app/opengraph-image.tsx");
  const [content, setContent] = useState("");
  const [mode, setMode] = useState<"create"|"overwrite"|"append">("create");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const f = params.get("file");
    if (f) setFilePath(f);
  }, [params]);

  const apply = async () => {
    setError(""); setResult(null); setLoading(true);
    try {
      const res = await fetch("/api/patch", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectRoot, filePath, content, mode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setResult(data);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <ToolHeader
        eyebrow="Infrastructure"
        title="File Patcher"
        description="Ghi code generated trực tiếp vào file local. An toàn — chỉ paths trong PATCH_ALLOWED_ROOTS mới được phép."
      />
      <div className="card bg-amber-50/50 border-amber-200 mb-6">
        <div className="flex gap-3">
          <AlertTriangle size={16} className="text-warning shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-ink mb-1">Cần setup</p>
            <p className="text-muted mb-2">Sửa <code className="bg-surface px-1 rounded">.env.local</code>:</p>
            <pre className="code bg-ink text-bg text-[11px]">PATCH_ALLOWED_ROOTS=/Users/lethienkhiem/Documents/CodeProject/pdf-converter</pre>
            <p className="text-muted mt-2 text-xs">Comma-separate nếu nhiều root. Restart <code>npm run dev</code>.</p>
          </div>
        </div>
      </div>
      <div className="card space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-eyebrow block mb-2">Project root</label>
            <input value={projectRoot} onChange={e=>setProjectRoot(e.target.value)} className="input font-mono text-xs"/>
          </div>
          <div>
            <label className="text-eyebrow block mb-2">File path (relative)</label>
            <input value={filePath} onChange={e=>setFilePath(e.target.value)} className="input font-mono text-xs"/>
          </div>
        </div>
        <div>
          <label className="text-eyebrow block mb-2">Mode</label>
          <div className="flex gap-1 p-1 bg-bg rounded-lg w-fit">
            {(["create","overwrite","append"] as const).map(m=>(
              <button key={m} onClick={()=>setMode(m)}
                className={mode===m ? "px-4 py-1.5 bg-surface rounded-md text-sm font-medium shadow-soft" : "px-4 py-1.5 text-sm text-muted hover:text-ink"}>
                {m}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted mt-2">
            <strong>create</strong>: fail nếu tồn tại · <strong>overwrite</strong>: tạo .backup.&lt;ts&gt; trước · <strong>append</strong>: thêm cuối file
          </p>
        </div>
        <div>
          <label className="text-eyebrow block mb-2">Content ({content.length} chars)</label>
          <textarea value={content} onChange={e=>setContent(e.target.value)} rows={14}
            placeholder="Paste code từ Schema Builder / OG Image Kit / Rewriter…"
            className="input font-mono text-xs"/>
        </div>
        <button onClick={apply} disabled={loading || !content.trim() || !filePath.trim()} className="btn btn-primary">
          {loading ? "Writing…" : "Write file"}
        </button>
        {error && (
          <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm">
            <AlertTriangle size={16} className="text-danger shrink-0 mt-0.5"/>
            <span className="text-danger">{error}</span>
          </div>
        )}
        {result && (
          <div className="flex gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
            <CheckCircle2 size={16} className="text-success shrink-0 mt-0.5"/>
            <div className="text-success">
              <p className="font-medium">File đã ghi</p>
              <p className="text-xs mt-1 font-mono break-all">{result.absPath}</p>
              {result.backup && <p className="text-xs mt-1">Backup: <code>{result.backup}</code></p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PatchTool() {
  return (
    <Suspense fallback={<div className="skeleton h-40 rounded-xl"/>}>
      <PatchToolInner />
    </Suspense>
  );
}
