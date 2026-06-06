import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Loader2 } from "lucide-react";

export default function WebDiscoveryIntakePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);

  const [formData, setFormData] = useState({
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

  const submitMutation = trpc.formSubmissions.submitForm.useMutation({
    onSuccess: () => {
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
    setFormData((prev) => ({ ...prev, [name]: value }));
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
        {
          name: "currentChallenges",
          label: "What are your main IT challenges right now? *",
          type: "textarea",
          placeholder: "e.g., Managing multiple systems, security concerns, slow performance...",
        },
        {
          name: "currentSystems",
          label: "What systems or tools are you currently using? *",
          type: "textarea",
          placeholder: "e.g., Microsoft 365, on-premise servers, cloud services, etc.",
        },
        {
          name: "mainPainPoint",
          label: "What's your biggest pain point? *",
          type: "textarea",
          placeholder: "What keeps you up at night about your IT?",
        },
      ],
    },
    {
      title: "IT Infrastructure",
      fields: [
        {
          name: "cloudUsage",
          label: "Are you using cloud services? *",
          type: "select",
          options: [
            { value: "", label: "Select an option" },
            { value: "not-using", label: "Not using cloud services" },
            { value: "some-cloud", label: "Using some cloud services" },
            { value: "mostly-cloud", label: "Mostly cloud-based" },
            { value: "hybrid", label: "Mix of cloud and on-premise" },
          ],
        },
        {
          name: "securityConcerns",
          label: "What are your top security concerns? *",
          type: "textarea",
          placeholder: "e.g., Data protection, compliance requirements, cyber threats...",
        },
        {
          name: "dataBackup",
          label: "How do you currently back up your data? *",
          type: "textarea",
          placeholder: "e.g., Local backups, cloud backups, not sure...",
        },
      ],
    },
    {
      title: "Goals & Priorities",
      fields: [
        {
          name: "topPriority",
          label: "What's your top IT priority for the next 12 months? *",
          type: "textarea",
          placeholder: "e.g., Improve security, migrate to cloud, reduce IT costs...",
        },
        {
          name: "desiredOutcome",
          label: "What would success look like for your organization? *",
          type: "textarea",
          placeholder: "e.g., 99.9% uptime, faster employee productivity, reduced security incidents...",
        },
        {
          name: "timeline",
          label: "What's your timeline for making changes? *",
          type: "select",
          options: [
            { value: "", label: "Select timeline" },
            { value: "immediate", label: "Immediate (next 30 days)" },
            { value: "soon", label: "Soon (next 3 months)" },
            { value: "medium", label: "Medium-term (3-6 months)" },
            { value: "long", label: "Long-term (6+ months)" },
          ],
        },
      ],
    },
    {
      title: "AI & Automation",
      fields: [
        {
          name: "aiInterest",
          label: "Are you interested in AI-powered automation? *",
          type: "select",
          options: [
            { value: "", label: "Select an option" },
            { value: "very-interested", label: "Very interested" },
            { value: "somewhat-interested", label: "Somewhat interested" },
            { value: "not-sure", label: "Not sure" },
            { value: "not-interested", label: "Not interested" },
          ],
        },
        {
          name: "automationNeeds",
          label: "What tasks or processes would you like to automate? *",
          type: "textarea",
          placeholder: "e.g., Customer support, ticket routing, report generation...",
        },
        {
          name: "costSavingsGoal",
          label: "How much could you save by automating these tasks? *",
          type: "select",
          options: [
            { value: "", label: "Select estimated savings" },
            { value: "10-20", label: "10-20% of IT budget" },
            { value: "20-30", label: "20-30% of IT budget" },
            { value: "30-40", label: "30-40% of IT budget" },
            { value: "40+", label: "40%+ of IT budget" },
          ],
        },
      ],
    },
    {
      title: "Support & Services",
      fields: [
        {
          name: "currentSupport",
          label: "Do you currently have IT support? *",
          type: "select",
          options: [
            { value: "", label: "Select an option" },
            { value: "in-house", label: "In-house IT team" },
            { value: "current-msp", label: "Current managed services provider" },
            { value: "ad-hoc", label: "Ad-hoc/freelance support" },
            { value: "none", label: "No dedicated support" },
          ],
        },
        {
          name: "supportIssues",
          label: "What issues are you having with your current support? *",
          type: "textarea",
          placeholder: "e.g., Slow response times, limited expertise, high costs...",
        },
        {
          name: "budgetRange",
          label: "What's your budget range for IT services? *",
          type: "select",
          options: [
            { value: "", label: "Select budget range" },
            { value: "under-5k", label: "Under $5,000/month" },
            { value: "5-10k", label: "$5,000 - $10,000/month" },
            { value: "10-25k", label: "$10,000 - $25,000/month" },
            { value: "25-50k", label: "$25,000 - $50,000/month" },
            { value: "50k+", label: "$50,000+/month" },
          ],
        },
      ],
    },
    {
      title: "Additional Information",
      fields: [
        {
          name: "additionalInfo",
          label: "Anything else you'd like us to know?",
          type: "textarea",
          placeholder: "Share any other details about your business or IT needs...",
        },
      ],
    },
  ];

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Thank You!</h2>
          <p className="text-slate-300 mb-6">
            We've received your IT discovery form. Our team will review your information and reach out within 24 hours to discuss how we can help transform your IT infrastructure.
          </p>
          <a href="/" className="inline-block bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-2 px-6 rounded">
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  const currentSectionData = sections[currentSection];
  const totalSections = sections.length;
  const progressPercent = ((currentSection + 1) / totalSections) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">IT Discovery Intake</h1>
          <p className="text-slate-300 text-lg">
            Tell us about your business and IT needs. We'll use this to create a personalized transformation plan.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-semibold text-slate-300">
              Section {currentSection + 1} of {totalSections}
            </span>
            <span className="text-sm font-semibold text-cyan-400">{Math.round(progressPercent)}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className="bg-cyan-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-slate-800 rounded-lg shadow-xl p-8 space-y-8">
          {/* Section Title */}
          <div>
            <h2 className="text-2xl font-bold text-cyan-400 mb-6">{currentSectionData.title}</h2>
          </div>

          {/* Section Fields */}
          <div className="space-y-6">
            {currentSectionData.fields.map((field) => (
              <div key={field.name}>
                <label className="block text-white font-semibold mb-2">{field.label}</label>

                {field.type === "text" || field.type === "email" || field.type === "tel" ? (
                  <Input
                    type={field.type}
                    name={field.name}
                    value={formData[field.name as keyof typeof formData]}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    disabled={isSubmitting}
                    className="w-full px-4 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-cyan-500 focus:outline-none"
                    required={field.label.includes("*")}
                  />
                ) : field.type === "textarea" ? (
                  <Textarea
                    name={field.name}
                    value={formData[field.name as keyof typeof formData]}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    disabled={isSubmitting}
                    className="w-full px-4 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-cyan-500 focus:outline-none min-h-[100px] resize-none"
                    required={field.label.includes("*")}
                  />
                ) : field.type === "select" ? (
                  <select
                    name={field.name}
                    value={formData[field.name as keyof typeof formData]}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className="w-full px-4 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-cyan-500 focus:outline-none"
                    required={field.label.includes("*")}
                  >
                    {field.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : null}
              </div>
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-4 pt-8">
            {currentSection > 0 && (
              <Button
                type="button"
                onClick={() => setCurrentSection(currentSection - 1)}
                disabled={isSubmitting}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded"
              >
                Previous
              </Button>
            )}

            {currentSection < totalSections - 1 ? (
              <Button
                type="button"
                onClick={() => setCurrentSection(currentSection + 1)}
                disabled={isSubmitting}
                className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-2 px-4 rounded"
              >
                Next
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-600 text-white font-semibold py-2 px-4 rounded flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Discovery Form"
                )}
              </Button>
            )}
          </div>

          {/* Info Text */}
          <p className="text-slate-400 text-sm text-center">
            * Required fields. We'll contact you within 24 hours to discuss your needs.
          </p>
        </form>
      </div>
    </div>
  );
}
