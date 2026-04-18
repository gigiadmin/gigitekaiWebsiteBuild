import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface CodeBlockWithCopyProps {
  code: string;
  language?: string;
}

export function CodeBlockWithCopy({ code, language = "bash" }: CodeBlockWithCopyProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <div className="relative group">
      <pre className="bg-slate-900 border border-slate-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300">
        <code className={`language-${language}`}>
          {code}
        </code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-2 rounded-lg bg-slate-800 border border-slate-700 text-gray-400 hover:text-white hover:bg-slate-700 transition-colors opacity-0 group-hover:opacity-100"
        title="Copy to clipboard"
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-400" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </button>
      {copied && (
        <span className="absolute top-12 right-2 text-xs text-green-400 bg-slate-900 border border-slate-700 rounded px-2 py-1 whitespace-nowrap">
          Copied!
        </span>
      )}
    </div>
  );
}
