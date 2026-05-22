import { useState } from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WebPricingPage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const scrollToPlans = () => {
    const element = document.getElementById("pricing-cards");
    element?.scrollIntoView({ behavior: "smooth" });
  };

  const faqs = [
    {
      question: "What's included in the setup fee?",
      answer: "The setup fee covers your initial website design, development, content setup, AI chatbot configuration, and launch. It's a one-time cost.",
    },
    {
      question: "Can I cancel anytime?",
      answer: "Yes. There are no long-term contracts. You can cancel your monthly plan at any time. We just ask for 30 days' notice.",
    },
    {
      question: "What if I need more pages or features later?",
      answer: "You can upgrade your plan at any time, or add individual landing pages for $500 each. We'll migrate everything seamlessly.",
    },
    {
      question: "Do I own my website?",
      answer: "While subscribed, we host and maintain your site. If you cancel, we can export your content and hand off the design files for a one-time transfer fee.",
    },
    {
      question: "What is the AI chatbot?",
      answer: "Every plan includes a Microsoft Copilot Studio-powered chatbot on your site. It answers customer questions, captures leads, and books appointments 24/7.",
    },
    {
      question: "How long does it take to build my website?",
      answer: "Most Starter sites launch in 7 business days. Growth and Pro sites take 10–14 business days depending on complexity.",
    },
  ];

  const addOns = [
    {
      title: "Google Ads Management",
      price: "+$500/mo",
      description: "We run and optimize your Google Ads campaigns to drive leads.",
    },
    {
      title: "Monthly SEO Retainer",
      price: "+$750/mo",
      description: "Ongoing SEO: keyword research, content optimization, monthly reporting.",
    },
    {
      title: "Additional Landing Pages",
      price: "$500 each",
      description: "High-converting landing pages for campaigns, promotions, or new services.",
    },
  ];

  const howItWorks = [
    {
      step: 1,
      title: "Book a Free Call",
      description: "Tell us about your business and goals. We'll recommend the right plan.",
    },
    {
      step: 2,
      title: "We Build Your Site",
      description: "Our team designs and develops your website in 7–14 business days.",
    },
    {
      step: 3,
      title: "Launch & Grow",
      description: "Your site goes live. We handle hosting, updates, and support every month.",
    },
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: 199,
      setupFee: 500,
      description: "Perfect for small businesses that need a professional online presence.",
      features: [
        "3–5 page custom website",
        "Mobile responsive design",
        "AI chatbot (Microsoft Copilot Studio)",
        "Contact form integration",
        "Google Analytics setup",
        "SSL certificate + hosting",
        "Monthly backups",
        "Minor edits included (1 hr/mo)",
        "Email support",
      ],
      highlighted: false,
    },
    {
      name: "Growth",
      price: 399,
      setupFee: 1000,
      description: "For growing businesses ready to attract more customers online.",
      features: [
        "Everything in Starter, plus:",
        "Up to 10 pages + 1 landing page",
        "On-page SEO setup",
        "Google Business Profile optimization",
        "Google Analytics + lead tracking",
        "Content updates (2 hrs/mo)",
        "Priority email + chat support",
      ],
      highlighted: true,
    },
    {
      name: "Pro",
      price: 799,
      setupFee: 2000,
      description: "Complete web solution with e-commerce, SEO, and dedicated support.",
      features: [
        "Everything in Growth, plus:",
        "Unlimited pages + full custom design",
        "E-commerce or booking integration",
        "Technical SEO + backlink strategy",
        "Content updates (5 hrs/mo)",
        "Phone + email + chat support",
        "Dedicated account manager",
      ],
      highlighted: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0E1A] via-[#0F1428] to-[#0A0E1A]">
      {/* Hero Section */}
      <section className="relative px-4 py-20 md:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight">
                  Professional Websites,{" "}
                  <span className="text-[#00D4FF]">One Simple Monthly Plan</span>
                </h1>
                <p className="text-xl text-gray-300 leading-relaxed">
                  No huge upfront costs. Get a custom website with AI-powered chatbot, hosting,
                  updates, and support — all in one monthly subscription.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  onClick={scrollToPlans}
                  className="bg-[#00D4FF] hover:bg-[#00B8D4] text-black font-semibold px-8 py-6 text-lg rounded-lg transition-[opacity,transform]"
                >
                  See Plans
                </Button>
                <Button
                  variant="outline"
                  className="border-[#00D4FF] text-[#00D4FF] hover:bg-[#00D4FF]/10 px-8 py-6 text-lg rounded-lg"
                >
                  View Portfolio
                </Button>
              </div>
            </div>

            {/* Right Visual - Browser Mockup */}
            <div className="hidden md:block relative">
              <div className="bg-gradient-to-br from-[#00D4FF]/20 to-[#0066FF]/20 rounded-2xl p-1 backdrop-blur-sm border border-[#00D4FF]/30">
                <div className="bg-[#0A0E1A] rounded-xl p-6 space-y-3">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="space-y-4 pt-4">
                    <div className="h-3 bg-gradient-to-r from-[#00D4FF]/40 to-transparent rounded w-3/4"></div>
                    <div className="h-2 bg-gray-700/40 rounded w-full"></div>
                    <div className="h-2 bg-gray-700/40 rounded w-5/6"></div>
                    <div className="h-8 bg-gradient-to-r from-[#00D4FF]/20 to-transparent rounded mt-4"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="bg-gradient-to-r from-[#00D4FF]/5 via-transparent to-[#0066FF]/5 border-y border-[#00D4FF]/20 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-center items-center gap-4 md:gap-8 text-sm md:text-base text-gray-300">
            <div className="flex items-center gap-2">
              <Check size={20} className="text-[#00D4FF]" />
              <span>AI-Powered Chatbot Included</span>
            </div>
            <div className="hidden md:block text-gray-600">•</div>
            <div className="flex items-center gap-2">
              <Check size={20} className="text-[#00D4FF]" />
              <span>SSL & Hosting Included</span>
            </div>
            <div className="hidden md:block text-gray-600">•</div>
            <div className="flex items-center gap-2">
              <Check size={20} className="text-[#00D4FF]" />
              <span>Cancel Anytime</span>
            </div>
            <div className="hidden md:block text-gray-600">•</div>
            <div className="flex items-center gap-2">
              <Check size={20} className="text-[#00D4FF]" />
              <span>30-Day Money-Back Guarantee</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards Section */}
      <section id="pricing-cards" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-300">Choose the plan that fits your business</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {pricingPlans.map((plan, idx) => (
              <div
                key={idx}
                className={`relative rounded-2xl p-8 transition-[opacity,transform] duration-300 ${
                  plan.highlighted
                    ? "bg-gradient-to-br from-[#00D4FF]/20 to-[#0066FF]/10 border-2 border-[#00D4FF] shadow-2xl shadow-[#00D4FF]/20 transform scale-105"
                    : "bg-gradient-to-br from-[#1a1f3a] to-[#0f1428] border border-[#00D4FF]/20 hover:border-[#00D4FF]/40"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-[#00D4FF] text-black px-4 py-1 rounded-full text-sm font-bold">
                      Most Popular
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                    <p className="text-gray-400 text-sm">{plan.description}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold text-[#00D4FF]">${plan.price}</span>
                      <span className="text-gray-400">/month</span>
                    </div>
                    <p className="text-xs text-gray-500">+ ${plan.setupFee} one-time setup</p>
                  </div>

                  <Button className="w-full bg-[#00D4FF] hover:bg-[#00B8D4] text-black font-semibold py-6 rounded-lg transition-[opacity,transform]">
                    Get Started
                  </Button>

                  <div className="space-y-3 pt-4 border-t border-[#00D4FF]/20">
                    {plan.features.map((feature, fidx) => (
                      <div key={fidx} className="flex items-start gap-3">
                        <Check size={18} className="text-[#00D4FF] flex-shrink-0 mt-0.5" />
                        <span className="text-gray-300 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <p className="text-gray-400">
              Need something custom?{" "}
              <a href="/contact" className="text-[#00D4FF] hover:underline font-semibold">
                Contact us
              </a>{" "}
              for a tailored quote.
            </p>
          </div>
        </div>
      </section>

      {/* Add-Ons Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-transparent via-[#00D4FF]/5 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Boost Your Results</h2>
            <p className="text-xl text-gray-300">Add any of these services to your plan.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {addOns.map((addon, idx) => (
              <div
                key={idx}
                className="bg-gradient-to-br from-[#1a1f3a] to-[#0f1428] border border-[#00D4FF]/20 rounded-xl p-8 hover:border-[#00D4FF]/40 transition-[opacity,transform] group"
              >
                <h3 className="text-xl font-bold text-white mb-2">{addon.title}</h3>
                <p className="text-[#00D4FF] font-semibold text-lg mb-4">{addon.price}</p>
                <p className="text-gray-400">{addon.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">How It Works</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {howItWorks.map((item, idx) => (
              <div key={idx} className="relative">
                {idx < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-20 left-full w-full h-1 bg-gradient-to-r from-[#00D4FF]/40 to-transparent"></div>
                )}
                <div className="bg-gradient-to-br from-[#1a1f3a] to-[#0f1428] border border-[#00D4FF]/20 rounded-xl p-8">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#00D4FF]/20 border border-[#00D4FF] mb-6">
                    <span className="text-[#00D4FF] font-bold text-lg">{item.step}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-gray-400">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-transparent via-[#00D4FF]/5 to-transparent">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-gradient-to-br from-[#1a1f3a] to-[#0f1428] border border-[#00D4FF]/20 rounded-xl overflow-hidden hover:border-[#00D4FF]/40 transition-[opacity,transform]"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="w-full px-8 py-6 flex items-center justify-between hover:bg-[#00D4FF]/5 transition-colors"
                >
                  <span className="text-lg font-semibold text-white text-left">{faq.question}</span>
                  {expandedFaq === idx ? (
                    <ChevronUp className="text-[#00D4FF] flex-shrink-0" />
                  ) : (
                    <ChevronDown className="text-gray-500 flex-shrink-0" />
                  )}
                </button>
                {expandedFaq === idx && (
                  <div className="px-8 py-6 bg-[#00D4FF]/5 border-t border-[#00D4FF]/20">
                    <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* FAQ Schema Markup */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: faqs.map((faq) => ({
                  "@type": "Question",
                  name: faq.question,
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: faq.answer,
                  },
                })),
              }),
            }}
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-[#00D4FF]/10 via-[#0066FF]/5 to-[#00D4FF]/10 border-y border-[#00D4FF]/20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Let's build a website that drives real results for your business.
          </p>
          <Button className="bg-[#00D4FF] hover:bg-[#00B8D4] text-black font-semibold px-10 py-6 text-lg rounded-lg transition-[opacity,transform]">
            Schedule Your Free Consultation
          </Button>
        </div>
      </section>
    </div>
  );
}
