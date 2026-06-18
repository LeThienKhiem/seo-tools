"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ToolHeader } from "@/components/ToolHeader";
import { GlobalSteps } from "@/components/StepNav";
import { CheckCircle2, Key, FileSpreadsheet, FolderOpen, ArrowRight } from "lucide-react";

export default function SetupPage() {
  const router = useRouter();
  const [status, setStatus] = useState<any>(null);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("claude-sonnet-4-6");
  const [gscEmail, setGscEmail] = useState("");
  const [projectRoot, setProjectRoot] = useState("");
  const [testKey, setTestKey] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    const r = await fetch("/api/setup");
    const d = await r.json();
    setStatus(d);
    setModel(d.model || "claude-sonnet-4-6");
    setGscEmail(d.gscEmail || "");
    setProjectRoot(d.projectRoot || "");
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true); setError(""); setMessage("");
    try {
      const body: any = { model };
      if (apiKey) { body.apiKey = apiKey; body.testKey = testKey; }
      if (gscEmail !== status?.gscEmail) body.gscEmail = gscEmail;
      if (projectRoot !== status?.projectRoot) body.projectRoot = projectRoot;
      const r = await fetch("/api/setup", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setMessage("Settings saved.");
      setApiKey("");
      await load();
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <GlobalSteps current={1} />
      <ToolHeader eyebrow="Step 1" title="Configure your workbench"
        description="Connect Claude, optionally link Search Console data, set your project root for code patching."/>

      {/* Status */}
      {status && (
        <div className="card mb-6">
          <h3 className="text-eyebrow mb-3">Status</h3>
          <div className="space-y-2.5 text-sm">
            <StatusRow ok={status.hasApiKey} label="Claude API key"
              detail={status.hasApiKey ? `via ${status.apiKeySource} · ${status.model}` : "Not configured"}/>
            <StatusRow ok={!!status.gscEmail} label="Search Console linked"
              detail={status.gscEmail || "Optional · upload CSV at Step 3"}/>
            <StatusRow ok={!!status.projectRoot} label="Project root for patching"
              detail={status.projectRoot || "Optional · set to enable File Patcher"}/>
            <StatusRow ok={status.patchAllowed} label="PATCH_ALLOWED_ROOTS env"
              detail={status.patchAllowed ? "Set in .env.local" : "Not set · File Patcher disabled"}/>
          </div>
        </div>
      )}

      {/* Claude */}
      <div className="card mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Key size={15} className="text-muted"/>
          <h3 className="font-medium">Claude API key</h3>
        </div>
        <p className="text-sm text-muted mb-3">
          Lấy key tại <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener" className="text-ink underline underline-offset-2">console.anthropic.com</a>.
          {status?.hasApiKey && status?.apiKeySource === "env" && (
            <span className="block mt-1 text-warning text-xs">⚠ Key đã set qua env, key nhập ở đây sẽ bị env override.</span>
          )}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3">
          <input value={apiKey} onChange={e=>setApiKey(e.target.value)}
            placeholder={status?.hasApiKey ? "(keep current) — paste new key to replace" : "sk-ant-..."}
            className="input font-mono text-xs" type="password"/>
          <select value={model} onChange={e=>setModel(e.target.value)} className="input">
            <option value="claude-sonnet-4-6">Sonnet 4.6 (fast)</option>
            <option value="claude-opus-4-7">Opus 4.7 (best)</option>
            <option value="claude-haiku-4-5-20251001">Haiku 4.5 (cheap)</option>
          </select>
        </div>
        <label className="flex items-center gap-2 mt-3 text-xs text-muted cursor-pointer">
          <input type="checkbox" checked={testKey} onChange={e=>setTestKey(e.target.checked)}/>
          Test key by sending a ping before saving
        </label>
      </div>

      {/* GSC */}
      <div className="card mb-4">
        <div className="flex items-center gap-2 mb-4">
          <FileSpreadsheet size={15} className="text-muted"/>
          <h3 className="font-medium">Search Console (optional)</h3>
        </div>
        <p className="text-sm text-muted mb-3">
          Live OAuth chưa hỗ trợ. Cách dùng: trong Search Console → <strong>Performance</strong> → Export CSV (Queries hoặc Pages) → upload ở Step 3 cùng URL audit để cross-reference.
          Đăng ký email để track:
        </p>
        <input value={gscEmail} onChange={e=>setGscEmail(e.target.value)}
          placeholder="you@example.com (optional, just for label)"
          className="input"/>
      </div>

      {/* Project root */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <FolderOpen size={15} className="text-muted"/>
          <h3 className="font-medium">Project root (for File Patcher)</h3>
        </div>
        <p className="text-sm text-muted mb-3">
          Cho phép Action Center ghi code trực tiếp vào project Next.js. Cần thêm path tương tự vào{" "}
          <code className="bg-bg px-1 rounded">PATCH_ALLOWED_ROOTS</code> trong <code className="bg-bg px-1 rounded">.env.local</code>.
        </p>
        <input value={projectRoot} onChange={e=>setProjectRoot(e.target.value)}
          placeholder="/Users/lethienkhiem/Documents/CodeProject/pdf-converter"
          className="input font-mono text-xs"/>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving} className="btn btn-primary">
          {saving ? "Saving…" : "Save settings"}
        </button>
        {status?.hasApiKey && (
          <button onClick={()=>router.push("/")} className="btn btn-secondary">
            Continue to audit <ArrowRight size={14}/>
          </button>
        )}
        {message && <span className="text-sm text-success">{message}</span>}
        {error && <span className="text-sm text-danger">{error}</span>}
      </div>
    </div>
  );
}

function StatusRow({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={ok ? "w-5 h-5 rounded-full bg-green-100 text-success flex items-center justify-center" : "w-5 h-5 rounded-full bg-bg border border-border flex items-center justify-center"}>
        {ok && <CheckCircle2 size={13}/>}
      </div>
      <span className="font-medium text-ink min-w-[180px]">{label}</span>
      <span className="text-muted text-xs">{detail}</span>
    </div>
  );
}
