"use client";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

export function ResultPanel({
  title,
  data,
  copyAs = "json",
}: {
  title?: string;
  data: unknown;
  copyAs?: "json" | "text";
}) {
  const [copied, setCopied] = useState(false);
  const text =
    copyAs === "json"
      ? typeof data === "string"
        ? data
        : JSON.stringify(data, null, 2)
      : String(data);

  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="card animate-slide-up">
      <div className="flex items-center justify-between mb-3">
        {title && <h3 className="font-medium text-ink">{title}</h3>}
        <button onClick={copy} className="btn-ghost text-xs gap-1.5 -my-1 ml-auto px-2 py-1">
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="code max-h-[600px]">{text}</pre>
    </div>
  );
}
