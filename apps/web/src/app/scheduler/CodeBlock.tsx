"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface Props {
  code: string;
  vue?: string;
  js?: string;
  compact?: boolean;
}

export function CodeBlock({ code, vue, js, compact }: Props) {
  const [lang, setLang] = useState<"react" | "vue" | "js">("react");
  const [copied, setCopied] = useState(false);

  const displayed = lang === "vue" && vue ? vue : lang === "js" && js ? js : code;

  const copy = async () => {
    await navigator.clipboard.writeText(displayed);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasTabs = vue || js;

  return (
    <div className={`demo-code-block${compact ? " demo-code-block-compact" : ""}`}>
      <div className="demo-code-header">
        {hasTabs ? (
          <div className="code-lang-tabs">
            <button
              type="button"
              className={`code-lang-btn${lang === "react" ? " active" : ""}`}
              onClick={() => setLang("react")}
            >
              React
            </button>
            {vue && (
              <button
                type="button"
                className={`code-lang-btn${lang === "vue" ? " active" : ""}`}
                onClick={() => setLang("vue")}
              >
                Vue
              </button>
            )}
            {js && (
              <button
                type="button"
                className={`code-lang-btn${lang === "js" ? " active" : ""}`}
                onClick={() => setLang("js")}
              >
                JS
              </button>
            )}
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
