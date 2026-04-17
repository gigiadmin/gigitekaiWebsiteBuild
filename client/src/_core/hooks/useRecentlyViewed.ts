import { useEffect, useState } from "react";

export interface RecentlyViewedItem {
  href: string;
  label: string;
  timestamp: number;
  icon?: string;
}

const STORAGE_KEY = "gigitekai_recently_viewed";
const MAX_ITEMS = 5;

/**
 * Hook to track and retrieve recently viewed pages
 * Stores up to 5 most recent pages in localStorage
 */
export function useRecentlyViewed() {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setItems(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse recently viewed items:", e);
      }
    }
  }, []);

  const addItem = (href: string, label: string, icon?: string) => {
    setItems((prev) => {
      // Remove if already exists
      const filtered = prev.filter((item) => item.href !== href);

      // Add new item at the beginning
      const updated = [
        { href, label, timestamp: Date.now(), icon },
        ...filtered,
      ].slice(0, MAX_ITEMS);

      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      return updated;
    });
  };

  const clearAll = () => {
    setItems([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return { items, addItem, clearAll };
}
