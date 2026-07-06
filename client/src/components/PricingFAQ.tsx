import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  {
    category: "Tier Comparison",
    question: "What's the difference between Essential Security, Professional Compliance, Elite + Governed AI, and Enterprise Custom?",
    answer: `Essential Security ($99/user/month): 24/7 Monitoring & Alerts, Daily Backups, Antivirus & Malware Protection, User Support, Basic Compliance.

Professional Compliance ($149/user/month - MOST POPULAR): Everything in Essential + Compliance Management (HIPAA/Legal), Security Audits, Policy Documentation, Incident Response.

Elite + Governed AI ($199/user/month): Everything in Professional + Managed Copilot (M365), AI Governance & Oversight, Automation Workflows, Advanced Analytics.

Enterprise Custom (Custom Quote): Everything in Elite + Custom Infrastructure, Dedicated Account Team, Strategic IT Planning, Multi-system integration.`,
  },
  {
    category: "Pricing & Discounts",
    question: "Do you offer volume discounts?",
    answer: `Yes! We offer tiered volume discounts:
• 25–50 users: 8% discount
• 50+ users: 10% discount
• Annual pre-pay: Additional 10% discount (can combine with volume discount)

Example: 50 users on Professional Compliance tier with annual pre-pay saves 20%!`,
  },
  {
    category: "Pricing & Discounts",
    question: "What about onboarding costs?",
    answer: `Onboarding is $50 per user, but it's waived for companies with 25+ seats. This covers account setup, device enrollment, user training, initial security baseline, and compliance configuration (for Professional Compliance and above).`,
  },
  {
    category: "Pricing & Discounts",
    question: "Are there any hidden fees?",
    answer: `No. Our pricing is completely transparent with flat monthly rates per user (no per-ticket charges). All features are included in your tier with no surprise add-ons. Only onboarding ($50/user, waived for 25+) is separate. Custom quotes available for Enterprise Custom deployments.`,
  },
  {
    category: "Service Details",
    question: "What's included in 24/7 support?",
    answer: `Our 24/7 support includes live chat, email, and phone support; remote desktop troubleshooting; account and access issue resolution; software installation and configuration; performance optimization; vendor coordination; and for Elite + Governed AI, dedicated account management and AI governance oversight.`,
  },
  {
    category: "Service Details",
    question: "What's the difference between SLAs?",
    answer: `Essential Security: 4-hour critical SLA (business hours only)
Professional Compliance & Elite + Governed AI: 15-minute critical SLA (24/7)

Critical issues = complete system outage or security incident.`,
  },
  {
    category: "Service Details",
    question: "Does your helpdesk cover Microsoft 365 Copilot?",
    answer: `Yes! Professional Compliance and Elite + Governed AI tiers include support for Copilot deployment, licensing, user training, adoption, and troubleshooting. Elite + Governed AI includes managed Copilot with AI Governance & Oversight.`,
  },
  {
    category: "Getting Started",
    question: "What's the minimum number of users?",
    answer: `All helpdesk tiers require a minimum of 10 users. For companies with fewer than 10 users or custom requirements, we offer Enterprise Custom pricing. Contact our sales team for a quote.`,
  },
  {
    category: "Getting Started",
    question: "Can I switch tiers mid-year?",
    answer: `Yes! You can upgrade or downgrade at any time. Changes take effect on your next billing cycle. Most customers start with Professional Compliance and scale as needed.`,
  },
  {
    category: "Getting Started",
    question: "How quickly can we get started?",
    answer: `Typically 1–2 weeks: Contract signed → Onboarding (1 week, $50/user or waived for 25+ seats) → Go-live and 24/7 support begins.`,
  },
];

export default function PricingFAQ() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = ["All", ...Array.from(new Set(faqData.map((item) => item.category)))];
  const filteredFAQ = selectedCategory === "All" ? faqData : faqData.filter((item) => item.category === selectedCategory);

  return (
    <div className="w-full py-16 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">24/7 Managed IT Services Pricing FAQ</h2>
          <p className="text-xl text-slate-400">Find answers to common questions about our service tiers and pricing</p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-3 justify-center mb-12">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg font-medium transition-[opacity,transform] ${
                selectedCategory === category
                  ? "bg-cyan-500 text-black"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {filteredFAQ.map((item, index) => (
            <div
              key={index}
              className="border border-slate-700 rounded-lg overflow-hidden hover:border-cyan-500/50 transition-colors"
            >
              <button
                onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                className="w-full px-6 py-4 flex items-center justify-between bg-slate-900/50 hover:bg-slate-800/50 transition-colors text-left"
              >
                <div className="flex-1">
                  <p className="text-sm text-cyan-400 font-medium mb-1">{item.category}</p>
                  <h3 className="text-lg font-semibold text-white">{item.question}</h3>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-cyan-400 flex-shrink-0 ml-4 transition-transform ${
                    expandedIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>

              {expandedIndex === index && (
                <div className="px-6 py-4 bg-slate-950/50 border-t border-slate-700">
                  <p className="text-slate-300 whitespace-pre-line leading-relaxed">{item.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 p-8 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-lg text-center">
          <h3 className="text-2xl font-bold text-white mb-3">Ready to get started?</h3>
          <p className="text-slate-300 mb-6">Schedule a free IT assessment or contact our sales team for a custom quote tailored to your business.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-6 py-3 bg-cyan-500 text-black font-semibold rounded-lg hover:bg-cyan-400 transition-colors">
              Chat with Aria
            </button>
            <button className="px-6 py-3 border border-cyan-500 text-cyan-400 font-semibold rounded-lg hover:bg-cyan-500/10 transition-colors">
              Get a Quote
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
