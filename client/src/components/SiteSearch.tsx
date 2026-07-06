/*
  GigitekAI Site-Wide Search
  Searches blog posts (client-side filter from cached list) and KB articles (server search)
  Opens as a full-width overlay panel below the navbar
*/

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, FileText, BookOpen, ArrowRight, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

interface SearchResult {
  type: "blog" | "kb";
  id: string | number;
  title: string;
  excerpt: string;
  href: string;
  category?: string;
}

interface SiteSearchProps {
  open: boolean;
  onClose: () => void;
}

export default function SiteSearch({ open, onClose }: SiteSearchProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [, navigate] = useLocation();

  // Debounce query
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setDebouncedQuery("");
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Blog posts — fetch all once, filter client-side
  const { data: allPosts } = trpc.blog.listPosts.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });

  // KB articles — server search
  const { data: kbResults, isFetching: kbLoading } = trpc.kb.search.useQuery(
    { query: debouncedQuery },
    { enabled: debouncedQuery.length >= 2 }
  );

  const blogResults: SearchResult[] = debouncedQuery.length >= 2
    ? (allPosts ?? [])
        .filter((p) => {
          const q = debouncedQuery.toLowerCase();
          return (
            p.title.toLowerCase().includes(q) ||
            (p.excerpt ?? "").toLowerCase().includes(q) ||
            (p.category ?? "").toLowerCase().includes(q)
          );
        })
        .slice(0, 4)
        .map((p) => ({
          type: "blog" as const,
          id: p.id,
          title: p.title,
          excerpt: p.excerpt ?? "",
          href: `/blog/${p.slug}`,
          category: p.category ?? undefined,
        }))
    : [];

  const kbSearchResults: SearchResult[] = (kbResults ?? []).slice(0, 4).map((a: any) => ({
    type: "kb" as const,
    id: a.id,
    title: a.title,
    excerpt: (a.content ?? "").substring(0, 120) + "…",
    href: `/kb/${a.id}`,
    category: a.category ?? undefined,
  }));

  const allResults = [...blogResults, ...kbSearchResults];
  const isLoading = kbLoading && debouncedQuery.length >= 2;
  const showEmpty = debouncedQuery.length >= 2 && !isLoading && allResults.length === 0;

  const handleSelect = useCallback(
    (href: string) => {
      onClose();
      navigate(href);
    },
    [onClose, navigate]
  );

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Search panel */}
      <div className="fixed top-0 left-0 right-0 z-[100] bg-white dark:bg-[#0A0E1A] border-b border-gray-200 dark:border-[rgba(0,212,255,0.15)] shadow-2xl">
        <div className="container py-4">
          {/* Input row */}
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus-within:border-[#00D4FF]/50 transition-[opacity,transform]">
              <Search size={18} className="text-gray-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search blog posts, knowledge base, services…"
                className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none"
                aria-label="Site search"
              />
              {isLoading && <Loader2 size={16} className="text-[#00D4FF] animate-spin shrink-0" />}
              {query && !isLoading && (
                <button
                  onClick={() => setQuery("")}
                  className="text-gray-400 hover:text-gray-400 dark:hover:text-white transition-colors"
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-medium"
            >
              Cancel
            </button>
          </div>

          {/* Results */}
          {debouncedQuery.length >= 2 && (
            <div className="mt-4 pb-2 space-y-1 max-h-[60vh] overflow-y-auto">
              {showEmpty && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No results found for "<span className="text-white">{debouncedQuery}</span>"
                </div>
              )}

              {blogResults.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest px-2 mb-2 flex items-center gap-1.5">
                    <FileText size={12} />
                    Blog & Insights
                  </p>
                  {blogResults.map((r) => (
                    <button
                      key={`blog-${r.id}`}
                      onClick={() => handleSelect(r.href)}
                      className="w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#00D4FF]/10 border border-[#00D4FF]/20 flex items-center justify-center shrink-0 mt-0.5">
                        <FileText size={14} className="text-[#00D4FF]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-[#00D4FF] transition-colors">
                          {r.title}
                        </p>
                        {r.category && (
                          <p className="text-xs text-gray-400 mt-0.5">{r.category}</p>
                        )}
                      </div>
                      <ArrowRight size={14} className="text-gray-400 group-hover:text-[#00D4FF] shrink-0 mt-1 transition-colors" />
                    </button>
                  ))}
                </div>
              )}

              {kbSearchResults.length > 0 && (
                <div className={blogResults.length > 0 ? "mt-4" : ""}>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest px-2 mb-2 flex items-center gap-1.5">
                    <BookOpen size={12} />
                    Knowledge Base
                  </p>
                  {kbSearchResults.map((r) => (
                    <button
                      key={`kb-${r.id}`}
                      onClick={() => handleSelect(r.href)}
                      className="w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <BookOpen size={14} className="text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-[#00D4FF] transition-colors">
                          {r.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{r.excerpt}</p>
                      </div>
                      <ArrowRight size={14} className="text-gray-400 group-hover:text-[#00D4FF] shrink-0 mt-1 transition-colors" />
                    </button>
                  ))}
                </div>
              )}

              {/* Quick links when no query */}
            </div>
          )}

          {/* Hint when query is empty */}
          {debouncedQuery.length === 0 && (
            <div className="mt-3 flex flex-wrap gap-2 pb-1">
              {["Cloud Infrastructure", "AI Solutions", "Cybersecurity", "Managed IT Services", "About Us"].map((hint) => (
                <button
                  key={hint}
                  onClick={() => setQuery(hint)}
                  className="px-3 py-1.5 rounded-full text-xs bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-400 dark:text-gray-400 hover:border-[#00D4FF]/40 hover:text-[#00D4FF] transition-[opacity,transform]"
                >
                  {hint}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
