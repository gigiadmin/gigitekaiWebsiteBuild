/**
 * TechStackLogos Component
 * Renders vendor logos for technology stack section
 * Used in ServiceDetail and other pages
 */

import { getVendorLogo } from "@/lib/vendorLogos";

interface TechStackLogosProps {
  technologies: string[];
  className?: string;
}

export default function TechStackLogos({
  technologies,
  className = "flex flex-wrap justify-center gap-6 md:gap-8",
}: TechStackLogosProps) {
  return (
    <div className={className}>
      {technologies.map((tech, i) => {
        const { url, alt } = getVendorLogo(tech);
        return (
          <div
            key={i}
            className="flex flex-col items-center gap-2 group"
            title={tech}
          >
            {/* Logo Container */}
            <div className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center bg-white dark:bg-[#141B2D] rounded-lg border border-gray-100 dark:border-[rgba(0,212,255,0.15)] shadow-sm hover:border-[#00D4FF]/40 hover:shadow-md transition-all duration-200 group-hover:scale-105">
              <img
                src={url}
                alt={alt}
                className="w-10 h-10 md:w-12 md:h-12 object-contain"
                loading="lazy"
                onError={(e) => {
                  // Fallback: show text if image fails to load
                  const img = e.target as HTMLImageElement;
                  img.style.display = "none";
                  const parent = img.parentElement;
                  if (parent) {
                    const span = document.createElement("span");
                    span.className = "text-xs font-semibold text-gray-600 dark:text-gray-400 text-center px-1";
                    span.textContent = tech;
                    parent.appendChild(span);
                  }
                }}
              />
            </div>
            {/* Label */}
            <span className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 text-center max-w-[80px] group-hover:text-[#00D4FF] transition-colors">
              {tech}
            </span>
          </div>
        );
      })}
    </div>
  );
}
