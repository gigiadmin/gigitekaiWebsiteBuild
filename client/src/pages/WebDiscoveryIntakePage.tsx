import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import {
  validateWebDiscoverySection,
  validateWebDiscoverySubmission,
} from "@/lib/webDiscoveryValidation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight, CheckCircle, Loader2, Save } from "lucide-react";

const STORAGE_KEY = "web-discovery-form-data";
const STORAGE_SECTION_KEY = "web-discovery-current-section";

const getDefaultFormData = () => ({
  // Section 1: Contact & Organization
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  companyName: "",
  companySize: "",
  industry: "",

  // Section 2: Current Situation
  currentChallenges: "",
  currentSystems: "",
  mainPainPoint: "",

  // Section 3: IT Infrastructure
  cloudUsage: "",
  securityConcerns: "",
  dataBackup: "",

  // Section 4: Goals & Priorities
  topPriority: "",
  desiredOutcome: "",
  timeline: "",

  // Section 5: AI & Automation
  aiInterest: "",
  automationNeeds: "",
  costSavingsGoal: "",

  // Section 6: Support & Services
  currentSupport: "",
  supportIssues: "",
  budgetRange: "",

  // Section 7: Additional Info
  additionalInfo: "",
});

const getInitialFormData = () => {
  if (typeof window === "undefined") return getDefaultFormData();

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.warn("Failed to load form data from localStorage", err);
  }

  return getDefaultFormData();
};

const getInitialSection = () => {
  if (typeof window === "undefined") return 0;
  try {
    const saved = localStorage.getItem(STORAGE_SECTION_KEY);
    return saved ? parseInt(saved, 10) : 0;
  } catch {
    return 0;
  }
};

