"use client";

import { cn } from "@/lib/utils";
import { Check, Copy } from "lucide-react";
import { useState, type HTMLAttributes } from "react";

interface CodeBlockProps extends HTMLAttributes<HTMLPreElement> {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
}

function CodeBlock({ code, language = "bash", filename, showLineNumbers, className, ...props }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.split("\n");

  return (
    <div className={cn("relative group rounded-xl overflow-hidden border border-card-border", className)}>
      {(filename || language) && (
        <div className="flex items-center justify-between px-4 py-2 bg-white/[0.02] border-b border-card-border">
          <span className="text-xs text-muted-foreground font-mono">
            {filename || language}
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-success" />
                <span className="text-success">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      )}
      <pre className="p-4 overflow-x-auto bg-[#0a0a12]" {...props}>
        <code className="text-sm leading-relaxed font-mono">
          {lines.map((line, i) => (
            <div key={i} className="flex">
              {showLineNumbers && (
                <span className="select-none pr-4 text-muted/50 text-right w-8 shrink-0">
                  {i + 1}
                </span>
              )}
              <span
                dangerouslySetInnerHTML={{
                  __html: highlightSyntax(line, language),
                }}
              />
            </div>
          ))}
        </code>
      </pre>
      {!filename && !language && (
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 rounded-md bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
        >
          {copied ? (
            <Check className="h-4 w-4 text-success" />
          ) : (
            <Copy className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      )}
    </div>
  );
}

function highlightSyntax(line: string, language: string): string {
  let result = escapeHtml(line);

  // Comments
  result = result.replace(
    /(#.*$|\/\/.*$)/gm,
    '<span style="color: #6b7280">$1</span>'
  );

  // Strings
  result = result.replace(
    /(&quot;[^&]*&quot;|&#39;[^&]*&#39;|"[^"]*"|'[^']*')/g,
    '<span style="color: #22c55e">$1</span>'
  );

  // Keywords
  const keywords = language === "python"
    ? /\b(import|from|def|class|return|if|else|for|in|while|try|except|with|as|async|await|True|False|None)\b/g
    : /\b(const|let|var|function|return|if|else|for|while|try|catch|async|await|import|from|export|default|new|class|true|false|null|undefined)\b/g;
  result = result.replace(keywords, '<span style="color: #8b5cf6">$1</span>');

  // Numbers
  result = result.replace(
    /\b(\d+\.?\d*)\b/g,
    '<span style="color: #f59e0b">$1</span>'
  );

  // Function calls
  result = result.replace(
    /(\w+)(\()/g,
    '<span style="color: #00d4ff">$1</span>$2'
  );

  return result;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export { CodeBlock };
