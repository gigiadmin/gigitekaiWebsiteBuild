/*
  GigitekAI Service Detail Page
  Dynamic page that shows detailed content for each service
  Design: Cyberpunk Minimalism meets Enterprise Precision
*/

import { useParams, useLocation } from "wouter";
import MainNavigation from "@/components/MainNavigation";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import Breadcrumb from "@/components/Breadcrumb";
import { ArrowRight, ArrowLeft, CheckCircle2, Cloud, Brain, Shield, TrendingUp, Database, Cpu } from "lucide-react";

const serviceData: Record<string, {
  icon: any;
  title: string;
  subtitle: string;
  heroDescription: string;
  features: { title: string; description: string }[];
  benefits: string[];
  useCases: { title: string; description: string }[];
  technologies: string[];
  ctaText: string;
}> = {
  cloud: {
    icon: Cloud,
    title: "Cloud Infrastructure",
    subtitle: "Enterprise Cloud Migration & Management",
    heroDescription: "Transform your business with scalable, resilient cloud infrastructure on AWS, Azure, and Google Cloud. Our certified cloud architects design, migrate, and manage enterprise-grade environments with 99.99% uptime SLAs and 24/7 support.",
    features: [
      { title: "Cloud Migration", description: "Seamless migration of on-premises workloads to the cloud with zero downtime. Our proven methodology ensures data integrity and minimal business disruption during the transition." },
      { title: "Multi-Cloud Management", description: "Unified management across AWS, Azure, and Google Cloud. Optimize costs, performance, and compliance with a single pane of glass for all your cloud resources." },
      { title: "Infrastructure as Code", description: "Automated infrastructure provisioning using Terraform, CloudFormation, and Pulumi. Ensure consistency, repeatability, and version control for all deployments." },
      { title: "Cost Optimization", description: "Reduce cloud spend by up to 40% with right-sizing, reserved instances, spot instances, and automated scaling policies tailored to your workload patterns." },
      { title: "Disaster Recovery", description: "Enterprise-grade DR solutions with RPO/RTO guarantees. Multi-region failover, automated backups, and tested recovery procedures to protect your business." },
      { title: "24/7 Monitoring & Support", description: "Round-the-clock infrastructure monitoring with proactive alerting, automated remediation, and dedicated support engineers for rapid incident response." },
    ],
    benefits: [
      "99.99% uptime SLA guarantee",
      "Up to 40% reduction in cloud costs",
      "Zero-downtime migrations",
      "SOC 2 and ISO 27001 compliant",
      "Dedicated cloud architect assigned",
      "Monthly optimization reviews",
    ],
    useCases: [
      { title: "Enterprise Migration", description: "A Fortune 500 financial services company migrated 200+ applications to AWS with zero downtime, reducing infrastructure costs by 35%." },
      { title: "Hybrid Cloud", description: "Healthcare organization implemented a hybrid cloud architecture connecting on-premises data centers with Azure, maintaining HIPAA compliance." },
      { title: "Auto-Scaling Platform", description: "E-commerce platform handling 10M+ daily transactions with auto-scaling infrastructure that reduced costs by 45% during off-peak hours." },
    ],
    technologies: ["AWS", "Microsoft Azure", "Google Cloud", "Terraform", "Kubernetes", "Docker", "CloudFormation", "Ansible", "Prometheus", "Grafana"],
    ctaText: "Start Your Cloud Journey",
  },
  ai: {
    icon: Brain,
    title: "AI & Machine Learning",
    subtitle: "Intelligent Automation & Predictive Analytics",
    heroDescription: "Harness the power of artificial intelligence and machine learning to transform your business operations. From predictive analytics to custom AI models, we deliver solutions that drive measurable ROI and competitive advantage.",
    features: [
      { title: "Custom AI Models", description: "Purpose-built machine learning models trained on your data. From natural language processing to computer vision, we develop AI solutions tailored to your specific business challenges." },
      { title: "Predictive Analytics", description: "Forecast trends, identify risks, and uncover opportunities with advanced predictive models. Make data-driven decisions with confidence using real-time analytics dashboards." },
      { title: "Process Automation", description: "Automate repetitive tasks and complex workflows with intelligent automation. Reduce manual effort by up to 80% while improving accuracy and consistency." },
      { title: "Conversational AI", description: "Deploy intelligent chatbots and virtual assistants that understand context, learn from interactions, and provide personalized customer experiences across channels." },
      { title: "Computer Vision", description: "Extract insights from images and video with custom computer vision models. Quality inspection, document processing, and visual search powered by deep learning." },
      { title: "MLOps & Model Management", description: "End-to-end machine learning operations including model training, deployment, monitoring, and retraining. Ensure your AI models stay accurate and performant over time." },
    ],
    benefits: [
      "Up to 80% reduction in manual processes",
      "95%+ model accuracy on production data",
      "Real-time predictions at scale",
      "Responsible AI with bias detection",
      "Continuous model improvement",
      "Full explainability and transparency",
    ],
    useCases: [
      { title: "Demand Forecasting", description: "Retail chain improved inventory management with ML-powered demand forecasting, reducing stockouts by 60% and overstock by 40%." },
      { title: "Fraud Detection", description: "Financial institution deployed real-time fraud detection system processing 1M+ transactions daily with 99.7% accuracy and <100ms latency." },
      { title: "Document Intelligence", description: "Insurance company automated claims processing with AI document extraction, reducing processing time from 5 days to 4 hours." },
    ],
    technologies: ["TensorFlow", "PyTorch", "OpenAI", "Azure AI", "AWS SageMaker", "Hugging Face", "LangChain", "MLflow", "Kubernetes", "Python"],
    ctaText: "Explore AI Solutions",
  },
  security: {
    icon: Shield,
    title: "Cybersecurity",
    subtitle: "Enterprise Security & Compliance",
    heroDescription: "Protect your organization with comprehensive cybersecurity solutions. From threat detection to compliance management, our security experts safeguard your data, infrastructure, and reputation against evolving cyber threats.",
    features: [
      { title: "Threat Detection & Response", description: "24/7 security operations center (SOC) with advanced threat detection, automated incident response, and forensic analysis capabilities." },
      { title: "Cloud Security", description: "Secure your cloud infrastructure with identity management, network segmentation, encryption, and continuous compliance monitoring across all cloud platforms." },
      { title: "Compliance Management", description: "Achieve and maintain compliance with SOC 2, ISO 27001, HIPAA, PCI DSS, and GDPR. Automated compliance monitoring and audit-ready documentation." },
      { title: "Penetration Testing", description: "Regular penetration testing and vulnerability assessments to identify and remediate security gaps before they can be exploited by attackers." },
      { title: "Zero Trust Architecture", description: "Implement zero trust security models with identity-based access controls, micro-segmentation, and continuous verification for every user and device." },
      { title: "Security Awareness Training", description: "Comprehensive security training programs with phishing simulations, policy education, and ongoing awareness campaigns to build a security-first culture." },
    ],
    benefits: [
      "24/7 security monitoring",
      "90% reduction in security incidents",
      "Compliance audit-ready at all times",
      "Mean time to detect < 15 minutes",
      "Mean time to respond < 1 hour",
      "Regular penetration testing",
    ],
    useCases: [
      { title: "SOC 2 Compliance", description: "SaaS company achieved SOC 2 Type II certification in 3 months with automated compliance monitoring and continuous evidence collection." },
      { title: "Incident Response", description: "Manufacturing firm contained a ransomware attack within 30 minutes using our automated incident response playbooks, preventing data loss." },
      { title: "Zero Trust Implementation", description: "Government contractor implemented zero trust architecture across 5,000 endpoints, reducing unauthorized access attempts by 95%." },
    ],
    technologies: ["CrowdStrike", "Palo Alto", "Splunk", "Microsoft Sentinel", "AWS Security Hub", "Okta", "HashiCorp Vault", "Snyk", "Tenable", "KnowBe4"],
    ctaText: "Secure Your Business",
  },
  strategy: {
    icon: TrendingUp,
    title: "IT Strategy & Growth",
    subtitle: "Technology Roadmapping & Advisory",
    heroDescription: "Align your technology investments with business objectives through strategic planning, roadmapping, and vCIO advisory services. We help you make informed decisions that drive growth and competitive advantage.",
    features: [
      { title: "Technology Roadmapping", description: "Develop comprehensive technology roadmaps aligned with your business goals. Prioritize investments, plan migrations, and chart a clear path to digital transformation." },
      { title: "vCIO Advisory", description: "Access experienced virtual CIO services for strategic technology leadership. Get executive-level guidance without the full-time cost of a dedicated CIO." },
      { title: "Digital Transformation", description: "End-to-end digital transformation strategy covering process optimization, technology modernization, and organizational change management." },
      { title: "Vendor Management", description: "Optimize your technology vendor portfolio with strategic sourcing, contract negotiation, and ongoing vendor performance management." },
      { title: "IT Budget Planning", description: "Data-driven IT budget planning and forecasting. Optimize spend across infrastructure, applications, and personnel to maximize ROI." },
      { title: "M&A Technology Due Diligence", description: "Comprehensive technology assessment for mergers and acquisitions. Evaluate technical debt, integration complexity, and synergy opportunities." },
    ],
    benefits: [
      "Clear 3-5 year technology roadmap",
      "20-30% improvement in IT ROI",
      "Reduced technology risk",
      "Faster decision-making",
      "Aligned IT and business goals",
      "Quarterly strategy reviews",
    ],
    useCases: [
      { title: "Digital Transformation", description: "Mid-market manufacturer developed a 3-year digital transformation roadmap that reduced operational costs by 25% and improved time-to-market by 40%." },
      { title: "IT Consolidation", description: "Private equity portfolio company consolidated IT operations across 5 acquisitions, reducing annual IT spend by $2.5M." },
      { title: "Cloud Strategy", description: "Healthcare system developed a phased cloud migration strategy that maintained compliance while reducing infrastructure costs by 35%." },
    ],
    technologies: ["TOGAF", "ITIL", "Agile", "SAFe", "OKR Framework", "Balanced Scorecard", "COBIT", "Six Sigma", "Lean IT", "Design Thinking"],
    ctaText: "Plan Your Strategy",
  },
  data: {
    icon: Database,
    title: "Data & Analytics",
    subtitle: "Business Intelligence & Data Engineering",
    heroDescription: "Unlock the full potential of your data with modern data engineering, business intelligence, and advanced analytics solutions. Transform raw data into actionable insights that drive strategic decision-making.",
    features: [
      { title: "Data Warehousing", description: "Modern cloud data warehouses built on Snowflake, BigQuery, or Redshift. Centralize your data for fast, reliable analytics across the organization." },
      { title: "Business Intelligence", description: "Interactive dashboards and reports using Tableau, Power BI, or Looker. Self-service analytics that empower every team to make data-driven decisions." },
      { title: "Data Engineering", description: "Robust data pipelines using Apache Spark, Airflow, and dbt. Ensure data quality, consistency, and availability for all downstream consumers." },
      { title: "Real-Time Analytics", description: "Stream processing and real-time analytics with Apache Kafka and Flink. Monitor KPIs, detect anomalies, and trigger actions in real-time." },
      { title: "Data Governance", description: "Comprehensive data governance frameworks including data cataloging, lineage tracking, quality monitoring, and access controls." },
      { title: "Advanced Analytics", description: "Statistical modeling, A/B testing, and advanced analytics to uncover hidden patterns, optimize processes, and predict future outcomes." },
    ],
    benefits: [
      "Single source of truth for all data",
      "Self-service analytics for all teams",
      "Real-time data processing",
      "99.9% data pipeline reliability",
      "Full data lineage and governance",
      "Reduced time-to-insight by 70%",
    ],
    useCases: [
      { title: "Customer 360", description: "Retail company built a unified customer data platform integrating 12 data sources, enabling personalized marketing that increased revenue by 22%." },
      { title: "Operational Analytics", description: "Logistics company implemented real-time fleet analytics dashboard, reducing fuel costs by 15% and improving delivery times by 20%." },
      { title: "Financial Reporting", description: "Financial services firm automated regulatory reporting with a modern data warehouse, reducing report generation from 2 weeks to 2 hours." },
    ],
    technologies: ["Snowflake", "BigQuery", "Redshift", "Tableau", "Power BI", "Apache Spark", "dbt", "Airflow", "Kafka", "Looker"],
    ctaText: "Unlock Your Data",
  },
  managed: {
    icon: Cpu,
    title: "Managed IT Services",
    subtitle: "24/7 IT Operations & Support",
    heroDescription: "Focus on your core business while we manage your IT infrastructure. Our managed services provide 24/7 monitoring, proactive maintenance, helpdesk support, and strategic guidance to keep your technology running at peak performance.",
    features: [
      { title: "24/7 Monitoring", description: "Continuous monitoring of servers, networks, applications, and endpoints. Proactive alerting and automated remediation to prevent issues before they impact your business." },
      { title: "Helpdesk Support", description: "Dedicated helpdesk with guaranteed response times. Tier 1-3 support for all technology issues with escalation procedures and SLA tracking." },
      { title: "Patch Management", description: "Automated patch management for operating systems, applications, and firmware. Ensure security compliance and reduce vulnerability exposure." },
      { title: "Backup & Recovery", description: "Comprehensive backup solutions with regular testing and verified recovery procedures. Protect your data with 3-2-1 backup strategies and immutable backups." },
      { title: "Endpoint Management", description: "Unified endpoint management for desktops, laptops, and mobile devices. Deploy, configure, and secure all endpoints from a central console." },
      { title: "Network Management", description: "Enterprise network management including switches, routers, firewalls, and wireless infrastructure. Performance optimization and capacity planning." },
    ],
    benefits: [
      "99.99% system uptime guarantee",
      "15-minute response time SLA",
      "Predictable monthly IT costs",
      "Proactive issue prevention",
      "Dedicated account manager",
      "Monthly performance reports",
    ],
    useCases: [
      { title: "Full IT Outsourcing", description: "Law firm with 500 employees outsourced entire IT operations, reducing IT costs by 30% while improving user satisfaction scores by 45%." },
      { title: "Co-Managed IT", description: "Manufacturing company augmented internal IT team with managed services, extending coverage to 24/7 and reducing after-hours incidents by 80%." },
      { title: "Remote Workforce", description: "Professional services firm deployed and managed IT infrastructure for 2,000 remote workers in 30 days, maintaining security and productivity." },
    ],
    technologies: ["Microsoft 365", "Azure AD", "Intune", "ConnectWise", "Datto", "SentinelOne", "Cisco Meraki", "Fortinet", "VMware", "Veeam"],
    ctaText: "Get Managed Support",
  },
};

