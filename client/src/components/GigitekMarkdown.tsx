/**
 * GigitekMarkdown — lightweight drop-in replacement for <Streamdown>
 * Uses react-markdown + remark-gfm (~50KB) instead of streamdown (~11MB with shiki/mermaid)
 * Renders GitHub-flavored markdown with GigitekAI brand styling
 */
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ReactNode } from "react";

interface GigitekMarkdownProps {
  children: string;
  className?: string;
}

export function GigitekMarkdown({ children, className = "" }: GigitekMarkdownProps) {
  return (
    <div className={`gigitekai-markdown ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings
          h1: ({ children }: { children?: ReactNode }) => <h1 className="text-xl font-bold text-white mb-3 mt-4">{children}</h1>,
          h2: ({ children }: { children?: ReactNode }) => <h2 className="text-lg font-semibold text-white mb-2 mt-3">{children}</h2>,
          h3: ({ children }: { children?: ReactNode }) => <h3 className="text-base font-semibold text-cyan-300 mb-2 mt-3">{children}</h3>,
          // Paragraphs
          p: ({ children }: { children?: ReactNode }) => <p className="text-slate-200 mb-2 leading-relaxed">{children}</p>,
          // Lists
          ul: ({ children }: { children?: ReactNode }) => <ul className="list-disc list-inside text-slate-200 mb-2 space-y-1 pl-2">{children}</ul>,
          ol: ({ children }: { children?: ReactNode }) => <ol className="list-decimal list-inside text-slate-200 mb-2 space-y-1 pl-2">{children}</ol>,
          li: ({ children }: { children?: ReactNode }) => <li className="text-slate-200">{children}</li>,
          // Code
          code: ({ children, className: cls }: { children?: ReactNode; className?: string }) => {
            const isBlock = cls?.includes("language-");
            return isBlock ? (
              <code className="block bg-[#0A0E1A] border border-cyan-500/20 rounded-lg p-3 text-cyan-300 text-sm font-mono overflow-x-auto mb-2 whitespace-pre">
                {children}
              </code>
            ) : (
              <code className="bg-[#0A0E1A] text-cyan-300 text-sm font-mono px-1.5 py-0.5 rounded">{children}</code>
            );
          },
          pre: ({ children }: { children?: ReactNode }) => <pre className="mb-2">{children}</pre>,
          // Links
          a: ({ href, children }: { href?: string; children?: ReactNode }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
              {children}
            </a>
          ),
          // Blockquote
          blockquote: ({ children }: { children?: ReactNode }) => (
            <blockquote className="border-l-2 border-cyan-500 pl-4 italic text-slate-300 mb-2">{children}</blockquote>
          ),
          // Strong / Em
          strong: ({ children }: { children?: ReactNode }) => <strong className="font-semibold text-white">{children}</strong>,
          em: ({ children }: { children?: ReactNode }) => <em className="italic text-slate-300">{children}</em>,
          // Horizontal rule
          hr: () => <hr className="border-slate-700 my-3" />,
          // Table
          table: ({ children }: { children?: ReactNode }) => (
            <div className="overflow-x-auto mb-2">
              <table className="w-full text-sm text-slate-200 border-collapse">{children}</table>
            </div>
          ),
          th: ({ children }: { children?: ReactNode }) => (
            <th className="border border-slate-700 px-3 py-2 text-left font-semibold text-cyan-300 bg-[#0A0E1A]">{children}</th>
          ),
          td: ({ children }: { children?: ReactNode }) => (
            <td className="border border-slate-700 px-3 py-2">{children}</td>
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
