/**
 * CannedResponsePicker — Floating panel for selecting canned replies.
 * Opens when agent clicks the "Canned" button in the reply area.
 * Supports search, category filter, and one-click insert.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Search, Zap, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CannedResponsePickerProps {
  onSelect: (body: string) => void;
}

const CATEGORIES = ["all", "general", "network", "hardware", "software", "security", "m365", "billing"];

export default function CannedResponsePicker({ onSelect }: CannedResponsePickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const { data: allResponses } = trpc.cannedResponses.list.useQuery(
    { category: category === "all" ? undefined : category },
    { enabled: open }
  );

  const { data: searchResults } = trpc.cannedResponses.search.useQuery(
    { query: search },
    { enabled: open && search.length > 1 }
  );

  const displayed = search.length > 1 ? (searchResults ?? []) : (allResponses ?? []);

  function handleSelect(body: string) {
    onSelect(body);
    setOpen(false);
    setSearch("");
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen((p) => !p)}
        className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/50 rounded-xl text-sm"
      >
        <Zap className="w-4 h-4 mr-1.5" />
        Canned
        <ChevronDown className={`w-3 h-3 ml-1 transition-transform ${open ? "rotate-180" : ""}`} />
      </Button>

      {open && (
        <div className="absolute bottom-full mb-2 right-0 w-80 bg-[#141B2D] border border-gray-700 rounded-xl shadow-2xl shadow-black/50 z-50">
          {/* Search */}
          <div className="p-3 border-b border-gray-800">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              <input
                type="text"
                placeholder="Search responses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                className="w-full pl-8 pr-3 py-1.5 bg-[#0A0E1A] border border-gray-700 rounded-lg text-xs text-white placeholder-gray-500 focus:border-[#00D4FF]/40 focus:outline-none"
              />
            </div>
          </div>

          {/* Category tabs */}
          {search.length <= 1 && (
            <div className="flex gap-1 p-2 border-b border-gray-800 overflow-x-auto">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap transition-colors ${
                    category === c
                      ? "bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/30"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </button>
              ))}
            </div>
          )}

          {/* Results */}
          <div className="max-h-64 overflow-y-auto p-1">
            {displayed.length === 0 ? (
              <p className="text-center text-gray-500 text-xs py-6">
                {search ? "No matches" : "No canned responses yet"}
              </p>
            ) : (
              displayed.map((r: any) => (
                <button
                  key={r.id}
                  onClick={() => handleSelect(r.body)}
                  className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-[#00D4FF]/5 hover:border-[#00D4FF]/10 border border-transparent transition-all group"
                >
                  <p className="text-white text-xs font-medium group-hover:text-[#00D4FF] transition-colors truncate">
                    {r.title}
                  </p>
                  <p className="text-gray-500 text-[10px] truncate mt-0.5">
                    {r.body.substring(0, 80)}...
                  </p>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-gray-800 text-center">
            <button
              onClick={() => setOpen(false)}
              className="text-[10px] text-gray-400 hover:text-gray-400"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
