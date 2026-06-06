import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Loader2 } from "lucide-react";

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
    },
    onError: (error) => {
      setIsSubmitting(false);
      alert(error.message || "Failed to submit form. Please try again.");
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev: typeof formData) => ({ ...prev, [name]: value }));
  };

  const handleClearForm = () => {
    if (confirm("Are you sure you want to clear all form data? This cannot be undone.")) {
      setFormData(getDefaultFormData());
      setCurrentSection(0);
      clearSavedData();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
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
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-3">IT Discovery Intake</h1>
          <p className="text-slate-400 text-lg">
            Tell us about your business and IT needs. We'll use this to create a personalized transformation plan.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-3">
            <span className="text-sm font-medium text-cyan-400">Section {currentSection + 1} of {sections.length}</span>
            <span className="text-sm font-medium text-slate-400">{Math.round(((currentSection + 1) / sections.length) * 100)}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentSection + 1) / sections.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8 mb-8">
          {/* Section Title */}
          <h2 className="text-2xl font-bold text-white mb-8 pb-4 border-b border-slate-700">
            {currentSectionData.title}
          </h2>

          {/* Form Fields */}
          <div className="space-y-6 mb-8">
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
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
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
                    placeholder={"placeholder" in field ? field.placeholder : ""}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none h-24"
                  />
                ) : (
                  <Input
                    id={field.name}
                    type={field.type}
                    name={field.name}
                    value={formData[field.name as keyof typeof formData]}
                    onChange={handleChange}
                    placeholder={"placeholder" in field ? field.placeholder : ""}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                )}
              </div>
            ))}
          </div>

          {/* Info Text */}
          <p className="text-slate-400 text-sm text-center">
            * Required fields. We'll contact you within 24 hours to discuss your needs.
          </p>
        </form>

        {/* Navigation Buttons */}
        <div className="flex gap-4 justify-between items-center">
          <div className="flex gap-3">
            <Button
              type="button"
              onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
              disabled={currentSection === 0}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              ← Previous
            </Button>

            {currentSection < sections.length - 1 ? (
              <Button
                type="button"
                onClick={() => setCurrentSection(Math.min(sections.length - 1, currentSection + 1))}
                className="bg-cyan-500 hover:bg-cyan-600 text-slate-950"
              >
                Next →
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-green-500 hover:bg-green-600 text-white"
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
            className="text-slate-400 hover:text-red-400 hover:bg-red-950/20"
          >
            Clear Form
          </Button>
        </div>
      </div>
    </div>
  );
}
