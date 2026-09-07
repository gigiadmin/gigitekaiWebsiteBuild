import { useMemo } from "react";
import { trpc } from "@/lib/trpc";

export type ConversionEventName =
  | "homepage_pathway_selected"
  | "assessment_opened"
  | "roi_opened"
  | "workflow_gallery_opened"
  | "trust_center_opened"
  | "insights_opened"
  | "workflow_demo_viewed"
  | "roi_scenario_calculated"
  | "roi_scenario_printed"
  | "aria_opened"
  | "aria_message_sent";

function getSessionId() {
  if (typeof window === "undefined") return undefined;
  const key = "gigitekai_conversion_session";
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;
  const value = crypto.randomUUID();
  window.sessionStorage.setItem(key, value);
  return value;
}

export function useConversionTracking() {
  const mutation = trpc.websiteExpansion.trackConversion.useMutation();
  const sessionId = useMemo(getSessionId, []);
  return (eventName: ConversionEventName, elementId?: string, metadata?: Record<string, string | number | boolean | null>) => {
    mutation.mutate({ eventName, elementId, metadata, sessionId, pageUrl: window.location.pathname });
  };
}
