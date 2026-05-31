import React, { useState, useEffect, useRef } from "react";
import { Search, Loader2, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

interface CommandResult {
  id: number;
  intent: string;
  status: "success" | "partial" | "failed";
  result?: any;
  errorMessage?: string;
  executionTime?: number;
}

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<CommandResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const executeCommand = trpc.commandCenter.executeCommand.useMutation();
  const getSavedCommands = trpc.commandCenter.getSavedCommands.useQuery(undefined, {
    enabled: isOpen && !!user,
  });

  // Keyboard shortcut: Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(!isOpen);
        setInput("");
        setResults([]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle command execution
  const handleExecute = async (command: string) => {
    if (!command.trim()) return;

    setIsLoading(true);
    try {
      const result = await executeCommand.mutateAsync({ input: command });
      setResults((prev) => [result, ...prev]);
      setInput("");
      setSelectedIndex(0);
    } catch (error) {
      console.error("Command execution failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleExecute(input);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(0, prev - 1));
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(results.length - 1, prev + 1));
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-3 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg transition-all"
        title="Command Palette (Cmd+K)"
      >
        <Search className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50">
      <div className="w-full max-w-2xl bg-slate-900 rounded-lg shadow-2xl border border-slate-700 overflow-hidden">
        {/* Input Section */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-cyan-400" />
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything... (e.g., 'Show website uptime', 'List all agents', 'Email queue status')"
              className="flex-1 bg-transparent text-white placeholder-slate-400 outline-none text-lg"
            />
            {isLoading && <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Press <kbd className="bg-slate-800 px-2 py-1 rounded">Esc</kbd> to close,{" "}
            <kbd className="bg-slate-800 px-2 py-1 rounded">↑↓</kbd> to navigate
          </p>
        </div>

        {/* Results Section */}
        <div className="max-h-96 overflow-y-auto">
          {results.length === 0 && !isLoading && (
            <div className="p-8 text-center text-slate-400">
              <p className="text-sm">
                {input.trim() === ""
                  ? "Type a command to get started"
                  : "No results. Press Enter to execute command."}
              </p>
            </div>
          )}

          {results.map((result, idx) => (
            <div
              key={result.id}
              className={`p-4 border-b border-slate-700 cursor-pointer transition-colors ${
                idx === selectedIndex ? "bg-slate-800" : "hover:bg-slate-800/50"
              }`}
            >
              <div className="flex items-start gap-3">
                {result.status === "success" && (
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                )}
                {result.status === "partial" && (
                  <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                )}
                {result.status === "failed" && (
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-white capitalize">{result.intent}</p>
                    {result.executionTime && (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {result.executionTime}ms
                      </span>
                    )}
                  </div>

                  {result.result && (
                    <div className="mt-2 text-sm text-slate-300 max-h-24 overflow-y-auto">
                      <pre className="bg-slate-950 p-2 rounded text-xs overflow-x-auto">
                        {JSON.stringify(result.result, null, 2)}
                      </pre>
                    </div>
                  )}

                  {result.errorMessage && (
                    <p className="mt-1 text-sm text-red-400">{result.errorMessage}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Saved Commands Section */}
        {getSavedCommands.data && getSavedCommands.data.length > 0 && results.length === 0 && (
          <div className="p-4 border-t border-slate-700 bg-slate-950">
            <p className="text-xs text-slate-400 mb-2">Saved Commands</p>
            <div className="grid grid-cols-2 gap-2">
              {getSavedCommands.data.map((cmd) => (
                <button
                  key={cmd.id}
                  onClick={() => {
                    setInput(cmd.commandTemplate);
                    inputRef.current?.focus();
                  }}
                  className="p-2 text-left text-sm rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 transition-colors"
                >
                  {cmd.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
