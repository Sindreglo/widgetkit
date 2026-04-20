"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface Props {
  code: string;
  compact?: boolean;
}

export function CodeBlock({ code, compact }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`demo-code-block${compact ? " demo-code-block-compact" : ""}`}>
      <div className="demo-code-header">
        <div />
        <button
          type="button"
          className={`demo-code-copy${copied ? " copied" : ""}`}
          onClick={copy}
          aria-label="Copy code"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="demo-code-pre"><code>{code}</code></pre>
    </div>
  );
}
