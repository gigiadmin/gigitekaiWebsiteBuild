/*
  GigitekAI FAQ Section — Fortune 500 Quality Professional Design
  - Professional accordion styling with smooth animations
  - Enhanced search and category filtering
  - Improved typography hierarchy and spacing
  - Professional form styling and interactions
*/
import { useState, useRef, useEffect, useMemo } from "react";
import StructuredData from "@/components/StructuredData";
import { ChevronDown, Search } from "lucide-react";

type FAQCategory = 'Pricing' | 'Implementation' | 'Security' | 'Support' | 'Integration' | 'General';

interface FAQ {
  q: string;
  a: string;
  category: FAQCategory;
}

const faqs: FAQ[] = [
  {
    q: "What cloud platforms does GigitekAI support?",
    a: "GigitekAI is a certified partner across all three major cloud hyperscalers — Amazon Web Services (AWS), Microsoft Azure, and Google Cloud Platform (GCP). We also support hybrid and multi-cloud architectures, allowing you to distribute workloads across platforms based on cost, performance, and compliance requirements.",
    category: 'General',
  },
  {
    q: "How does GigitekAI approach AI implementation for businesses?",
    a: "We follow a structured AI adoption framework: Discovery (understanding your data and business goals), Proof of Concept (validating AI use cases with real data), Production Deployment (scaling proven models), and Continuous Optimization (monitoring and improving model performance over time). We prioritize practical, measurable AI applications over theoretical capabilities.",
    category: 'Implementation',
  },
  {
    q: "What does your managed cloud service include?",
    a: "Our managed cloud service encompasses 24/7 infrastructure monitoring, proactive incident response, cost optimization, security patch management, performance tuning, capacity planning, and monthly strategic reviews. You get a dedicated cloud engineer and an account manager who understands your business context.",
    category: 'Support',
  },
  {
    q: "Can GigitekAI help with compliance requirements like HIPAA, SOC 2, or CMMC?",
    a: "Absolutely. Compliance architecture is a core competency at GigitekAI. We design cloud environments with compliance controls built in from the ground up — not bolted on afterward. Our team includes certified compliance specialists for HIPAA, SOC 2 Type II, PCI-DSS, CMMC, FedRAMP, and NIST frameworks.",
    category: 'Security',
  },
  {
    q: "How long does a typical cloud migration take?",
    a: "Migration timelines depend on the complexity and size of your environment. A focused application migration can take 4–8 weeks, while a full enterprise data center migration may span 3–9 months. We use phased migration strategies to minimize risk and ensure business continuity throughout the process.",
    category: 'Implementation',
  },
  {
    q: "What makes GigitekAI different from other cloud and AI providers?",
    a: "GigitekAI combines deep cloud engineering expertise with genuine AI specialization — a combination that most traditional MSPs lack. We don't resell generic cloud services; we architect custom solutions. Our team includes former hyperscaler engineers, data scientists, and AI researchers who bring real-world enterprise experience to every engagement.",
    category: 'General',
  },
  {
    q: "What size businesses does GigitekAI work with?",
    a: "We work with businesses ranging from growth-stage startups (50+ employees) to large enterprises with thousands of users. Our solutions scale accordingly — from a focused cloud modernization project to a comprehensive enterprise AI transformation program.",
    category: 'General',
  },
  {
    q: "What does the onboarding process look like?",
    a: "Onboarding begins with a complimentary Cloud & AI Readiness Assessment (typically 2–3 business days). From there, we develop a tailored engagement plan, assign your dedicated team, and begin a structured onboarding sprint. Most clients are fully operational with our managed services within 30–45 days.",
    category: 'Implementation',
  },
  {
    q: "How does GigitekAI pricing work?",
    a: "We offer flexible pricing models: fixed monthly managed services retainers, project-based engagements for migrations and implementations, and usage-based pricing for cloud infrastructure. There are no hidden fees. We provide transparent cost estimates upfront and work with you to optimize cloud spending. Most clients see 20–40% cost reduction within the first year through our optimization practices.",
    category: 'Pricing',
  },
  {
    q: "What is your typical implementation timeline for AI projects?",
    a: "AI project timelines vary based on scope. A proof-of-concept typically takes 4–6 weeks. A production-ready AI system usually takes 3–6 months from discovery to deployment. We provide a detailed project roadmap during the initial assessment, including milestones, deliverables, and success metrics.",
    category: 'Implementation',
  },
  {
    q: "How do you ensure data security in cloud environments?",
    a: "Security is embedded in every layer of our architecture. We implement zero-trust networking, encryption at rest and in transit, multi-factor authentication, role-based access controls, and continuous security monitoring. We also conduct regular penetration testing and security audits. Our security practices align with NIST, CIS, and industry-specific frameworks.",
    category: 'Security',
  },
  {
    q: "What kind of support does GigitekAI provide?",
    a: "We offer 24/7/365 helpdesk support with guaranteed response times (critical issues: 1 hour, high: 4 hours, medium: 8 hours, low: 24 hours). You have a dedicated support team, a technical account manager, and direct access to senior engineers for strategic guidance. We also provide quarterly business reviews to align technology with your business goals.",
    category: 'Support',
  },
  {
    q: "Can GigitekAI integrate with our existing Microsoft 365 environment?",
    a: "Yes. We're Microsoft 365 specialists with deep expertise in Azure, Microsoft Teams, SharePoint, Exchange Online, and Microsoft 365 security. We can architect integrations between your on-premises systems and Microsoft 365, optimize licensing, implement advanced security features, and provide managed services for your entire M365 stack.",
    category: 'Integration',
  },
  {
    q: "What happens if we need to scale up or down our services?",
    a: "Our services are designed to scale with your business. You can increase or decrease capacity with 30 days' notice. We handle all the infrastructure provisioning, deprovisioning, and cost adjustments. There are no long-term lock-in contracts — we work on a month-to-month basis after your initial commitment period.",
    category: 'Pricing',
  },
  {
    q: "Does GigitekAI offer disaster recovery and business continuity planning?",
    a: "Absolutely. We design and implement comprehensive disaster recovery (DR) and business continuity (BC) strategies tailored to your RTO and RPO requirements. This includes automated backups, geo-redundant infrastructure, failover testing, and runbook documentation. We conduct annual DR drills to ensure your team is prepared.",
    category: 'Support',
  },
  {
    q: "How do I get started with GigitekAI?",
    a: "Start with our free Cloud & AI Readiness Assessment. Schedule a 30-minute discovery call with our team, and we'll evaluate your current environment, discuss your business goals, and provide a customized roadmap. There's no obligation — we're here to help you understand your options.",
    category: 'General',
  },
  {
    q: "What are your service level agreements (SLAs)?",
    a: "Our SLAs guarantee 99.9% uptime for managed services, with response times of 1 hour for critical issues, 4 hours for high-priority, 8 hours for medium, and 24 hours for low-priority issues. We provide monthly SLA reports and credits if we fail to meet commitments. Custom SLAs are available for enterprise clients.",
    category: 'Support',
  },
  {
    q: "Do you offer training and knowledge transfer?",
    a: "Yes. We include comprehensive training and documentation as part of our implementation. This includes hands-on workshops for your team, detailed runbooks, video tutorials, and ongoing lunch-and-learn sessions. We believe in empowering your team to be self-sufficient while maintaining our support partnership.",
    category: 'Implementation',
  },
  {
    q: "What is your approach to cloud cost optimization?",
    a: "We conduct a detailed cost analysis of your cloud infrastructure, identify waste and inefficiencies, and implement optimization strategies. This includes right-sizing instances, leveraging reserved instances, optimizing storage, and automating resource cleanup. Most clients see 20–40% cost savings within 6 months.",
    category: 'Pricing',
  },
  {
    q: "Can you help with multi-cloud strategies?",
    a: "Absolutely. We help organizations avoid vendor lock-in by architecting multi-cloud strategies that leverage the best services from AWS, Azure, and GCP. We manage workload distribution, ensure consistent security policies across clouds, and optimize costs across your multi-cloud environment.",
    category: 'Implementation',
  },
];

