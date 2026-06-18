"use client";

import { useEffect, useState, use, useRef } from "react";
import { ScoreRing, ScoreBar } from "@/components/Score";
import { Badge, StatusBadge } from "@/components/Badge";
import { ResultPanel } from "@/components/ResultPanel";
import { AuditSteps } from "@/components/StepNav";
import {
  AlertCircle,
  ExternalLink,
  Sparkles,
  Download,
  Upload,
  FileJson,
  FileText,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

interface AuditData {
  id: string;
  url: string;
  status: string;
  logs: string[];
  report: any | null;
  error: string | null;
  gsc?: any;
}

export default function AuditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<AuditData | null>(null);
  const [gsc, setGsc] = useState<any>(null);
  const [uploadingGsc, setUploadingGsc] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const load = async () => {
      const res = await fetch(`/api/audit/${id}`);
      const d = await res.json();
      setData(d);
      if (d.status === "pending" || d.status === "running") {
        timer = setTimeout(load, 2000);
      }
    };
    load();
    return () => clearTimeout(timer);
  }, [id]);

  const uploadGsc = async (file: File) => {
    setUploadingGsc(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("auditId", id);
      const r = await fetch("/api/gsc/upload", { method: "POST", body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setGsc(d);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setUploadingGsc(false);
    }
  };

  if (!data) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-1/3 rounded" />
        <div className="skeleton h-20 rounded-xl" />
        <div className="skeleton h-40 rounded-xl" />
      </div>
    );
  }

  const isDone = data.status === "completed";

  return (
    <div>
      <AuditSteps auditId={id} current={3} />

      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6 mb-8">
        <div className="min-w-0 flex-1">
          <div className="text-eyebrow mb-2">Step 3 · Audit results</div>
          <h1 className="font-serif text-2xl truncate flex items-center gap-2">
            {data.url}
            <a href={data.url} target="_blank" rel="noopener" className="text-muted hover:text-ink">
              <ExternalLink size={16} />
            </a>
          </h1>
        </div>
        <StatusBadge status={data.status} />
      </header>

      {/* In progress */}
      {(data.status === "pending" || data.status === "running") && (
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-warning animate-pulse" />
            <h3 className="font-medium text-sm">Analyzing</h3>
          </div>
          <pre className="code text-[11px] max-h-72 bg-bg text-muted border border-border">
            {data.logs.join("\n") || "Starting..."}
          </pre>
        </div>
      )}

      {data.status === "failed" && (
        <div className="card border-red-200 bg-red-50/50">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="text-danger mt-0.5 shrink-0" />
            <div className="flex-1">
              <h3 className="font-medium text-danger mb-1">Audit failed</h3>
              <p className="text-sm whitespace-pre-wrap">{data.error}</p>
            </div>
          </div>
        </div>
      )}

      {isDone && data.report && (
        <>
          {/* Score + summary */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="card flex flex-col items-center justify-center text-center md:col-span-1 py-8">
              <ScoreRing value={data.report.overallScore} size={140} label="overall" />
              <Badge variant="default"><span className="capitalize">{data.report.businessType}</span></Badge>
            </div>
            <div className="card md:col-span-2">
              <div className="text-eyebrow mb-3 flex items-center gap-1.5"><Sparkles size={11} /> Summary</div>
              <p className="text-sm leading-relaxed">{data.report.summary}</p>
            </div>
          </section>

          {/* Actions row */}
          <section className="card mb-8 bg-bg border-dashed">
            <h3 className="text-eyebrow mb-3">Download report</h3>
            <div className="flex flex-wrap gap-2">
              <a href={`/api/audit/${id}/report?format=json`} className="btn btn-secondary text-sm">
                <FileJson size={14}/> JSON
              </a>
              <a href={`/api/audit/${id}/report?format=md`} className="btn btn-secondary text-sm">
                <FileText size={14}/> Markdown
              </a>
              <button onClick={()=>window.print()} className="btn btn-secondary text-sm">
                <Download size={14}/> Print to PDF
              </button>
            </div>
          </section>

          {/* GSC upload */}
          <section className="card mb-8">
            <h3 className="text-eyebrow mb-2 flex items-center gap-2">
              <TrendingUp size={13}/> Search Console data (optional)
            </h3>
            <p className="text-sm text-muted mb-3">
              Upload <strong>Queries.csv</strong> hoặc <strong>Pages.csv</strong> từ GSC Performance →
              cross-reference với audit để biết câu hỏi nào đang impression cao nhưng CTR thấp.
            </p>
            <input ref={fileRef} type="file" accept=".csv" className="hidden"
              onChange={e=>{const f=e.target.files?.[0]; if(f) uploadGsc(f);}}/>
            <button onClick={()=>fileRef.current?.click()} disabled={uploadingGsc} className="btn btn-secondary text-sm">
              <Upload size={14}/> {uploadingGsc ? "Uploading…" : "Upload GSC CSV"}
            </button>

            {gsc && (
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Stat label="Clicks" value={gsc.totals.clicks}/>
                  <Stat label="Impressions" value={gsc.totals.impressions}/>
                  <Stat label="Avg CTR" value={`${(gsc.totals.avgCtr * 100).toFixed(2)}%`}/>
                  <Stat label="Avg position" value={gsc.totals.avgPosition.toFixed(1)}/>
                </div>
                {gsc.topOpportunities?.length > 0 && (
                  <div>
                    <h4 className="text-eyebrow mb-2">Top opportunities</h4>
                    <div className="space-y-1.5">
                      {gsc.topOpportunities.slice(0, 5).map((o:any, i:number)=>(
                        <div key={i} className="flex items-center gap-3 text-sm px-3 py-2 rounded-lg bg-bg">
                          <Badge variant="info">#{Math.round(o.position)}</Badge>
                          <span className="font-medium flex-1 truncate">{o.query || o.page}</span>
                          <span className="text-muted text-xs">{o.impressions.toLocaleString()} imp · {o.clicks} clicks</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Top issues summary */}
          {data.report.topIssues?.length > 0 && (
            <section className="mb-8">
              <div className="flex items-baseline justify-between mb-3">
                <h2 className="h-section">Top issues — {data.report.topIssues.length} found</h2>
                <a href={`/audit/${id}/actions`} className="text-sm text-ink hover:underline underline-offset-2">
                  Continue to actions →
                </a>
              </div>
              <div className="space-y-2">
                {data.report.topIssues.slice(0, 5).map((iss:any, i:number)=>(
                  <div key={i} className="flex items-center gap-3 px-3 py-3 rounded-lg border border-border bg-surface">
                    <Badge variant={iss.priority==="high"?"danger":iss.priority==="medium"?"warning":"default"}>
                      {iss.priority}
                    </Badge>
                    <span className="text-sm font-medium flex-1 truncate">{iss.title}</span>
                    <span className="text-xs text-muted">{iss.category}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Categories */}
          <section className="mb-8">
            <h2 className="h-section mb-4">Category scores</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 card">
              {Object.entries(data.report.categories || {}).map(([cat, val]: [string, any])=>(
                <div key={cat}>
                  <ScoreBar value={val.score} label={cat.replace(/_/g," ").replace(/\b\w/g,l=>l.toUpperCase())}/>
                </div>
              ))}
            </div>
          </section>

          {/* Continue button */}
          <div className="flex justify-end gap-3 pt-6 border-t border-border">
            <a href={`/audit/${id}/actions`} className="btn btn-primary">
              Step 4: Take action <ArrowRight size={14}/>
            </a>
          </div>

          <details className="card mt-8">
            <summary className="cursor-pointer text-sm font-medium text-muted hover:text-ink">
              Raw JSON
            </summary>
            <ResultPanel title="" data={data.report} />
          </details>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="border-l-2 border-border pl-3">
      <div className="font-serif text-xl">{typeof value === "number" ? value.toLocaleString() : value}</div>
      <div className="text-xs text-muted mt-0.5">{label}</div>
    </div>
  );
}
