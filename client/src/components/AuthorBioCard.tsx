/**
 * AuthorBioCard — displays author avatar, name, title, and bio
 * Shown at the bottom of each blog article, above the share buttons.
 */

import { User } from "lucide-react";

interface AuthorBioCardProps {
  name: string;
  title?: string | null;
  bio?: string | null;
  avatar?: string | null;
}

export default function AuthorBioCard({ name, title, bio, avatar }: AuthorBioCardProps) {
  // Don't render if there's nothing meaningful to show beyond a generic name
  const hasContent = bio || title || avatar;
  if (!hasContent && name === "GigitekAI Team") return null;

  return (
    <div className="mt-8 bg-[#0A0E1A]/80 rounded-2xl p-6 border border-cyan-500/20 flex flex-col sm:flex-row items-start gap-5">
      {/* Avatar */}
      <div className="flex-shrink-0">
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            className="w-16 h-16 rounded-full object-cover border-2 border-cyan-500/40 shadow-sm"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00D4FF]/20 to-[#0A0E1A]/40 border-2 border-cyan-500/30 flex items-center justify-center">
            <User size={28} className="text-[#00D4FF]" />
          </div>
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-bold uppercase tracking-widest text-[#00D4FF]"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Written by
          </span>
        </div>
        <h4
          className="text-lg font-bold text-white leading-tight"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {name}
        </h4>
        {title && (
          <p className="text-sm text-cyan-400 mt-0.5 mb-2">{title}</p>
        )}
        {bio && (
          <p className="text-sm text-gray-300 leading-relaxed">{bio}</p>
        )}
        {name === "Harry Henry Santiago" && (
          <a
            href="https://www.linkedin.com/in/gigitekinc"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-2 text-xs text-cyan-400 hover:text-cyan-300 transition underline"
          >
            linkedin.com/in/gigitekinc
          </a>
        )}
      </div>
    </div>
  );
}
