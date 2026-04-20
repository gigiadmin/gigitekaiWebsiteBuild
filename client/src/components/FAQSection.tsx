/*
  GigitekAI FAQ Section — Accordion-style frequently asked questions
  White background, mirrors appliedtech.us FAQ section
*/

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "What cloud platforms does GigitekAI support?",
    a: "GigitekAI is a certified partner across all three major cloud hyperscalers — Amazon Web Services (AWS), Microsoft Azure, and Google Cloud Platform (GCP). We also support hybrid and multi-cloud architectures, allowing you to distribute workloads across platforms based on cost, performance, and compliance requirements.",
  },
  {
    q: "How does GigitekAI approach AI implementation for businesses?",
    a: "We follow a structured AI adoption framework: Discovery (understanding your data and business goals), Proof of Concept (validating AI use cases with real data), Production Deployment (scaling proven models), and Continuous Optimization (monitoring and improving model performance over time). We prioritize practical, measurable AI applications over theoretical capabilities.",
  },
  {
    q: "What does your managed cloud service include?",
    a: "Our managed cloud service encompasses 24/7 infrastructure monitoring, proactive incident response, cost optimization, security patch management, performance tuning, capacity planning, and monthly strategic reviews. You get a dedicated cloud engineer and an account manager who understands your business context.",
  },
  {
    q: "Can GigitekAI help with compliance requirements like HIPAA, SOC 2, or CMMC?",
    a: "Absolutely. Compliance architecture is a core competency at GigitekAI. We design cloud environments with compliance controls built in from the ground up — not bolted on afterward. Our team includes certified compliance specialists for HIPAA, SOC 2 Type II, PCI-DSS, CMMC, FedRAMP, and NIST frameworks.",
  },
  {
    q: "How long does a typical cloud migration take?",
    a: "Migration timelines depend on the complexity and size of your environment. A focused application migration can take 4–8 weeks, while a full enterprise data center migration may span 3–9 months. We use phased migration strategies to minimize risk and ensure business continuity throughout the process.",
  },
  {
    q: "What makes GigitekAI different from other cloud and AI providers?",
    a: "GigitekAI combines deep cloud engineering expertise with genuine AI specialization — a combination that most traditional MSPs lack. We don't resell generic cloud services; we architect custom solutions. Our team includes former hyperscaler engineers, data scientists, and AI researchers who bring real-world enterprise experience to every engagement.",
  },
  {
    q: "What size businesses does GigitekAI work with?",
    a: "We work with businesses ranging from growth-stage startups (50+ employees) to large enterprises with thousands of users. Our solutions scale accordingly — from a focused cloud modernization project to a comprehensive enterprise AI transformation program.",
  },
  {
    q: "What does the onboarding process look like?",
    a: "Onboarding begins with a complimentary Cloud & AI Readiness Assessment (typically 2–3 business days). From there, we develop a tailored engagement plan, assign your dedicated team, and begin a structured onboarding sprint. Most clients are fully operational with our managed services within 30–45 days.",
  },
  {
    q: "How does GigitekAI pricing work?",
    a: "We offer flexible pricing models: fixed monthly managed services retainers, project-based engagements for migrations and implementations, and usage-based pricing for cloud infrastructure. There are no hidden fees. We provide transparent cost estimates upfront and work with you to optimize cloud spending. Most clients see 20–40% cost reduction within the first year through our optimization practices.",
  },
  {
    q: "What is your typical implementation timeline for AI projects?",
    a: "AI project timelines vary based on scope. A proof-of-concept typically takes 4–6 weeks. A production-ready AI system usually takes 3–6 months from discovery to deployment. We provide a detailed project roadmap during the initial assessment, including milestones, deliverables, and success metrics.",
  },
  {
    q: "How do you ensure data security in cloud environments?",
    a: "Security is embedded in every layer of our architecture. We implement zero-trust networking, encryption at rest and in transit, multi-factor authentication, role-based access controls, and continuous security monitoring. We also conduct regular penetration testing and security audits. Our security practices align with NIST, CIS, and industry-specific frameworks.",
  },
  {
    q: "What kind of support does GigitekAI provide?",
    a: "We offer 24/7/365 helpdesk support with guaranteed response times (critical issues: 1 hour, high: 4 hours, medium: 8 hours, low: 24 hours). You have a dedicated support team, a technical account manager, and direct access to senior engineers for strategic guidance. We also provide quarterly business reviews to align technology with your business goals.",
  },
  {
    q: "Can GigitekAI integrate with our existing Microsoft 365 environment?",
    a: "Yes. We're Microsoft 365 specialists with deep expertise in Azure, Microsoft Teams, SharePoint, Exchange Online, and Microsoft 365 security. We can architect integrations between your on-premises systems and Microsoft 365, optimize licensing, implement advanced security features, and provide managed services for your entire M365 stack.",
  },
  {
    q: "What happens if we need to scale up or down our services?",
    a: "Our services are designed to scale with your business. You can increase or decrease capacity with 30 days' notice. We handle all the infrastructure provisioning, deprovisioning, and cost adjustments. There are no long-term lock-in contracts — we work on a month-to-month basis after your initial commitment period.",
  },
  {
    q: "Does GigitekAI offer disaster recovery and business continuity planning?",
    a: "Absolutely. We design and implement comprehensive disaster recovery (DR) and business continuity (BC) strategies tailored to your RTO and RPO requirements. This includes automated backups, geo-redundant infrastructure, failover testing, and runbook documentation. We conduct annual DR drills to ensure your team is prepared.",
  },
  {
    q: "How do I get started with GigitekAI?",
    a: "Start with our free Cloud & AI Readiness Assessment. Schedule a 30-minute discovery call with our team, and we'll evaluate your current environment, discuss your business goals, and provide a customized roadmap. There's no obligation — we're here to help you understand your options.",
  },
];

function FAQItem({ faq, index }: { faq: typeof faqs[0]; index: number }) {
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
      className={`border-b border-gray-100 dark:border-[rgba(0,212,255,0.1)] transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
      style={{ transitionDelay: `${index * 50}ms` }}
    >
      <button
        className="w-full flex items-center justify-between py-5 text-left group"
        onClick={() => setOpen(!open)}
      >
        <span
          className="text-gray-900 dark:text-white font-semibold text-base group-hover:text-[#00D4FF] transition-colors pr-4"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {faq.q}
        </span>
        <ChevronDown
          size={18}
          className={`text-[#00D4FF] flex-shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="pb-5 text-gray-600 dark:text-gray-400 text-sm leading-relaxed fade-in-up">
          {faq.a}
        </div>
      )}
    </div>
  );
}

export default function FAQSection() {
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
    <section className="py-20 bg-white dark:bg-[#0A0E1A]" ref={ref}>
      <div className="container">
        <div className="grid lg:grid-cols-5 gap-16">
          {/* Left */}
          <div
            className={`lg:col-span-2 transition-all duration-700 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="section-label">FAQ</div>
            <h2
              className="text-4xl font-bold text-gray-900 dark:text-white mb-4"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Frequently Asked Questions
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-base leading-relaxed mb-6">
              Have more questions? Our team is ready to discuss your specific cloud and AI needs.
            </p>
            <a href="/contact" className="btn-cyan text-sm">
              Talk to an Expert
            </a>
          </div>

          {/* Right — FAQ list */}
          <div className="lg:col-span-3">
            {faqs.map((faq, i) => (
              <FAQItem key={faq.q} faq={faq} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