const CATEGORIES: FAQCategory[] = ['General', 'Pricing', 'Implementation', 'Security', 'Support', 'Integration'];

function FAQItem({ faq, index }: { faq: FAQ; index: number }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`border-b border-[rgba(0,212,255,0.1)] transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
      style={{ transitionDelay: `${index * 50}ms` }}
    >
      <button
        className="w-full flex items-center justify-between py-6 text-left group hover:text-[#00D4FF] transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span
          className="text-white font-semibold text-base pr-4 group-hover:text-[#00D4FF] transition-colors"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {faq.q}
        </span>
        <ChevronDown
          size={20}
          className={`text-[#00D4FF] flex-shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="pb-6 text-gray-400 text-sm leading-relaxed fade-in-up">
          {faq.a}
        </div>
      )}
    </div>
  );
}

export default function FAQSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<FAQCategory>('General');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = faq.category === selectedCategory;
    const matchesSearch = 
      faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.a.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const faqSchema = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.slice(0, 10).map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  }), []);

  return (
    <section className="py-24 bg-[#0A0E1A]" ref={ref}>
      <StructuredData data={faqSchema} id="sd-faqpage" />
      <div className="container">
        <div className="grid lg:grid-cols-5 gap-16">
          {/* Left - Header */}
          <div
            className={`lg:col-span-2 transition-all duration-700 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="section-label mb-6">FAQ</div>
            <h2
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Frequently Asked Questions
            </h2>
            <p className="text-gray-400 text-base leading-relaxed mb-8">
              Have more questions? Our team is ready to discuss your specific cloud and AI needs.
            </p>
            <a href="/contact" className="btn-cyan inline-flex items-center gap-2 font-semibold px-8 py-3.5 rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200">
              Talk to an Expert
            </a>
          </div>

          {/* Right - FAQ list with filtering */}
          <div className="lg:col-span-3">
            {/* Search Bar - Professional styling */}
            <div className="mb-8 relative">
              <Search className="absolute left-4 top-4 text-gray-500" size={18} />
              <input
                type="text"
                placeholder="Search FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-[rgba(0,212,255,0.2)] rounded-lg bg-[#0F1629] text-white placeholder-gray-500 focus:outline-none focus:border-[#00D4FF] focus:shadow-lg focus:shadow-[#00D4FF]/20 transition-all duration-200"
              />
            </div>

            {/* Category Filter - Professional buttons */}
            <div className="mb-8 flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    selectedCategory === cat
                      ? 'bg-[#00D4FF] text-[#0A0E1A] shadow-lg shadow-[#00D4FF]/30'
                      : 'bg-[#0F1629] text-gray-400 border border-[rgba(0,212,255,0.1)] hover:border-[rgba(0,212,255,0.3)] hover:text-[#00D4FF]'
                  }`}
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* FAQ Items */}
            <div className="border-t border-[rgba(0,212,255,0.1)]">
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((faq, i) => (
                  <FAQItem key={faq.q} faq={faq} index={i} />
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-base">
                    No FAQs found. Try a different search or category.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
