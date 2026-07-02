/**
 * GigitekMarkdown — lightweight drop-in replacement for <Streamdown>
 * Uses react-markdown + remark-gfm (~50KB) instead of streamdown (~11MB with shiki/mermaid)
 * Renders GitHub-flavored markdown with GigitekAI brand styling
 *
 * Props:
 *   theme?: "dark" | "light"  — defaults to "dark" for backward compat
 */
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ReactNode } from "react";

interface GigitekMarkdownProps {
  children: string;
  className?: string;
  theme?: "dark" | "light";
}

export function GigitekMarkdown({ children, className = "", theme = "dark" }: GigitekMarkdownProps) {
  const isLight = theme === "light";

  const colors = {
    h1: isLight ? "text-gray-900" : "text-white",
    h2: isLight ? "text-gray-900" : "text-white",
    h3: isLight ? "text-gray-800" : "text-cyan-300",
    p:  isLight ? "text-gray-800" : "text-slate-200",
    li: isLight ? "text-gray-800" : "text-slate-200",
    ul: isLight ? "text-gray-800" : "text-slate-200",
    ol: isLight ? "text-gray-800" : "text-slate-200",
    strong: isLight ? "font-semibold text-gray-900" : "font-semibold text-white",
    em: isLight ? "italic text-gray-700" : "italic text-slate-300",
    blockquote: isLight
      ? "border-l-4 border-cyan-500 pl-4 italic text-gray-700 mb-3 bg-cyan-50 rounded-r-lg py-2 pr-3"
      : "border-l-2 border-cyan-500 pl-4 italic text-slate-300 mb-2",
    hr: isLight ? "border-gray-300 my-4" : "border-slate-700 my-3",
    table: isLight ? "w-full text-sm text-gray-800 border-collapse" : "w-full text-sm text-slate-200 border-collapse",
    th: isLight
      ? "border border-gray-300 px-3 py-2 text-left font-semibold text-gray-900 bg-gray-100"
      : "border border-slate-700 px-3 py-2 text-left font-semibold text-cyan-300 bg-[#0A0E1A]",
    td: isLight ? "border border-gray-300 px-3 py-2 text-gray-800" : "border border-slate-700 px-3 py-2",
    a: "text-cyan-600 hover:text-cyan-700 underline underline-offset-2",
    codeInline: isLight
      ? "bg-gray-100 text-gray-800 text-sm font-mono px-1.5 py-0.5 rounded"
      : "bg-[#0A0E1A] text-cyan-300 text-sm font-mono px-1.5 py-0.5 rounded",
    codeBlock: isLight
      ? "block bg-gray-900 text-green-300 text-sm font-mono p-3 rounded-lg overflow-x-auto mb-2 whitespace-pre border border-gray-200"
      : "block bg-[#0A0E1A] border border-cyan-500/20 rounded-lg p-3 text-cyan-300 text-sm font-mono overflow-x-auto mb-2 whitespace-pre",
  };

  return (
    <div className={`gigitekai-markdown ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }: { children?: ReactNode }) => (
            <h1 className={`text-2xl font-bold ${colors.h1} mb-4 mt-6 leading-tight`}>{children}</h1>
          ),
          h2: ({ children }: { children?: ReactNode }) => (
            <h2 className={`text-xl font-bold ${colors.h2} mb-3 mt-5 leading-snug`}>{children}</h2>
          ),
          h3: ({ children }: { children?: ReactNode }) => (
            <h3 className={`text-lg font-semibold ${colors.h3} mb-2 mt-4`}>{children}</h3>
          ),
          h4: ({ children }: { children?: ReactNode }) => (
            <h4 className={`text-base font-semibold ${colors.h2} mb-2 mt-3`}>{children}</h4>
          ),
          p: ({ children }: { children?: ReactNode }) => (
            <p className={`${colors.p} mb-4 leading-relaxed text-base`}>{children}</p>
          ),
          ul: ({ children }: { children?: ReactNode }) => (
            <ul className={`list-disc list-outside ${colors.ul} mb-4 space-y-1.5 pl-5`}>{children}</ul>
          ),
          ol: ({ children }: { children?: ReactNode }) => (
            <ol className={`list-decimal list-outside ${colors.ol} mb-4 space-y-1.5 pl-5`}>{children}</ol>
          ),
          li: ({ children }: { children?: ReactNode }) => (
            <li className={`${colors.li} leading-relaxed`}>{children}</li>
          ),
          code: ({ children, className: cls }: { children?: ReactNode; className?: string }) => {
            const isBlock = cls?.includes("language-");
            return isBlock ? (
              <code className={colors.codeBlock}>{children}</code>
            ) : (
              <code className={colors.codeInline}>{children}</code>
            );
          },
          pre: ({ children }: { children?: ReactNode }) => <pre className="mb-3">{children}</pre>,
          a: ({ href, children }: { href?: string; children?: ReactNode }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className={colors.a}>
              {children}
            </a>
          ),
          blockquote: ({ children }: { children?: ReactNode }) => (
            <blockquote className={`${colors.blockquote} mb-4`}>{children}</blockquote>
          ),
          strong: ({ children }: { children?: ReactNode }) => (
            <strong className={colors.strong}>{children}</strong>
          ),
          em: ({ children }: { children?: ReactNode }) => (
            <em className={colors.em}>{children}</em>
          ),
          hr: () => <hr className={`${colors.hr}`} />,
          table: ({ children }: { children?: ReactNode }) => (
            <div className="overflow-x-auto mb-4">
              <table className={colors.table}>{children}</table>
            </div>
          ),
          th: ({ children }: { children?: ReactNode }) => (
            <th className={colors.th}>{children}</th>
          ),
          td: ({ children }: { children?: ReactNode }) => (
            <td className={colors.td}>{children}</td>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

// Named export for drop-in compatibility with streamdown's { Streamdown } export
export { GigitekMarkdown as Streamdown };
export default GigitekMarkdown;