export default function WebDiscoveryIntakePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [currentSection, setCurrentSection] = useState(getInitialSection());
  const [formData, setFormData] = useState(getInitialFormData());
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const formTopRef = useRef<HTMLFormElement>(null);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    } catch (err) {
      console.warn("Failed to save form data to localStorage", err);
    }
  }, [formData]);

  // Save current section to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SECTION_KEY, currentSection.toString());
    } catch (err) {
      console.warn("Failed to save section to localStorage", err);
    }
  }, [currentSection]);

  // Clear localStorage after successful submission
  const clearSavedData = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_SECTION_KEY);
    } catch (err) {
      console.warn("Failed to clear localStorage", err);
    }
  };

  const submitMutation = trpc.formSubmissions.submitForm.useMutation({
    onSuccess: () => {
      clearSavedData();
      setSubmitted(true);
      setIsSubmitting(false);
      setSubmissionError(null);
    },
    onError: (error) => {
      setIsSubmitting(false);
      setSubmissionError(error.message || "We could not submit your discovery form. Please try again or contact support.");
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev: typeof formData) => ({ ...prev, [name]: value }));
    setFieldErrors(prev => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const handleClearForm = () => {
    if (confirm("Are you sure you want to clear all form data? This cannot be undone.")) {
      setFormData(getDefaultFormData());
      setCurrentSection(0);
      setFieldErrors({});
      clearSavedData();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateWebDiscoverySubmission(formData);
    if (validation.firstInvalidSection !== null) {
      setFieldErrors(validation.errors);
      setCurrentSection(validation.firstInvalidSection);
      return;
    }
    setIsSubmitting(true);

    try {
      const message = `
IT DISCOVERY FORM SUBMISSION

CONTACT INFORMATION:
- Name: ${formData.contactName}
- Email: ${formData.contactEmail}
- Phone: ${formData.contactPhone}
- Company: ${formData.companyName}
- Company Size: ${formData.companySize}
- Industry: ${formData.industry}

CURRENT SITUATION:
- Main Challenges: ${formData.currentChallenges}
- Current Systems: ${formData.currentSystems}
- Biggest Pain Point: ${formData.mainPainPoint}

IT INFRASTRUCTURE:
- Cloud Usage: ${formData.cloudUsage}
- Security Concerns: ${formData.securityConcerns}
- Data Backup Strategy: ${formData.dataBackup}

GOALS & PRIORITIES:
- Top Priority: ${formData.topPriority}
- Desired Outcome: ${formData.desiredOutcome}
- Timeline: ${formData.timeline}

AI & AUTOMATION:
- Interest in AI Solutions: ${formData.aiInterest}
- Automation Needs: ${formData.automationNeeds}
- Cost Savings Goal: ${formData.costSavingsGoal}

SUPPORT & SERVICES:
- Current Support: ${formData.currentSupport}
- Support Issues: ${formData.supportIssues}
- Budget Range: ${formData.budgetRange}

ADDITIONAL INFORMATION:
${formData.additionalInfo}
      `.trim();

      await submitMutation.mutateAsync({
        name: formData.contactName,
        email: formData.contactEmail,
        phone: formData.contactPhone,
        company: formData.companyName,
        category: "IT Discovery",
        message: message,
        source: "web-discovery-form",
      });
    } catch (error) {
      // Error is handled by onError callback
    }
  };

  const handleNextSection = () => {
    const sectionErrors = validateWebDiscoverySection(formData, currentSection);
    if (Object.keys(sectionErrors).length > 0) {
      setFieldErrors(sectionErrors);
      requestAnimationFrame(() => document.getElementById(Object.keys(sectionErrors)[0])?.focus());
      return;
    }

    setFieldErrors({});
    setCurrentSection(Math.min(sections.length - 1, currentSection + 1));
    requestAnimationFrame(() => formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const handlePreviousSection = () => {
    setCurrentSection(Math.max(0, currentSection - 1));
    requestAnimationFrame(() => formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const sections = [
    {
      title: "Contact & Organization",
      fields: [
        { name: "contactName", label: "Your Name *", type: "text", placeholder: "John Smith" },
        { name: "contactEmail", label: "Email Address *", type: "email", placeholder: "john@company.com" },
        { name: "contactPhone", label: "Phone Number *", type: "tel", placeholder: "(555) 123-4567" },
        { name: "companyName", label: "Company Name *", type: "text", placeholder: "Acme Corporation" },
        {
          name: "companySize",
          label: "Company Size *",
          type: "select",
          options: [
            { value: "", label: "Select company size" },
            { value: "1-10", label: "1-10 employees" },
            { value: "11-50", label: "11-50 employees" },
            { value: "51-100", label: "51-100 employees" },
            { value: "101-500", label: "101-500 employees" },
            { value: "500+", label: "500+ employees" },
          ],
        },
        { name: "industry", label: "Industry *", type: "text", placeholder: "e.g., Healthcare, Finance, Retail" },
      ],
    },
    {
      title: "Current Situation",
      fields: [
        { name: "currentChallenges", label: "What are your main IT challenges? *", type: "textarea" },
        { name: "currentSystems", label: "What systems are you currently using? *", type: "textarea" },
        { name: "mainPainPoint", label: "What's your biggest pain point? *", type: "textarea" },
      ],
    },
    {
      title: "IT Infrastructure",
      fields: [
        {
          name: "cloudUsage",
          label: "Current Cloud Usage *",
          type: "select",
          options: [
            { value: "", label: "Select cloud usage" },
            { value: "none", label: "Not using cloud" },
            { value: "some", label: "Using some cloud services" },
            { value: "hybrid", label: "Hybrid cloud setup" },
            { value: "full", label: "Full cloud migration" },
          ],
        },
        { name: "securityConcerns", label: "Security & Compliance Concerns *", type: "textarea" },
        { name: "dataBackup", label: "Current Data Backup Strategy *", type: "textarea" },
      ],
    },
    {
      title: "Goals & Priorities",
      fields: [
        { name: "topPriority", label: "What's your top priority? *", type: "textarea" },
        { name: "desiredOutcome", label: "What outcome do you want to achieve? *", type: "textarea" },
        {
          name: "timeline",
          label: "Timeline for Implementation *",
          type: "select",
          options: [
            { value: "", label: "Select timeline" },
            { value: "immediate", label: "Immediate (0-3 months)" },
            { value: "short", label: "Short-term (3-6 months)" },
            { value: "medium", label: "Medium-term (6-12 months)" },
            { value: "long", label: "Long-term (12+ months)" },
          ],
        },
      ],
    },
    {
      title: "AI & Automation",
      fields: [
        {
          name: "aiInterest",
          label: "Interest in AI Solutions *",
          type: "select",
          options: [
            { value: "", label: "Select interest level" },
            { value: "exploring", label: "Just exploring" },
            { value: "interested", label: "Very interested" },
            { value: "urgent", label: "Urgent need" },
          ],
        },
        { name: "automationNeeds", label: "What processes need automation? *", type: "textarea" },
        { name: "costSavingsGoal", label: "Cost Savings Goal *", type: "textarea" },
      ],
    },
    {
      title: "Support & Services",
      fields: [
        { name: "currentSupport", label: "Current IT Support Model *", type: "textarea" },
        { name: "supportIssues", label: "Issues with Current Support *", type: "textarea" },
        {
          name: "budgetRange",
          label: "Budget Range *",
          type: "select",
          options: [
            { value: "", label: "Select budget range" },
            { value: "under-5k", label: "Under $5,000/month" },
            { value: "5-10k", label: "$5,000 - $10,000/month" },
            { value: "10-25k", label: "$10,000 - $25,000/month" },
            { value: "25k+", label: "$25,000+/month" },
          ],
        },
      ],
    },
    {
      title: "Additional Information",
      fields: [
        {
          name: "additionalInfo",
          label: "Anything else we should know?",
          type: "textarea",
          placeholder: "Share any additional information that would help us understand your needs...",
        },
      ],
    },
  ];

  if (submitted) {
    return (
      <div className="flex min-h-[100svh] items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4">
        <div className="text-center max-w-md">
          <CheckCircle className="w-16 h-16 text-cyan-400 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-white mb-4">Thank You!</h1>
          <p className="text-slate-300 mb-6">
            Your IT Discovery intake form has been submitted successfully. Our team will review your responses and contact you within 24 hours to discuss your transformation plan.
          </p>
          <Button
            onClick={() => (window.location.href = "/")}
            className="bg-cyan-500 hover:bg-cyan-600 text-slate-950"
          >
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  const currentSectionData = sections[currentSection];

  return (
      <div className="min-h-[100svh] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-6 sm:py-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-7 text-center sm:mb-12">
          <p className="mb-3 text-xs font-semibold tracking-[0.18em] text-cyan-400">GIGITEKAI DISCOVERY</p>
          <h1 className="mb-3 text-3xl font-bold text-white sm:text-4xl">IT Discovery Intake</h1>
          <p className="text-base text-slate-400 sm:text-lg">
            Tell us about your business and IT needs. We'll use this to create a personalized transformation plan.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="sticky top-0 z-10 -mx-4 mb-6 border-y border-cyan-400/10 bg-slate-950/95 px-4 py-4 backdrop-blur sm:static sm:mx-0 sm:mb-8 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
          <div className="flex justify-between mb-3">
            <span className="text-sm font-medium text-cyan-400">Section {currentSection + 1} of {sections.length}</span>
            <span className="text-sm font-medium text-slate-400">{Math.round(((currentSection + 1) / sections.length) * 100)}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-800" role="progressbar" aria-label="Discovery intake progress" aria-valuemin={1} aria-valuemax={sections.length} aria-valuenow={currentSection + 1}>
            <div
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentSection + 1) / sections.length) * 100}%` }}
            />
          </div>
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-400 sm:hidden">
            <Save className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" /> Your progress is saved privately on this device.
          </div>
        </div>

        {/* Form */}
        <form ref={formTopRef} onSubmit={handleSubmit} className="mb-5 border border-slate-700 bg-slate-800/50 p-5 backdrop-blur-sm sm:mb-8 sm:rounded-lg sm:p-8">
          {/* Section Title */}
          <h2 className="mb-6 border-b border-slate-700 pb-4 text-xl font-bold text-white sm:mb-8 sm:text-2xl">
            {currentSectionData.title}
          </h2>

          {/* Form Fields */}
          <div className="mb-6 space-y-6 sm:mb-8">
            {currentSectionData.fields.map((field) => (
              <div key={field.name}>
                <label htmlFor={field.name} className="block text-sm font-medium text-slate-200 mb-2">
                  {field.label}
                </label>

                {field.type === "select" ? (
                  <select
                    id={field.name}
                    name={field.name}
                    value={formData[field.name as keyof typeof formData]}
                    onChange={handleChange}
                    aria-invalid={Boolean(fieldErrors[field.name])}
                    aria-describedby={fieldErrors[field.name] ? `${field.name}-error` : undefined}
                    className="min-h-[52px] w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-base text-white placeholder-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    {(field.options || []).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === "textarea" ? (
                  <Textarea
                    id={field.name}
                    name={field.name}
                    value={formData[field.name as keyof typeof formData]}
                    onChange={handleChange}
                    aria-invalid={Boolean(fieldErrors[field.name])}
                    aria-describedby={fieldErrors[field.name] ? `${field.name}-error` : undefined}
                    placeholder={"placeholder" in field ? field.placeholder : ""}
                    className="min-h-[132px] w-full resize-none rounded-lg border border-slate-600 bg-slate-700 px-4 py-3 text-base text-white placeholder-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                ) : (
                  <Input
                    id={field.name}
                    type={field.type}
                    name={field.name}
                    inputMode={field.name === "contactPhone" ? "tel" : undefined}
                    autoComplete={field.name === "contactName" ? "name" : field.name === "contactEmail" ? "email" : field.name === "contactPhone" ? "tel" : field.name === "companyName" ? "organization" : undefined}
                    value={formData[field.name as keyof typeof formData]}
                    onChange={handleChange}
                    aria-invalid={Boolean(fieldErrors[field.name])}
                    aria-describedby={fieldErrors[field.name] ? `${field.name}-error` : undefined}
                    placeholder={"placeholder" in field ? field.placeholder : ""}
                    className="min-h-[52px] w-full rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-base text-white placeholder-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                )}
                {fieldErrors[field.name] && (
                  <p id={`${field.name}-error`} role="alert" className="mt-2 text-sm text-red-300">
                    {fieldErrors[field.name]}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Info Text */}
          <p className="text-slate-400 text-sm text-center">
            * Required fields. We'll contact you within 24 hours to discuss your needs.
          </p>
        </form>

        {submissionError && (
          <p role="alert" className="mb-4 border border-red-400/40 bg-red-950/30 p-4 text-sm leading-6 text-red-100">
            {submissionError}
          </p>
        )}

        {/* Navigation Buttons */}
        <div className="sticky bottom-3 z-10 flex flex-col-reverse gap-3 border border-slate-700 bg-slate-950/95 p-3 backdrop-blur sm:static sm:flex-row sm:items-center sm:justify-between sm:border-0 sm:bg-transparent sm:p-0">
          <div className="flex gap-3">
            <Button
              type="button"
              onClick={handlePreviousSection}
              disabled={currentSection === 0}
              variant="outline"
              className="min-h-[50px] flex-1 border-slate-600 text-slate-300 hover:bg-slate-800 sm:flex-none"
            >
              <ArrowLeft className="mr-1 h-4 w-4" /> Previous
            </Button>

            {currentSection < sections.length - 1 ? (
              <Button
                type="button"
                onClick={handleNextSection}
                className="min-h-[50px] flex-1 bg-cyan-500 text-slate-950 hover:bg-cyan-600 sm:flex-none"
              >
                Next <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="min-h-[50px] flex-1 bg-green-500 text-white hover:bg-green-600 sm:flex-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Form"
                )}
              </Button>
            )}
          </div>

          <Button
            type="button"
            onClick={handleClearForm}
            variant="ghost"
            className="min-h-[48px] w-full text-slate-400 hover:bg-red-950/20 hover:text-red-400 sm:w-auto"
          >
            Clear Form
          </Button>
        </div>
      </div>
    </div>
  );
}
