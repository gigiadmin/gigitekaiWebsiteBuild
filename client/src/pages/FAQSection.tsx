import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    id: "1",
    question: "What exactly is included in the free IT audit?",
    answer:
      "Our comprehensive free audit includes: security vulnerability assessment, cost analysis of your current IT spend, system performance review, compliance gap identification, and a custom 12-month IT modernization roadmap. We'll provide a detailed report with actionable recommendations.",
  },
  {
    id: "2",
    question: "How long does the audit take?",
    answer:
      "The audit typically takes 5-7 business days from submission. We'll review your infrastructure, conduct security assessments, and compile a detailed report. You'll then have a 30-minute consultation call with our team to discuss findings and recommendations.",
  },
  {
    id: "3",
    question: "Is there any obligation to purchase after the audit?",
    answer:
      "Absolutely not. The audit is completely free with no strings attached. We provide honest recommendations based on your business needs. If you decide to move forward, you'll get 50% off your first month as our thank you for choosing GigitekAI.",
  },
  {
    id: "4",
    question: "When does the 50% off promotion expire?",
    answer:
      "The 50% off first-month promotion is valid for 1 month only from the date of your audit submission. After your first month at the discounted rate, pricing returns to the standard rate for your chosen plan.",
  },
  {
    id: "5",
    question: "Can I change plans after signing up?",
    answer:
      "Yes! You can upgrade or downgrade your plan at any time. We'll prorate the charges based on your usage. Our team can help you find the perfect plan for your evolving needs.",
  },
  {
    id: "6",
    question: "What's your cancellation policy?",
    answer:
      "We offer a 30-day money-back guarantee on all plans. If you're not satisfied within the first 30 days, we'll refund your money, no questions asked. After that, you can cancel with 30 days notice.",
  },
  {
    id: "7",
    question: "Do you offer custom solutions?",
    answer:
      "Yes! If our standard plans don't fit your needs, we can build a custom package tailored to your specific requirements. Contact our team after your audit to discuss custom solutions.",
  },
  {
    id: "8",
    question: "What support do you provide?",
    answer:
      "All plans include 24/7 support. Starter plans include 24/5 support, Growth and Enterprise plans include 24/7 support. Enterprise plans also include a dedicated account manager and weekly check-ins.",
  },
];

export default function FAQSection() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Frequently Asked Questions</h2>
          <p className="text-gray-400 text-lg">
            Have questions? We've got answers. Can't find what you're looking for?{" "}
            <a href="mailto:support@gigitekai.com" className="text-[#00D4FF] hover:underline">
              Contact us
            </a>
          </p>
        </div>

        <div className="space-y-4">
          {faqItems.map((item) => (
            <Card
              key={item.id}
              className="bg-[#0F1419]/40 border-gray-800/40 overflow-hidden transition-[opacity,transform]"
            >
              <button
                onClick={() => toggleExpanded(item.id)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-900/20 transition-colors text-left"
              >
                <span className="font-semibold text-white pr-4">{item.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-[#00D4FF] flex-shrink-0 transition-transform ${
                    expandedId === item.id ? "rotate-180" : ""
                  }`}
                />
              </button>

              {expandedId === item.id && (
                <div className="px-6 py-4 bg-gray-900/20 border-t border-gray-800/40">
                  <p className="text-gray-300 leading-relaxed">{item.answer}</p>
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 p-8 bg-gradient-to-r from-[#00D4FF]/10 to-purple-500/10 border border-[#00D4FF]/30 rounded-lg text-center">
          <h3 className="text-xl font-bold mb-2">Still have questions?</h3>
          <p className="text-gray-400 mb-4">
            Our team is ready to help. Reach out anytime.
          </p>
          <a
            href="mailto:support@gigitekai.com"
            className="inline-block px-6 py-2 bg-[#00D4FF] text-black font-semibold rounded-lg hover:bg-[#00D4FF]/90 transition-colors"
          >
            Contact Us
          </a>
        </div>
      </div>
    </div>
  );
}
