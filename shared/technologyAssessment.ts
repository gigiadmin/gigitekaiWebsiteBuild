export type AssessmentDimension = "identity" | "security" | "resilience" | "service" | "automation";

export type AssessmentDimensions = Record<AssessmentDimension, number>;

export const recommendationByDimension: Record<AssessmentDimension, { title: string; detail: string; route: string }> = {
  identity: {
    title: "Strengthen identity and Microsoft 365 governance",
    detail: "Prioritize Entra ID, privileged access, MFA coverage, conditional access, and lifecycle controls.",
    route: "/services/microsoft-365",
  },
  security: {
    title: "Establish a measurable security baseline",
    detail: "Document controls, endpoint protection, email security, vulnerability exposure, and response ownership.",
    route: "/trust-center",
  },
  resilience: {
    title: "Validate backup and recovery readiness",
    detail: "Define recovery objectives, protect Microsoft 365 data, and test restoration workflows before an incident.",
    route: "/services/managed",
  },
  service: {
    title: "Create an accountable managed-service operating model",
    detail: "Clarify support ownership, SLAs, escalation, monitoring, lifecycle management, and continuous improvement.",
    route: "/services/managed",
  },
  automation: {
    title: "Build a governed AI automation roadmap",
    detail: "Start with repeatable workflows, define human approvals, and measure time saved before expanding autonomy.",
    route: "/fractional-cto-ai-strategy",
  },
};

export function scoreTechnologyAssessment(dimensions: AssessmentDimensions) {
  const entries = Object.entries(dimensions) as Array<[AssessmentDimension, number]>;
  const points = entries.reduce((sum, [, value]) => sum + value, 0);
  const score = Math.round((points / (entries.length * 4)) * 100);
  const maturityLevel = score >= 80 ? "Optimized" : score >= 60 ? "Managed" : score >= 40 ? "Developing" : "Foundational";
  const recommendations = entries
    .sort(([, a], [, b]) => a - b)
    .slice(0, 3)
    .map(([dimension]) => ({ dimension, ...recommendationByDimension[dimension] }));
  return { score, maturityLevel, recommendations };
}
