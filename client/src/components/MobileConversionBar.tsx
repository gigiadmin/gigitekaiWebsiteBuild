import { ClipboardCheck, LifeBuoy, Phone } from "lucide-react";

const actions = [
  { label: "Call", href: "tel:+16096764483", icon: Phone },
  { label: "Assessment", href: "/free-audit", icon: ClipboardCheck, primary: true },
  { label: "Support", href: "/helpdesk", icon: LifeBuoy },
];

export default function MobileConversionBar() {
  return (
    <nav
      aria-label="Mobile quick actions"
      className="fixed inset-x-0 bottom-0 z-40 grid min-h-[68px] grid-cols-3 border-t border-[#00D4FF]/25 bg-[#050810]/95 px-[max(0.75rem,env(safe-area-inset-left))] pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-md md:hidden"
    >
      {actions.map(({ label, href, icon: Icon, primary }) => (
        <a
          key={label}
          href={href}
          className={`flex min-h-[52px] flex-col items-center justify-center gap-1 text-[11px] font-semibold ${primary ? "text-[#00D4FF]" : "text-slate-200"}`}
        >
          <Icon className={`h-5 w-5 ${primary ? "text-[#00D4FF]" : "text-slate-300"}`} aria-hidden="true" />
          {label}
        </a>
      ))}
    </nav>
  );
}
