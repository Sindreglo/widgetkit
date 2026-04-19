"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface Props {
  code: string;
  vue?: string;
  compact?: boolean;
}

export function CodeBlock({ code, vue, compact }: Props) {
  const [lang, setLang] = useState<"react" | "vue">("react");
  const [copied, setCopied] = useState(false);

  const displayed = lang === "vue" && vue ? vue : code;

  const copy = async () => {
    await navigator.clipboard.writeText(displayed);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`demo-code-block${compact ? " demo-code-block-compact" : ""}`}>
      <div className="demo-code-header">
        {vue ? (
          <div className="code-lang-tabs">
            <button
              type="button"
              className={`code-lang-btn${lang === "react" ? " active" : ""}`}
              onClick={() => setLang("react")}
            >
              React
            </button>
            <button
              type="button"
              className={`code-lang-btn${lang === "vue" ? " active" : ""}`}
              onClick={() => setLang("vue")}
            >
              Vue
            </button>
          </div>
        ) : (
          <div />
        )}
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
      <pre className="demo-code-pre"><code>{displayed}</code></pre>
    </div>
  );
}
