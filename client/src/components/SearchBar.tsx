import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

/**
 * SearchBar Component
 * Professional search bar with real-time autocomplete suggestions
 * Integrates into header and provides access to search results page
 */
export function SearchBar() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random()}`);
  const inputRef = useRef<HTMLInputElement>(null);
  const [, setLocation] = useLocation();

  // Fetch suggestions as user types
  const { data: suggestions = [] } = trpc.search.suggestions.useQuery(
    { q: query, limit: 8 },
    { enabled: query.length > 0 }
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      // Navigate to search results page
      setLocation(`/search?q=${encodeURIComponent(searchQuery)}&sessionId=${sessionId}`);
      setQuery("");
      setIsOpen(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    handleSearch(suggestion);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch(query);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-full max-w-md">
      {/* Search Input */}
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search solutions, blog, KB..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length > 0 && setIsOpen(true)}
          className="w-full pl-10 pr-10 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-3 text-gray-400 hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && query.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-50">
          {suggestions.length > 0 ? (
            <ul className="py-2">
              {suggestions.map((suggestion, index) => (
                <li key={index}>
                  <button
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-800 text-gray-200 hover:text-cyan-400 transition-colors flex items-center gap-2"
                  >
                    <Search className="w-3 h-3 text-gray-500" />
                    {suggestion}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-3 text-gray-400 text-sm">
              No suggestions found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
