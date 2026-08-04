import React from "react";
import { FileText, ExternalLink } from "lucide-react";

function isPdfUrl(url: string): boolean {
  return /\.pdf(\?|#|$)/i.test(url);
}

function shortenUrl(url: string, max = 32): string {
  try {
    const parsed = new URL(url);
    const last = parsed.pathname.split("/").filter(Boolean).pop() || parsed.hostname;
    const decoded = decodeURIComponent(last);
    return decoded.length > max ? `${decoded.slice(0, max)}…` : decoded;
  } catch {
    return url.length > max ? `${url.slice(0, max)}…` : url;
  }
}

// Renders plain text with any http(s) URLs converted into clickable chips.
// PDF links get a distinct "View PDF" treatment so uploaded design files /
// documents are obviously openable instead of showing as a raw long URL.
export function Linkify({ text, className }: { text: string; className?: string }) {
  if (!text) return null;
  const parts = text.split(/(https?:\/\/[^\s<>"')]+)/g);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.startsWith("http://") || part.startsWith("https://")) {
          const pdf = isPdfUrl(part);
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mx-0.5 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-semibold text-[11px] align-middle hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
            >
              {pdf ? <FileText className="w-3 h-3" /> : <ExternalLink className="w-3 h-3" />}
              {pdf ? "View PDF" : shortenUrl(part)}
            </a>
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </span>
  );
}

// Some older records (e.g. Meta lead webhook payloads) embedded a raw
// JSON.stringify() blob inline in a notes string. Expand any such flat
// `{...}` object into readable "key: value" lines instead of showing braces
// and quotes verbatim.
export function humanizeEmbeddedJson(text: string): string {
  if (!text) return text;
  return text.replace(/\{[^{}]*\}/g, (match) => {
    try {
      const obj = JSON.parse(match) as unknown;
      if (obj && typeof obj === "object" && !Array.isArray(obj)) {
        return Object.entries(obj as Record<string, unknown>)
          .map(([key, value]) => `  ${key}: ${value}`)
          .join("\n");
      }
    } catch {
      // Not valid JSON — leave the original text untouched.
    }
    return match;
  });
}
