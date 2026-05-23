/*
  GigitekAI Floating Contact Speed-Dial
  Bottom-left corner — expands into 3 quick-action options:
  Call, Email, Schedule a Meeting
  Does not compete with the chat widgets in the bottom-right corner
*/

import { useState, useEffect, useRef } from "react";
import { Phone, Mail, Calendar, X, Headphones } from "lucide-react";
import { Link } from "wouter";

const actions = [
  {
    label: "Schedule a Meeting",
    icon: Calendar,
    href: "/contact",
    color: "bg-[#00D4FF] text-[#0A0E1A]",
    hoverColor: "hover:bg-[#00EEFF]",
    description: "Book a free 30-min consultation",
  },
  {
    label: "Send an Email",
    icon: Mail,
    href: "mailto:support@gigitekai.com",
    color: "bg-[#0F1629] text-[#00D4FF] border border-[#00D4FF]/30",
    hoverColor: "hover:bg-[#00D4FF]/10",
    description: "support@gigitekai.com",
    external: true,
  },
  {
    label: "Call Us",
    icon: Phone,
    href: "tel:+1727-382-5776",
    color: "bg-[#0F1629] text-[#00D4FF] border border-[#00D4FF]/30",
    hoverColor: "hover:bg-[#00D4FF]/10",
    description: "(727) 382-5776",
    external: true,
  },
];

export default function FloatingContactDial() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div
      ref={ref}
      className="fixed bottom-6 left-6 z-[150] flex flex-col-reverse items-start gap-3"
      aria-label="Quick contact options"
    >
      {/* Action items — shown when open */}
      {open && actions.map((action, i) => {
        const Icon = action.icon;
        const content = (
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg shadow-black/30 transition-[opacity,transform] duration-200 cursor-pointer ${action.color} ${action.hoverColor}`}
            style={{
              animation: `slideUpFade 0.2s ease ${i * 0.05}s both`,
            }}
          >
            <Icon size={16} className="shrink-0" />
            <div>
              <p className="text-xs font-semibold leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {action.label}
              </p>
              <p className="text-xs opacity-70 leading-tight mt-0.5">{action.description}</p>
            </div>
          </div>
        );

        if (action.external) {
          return (
            <a
              key={action.label}
              href={action.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
            >
              {content}
            </a>
          );
        }
        return (
          <Link key={action.label} href={action.href} onClick={() => setOpen(false)}>
            {content}
          </Link>
        );
      })}

      {/* Main toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`w-14 h-14 rounded-full shadow-lg shadow-black/40 flex items-center justify-center transition-[opacity,transform] duration-300 ${
          open
            ? "bg-white/10 border border-white/20 text-white rotate-90"
            : "bg-[#00D4FF] text-[#0A0E1A] hover:bg-[#00EEFF] hover:scale-105"
        }`}
        aria-label={open ? "Close contact options" : "Open contact options"}
        aria-expanded={open}
      >
        {open ? <X size={22} /> : <Headphones size={22} />}
      </button>

      {/* Pulse ring on main button when closed */}
      {!open && (
        <span
          className="absolute bottom-0 left-0 w-14 h-14 rounded-full bg-[#00D4FF]/30 pointer-events-none"
          style={{ animation: "ping 2s cubic-bezier(0,0,0.2,1) infinite" }}
        />
      )}

      <style>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
