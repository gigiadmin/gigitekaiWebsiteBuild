export type WebDiscoveryValues = Record<string, string>;

type RequiredField = {
  name: string;
  label: string;
  section: number;
  validator?: (value: string) => string | null;
};

const emailError = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
    ? null
    : "Enter a valid email address.";

const phoneError = (value: string) =>
  value.replace(/\D/g, "").length >= 10
    ? null
    : "Enter a valid phone number with at least 10 digits.";

export const webDiscoveryRequiredFields: RequiredField[] = [
  { name: "contactName", label: "Your name", section: 0 },
  { name: "contactEmail", label: "Email address", section: 0, validator: emailError },
  { name: "contactPhone", label: "Phone number", section: 0, validator: phoneError },
  { name: "companyName", label: "Company name", section: 0 },
  { name: "companySize", label: "Company size", section: 0 },
  { name: "industry", label: "Industry", section: 0 },
  { name: "currentChallenges", label: "Main IT challenges", section: 1 },
  { name: "currentSystems", label: "Current systems", section: 1 },
  { name: "mainPainPoint", label: "Biggest pain point", section: 1 },
  { name: "cloudUsage", label: "Current cloud usage", section: 2 },
  { name: "securityConcerns", label: "Security and compliance concerns", section: 2 },
  { name: "dataBackup", label: "Current data backup strategy", section: 2 },
  { name: "topPriority", label: "Top priority", section: 3 },
  { name: "desiredOutcome", label: "Desired outcome", section: 3 },
  { name: "timeline", label: "Implementation timeline", section: 3 },
  { name: "aiInterest", label: "Interest in AI solutions", section: 4 },
  { name: "automationNeeds", label: "Automation needs", section: 4 },
  { name: "costSavingsGoal", label: "Cost savings goal", section: 4 },
  { name: "currentSupport", label: "Current IT support model", section: 5 },
  { name: "supportIssues", label: "Current support issues", section: 5 },
  { name: "budgetRange", label: "Budget range", section: 5 },
];

export function validateWebDiscoverySection(
  values: WebDiscoveryValues,
  section: number
): Record<string, string> {
  return webDiscoveryRequiredFields
    .filter(field => field.section === section)
    .reduce<Record<string, string>>((errors, field) => {
      const value = values[field.name] || "";
      if (!value.trim()) {
        errors[field.name] = `${field.label} is required.`;
      } else {
        const validationError = field.validator?.(value);
        if (validationError) errors[field.name] = validationError;
      }
      return errors;
    }, {});
}

export function validateWebDiscoverySubmission(
  values: WebDiscoveryValues
): { errors: Record<string, string>; firstInvalidSection: number | null } {
  const errors = webDiscoveryRequiredFields.reduce<Record<string, string>>(
    (allErrors, field) => ({
      ...allErrors,
      ...validateWebDiscoverySection(values, field.section),
    }),
    {}
  );

  const firstFieldWithError = webDiscoveryRequiredFields.find(field => errors[field.name]);
  return {
    errors,
    firstInvalidSection: firstFieldWithError?.section ?? null,
  };
}
