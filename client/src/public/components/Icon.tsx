/** Small inline stroke icon set for the public site. No icon library needed. */

type Props = { size?: number; className?: string; title?: string };

const base = (size: number, className?: string, title?: string) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className,
  ...(title ? { role: "img" as const, "aria-label": title } : { "aria-hidden": true as const }),
});

export function IconChevron({ size = 20, className, title }: Props) {
  return (
    <svg {...base(size, className, title)} strokeWidth={1.8}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}
export function IconArrow({ size = 12, className, title }: Props) {
  return (
    <svg {...base(size, className, title)} viewBox="0 0 12 12" strokeWidth={1.8}>
      <path d="M4 2l4 4-4 4" />
    </svg>
  );
}
export function IconBack({ size = 12, className, title }: Props) {
  return (
    <svg {...base(size, className, title)} viewBox="0 0 12 12" strokeWidth={1.8}>
      <path d="M8 2L4 6l4 4" />
    </svg>
  );
}
export function IconPlus({ size = 16, className, title }: Props) {
  return (
    <svg {...base(size, className, title)} viewBox="0 0 16 16" strokeWidth={1.6}>
      <path d="M8 3v10M3 8h10" />
    </svg>
  );
}
export function IconCheck({ size = 18, className, title }: Props) {
  return (
    <svg {...base(size, className, title)} strokeWidth={1.8}>
      <path d="M5 12l4 4L19 7" />
    </svg>
  );
}
export function IconMenu({ size = 20, className, title }: Props) {
  return (
    <svg {...base(size, className, title)} viewBox="0 0 20 20" strokeWidth={1.6}>
      <path d="M3 6h14M3 14h14" />
    </svg>
  );
}
export function IconClose({ size = 20, className, title }: Props) {
  return (
    <svg {...base(size, className, title)} viewBox="0 0 20 20" strokeWidth={1.6}>
      <path d="M5 5l10 10M15 5L5 15" />
    </svg>
  );
}

export function ServiceIcon({ name, size = 32 }: { name: "monitor" | "grid" | "workflow" | "shield" | "cloud"; size?: number }) {
  const p = base(size);
  switch (name) {
    case "monitor":
      return (
        <svg {...p}>
          <rect x="3" y="4" width="18" height="12" rx="2" />
          <path d="M8 20h8M12 16v4" />
        </svg>
      );
    case "grid":
      return (
        <svg {...p}>
          <rect x="3" y="3" width="8" height="8" rx="1" />
          <rect x="13" y="3" width="8" height="8" rx="1" />
          <rect x="3" y="13" width="8" height="8" rx="1" />
          <rect x="13" y="13" width="8" height="8" rx="1" />
        </svg>
      );
    case "workflow":
      return (
        <svg {...p}>
          <rect x="3" y="4" width="6" height="6" rx="1" />
          <rect x="15" y="14" width="6" height="6" rx="1" />
          <path d="M9 7h4a3 3 0 0 1 3 3v4" />
        </svg>
      );
    case "shield":
      return (
        <svg {...p}>
          <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    case "cloud":
      return (
        <svg {...p}>
          <path d="M7 18a4 4 0 0 1-.5-7.97A6 6 0 0 1 18 9a4.5 4.5 0 0 1 0 9z" />
        </svg>
      );
  }
}
