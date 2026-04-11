/**
 * ShareButtons — Social share row for blog articles
 * Buttons: LinkedIn share, X (Twitter) share, Copy link
 * Usage: <ShareButtons url={canonicalUrl} title={postTitle} />
 */

import { useState } from "react";
import { Link2, Check } from "lucide-react";

interface ShareButtonsProps {
  url: string;   // full canonical URL of the article
  title: string; // article title for pre-filled share text
  className?: string;
}

// ── SVG brand icons ──────────────────────────────────────────────────────────

function LinkedInIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function XIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

// ── component ────────────────────────────────────────────────────────────────

export default function ShareButtons({ url, title, className = "" }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const linkedInHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
  const xHref = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm text-gray-500 mr-1 font-medium">Share:</span>

      {/* LinkedIn */}
      <a
        href={linkedInHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on LinkedIn"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border transition-all duration-200 bg-white text-[#0A66C2] border-[#0A66C2]/30 hover:bg-[#0A66C2] hover:text-white hover:border-[#0A66C2] hover:shadow-[0_0_10px_rgba(10,102,194,0.3)]"
      >
        <LinkedInIcon size={15} />
        LinkedIn
      </a>

      {/* X (Twitter) */}
      <a
        href={xHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on X"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border transition-all duration-200 bg-white text-gray-900 border-gray-300 hover:bg-gray-900 hover:text-white hover:border-gray-900 hover:shadow-[0_0_10px_rgba(0,0,0,0.15)]"
      >
        <XIcon size={15} />
        X
      </a>

      {/* Copy link */}
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copy link to article"
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border transition-all duration-200 ${
          copied
            ? "bg-green-500 text-white border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.35)]"
            : "bg-white text-gray-600 border-gray-300 hover:bg-[#00D4FF] hover:text-[#0A0E1A] hover:border-[#00D4FF] hover:shadow-[0_0_10px_rgba(0,212,255,0.3)]"
        }`}
      >
        {copied ? <Check size={15} /> : <Link2 size={15} />}
        {copied ? "Copied!" : "Copy link"}
      </button>
    </div>
  );
}
