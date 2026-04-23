/**
 * StructuredData — Injects JSON-LD schema markup into the page head.
 * Usage: <StructuredData data={schemaObject} />
 */
import { useEffect } from "react";

interface Props {
  data: Record<string, unknown>;
  id?: string;
}

export default function StructuredData({ data, id }: Props) {
  useEffect(() => {
    const scriptId = id || `sd-${JSON.stringify(data["@type"])}`;
    // Remove existing if re-rendering
    const existing = document.getElementById(scriptId);
    if (existing) existing.remove();

    const script = document.createElement("script");
    script.id = scriptId;
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);

    return () => {
      const el = document.getElementById(scriptId);
      if (el) el.remove();
    };
  }, [data, id]);

  return null;
}
