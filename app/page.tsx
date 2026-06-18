"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Plus, Settings } from "lucide-react";
import { StatusBadge } from "@/components/Badge";
import { GlobalSteps } from "@/components/StepNav";

interface AuditMeta {
  id: string;
  url: string;
  status: string;
  created_at: number;
  has_error: boolean;
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [audits, setAudits] = useState<AuditMeta[]>([]);
  const [setupStatus, setSetupStatus] = useState<any>(null);
  const router = useRouter();

  const loadAudits = async () => {
    try {
      const res = await fetch("/api/audit");
      const data = await res.json();
      setAudits(data.audits || []);
    } catch {}
  };

  const loadSetup = async () => {
    try {
      const r = await fetch("/api/setup");
      const d = await r.json();
      setSetupStatus(d);
    } catch {}
  };

  useEffect(() => {
    loadSetup();
    loadAudits();
    const i = setInterval(loadAudits, 4000);
    return () => clearInterval(i);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const target = url.startsWith("http") ? url : `https://${url}`;
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      router.push(`/audit/${data.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatRelative = (ts: number) => {
    const diff = Date.now() - ts;
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return new Date(ts).toLocaleDateString();
  };

  const needsSetup = setupStatus && !setupStatus.hasApiKey;

  return (
    <div>
      <GlobalSteps current={2} />

      {/* Setup warning */}
      {needsSetup && (
        <div className="card border-amber-200 bg-amber-50/50 mb-6 flex items-start gap-3">
          <Settings size={18} className="text-warning shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-ink">Setup not complete</p>
            <p className="text-sm text-muted mt-1">
              Configure your Claude API key before running an audit.
            </p>
          </div>
          <a href="/setup" className="btn btn-primary text-sm">
            Go to Setup <ArrowUpRight size={14} />
          </a>
        </div>
      )}

      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-surface hero-gradient mb-10">
        <div className="px-8 py-10 md:px-12 md:py-14">
          <div className="text-eyebrow mb-2">Step 2</div>
          <h1 className="h-display mb-3">
            Run an audit.<br />
            <span className="text-muted">Get scored findings + fixes.</span>
          </h1>
          <p className="text-muted text-base max-w-xl mb-7">
            Paste a URL. We crawl, parse SEO signals, and Claude generates a
            production-ready report. Optionally cross-reference Search Console
            data on the results page.
          </p>

          <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2 max-w-2xl">
            <input
              type="text"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.example.com"
              className="input-lg flex-1"
              disabled={needsSetup}
            />
            <button
              type="submit"
              disabled={submitting || needsSetup}
              className="btn btn-primary px-6"
            >
              {submitting ? "Starting…" : "Run audit"}
              {!submitting && <ArrowUpRight size={16} />}
            </button>
          </form>
          {error && <p className="text-danger text-sm mt-3">{error}</p>}
        </div>
      </section>

      {/* Recent audits */}
      <section>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="h-section">Recent audits</h2>
          <span className="text-xs text-subtle">{audits.length} total</span>
        </div>

        {audits.length === 0 ? (
          <div className="card text-center py-12">
            <div className="w-10 h-10 rounded-full bg-bg flex items-center justify-center mx-auto mb-3">
              <Plus size={18} className="text-muted" />
            </div>
            <p className="text-sm text-muted">
              No audits yet. Run your first above.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {audits.map((a) => (
              <a
                key={a.id}
                href={`/audit/${a.id}`}
                className="group flex items-center justify-between px-4 py-3 rounded-lg border border-border bg-surface hover:border-ink/20 hover:shadow-soft transition-all"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm truncate">{a.url}</div>
                  <div className="text-xs text-muted mt-0.5">
                    {formatRelative(a.created_at)}
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <StatusBadge status={a.status} />
                  <ArrowUpRight
                    size={15}
                    className="text-subtle group-hover:text-ink transition-colors"
                  />
                </div>
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
