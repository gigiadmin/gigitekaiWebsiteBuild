import { Link } from "wouter";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

/**
 * Breadcrumb Navigation Component
 * Displays a hierarchical path showing the user's location in the application
 * Last item is not clickable (current page)
 */
export default function Breadcrumb({ items }: BreadcrumbProps) {
  if (!items || items.length === 0) return null;

  return (
    <nav className="flex items-center gap-2 mb-6 text-sm">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isFirst = index === 0;

        return (
          <div key={index} className="flex items-center gap-2">
            {!isFirst && (
              <ChevronRight className="w-4 h-4 text-slate-500" />
            )}
            {isLast ? (
              <span className="text-slate-300 font-medium">{item.label}</span>
            ) : (
              <Link href={item.href || "#"}>
                <a className="text-cyan-400 hover:text-cyan-300 hover:underline transition-all duration-200 cursor-pointer">
                  {item.label}
                </a>
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
