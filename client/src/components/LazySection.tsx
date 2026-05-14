import { useRef, useState, useEffect, Suspense, lazy, type ComponentType } from "react";

interface LazySectionProps {
  /** Factory function that returns the dynamic import — e.g. () => import("@/components/Foo") */
  factory: () => Promise<{ default: ComponentType<any> }>;
  /** How far before the section enters the viewport to start loading (px) */
  rootMargin?: string;
  /** Minimum height placeholder while section hasn't loaded */
  minHeight?: string;
  /** Optional props to pass to the lazy component */
  componentProps?: Record<string, any>;
}

/**
 * LazySection — TRUE deferred loading with IntersectionObserver.
 *
 * Unlike React.lazy + Suspense (which triggers import() at module evaluation),
 * this component only calls the import() factory when the placeholder scrolls
 * within `rootMargin` of the viewport. The dynamic import is NOT triggered
 * until the user actually scrolls near the section.
 *
 * This dramatically reduces initial JS downloaded on mobile, directly
 * improving the "Reduce unused JavaScript" Lighthouse metric.
 */
export default function LazySection({
  factory,
  rootMargin = "400px",
  minHeight = "200px",
  componentProps = {},
}: LazySectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [LazyComponent, setLazyComponent] = useState<ReturnType<typeof lazy> | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // If IntersectionObserver isn't supported, load immediately
    if (!("IntersectionObserver" in window)) {
      setLazyComponent(() => lazy(factory));
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Only NOW do we trigger the dynamic import
          setLazyComponent(() => lazy(factory));
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [factory, rootMargin]);

  if (!LazyComponent) {
    return (
      <div
        ref={ref}
        style={{ minHeight }}
        aria-hidden="true"
      />
    );
  }

  return (
    <Suspense fallback={<div style={{ minHeight }} aria-hidden="true" />}>
      <LazyComponent {...componentProps} />
    </Suspense>
  );
}