export default function ServiceDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const service = slug ? serviceData[slug] : null;

  if (!service) {
    return (
      <div className="min-h-screen flex flex-col">
        <MainNavigation />
        <main className="flex-1 flex items-center justify-center bg-[#0A0E1A]">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Service Not Found
            </h1>
            <p className="text-gray-400 mb-6">The service you're looking for doesn't exist.</p>
            <a href="/#services" className="btn-cyan text-sm">
              <ArrowLeft size={16} /> Back to Services
            </a>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const Icon = service.icon;
  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Services", href: "/#services" },
    { label: service.title },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <MainNavigation />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-[#0A0E1A] py-20 lg:py-28 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,212,255,0.08),transparent_60%)]"></div>
          <div className="container relative z-10">
            <Breadcrumb items={breadcrumbs} />
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-[#00D4FF] transition-colors mb-8"
            >
              <ArrowLeft size={16} /> Back to Home
            </button>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-3 mb-6">
                  <div className="w-14 h-14 rounded-xl bg-[#00D4FF]/10 border border-[#00D4FF]/20 flex items-center justify-center">
                    <Icon size={28} className="text-[#00D4FF]" />
                  </div>
                  <span className="text-[#00D4FF] text-sm font-semibold uppercase tracking-widest">
                    {service.subtitle}
                  </span>
                </div>
                <h1
                  className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {service.title}
                </h1>
                <p className="text-gray-300 text-lg leading-relaxed mb-8">
                  {service.heroDescription}
                </p>
                <div className="flex flex-wrap gap-4">
                  <a href="#contact" className="btn-cyan">
                    {service.ctaText} <ArrowRight size={16} />
                  </a>
                  <a
                    href="#features"
                    className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white border border-gray-700 rounded-lg hover:border-[#00D4FF]/50 hover:text-[#00D4FF] transition-all"
                  >
                    View Capabilities
                  </a>
                </div>
              </div>

              {/* Benefits sidebar */}
              <div className="bg-[#141B2D] border border-[rgba(0,212,255,0.15)] rounded-2xl p-8">
                <h3 className="text-white font-bold text-lg mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Key Benefits
                </h3>
                <div className="space-y-4">
                  {service.benefits.map((benefit, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle2 size={20} className="text-[#00D4FF] mt-0.5 shrink-0" />
                      <span className="text-gray-300 text-sm">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-white scroll-mt-20">
          <div className="container">
            <div className="text-center mb-16">
              <span className="text-[#00D4FF] text-sm font-semibold uppercase tracking-widest">Capabilities</span>
              <h2
                className="text-3xl md:text-4xl font-bold text-gray-900 mt-3"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                What We Deliver
              </h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {service.features.map((feature, i) => (
                <div
                  key={i}
                  className="bg-gray-50 rounded-xl p-6 border border-gray-100 hover:border-[#00D4FF]/30 hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#00D4FF]/10 flex items-center justify-center mb-4">
                    <span className="text-[#00D4FF] font-bold text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="py-20 bg-[#0A0E1A]">
          <div className="container">
            <div className="text-center mb-16">
              <span className="text-[#00D4FF] text-sm font-semibold uppercase tracking-widest">Success Stories</span>
              <h2
                className="text-3xl md:text-4xl font-bold text-white mt-3"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Real-World Results
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {service.useCases.map((useCase, i) => (
                <div
                  key={i}
                  className="bg-[#141B2D] border border-[rgba(0,212,255,0.15)] rounded-xl p-8 hover:border-[#00D4FF]/40 transition-all duration-300"
                >
                  <div className="w-10 h-10 rounded-full bg-[#00D4FF]/10 border border-[#00D4FF]/20 flex items-center justify-center mb-5">
                    <span className="text-[#00D4FF] font-bold text-sm">{i + 1}</span>
                  </div>
                  <h3 className="text-white font-bold text-lg mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {useCase.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{useCase.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Technologies Section */}
        <section className="py-16 bg-white">
          <div className="container">
            <div className="text-center mb-10">
              <span className="text-[#00D4FF] text-sm font-semibold uppercase tracking-widest">Technology Stack</span>
              <h2
                className="text-2xl md:text-3xl font-bold text-gray-900 mt-3"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Tools & Platforms We Use
              </h2>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {service.technologies.map((tech, i) => (
                <span
                  key={i}
                  className="px-5 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:border-[#00D4FF]/40 hover:text-[#00D4FF] transition-all"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-[#0A0E1A] to-[#141B2D]">
          <div className="container text-center">
            <h2
              className="text-3xl md:text-4xl font-bold text-white mb-6"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Ready to Get Started?
            </h2>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-8">
              Let's discuss how our {service.title.toLowerCase()} solutions can transform your business.
              Schedule a free consultation with our experts today.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href="/#contact" className="btn-cyan">
                Schedule a Consultation <ArrowRight size={16} />
              </a>
              <a
                href="/#services"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white border border-gray-700 rounded-lg hover:border-[#00D4FF]/50 hover:text-[#00D4FF] transition-all"
              >
                Explore All Services
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
