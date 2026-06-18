"use client";
import { useState } from "react";
import { ToolHeader } from "@/components/ToolHeader";
import { ResultPanel } from "@/components/ResultPanel";
import { Badge } from "@/components/Badge";
import { CheckCircle2, AlertCircle } from "lucide-react";

export default function HreflangTool() {
  const [url, setUrl] = useState("https://www.invoicetodata.com/");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const go = async () => {
    setLoading(true); setError(""); setData(null);
    try {
      const res = await fetch("/api/generate/hreflang", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setData(d);
    } catch(e) { setError((e as Error).message); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <ToolHeader eyebrow="Analyze" title="Hreflang Validator"
        description="Detect reciprocal link issues, x-default, invalid ISO codes."/>
      <div className="card space-y-4">
        <input value={url} onChange={e=>setUrl(e.target.value)} className="input"/>
        <button onClick={go} disabled={loading} className="btn btn-primary">{loading?"Validating…":"Validate"}</button>
        {error && <p className="text-danger text-sm">{error}</p>}
      </div>
      {data && (
        <div className="space-y-4 mt-6 animate-slide-up">
          <div className={`card ${data.valid?"border-green-200 bg-green-50/50":"border-red-200 bg-red-50/50"}`}>
            <div className="flex items-center gap-3">
              {data.valid ? <CheckCircle2 size={20} className="text-success"/> : <AlertCircle size={20} className="text-danger"/>}
              <div>
                <p className="font-medium">{data.valid?"Implementation valid":"Issues found"}</p>
                <p className="text-xs text-muted mt-0.5">
                  Detected lang: <code>{data._crawled?.lang || "none"}</code> · Tags: {data._crawled?.tags?.length || 0}
                </p>
              </div>
            </div>
          </div>
          {Array.isArray(data.issues) && data.issues.length>0 && (
            <div className="card">
              <h3 className="text-eyebrow mb-3">Issues</h3>
              <ul className="space-y-3">
                {data.issues.map((i:any,idx:number)=>(
                  <li key={idx} className="flex gap-3">
                    <Badge variant={i.severity==="error"?"danger":i.severity==="warning"?"warning":"default"}>{i.severity}</Badge>
                    <div className="flex-1 text-sm">
                      <p>{i.message}</p>
                      <p className="text-muted text-xs mt-1"><strong>Fix:</strong> {i.fix}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <ResultPanel title="Full report" data={data}/>
        </div>
      )}
    </div>
  );
}
