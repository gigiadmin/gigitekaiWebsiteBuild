/**
 * Portfolio Demo Sites Configuration
 * Defines all 7 industry demo sites for the GigitekAI portfolio showcase
 * Each site showcases GigitekAI's web building capabilities
 */

export interface ServiceItem {
  title: string;
  description: string;
  icon: string;
  features: string[];
}

export interface Testimonial {
  name: string;
  title: string;
  company: string;
  quote: string;
  rating: number;
}

export interface TeamMember {
  name: string;
  title: string;
  initials: string;
}

export interface ProcessStep {
  step: number;
  title: string;
  description: string;
  icon: string;
}

export interface CaseStudy {
  client: string;
  industry: string;
  challenge: string;
  solution: string;
  results: Array<{ metric: string; value: string }>;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface PricingTier {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
}

export interface PortfolioSiteConfig {
  id: string;
  name: string;
  tagline: string;
  industry: string;
  description: string;
  icon: string;
  accentColor: string;
  bgColor: string;
  logoUrl: string;
  companyName: string;
  services: ServiceItem[];
  aboutText: string;
  aboutPoints: string[];
  stats: Array<{ value: string; label: string }>;
  testimonials: Testimonial[];
  team: TeamMember[];
  contactInfo: {
    phone: string;
    email: string;
    address: string;
  };
  // New rich content fields
  processSteps?: ProcessStep[];
  caseStudy?: CaseStudy;
  faqs?: FAQItem[];
  pricingTiers?: PricingTier[];
  trustBadges?: string[];
  newsletterHeadline?: string;
  newsletterSubtext?: string;
}

export const PORTFOLIO_DEMO_SITES: Record<string, PortfolioSiteConfig> = {
  finance: {
    id: "finance",
    name: "Meridian Capital",
    companyName: "Meridian Capital",
    logoUrl: "/manus-storage/fintech-logo_fae4db7b.png",
    tagline: "Digital Banking & Investment Management",
    industry: "Financial Services",
    description:
      "Transform your financial services with enterprise-grade cloud infrastructure, AI-powered analytics, and secure transaction processing. We help financial institutions innovate faster while maintaining compliance and security.",
    icon: "💰",
    accentColor: "#00D97E",
    bgColor: "#0A1A12",
    services: [
      {
        title: "Digital Banking",
        description: "Secure, scalable banking infrastructure with real-time transaction processing and compliance management.",
        icon: "🏦",
        features: ["Real-time transaction processing", "Multi-factor authentication", "PCI-DSS compliant", "Open banking APIs"],
      },
      {
        title: "Investment Management",
        description: "Portfolio analysis, robo-advisory, and wealth management solutions powered by AI insights.",
        icon: "📊",
        features: ["AI-driven portfolio optimization", "Real-time market data", "Risk assessment tools", "Automated rebalancing"],
      },
      {
        title: "Financial Advisory",
        description: "Expert guidance on financial planning, risk management, and strategic investments.",
        icon: "💼",
        features: ["Personalized financial plans", "Tax optimization strategies", "Retirement planning", "Estate planning support"],
      },
    ],
    aboutText:
      "FinTech Solutions is a leading provider of digital banking and investment management platforms. With over 15 years of experience, we help financial institutions modernize their operations and deliver exceptional customer experiences.",
    aboutPoints: [
      "SOC 2 Type II and PCI-DSS certified",
      "Serving 500+ financial institutions globally",
      "Processing $10B+ in transactions annually",
      "99.99% platform uptime guaranteed",
    ],
    stats: [
      { value: "$10B+", label: "Transactions Processed" },
      { value: "500+", label: "Financial Institutions" },
      { value: "99.99%", label: "Uptime SLA" },
      { value: "15+", label: "Years Experience" },
    ],
    testimonials: [
      {
        name: "Michael Chen",
        title: "CTO",
        company: "Meridian Bank",
        quote: "FinTech Solutions transformed our digital banking infrastructure. Transaction processing is 3x faster and our compliance overhead dropped by 40%.",
        rating: 5,
      },
      {
        name: "Sarah Williams",
        title: "VP of Operations",
        company: "Apex Capital",
        quote: "The AI-powered portfolio management tools have given our advisors a significant edge. Client satisfaction scores have never been higher.",
        rating: 5,
      },
      {
        name: "David Rodriguez",
        title: "CEO",
        company: "NovaPay",
        quote: "Exceptional platform reliability and outstanding support team. We've had zero downtime in 18 months of operation.",
        rating: 5,
      },
    ],
    team: [
      { name: "James Hartwell", title: "CEO & Founder", initials: "JH" },
      { name: "Lisa Park", title: "CTO", initials: "LP" },
      { name: "Robert Kim", title: "Head of Compliance", initials: "RK" },
      { name: "Amanda Torres", title: "VP of Product", initials: "AT" },
    ],
    contactInfo: {
      phone: "(800) 555-0100",
      email: "contact@fintechsolutions.demo",
      address: "100 Wall Street, New York, NY 10005",
    },
    processSteps: [
      { step: 1, title: "Discovery & Assessment", description: "We analyze your current financial infrastructure, compliance requirements, and growth objectives to design a tailored roadmap.", icon: "🔍" },
      { step: 2, title: "Architecture Design", description: "Our engineers design a secure, scalable platform architecture with PCI-DSS compliance baked in from day one.", icon: "📐" },
      { step: 3, title: "Build & Integrate", description: "We build your platform with real-time transaction processing, connect to banking APIs, and integrate with existing systems.", icon: "⚙️" },
      { step: 4, title: "Launch & Optimize", description: "Go live with 24/7 monitoring, continuous optimization, and dedicated support to ensure peak performance.", icon: "🚀" },
    ],
    caseStudy: {
      client: "Pacific Coast Credit Union",
      industry: "Banking & Financial Services",
      challenge: "Legacy core banking system causing 4-hour processing delays, frequent outages, and inability to offer mobile banking to 200,000+ members.",
      solution: "Migrated to cloud-native microservices architecture with real-time transaction processing, mobile-first design, and AI-powered fraud detection.",
      results: [
        { metric: "Processing Speed", value: "300x Faster" },
        { metric: "Fraud Detection", value: "99.7%" },
        { metric: "Member Satisfaction", value: "+47 NPS" },
        { metric: "Cost Reduction", value: "38%" },
      ],
    },
    faqs: [
      { question: "How long does a typical digital banking platform implementation take?", answer: "Most implementations take 12-16 weeks from discovery to launch. Complex multi-entity deployments may take 20-24 weeks. We use agile sprints with bi-weekly demos so you see progress immediately." },
      { question: "Is your platform compliant with financial regulations?", answer: "Yes. We maintain SOC 2 Type II, PCI-DSS Level 1, and FFIEC compliance certifications. Our platform is designed for GDPR, CCPA, and Dodd-Frank requirements out of the box." },
      { question: "Can you integrate with our existing core banking system?", answer: "Absolutely. We support integration with all major core banking platforms including FIS, Fiserv, Jack Henry, Temenos, and Mambu through our open API layer." },
      { question: "What is your uptime guarantee?", answer: "We guarantee 99.99% uptime backed by an SLA with financial credits. Our platform uses multi-region active-active deployment with automatic failover." },
      { question: "Do you support cryptocurrency and digital asset management?", answer: "Yes. Our platform includes modules for digital asset custody, crypto trading integration, and blockchain-based settlement — all within regulatory frameworks." },
    ],
    pricingTiers: [
      { name: "Starter", price: "$2,500", period: "month", description: "For community banks and credit unions getting started with digital transformation.", features: ["Up to 50,000 accounts", "Core banking APIs", "Mobile app (iOS & Android)", "Basic fraud detection", "Email support", "99.9% uptime SLA"], cta: "Get Started" },
      { name: "Professional", price: "$7,500", period: "month", description: "For growing institutions that need advanced capabilities and compliance tools.", features: ["Up to 500,000 accounts", "AI-powered fraud detection", "Robo-advisory module", "Real-time payments", "Dedicated account manager", "99.99% uptime SLA", "SOC 2 compliance tools"], highlighted: true, cta: "Contact Sales" },
      { name: "Enterprise", price: "Custom", period: "year", description: "For large institutions requiring full customization and white-label solutions.", features: ["Unlimited accounts", "White-label platform", "Custom AI models", "Multi-entity support", "On-premise option", "24/7 dedicated support", "Custom SLA", "Regulatory reporting suite"], cta: "Talk to Us" },
    ],
    trustBadges: ["SOC 2 Type II", "PCI-DSS Level 1", "ISO 27001", "FFIEC Compliant", "AWS Advanced Partner"],
    newsletterHeadline: "Stay Ahead in FinTech",
    newsletterSubtext: "Weekly insights on digital banking trends, regulatory updates, and AI innovations in financial services.",
  },

  legal: {
    id: "legal",
    name: "Sterling & Associates",
    companyName: "Sterling & Associates",
    logoUrl: "/manus-storage/legal-logo_a6771a47.png",
    tagline: "Corporate Law & Legal Consulting",
    industry: "Legal Services",
    description:
      "Navigate complex legal landscapes with confidence. Our platform combines expert attorneys with AI-powered document analysis, compliance tracking, and secure case management to streamline your legal operations.",
    icon: "⚖️",
    accentColor: "#818CF8",
    bgColor: "#0D0A1A",
    services: [
      {
        title: "Corporate Law",
        description: "Contract drafting, M&A support, corporate governance, and regulatory compliance services.",
        icon: "📋",
        features: ["Contract drafting & review", "M&A due diligence", "Corporate governance", "Regulatory compliance"],
      },
      {
        title: "Litigation Support",
        description: "Expert legal representation, case management, and dispute resolution with proven track record.",
        icon: "⚖️",
        features: ["Civil & commercial litigation", "Arbitration & mediation", "Class action defense", "IP disputes"],
      },
      {
        title: "Legal Technology",
        description: "AI-powered document analysis, e-discovery, and legal workflow automation.",
        icon: "🤖",
        features: ["AI document review", "E-discovery platform", "Contract lifecycle management", "Legal analytics"],
      },
    ],
    aboutText:
      "Legal Pro brings together top-tier attorneys and cutting-edge technology to deliver exceptional legal services. Our team has successfully handled complex cases for Fortune 500 companies and emerging startups alike.",
    aboutPoints: [
      "200+ experienced attorneys across 12 practice areas",
      "Offices in New York, Chicago, Los Angeles, and Miami",
      "98% client satisfaction rate over 20 years",
      "Named 'Best Law Firm' by Legal 500 three years running",
    ],
    stats: [
      { value: "500+", label: "Cases Won" },
      { value: "200+", label: "Corporate Clients" },
      { value: "98%", label: "Client Satisfaction" },
      { value: "20+", label: "Years of Practice" },
    ],
    testimonials: [
      {
        name: "Jennifer Walsh",
        title: "General Counsel",
        company: "TechCorp Inc.",
        quote: "Legal Pro's AI-powered contract review saved us hundreds of hours during our Series C fundraise. Their team is responsive, thorough, and deeply knowledgeable.",
        rating: 5,
      },
      {
        name: "Marcus Johnson",
        title: "CEO",
        company: "Pinnacle Ventures",
        quote: "We've relied on Legal Pro for all our M&A work for the past 5 years. Their attention to detail and strategic advice is unmatched.",
        rating: 5,
      },
      {
        name: "Patricia Lee",
        title: "CFO",
        company: "Global Retail Group",
        quote: "The litigation team at Legal Pro secured a favorable outcome in a complex multi-jurisdictional dispute. Highly recommend.",
        rating: 5,
      },
    ],
    team: [
      { name: "Richard Chambers", title: "Managing Partner", initials: "RC" },
      { name: "Elena Vasquez", title: "Senior Partner, Corporate", initials: "EV" },
      { name: "Thomas Wright", title: "Head of Litigation", initials: "TW" },
      { name: "Sophia Nguyen", title: "Director of Legal Tech", initials: "SN" },
    ],
    contactInfo: {
      phone: "(800) 555-0200",
      email: "contact@legalpro.demo",
      address: "350 Fifth Avenue, New York, NY 10118",
    },
    processSteps: [
      { step: 1, title: "Initial Consultation", description: "Free 30-minute consultation to understand your legal needs, assess complexity, and determine the best strategy.", icon: "📋" },
      { step: 2, title: "Strategy Development", description: "Our attorneys develop a comprehensive legal strategy with clear milestones, timelines, and cost estimates.", icon: "🎯" },
      { step: 3, title: "Execution & Advocacy", description: "We execute with precision — drafting documents, negotiating terms, and representing your interests aggressively.", icon: "⚖️" },
      { step: 4, title: "Resolution & Review", description: "We close the matter, ensure all obligations are met, and provide ongoing counsel to prevent future issues.", icon: "✅" },
    ],
    caseStudy: {
      client: "TechCorp International",
      industry: "Technology / M&A",
      challenge: "$450M cross-border acquisition with regulatory hurdles in 6 jurisdictions, complex IP transfer requirements, and a 90-day closing deadline.",
      solution: "Assembled a 12-attorney team across 4 offices, leveraged AI document review for 50,000+ contracts, and coordinated parallel regulatory filings.",
      results: [
        { metric: "Deal Closed In", value: "78 Days" },
        { metric: "Documents Reviewed", value: "50,000+" },
        { metric: "Cost vs. Estimate", value: "12% Under" },
        { metric: "Post-Close Issues", value: "Zero" },
      ],
    },
    faqs: [
      { question: "How do you bill for legal services?", answer: "We offer flexible billing including hourly rates, flat fees for defined scope work, contingency arrangements for litigation, and monthly retainers for ongoing counsel. We provide detailed estimates upfront." },
      { question: "What industries do you specialize in?", answer: "Our primary verticals are technology, financial services, healthcare, and real estate. We have dedicated practice groups with deep domain expertise in each sector." },
      { question: "How does your AI-powered document review work?", answer: "Our proprietary AI platform can review contracts 10x faster than manual review with 99.2% accuracy. It identifies key clauses, risks, and non-standard terms, allowing our attorneys to focus on strategy." },
      { question: "Can you handle matters outside the United States?", answer: "Yes. We have offices in New York, Chicago, LA, and Miami, plus a network of vetted partner firms in 30+ countries for cross-border matters." },
      { question: "What is your success rate in litigation?", answer: "Over the past 5 years, we have achieved favorable outcomes in 94% of litigated matters, including settlements, verdicts, and dismissals of claims against our clients." },
    ],
    pricingTiers: [
      { name: "Counsel", price: "$3,500", period: "month", description: "Ongoing legal counsel for startups and small businesses.", features: ["10 hours/month of attorney time", "Contract review & drafting", "Employment law guidance", "Regulatory compliance advice", "Email & phone support", "48-hour response time"], cta: "Get Started" },
      { name: "Business", price: "$8,500", period: "month", description: "Comprehensive legal support for growing companies.", features: ["25 hours/month of attorney time", "M&A and fundraising support", "IP protection & filing", "Litigation defense", "Dedicated partner", "24-hour response time", "Board meeting attendance"], highlighted: true, cta: "Contact Us" },
      { name: "Enterprise", price: "Custom", period: "year", description: "Full-service legal department for large organizations.", features: ["Unlimited attorney access", "Dedicated legal team (3-5 attorneys)", "Cross-border capabilities", "AI document review platform", "Regulatory lobbying", "Crisis management", "Same-day response", "Quarterly strategy reviews"], cta: "Schedule Consultation" },
    ],
    trustBadges: ["Am Law 200", "Legal 500 Ranked", "Chambers & Partners", "Super Lawyers", "Best Lawyers 2025"],
    newsletterHeadline: "Legal Insights That Matter",
    newsletterSubtext: "Monthly briefings on regulatory changes, landmark cases, and legal technology innovations for business leaders.",
  },

  insurance: {
    id: "insurance",
    name: "Pinnacle Insurance Group",
    companyName: "Pinnacle Insurance Group",
    logoUrl: "/manus-storage/insurance-logo_ea0f8444.png",
    tagline: "Health, Property & Liability Insurance",
    industry: "Insurance",
    description:
      "Protect what matters most with modern insurance solutions. Our AI-powered platform streamlines underwriting, accelerates claims processing, and provides customers with transparent, flexible coverage options tailored to their needs.",
    icon: "🛡️",
    accentColor: "#FBBF24",
    bgColor: "#1A1200",
    services: [
      {
        title: "Health Insurance",
        description: "Comprehensive health coverage with preventive care, telemedicine, and wellness programs.",
        icon: "🏥",
        features: ["Individual & family plans", "Telemedicine included", "Preventive care coverage", "Mental health benefits"],
      },
      {
        title: "Property & Casualty",
        description: "Home, auto, and business insurance with fast claims processing and risk assessment.",
        icon: "🏠",
        features: ["Homeowners & renters insurance", "Auto insurance", "Commercial property", "AI-powered risk assessment"],
      },
      {
        title: "Liability Coverage",
        description: "Professional liability, general liability, and specialized coverage for enterprises.",
        icon: "🛡️",
        features: ["General liability", "Professional liability (E&O)", "Cyber liability", "Directors & officers coverage"],
      },
    ],
    aboutText:
      "InsureFlow revolutionizes insurance with intelligent underwriting and rapid claims processing. We serve over 100,000 customers across North America with transparent pricing and exceptional service.",
    aboutPoints: [
      "A+ rated by AM Best for financial stability",
      "Claims processed in under 24 hours on average",
      "Licensed in all 50 states and Canada",
      "NAIC compliant with full regulatory transparency",
    ],
    stats: [
      { value: "100K+", label: "Customers Served" },
      { value: "70%", label: "Faster Claims" },
      { value: "$500M+", label: "Claims Paid" },
      { value: "24/7", label: "Support Available" },
    ],
    testimonials: [
      {
        name: "Karen Mitchell",
        title: "HR Director",
        company: "Sunrise Manufacturing",
        quote: "InsureFlow's group health plans saved our company 25% on premiums while improving coverage. The claims process is incredibly smooth.",
        rating: 5,
      },
      {
        name: "Brian Foster",
        title: "Small Business Owner",
        company: "Foster's Bakery",
        quote: "When a pipe burst in my shop, InsureFlow had an adjuster out the same day and my claim was settled within 48 hours. Incredible service.",
        rating: 5,
      },
      {
        name: "Dr. Alicia Reyes",
        title: "Medical Director",
        company: "Coastal Health Group",
        quote: "The professional liability coverage and risk management tools from InsureFlow give our entire practice team peace of mind.",
        rating: 5,
      },
    ],
    team: [
      { name: "William Grant", title: "CEO & President", initials: "WG" },
      { name: "Nancy Patel", title: "Chief Actuary", initials: "NP" },
      { name: "Carlos Mendez", title: "VP of Claims", initials: "CM" },
      { name: "Diane Olson", title: "Head of Underwriting", initials: "DO" },
    ],
    contactInfo: {
      phone: "(800) 555-0300",
      email: "contact@insureflow.demo",
      address: "500 Insurance Plaza, Hartford, CT 06103",
    },
    processSteps: [
      { step: 1, title: "Risk Assessment", description: "Our AI analyzes your risk profile using 200+ data points to determine optimal coverage and pricing.", icon: "📊" },
      { step: 2, title: "Custom Quote", description: "Receive a tailored insurance package within minutes — transparent pricing with no hidden fees or exclusions.", icon: "💰" },
      { step: 3, title: "Instant Coverage", description: "Bind your policy digitally in minutes. Coverage begins immediately with full documentation delivered to your inbox.", icon: "⚡" },
      { step: 4, title: "Claims & Support", description: "File claims through our app or phone. AI-assisted processing means most claims are resolved within 24 hours.", icon: "🤝" },
    ],
    caseStudy: {
      client: "Sunrise Manufacturing Group",
      industry: "Manufacturing & Industrial",
      challenge: "Complex multi-site insurance program with $50M in property coverage, workers comp across 12 states, and a history of slow claims taking 45+ days to resolve.",
      solution: "Consolidated all policies under a single platform with AI-powered claims triage, predictive risk modeling, and a dedicated claims advocate team.",
      results: [
        { metric: "Claims Resolution", value: "< 24 Hours" },
        { metric: "Premium Savings", value: "22%" },
        { metric: "Employee Satisfaction", value: "+38 NPS" },
        { metric: "Claim Denials", value: "Down 67%" },
      ],
    },
    faqs: [
      { question: "How quickly can I get a quote?", answer: "Our AI-powered quoting engine delivers personalized quotes in under 3 minutes for most coverage types. Complex commercial policies may take up to 24 hours for a comprehensive proposal." },
      { question: "What happens when I need to file a claim?", answer: "File through our mobile app, website, or by calling our 24/7 claims line. Our AI triage system categorizes and routes your claim immediately. Most standard claims are resolved within 24 hours." },
      { question: "Can I bundle multiple types of coverage?", answer: "Absolutely. We offer multi-policy discounts of 15-25% when you bundle health, property, auto, and liability coverage. Our platform manages all policies in one dashboard." },
      { question: "Are you licensed in my state?", answer: "We are licensed and regulated in all 50 US states plus DC, Puerto Rico, and all Canadian provinces. Our compliance team ensures full regulatory adherence in every jurisdiction." },
      { question: "How do you keep premiums affordable?", answer: "Our AI underwriting model assesses risk more accurately than traditional methods, allowing us to offer competitive rates. We also reward healthy behaviors and loss prevention with premium discounts." },
    ],
    pricingTiers: [
      { name: "Personal", price: "$89", period: "month", description: "Comprehensive personal coverage for individuals and families.", features: ["Health insurance (individual/family)", "Auto insurance", "Renters/homeowners coverage", "Personal liability ($1M)", "Mobile app & digital ID cards", "24/7 claims support"], cta: "Get a Quote" },
      { name: "Business", price: "$349", period: "month", description: "Complete coverage for small and mid-size businesses.", features: ["General liability ($2M)", "Professional liability (E&O)", "Workers compensation", "Commercial property", "Cyber liability", "Dedicated agent", "Risk management tools"], highlighted: true, cta: "Get a Quote" },
      { name: "Enterprise", price: "Custom", period: "year", description: "Tailored programs for large organizations with complex needs.", features: ["Custom coverage limits", "Multi-state/multi-site", "Captive & self-insured options", "Executive liability (D&O)", "Global coverage", "Dedicated claims team", "Quarterly risk reviews", "Loss control engineering"], cta: "Contact Us" },
    ],
    trustBadges: ["A+ AM Best Rating", "NAIC Compliant", "BBB A+ Rated", "Licensed All 50 States", "SOC 2 Certified"],
    newsletterHeadline: "Protect What Matters Most",
    newsletterSubtext: "Monthly tips on risk management, coverage optimization, and industry regulatory updates for business owners.",
  },

  vc: {
    id: "vc",
    name: "Apex Ventures",
    companyName: "Apex Ventures",
    logoUrl: "/manus-storage/vc-logo_3e310c4e.png",
    tagline: "Venture Capital & Startup Funding",
    industry: "Venture Capital",
    description:
      "Fuel innovation and growth. We provide early-stage funding, strategic mentorship, and access to our network of industry leaders. Our data-driven approach helps founders scale faster and achieve sustainable growth.",
    icon: "📈",
    accentColor: "#F472B6",
    bgColor: "#1A0A14",
    services: [
      {
        title: "Early-Stage Funding",
        description: "Seed and Series A funding for innovative startups with mentorship and network access.",
        icon: "🚀",
        features: ["Seed rounds ($500K–$2M)", "Series A ($2M–$10M)", "Bridge financing", "SAFE & convertible notes"],
      },
      {
        title: "Portfolio Management",
        description: "Strategic oversight, performance tracking, and growth acceleration for portfolio companies.",
        icon: "📈",
        features: ["Board representation", "KPI tracking & reporting", "Follow-on investment support", "Exit strategy planning"],
      },
      {
        title: "Startup Mentorship",
        description: "Expert guidance from industry veterans on strategy, operations, and scaling.",
        icon: "🎯",
        features: ["1:1 founder coaching", "Go-to-market strategy", "Talent acquisition support", "Investor introductions"],
      },
    ],
    aboutText:
      "VenturePeak is a premier venture capital firm focused on early-stage technology companies. We have successfully funded and mentored 50+ startups, with 15 exits and a combined valuation exceeding $2 billion.",
    aboutPoints: [
      "Focus areas: AI/ML, FinTech, HealthTech, Enterprise SaaS",
      "Network of 200+ industry mentors and advisors",
      "Average 3.2x return on invested capital",
      "Portfolio companies have raised $500M+ in follow-on funding",
    ],
    stats: [
      { value: "50+", label: "Portfolio Companies" },
      { value: "$2B+", label: "Combined Valuation" },
      { value: "15", label: "Successful Exits" },
      { value: "$500M", label: "Assets Under Management" },
    ],
    testimonials: [
      {
        name: "Alex Thompson",
        title: "Co-Founder & CEO",
        company: "DataSync AI",
        quote: "VenturePeak didn't just write a check — they rolled up their sleeves and helped us navigate our first enterprise sales cycle. We closed $2M ARR within 6 months.",
        rating: 5,
      },
      {
        name: "Priya Sharma",
        title: "Founder",
        company: "MedFlow Health",
        quote: "The network and mentorship from VenturePeak were invaluable. They connected us with our first 3 hospital clients and helped us raise our Series A.",
        rating: 5,
      },
      {
        name: "Kevin O'Brien",
        title: "CEO",
        company: "CloudShift",
        quote: "VenturePeak's strategic guidance helped us pivot at exactly the right time. We went from struggling to a $50M acquisition in 18 months.",
        rating: 5,
      },
    ],
    team: [
      { name: "Victoria Harmon", title: "Managing Partner", initials: "VH" },
      { name: "Jason Liu", title: "General Partner", initials: "JL" },
      { name: "Rachel Stone", title: "Principal", initials: "RS" },
      { name: "Omar Hassan", title: "Venture Partner", initials: "OH" },
    ],
    contactInfo: {
      phone: "(800) 555-0400",
      email: "contact@venturepeak.demo",
      address: "3000 Sand Hill Road, Menlo Park, CA 94025",
    },
    processSteps: [
      { step: 1, title: "Application & Screening", description: "Submit your pitch deck and financials. Our team reviews 1,000+ applications quarterly and responds within 5 business days.", icon: "📩" },
      { step: 2, title: "Deep Dive & Diligence", description: "Selected founders meet our partners for a deep dive into product, market, team, and financials over 2-3 weeks.", icon: "🔬" },
      { step: 3, title: "Term Sheet & Close", description: "We move fast. Term sheets issued within 48 hours of partner approval. Typical close in 2-3 weeks with founder-friendly terms.", icon: "📝" },
      { step: 4, title: "Growth Partnership", description: "Post-investment, you get a board seat, operating support, customer introductions, and follow-on funding priority.", icon: "📈" },
    ],
    caseStudy: {
      client: "DataSync AI (Series A)",
      industry: "Enterprise SaaS / AI",
      challenge: "Pre-revenue AI startup with strong technology but no enterprise sales motion, struggling to convert pilot customers into contracts.",
      solution: "Led $8M Series A, placed a sales advisor from our network, introduced to 15 enterprise prospects, and provided go-to-market playbook.",
      results: [
        { metric: "ARR Growth", value: "$0 → $4.2M" },
        { metric: "Time to Revenue", value: "6 Months" },
        { metric: "Enterprise Clients", value: "12 Signed" },
        { metric: "Follow-on Raised", value: "$25M Series B" },
      ],
    },
    faqs: [
      { question: "What stage companies do you invest in?", answer: "We focus on Seed ($500K–$2M) and Series A ($2M–$10M) rounds. We occasionally participate in pre-seed for exceptional founders with prior exits, and we always reserve capital for follow-on." },
      { question: "What sectors are you focused on?", answer: "Our core thesis areas are AI/ML, Enterprise SaaS, FinTech, HealthTech, and Climate Tech. We look for companies with strong technical moats and large addressable markets." },
      { question: "How long does your investment process take?", answer: "From first meeting to term sheet, our average is 3 weeks. We can move faster for competitive rounds. We never ghost founders — you'll get a clear yes or no with feedback." },
      { question: "What do you offer beyond capital?", answer: "Board participation, hiring support (we've placed 200+ executives), customer introductions, follow-on funding coordination, and access to our 50+ portfolio company network for partnerships." },
      { question: "What are your return expectations?", answer: "We target 3-5x fund returns with a 7-10 year horizon. Our historical average is 3.2x MOIC across 3 funds. We optimize for outlier outcomes, not average returns." },
    ],
    pricingTiers: [
      { name: "Seed", price: "$500K–$2M", period: "round", description: "For pre-product or early-traction startups with exceptional founders.", features: ["Board observer seat", "Monthly office hours", "Hiring support (first 5 hires)", "Pitch deck coaching", "Investor intro network", "Co-working space access"], cta: "Apply Now" },
      { name: "Series A", price: "$2M–$10M", period: "round", description: "For companies with product-market fit ready to scale.", features: ["Board seat", "Weekly partner check-ins", "Executive recruiting", "Go-to-market playbook", "Customer introductions", "Follow-on reserve", "CFO/finance support"], highlighted: true, cta: "Apply Now" },
      { name: "Growth", price: "$10M+", period: "round", description: "For portfolio companies ready to dominate their market.", features: ["Lead or co-lead round", "IPO/M&A advisory", "International expansion support", "Strategic acquirer introductions", "Public company board prep", "IR & communications", "Secondary liquidity options", "Full operating team access"], cta: "Talk to Partners" },
    ],
    trustBadges: ["Top 50 VC (PitchBook)", "15 Exits", "$2B+ Portfolio Value", "200+ Mentor Network", "3.2x Avg MOIC"],
    newsletterHeadline: "The Founder's Edge",
    newsletterSubtext: "Weekly insights on fundraising, scaling, and the venture landscape from partners who've been in your shoes.",
  },

  health: {
    id: "health",
    name: "Vitara Health",
    companyName: "Vitara Health",
    logoUrl: "/manus-storage/health-logo_1af43473.png",
    tagline: "Telemedicine & Wellness Services",
    industry: "Healthcare",
    description:
      "Healthcare reimagined for the digital age. Our comprehensive platform connects patients with licensed physicians, provides personalized wellness programs, and maintains secure health records — accessible from anywhere, anytime.",
    icon: "🏥",
    accentColor: "#F87171",
    bgColor: "#1A0A0A",
    services: [
      {
        title: "Telemedicine",
        description: "Virtual consultations with licensed physicians, prescription management, and follow-up care.",
        icon: "👨‍⚕️",
        features: ["On-demand video consultations", "E-prescriptions", "Specialist referrals", "24/7 urgent care access"],
      },
      {
        title: "Wellness Programs",
        description: "Preventive care, fitness tracking, nutrition guidance, and mental health support.",
        icon: "💪",
        features: ["Personalized wellness plans", "Mental health counseling", "Nutrition coaching", "Fitness & activity tracking"],
      },
      {
        title: "Patient Management",
        description: "Integrated EHR, appointment scheduling, and secure patient communication platform.",
        icon: "📋",
        features: ["Electronic health records", "Appointment scheduling", "Secure messaging", "Lab results & imaging"],
      },
    ],
    aboutText:
      "HealthFirst brings quality healthcare to your fingertips. With a network of 500+ licensed physicians and 1M+ patients served, we are transforming how people access and manage their health.",
    aboutPoints: [
      "HIPAA-compliant platform with end-to-end encryption",
      "Licensed physicians in all 50 states",
      "Average wait time under 10 minutes",
      "Integrated with 200+ insurance providers",
    ],
    stats: [
      { value: "1M+", label: "Patients Served" },
      { value: "500+", label: "Licensed Physicians" },
      { value: "HIPAA", label: "Compliant" },
      { value: "4.9★", label: "Patient Rating" },
    ],
    testimonials: [
      {
        name: "Dr. Sandra Kim",
        title: "Family Physician",
        company: "HealthFirst Network",
        quote: "The platform makes it incredibly easy to see patients remotely. I can review records, prescribe, and follow up all in one place. My patients love the convenience.",
        rating: 5,
      },
      {
        name: "Mark Davidson",
        title: "Patient",
        company: "HealthFirst Member",
        quote: "I got a prescription for a sinus infection at 11pm without leaving my house. The doctor was professional, thorough, and the whole visit took 15 minutes.",
        rating: 5,
      },
      {
        name: "Lisa Fernandez",
        title: "HR Benefits Manager",
        company: "Coastal Enterprises",
        quote: "We rolled out HealthFirst to our 500-person workforce and saw a 30% reduction in sick days. The wellness programs are genuinely effective.",
        rating: 5,
      },
    ],
    team: [
      { name: "Dr. Andrew Patel", title: "Chief Medical Officer", initials: "AP" },
      { name: "Christine Lee", title: "CEO", initials: "CL" },
      { name: "Dr. Marcus Webb", title: "Head of Telemedicine", initials: "MW" },
      { name: "Tanya Brooks", title: "VP of Patient Experience", initials: "TB" },
    ],
    contactInfo: {
      phone: "(800) 555-0500",
      email: "contact@healthfirst.demo",
      address: "200 Medical Center Drive, Boston, MA 02115",
    },
    processSteps: [
      { step: 1, title: "Create Your Profile", description: "Sign up in 2 minutes. Share your medical history, insurance info, and health goals securely through our HIPAA-compliant platform.", icon: "📱" },
      { step: 2, title: "Match With a Provider", description: "Our AI matches you with the right specialist based on your symptoms, preferences, and availability — often within minutes.", icon: "🩺" },
      { step: 3, title: "Virtual or In-Person Visit", description: "See your provider via HD video, phone, or in-person at one of our 50+ clinic locations. Same-day appointments available.", icon: "📹" },
      { step: 4, title: "Ongoing Care & Follow-Up", description: "Receive prescriptions, lab orders, referrals, and personalized care plans. Our team follows up to ensure you're improving.", icon: "❤️" },
    ],
    caseStudy: {
      client: "Coastal Enterprises (500 employees)",
      industry: "Corporate Wellness",
      challenge: "High employee absenteeism (avg 8.5 sick days/year), rising healthcare costs ($2.1M annually), and low engagement with existing wellness programs.",
      solution: "Deployed comprehensive telemedicine platform with 24/7 access, mental health support, preventive care programs, and AI-powered health risk assessments for all employees.",
      results: [
        { metric: "Sick Days Reduced", value: "30%" },
        { metric: "Healthcare Costs", value: "-$420K/yr" },
        { metric: "Employee Satisfaction", value: "94%" },
        { metric: "Avg Wait Time", value: "< 5 min" },
      ],
    },
    faqs: [
      { question: "Is my health information secure?", answer: "Absolutely. We are HIPAA-compliant with SOC 2 Type II certification. All data is encrypted at rest and in transit. We never sell patient data and undergo annual third-party security audits." },
      { question: "What insurance do you accept?", answer: "We accept all major insurance plans including Aetna, Blue Cross Blue Shield, Cigna, Humana, Kaiser, UnitedHealthcare, and Medicare/Medicaid. We also offer affordable self-pay options starting at $49/visit." },
      { question: "Can I get prescriptions through telemedicine?", answer: "Yes. Our licensed providers can prescribe most medications during your virtual visit. Prescriptions are sent electronically to your preferred pharmacy for same-day pickup." },
      { question: "What conditions can you treat virtually?", answer: "We treat 80%+ of common conditions virtually including infections, allergies, skin conditions, mental health, chronic disease management, and preventive care. Complex cases are referred to in-person specialists." },
      { question: "How quickly can I see a doctor?", answer: "Our average wait time is under 5 minutes for urgent care. Scheduled appointments are available same-day for most specialties. Our 24/7 service means you can see a provider at any hour." },
    ],
    pricingTiers: [
      { name: "Individual", price: "$29", period: "month", description: "Comprehensive virtual healthcare for individuals.", features: ["Unlimited urgent care visits", "24/7 provider access", "Prescription management", "Mental health support", "Health records portal", "Lab ordering"], cta: "Start Free Trial" },
      { name: "Family", price: "$79", period: "month", description: "Coverage for your entire household (up to 6 members).", features: ["Everything in Individual", "Up to 6 family members", "Pediatric care", "Family wellness programs", "Specialist referrals", "Chronic care management", "Priority scheduling"], highlighted: true, cta: "Start Free Trial" },
      { name: "Enterprise", price: "Custom", period: "employee/mo", description: "Employee health benefits for organizations of any size.", features: ["All family plan features", "Custom wellness programs", "Onsite clinic integration", "Analytics dashboard", "Benefits admin portal", "Dedicated account team", "EAP integration", "ROI reporting"], cta: "Get a Demo" },
    ],
    trustBadges: ["HIPAA Compliant", "SOC 2 Type II", "NCQA Accredited", "URAC Certified", "Joint Commission"],
    newsletterHeadline: "Your Health, Simplified",
    newsletterSubtext: "Weekly wellness tips, preventive care reminders, and the latest in telemedicine innovation delivered to your inbox.",
  },

  consulting: {
    id: "consulting",
    name: "Stratford Advisory",
    companyName: "Stratford Advisory",
    logoUrl: "/manus-storage/consulting-logo_5d8e67e2.png",
    tagline: "Management & Digital Transformation",
    industry: "Management Consulting",
    description:
      "Transform your business with strategic consulting from industry experts. We combine deep domain knowledge with cutting-edge technology to help organizations navigate change, optimize operations, and achieve sustainable competitive advantage.",
    icon: "🎯",
    accentColor: "#A78BFA",
    bgColor: "#0E0A1A",
    services: [
      {
        title: "Strategy Consulting",
        description: "Business strategy, market analysis, and competitive positioning for sustainable growth.",
        icon: "🎯",
        features: ["Market entry strategy", "Competitive analysis", "M&A advisory", "Growth roadmapping"],
      },
      {
        title: "Operations Optimization",
        description: "Process improvement, cost reduction, and operational efficiency through data-driven insights.",
        icon: "⚙️",
        features: ["Lean & Six Sigma", "Supply chain optimization", "Cost reduction programs", "Performance benchmarking"],
      },
      {
        title: "Digital Transformation",
        description: "Technology adoption, change management, and organizational restructuring for the digital era.",
        icon: "🔄",
        features: ["Technology assessment", "Change management", "ERP implementation", "AI & automation roadmap"],
      },
    ],
    aboutText:
      "Consulting Plus has guided 200+ organizations through successful digital transformations. Our team of experienced consultants brings proven methodologies and industry best practices to drive measurable results.",
    aboutPoints: [
      "Former McKinsey, BCG, and Deloitte partners on our team",
      "Specialized practices in 8 industry verticals",
      "Average 35% cost reduction delivered to clients",
      "Certified in ITIL, PRINCE2, and Agile methodologies",
    ],
    stats: [
      { value: "200+", label: "Transformations" },
      { value: "35%", label: "Avg Cost Reduction" },
      { value: "2x", label: "Productivity Gain" },
      { value: "95%", label: "Client Retention" },
    ],
    testimonials: [
      {
        name: "Robert Sinclair",
        title: "CEO",
        company: "National Logistics Corp",
        quote: "Consulting Plus redesigned our entire supply chain operation. We reduced costs by 28% and improved delivery times by 40% in under a year.",
        rating: 5,
      },
      {
        name: "Michelle Park",
        title: "COO",
        company: "Heritage Financial",
        quote: "Their digital transformation roadmap was exactly what we needed. The team was pragmatic, collaborative, and delivered on every milestone.",
        rating: 5,
      },
      {
        name: "Daniel Okafor",
        title: "VP of Strategy",
        company: "MedDevice Global",
        quote: "The market entry strategy Consulting Plus developed helped us successfully launch in three new markets simultaneously. Exceptional work.",
        rating: 5,
      },
    ],
    team: [
      { name: "Catherine Moore", title: "Managing Director", initials: "CM" },
      { name: "Steven Park", title: "Partner, Strategy", initials: "SP" },
      { name: "Anita Gupta", title: "Partner, Operations", initials: "AG" },
      { name: "Frank Deluca", title: "Director, Digital", initials: "FD" },
    ],
    contactInfo: {
      phone: "(800) 555-0600",
      email: "contact@consultingplus.demo",
      address: "233 S Wacker Drive, Chicago, IL 60606",
    },
    processSteps: [
      { step: 1, title: "Diagnostic Assessment", description: "2-week deep dive into your organization — stakeholder interviews, data analysis, and competitive benchmarking to identify the highest-impact opportunities.", icon: "📊" },
      { step: 2, title: "Strategy & Roadmap", description: "We develop a prioritized transformation roadmap with clear KPIs, quick wins, and long-term initiatives aligned to your business objectives.", icon: "📍" },
      { step: 3, title: "Execution & Change Management", description: "Our consultants work alongside your team to implement changes, manage stakeholder alignment, and drive adoption across the organization.", icon: "⚙️" },
      { step: 4, title: "Measure & Sustain", description: "We track results against KPIs, optimize based on data, and transfer knowledge to ensure lasting impact after our engagement ends.", icon: "🏆" },
    ],
    caseStudy: {
      client: "Heritage Financial Group",
      industry: "Financial Services / Digital Transformation",
      challenge: "150-year-old financial institution with $8B AUM losing market share to digital-first competitors. Legacy systems, siloed departments, and 18-month product launch cycles.",
      solution: "Led 12-month digital transformation: modernized core systems, implemented agile methodology, redesigned customer journey, and launched mobile-first platform.",
      results: [
        { metric: "Product Launch Time", value: "18mo → 6wk" },
        { metric: "Customer Acquisition", value: "+340%" },
        { metric: "Operating Costs", value: "-28%" },
        { metric: "NPS Score", value: "+52 pts" },
      ],
    },
    faqs: [
      { question: "How is your approach different from other consulting firms?", answer: "We don't just deliver PowerPoint decks. Our consultants embed with your team, implement alongside you, and stay accountable to measurable outcomes. We tie our fees to results wherever possible." },
      { question: "What size companies do you work with?", answer: "Our sweet spot is mid-market to large enterprises ($50M–$5B revenue). We have dedicated practice groups for each segment with consultants who understand your specific challenges." },
      { question: "How long is a typical engagement?", answer: "Diagnostic assessments take 2-4 weeks. Strategy projects run 6-12 weeks. Full transformation programs are 6-18 months. We always start with a defined scope and expand based on demonstrated value." },
      { question: "Do you have industry-specific expertise?", answer: "Yes. Our partners average 20+ years in their respective industries. We have dedicated practices in Financial Services, Healthcare, Manufacturing, Technology, and Consumer/Retail." },
      { question: "What is your pricing model?", answer: "We offer three models: fixed-fee for defined scope projects, retainer for ongoing advisory, and performance-based where a portion of our fee is tied to achieving agreed-upon KPIs." },
    ],
    pricingTiers: [
      { name: "Advisory", price: "$15,000", period: "month", description: "Ongoing strategic advisory for leadership teams.", features: ["Monthly strategy sessions", "Board-ready presentations", "Market intelligence reports", "Executive coaching (2 leaders)", "Priority email/phone access", "Quarterly business reviews"], cta: "Schedule Call" },
      { name: "Transformation", price: "$75,000", period: "quarter", description: "Hands-on consulting for major business initiatives.", features: ["Dedicated 2-person team", "Weekly on-site presence", "Change management support", "Stakeholder alignment", "KPI dashboard & tracking", "Implementation support", "Monthly executive briefings"], highlighted: true, cta: "Request Proposal" },
      { name: "Enterprise", price: "Custom", period: "engagement", description: "Full-scale transformation programs for large organizations.", features: ["Dedicated 5+ person team", "Full-time on-site presence", "C-suite advisory", "Multi-workstream management", "Performance-based pricing", "Global delivery capability", "Knowledge transfer program", "12-month post-engagement support"], cta: "Talk to Partners" },
    ],
    trustBadges: ["McKinsey Alumni Network", "ISO 20700 Certified", "Forbes Top Consultants", "CMC Certified", "100+ Transformations"],
    newsletterHeadline: "The Transformation Brief",
    newsletterSubtext: "Bi-weekly insights on digital transformation, operational excellence, and strategic leadership from our senior partners.",
  },

  tech: {
    id: "tech",
    name: "NovaTech Solutions",
    companyName: "NovaTech Solutions",
    logoUrl: "/manus-storage/tech-logo_3292abd5.png",
    tagline: "SaaS & Cloud Infrastructure",
    industry: "Technology",
    description:
      "Build the future with cutting-edge technology. Our cloud-native platform provides the infrastructure, tools, and expertise you need to develop, deploy, and scale innovative software solutions that drive business growth.",
    icon: "💻",
    accentColor: "#60A5FA",
    bgColor: "#0A0E1A",
    services: [
      {
        title: "SaaS Platform",
        description: "Cloud-native software solutions with API-first architecture, real-time collaboration, and enterprise scalability.",
        icon: "☁️",
        features: ["Multi-tenant architecture", "REST & GraphQL APIs", "Real-time collaboration", "White-label options"],
      },
      {
        title: "Cloud Infrastructure",
        description: "Multi-cloud deployment, auto-scaling, disaster recovery, and 99.99% uptime guarantees.",
        icon: "🔧",
        features: ["AWS, Azure & GCP support", "Auto-scaling & load balancing", "Disaster recovery", "Zero-trust security"],
      },
      {
        title: "Custom Development",
        description: "Full-stack development, AI integration, mobile apps, and enterprise software solutions.",
        icon: "💻",
        features: ["Full-stack web & mobile", "AI/ML integration", "Legacy modernization", "DevOps & CI/CD"],
      },
    ],
    aboutText:
      "TechVision empowers companies to innovate faster with cloud-native technology. We have built and deployed 100+ applications serving millions of users across industries.",
    aboutPoints: [
      "ISO 27001 certified security practices",
      "SOC 2 Type II compliant infrastructure",
      "50+ engineers across frontend, backend, and DevOps",
      "Average project delivery 40% faster than industry standard",
    ],
    stats: [
      { value: "100+", label: "Apps Deployed" },
      { value: "10M+", label: "Users Served" },
      { value: "99.99%", label: "Uptime SLA" },
      { value: "50+", label: "Expert Engineers" },
    ],
    testimonials: [
      {
        name: "Nathan Cole",
        title: "CTO",
        company: "Retail Analytics Inc.",
        quote: "TechVision rebuilt our legacy platform in 4 months. Performance improved 10x and our engineering team can now ship features 3x faster.",
        rating: 5,
      },
      {
        name: "Jessica Huang",
        title: "Product Director",
        company: "EduLearn Platform",
        quote: "The TechVision team delivered a world-class mobile app on time and under budget. Their code quality and documentation are exceptional.",
        rating: 5,
      },
      {
        name: "Patrick O'Connor",
        title: "CEO",
        company: "FieldOps Pro",
        quote: "We went from idea to 10,000 active users in 6 months thanks to TechVision's rapid development and cloud infrastructure expertise.",
        rating: 5,
      },
    ],
    team: [
      { name: "Eric Zhang", title: "CEO & Co-Founder", initials: "EZ" },
      { name: "Maya Patel", title: "CTO", initials: "MP" },
      { name: "Chris Anderson", title: "Head of Engineering", initials: "CA" },
      { name: "Laura Kim", title: "VP of Product", initials: "LK" },
    ],
    contactInfo: {
      phone: "(800) 555-0700",
      email: "contact@techvision.demo",
      address: "1 Infinite Loop, Cupertino, CA 95014",
    },
    processSteps: [
      { step: 1, title: "Discovery & Scoping", description: "We map your requirements, define the technical architecture, and create a detailed project plan with milestones and deliverables.", icon: "📝" },
      { step: 2, title: "Design & Prototype", description: "UX/UI design, interactive prototypes, and user testing to validate the experience before writing a single line of production code.", icon: "🎨" },
      { step: 3, title: "Agile Development", description: "2-week sprints with continuous delivery. You see working software every iteration with full transparency into progress and blockers.", icon: "💻" },
      { step: 4, title: "Launch & Scale", description: "Production deployment with CI/CD, monitoring, auto-scaling, and 24/7 SRE support. We stay on as your technical partner post-launch.", icon: "🚀" },
    ],
    caseStudy: {
      client: "EduLearn Platform",
      industry: "EdTech / SaaS",
      challenge: "Needed to build a real-time collaborative learning platform supporting 100,000+ concurrent users with video, chat, and interactive whiteboards — in 6 months.",
      solution: "Assembled a 12-person cross-functional team. Built on Kubernetes with WebSocket infrastructure, CDN-optimized video delivery, and a React Native mobile app.",
      results: [
        { metric: "Delivered In", value: "5.5 Months" },
        { metric: "Concurrent Users", value: "150K+" },
        { metric: "Uptime", value: "99.99%" },
        { metric: "App Store Rating", value: "4.8 ★" },
      ],
    },
    faqs: [
      { question: "What technologies do you specialize in?", answer: "Our core stack includes React/Next.js, React Native, Node.js, Python, Go, AWS/GCP/Azure, Kubernetes, and PostgreSQL. We choose the right tool for each project based on requirements, not preference." },
      { question: "How do you handle project management?", answer: "We use agile methodology with 2-week sprints. You get a dedicated project manager, access to our project board, daily standups (optional), and bi-weekly demos of working software." },
      { question: "Can you work with our existing development team?", answer: "Absolutely. We offer team augmentation, technical leadership, and full project delivery models. Many clients start with augmentation and transition to a hybrid model." },
      { question: "What about security and compliance?", answer: "Security is built into our SDLC. We follow OWASP guidelines, conduct regular penetration testing, and can build to SOC 2, HIPAA, PCI-DSS, and FedRAMP requirements." },
      { question: "Do you provide ongoing support after launch?", answer: "Yes. We offer SLA-backed support tiers from business-hours to 24/7 with guaranteed response times. Our SRE team monitors your infrastructure and handles incidents proactively." },
    ],
    pricingTiers: [
      { name: "Startup", price: "$15,000", period: "month", description: "For startups building their first product with a dedicated team.", features: ["3-person dev team", "Full-stack development", "UI/UX design included", "Weekly demos", "Cloud hosting setup", "CI/CD pipeline", "3 months post-launch support"], cta: "Start Building" },
      { name: "Scale", price: "$45,000", period: "month", description: "For growing companies that need to ship faster and scale reliably.", features: ["6-8 person team", "Architecture & tech leadership", "Mobile + web development", "DevOps & SRE included", "Performance optimization", "Security audits", "Dedicated PM", "24/7 on-call support"], highlighted: true, cta: "Talk to Us" },
      { name: "Enterprise", price: "Custom", period: "engagement", description: "For large organizations with complex, mission-critical systems.", features: ["10+ person dedicated team", "Solution architecture", "Legacy modernization", "Multi-cloud strategy", "Compliance engineering", "Staff augmentation", "CTO advisory", "Custom SLA & SRE", "IP transfer & documentation"], cta: "Request Proposal" },
    ],
    trustBadges: ["AWS Advanced Partner", "Google Cloud Partner", "ISO 27001", "SOC 2 Type II", "Clutch Top Developer"],
    newsletterHeadline: "The Tech Pulse",
    newsletterSubtext: "Weekly deep dives on cloud architecture, AI/ML trends, and engineering best practices from our CTO and senior engineers.",
  },
  ecommerce: {
    id: "ecommerce",
    name: "TrendHub Store",
    companyName: "TrendHub Store",
    logoUrl: "",
    tagline: "Shop the Future. Delivered Today.",
    industry: "E-Commerce & Retail",
    description: "A full-featured modern e-commerce platform with AI-powered product recommendations, seamless checkout, inventory management, and real-time analytics — built for brands that want to scale fast.",
    icon: "🛍️",
    accentColor: "#EC4899",
    bgColor: "#1a0a14",
    services: [
      { title: "AI Product Recommendations", description: "Machine learning engine that personalizes product discovery for every shopper based on behavior, preferences, and purchase history.", icon: "🤖", features: ["Behavioral analysis", "Real-time personalization", "Cross-sell & upsell engine", "A/B testing built-in"] },
      { title: "Seamless Checkout", description: "One-click checkout with support for 40+ payment methods including Stripe, PayPal, Apple Pay, Google Pay, and buy-now-pay-later options.", icon: "💳", features: ["One-click checkout", "40+ payment gateways", "BNPL integration", "Fraud detection"] },
      { title: "Inventory & Fulfillment", description: "Real-time inventory tracking across multiple warehouses with automated reorder points, supplier integrations, and 3PL connectivity.", icon: "📦", features: ["Multi-warehouse support", "Auto-reorder rules", "3PL integrations", "Barcode scanning"] },
      { title: "Analytics Dashboard", description: "Comprehensive sales analytics with revenue forecasting, customer lifetime value, cohort analysis, and marketing attribution.", icon: "📊", features: ["Revenue forecasting", "CLV analysis", "Marketing attribution", "Custom reports"] },
    ],
    aboutText: "TrendHub Store is a next-generation e-commerce platform built for modern brands. We combine powerful technology with beautiful design to help retailers sell more, ship faster, and delight customers at every touchpoint.",
    aboutPoints: [
      "AI-powered personalization increases average order value by 35%",
      "Sub-2-second page loads with global CDN and edge caching",
      "PCI-DSS Level 1 compliant payment processing",
      "Integrates with 200+ apps including Shopify, WooCommerce, and Magento",
      "24/7 support with dedicated e-commerce success managers",
    ],
    stats: [
      { value: "$2.4M", label: "GMV Processed Monthly" },
      { value: "98.7%", label: "Uptime SLA" },
      { value: "1.8s", label: "Avg Page Load" },
      { value: "35%", label: "AOV Lift via AI" },
    ],
    testimonials: [
      { name: "Priya Sharma", title: "Founder & CEO", company: "Luxe Threads", quote: "TrendHub transformed our online store. Sales are up 140% in six months and our cart abandonment dropped from 72% to 28%. The AI recommendations are genuinely impressive.", rating: 5 },
      { name: "Marcus Webb", title: "Head of Digital", company: "GearUp Sports", quote: "We migrated from WooCommerce and the difference is night and day. Checkout is lightning fast, inventory syncs perfectly, and the analytics finally give us the data we need.", rating: 5 },
      { name: "Aisha Patel", title: "E-Commerce Director", company: "Botanica Beauty", quote: "The onboarding team had us live in 72 hours. The platform handles our flash sales without breaking a sweat — 50,000 concurrent shoppers and zero downtime.", rating: 5 },
    ],
    team: [
      { name: "Jordan Lee", title: "CEO & Co-Founder", initials: "JL" },
      { name: "Chloe Martinez", title: "CTO", initials: "CM" },
      { name: "Ryan Okafor", title: "Head of Product", initials: "RO" },
      { name: "Nina Tanaka", title: "VP of Merchant Success", initials: "NT" },
    ],
    contactInfo: {
      phone: "+1 (800) 555-8742",
      email: "hello@trendhub.demo",
      address: "350 5th Avenue, Suite 4200, New York, NY 10118",
    },
    processSteps: [
      { step: 1, title: "Store Setup", description: "We configure your storefront, import your product catalog, and set up payment gateways in as little as 48 hours.", icon: "🏪" },
      { step: 2, title: "Design & Brand", description: "Our designers customize your theme to match your brand identity — colors, fonts, layout, and custom components.", icon: "🎨" },
      { step: 3, title: "Integrations", description: "We connect your existing tools — ERP, CRM, marketing platforms, shipping carriers, and accounting software.", icon: "🔗" },
      { step: 4, title: "Launch & Scale", description: "Go live with confidence. Our team monitors your launch, optimizes performance, and helps you scale to your first million.", icon: "🚀" },
    ],
    caseStudy: {
      client: "Luxe Threads",
      industry: "Fashion & Apparel",
      challenge: "Luxe Threads was losing 70%+ of shoppers at checkout due to a slow, clunky legacy platform. Mobile conversion was under 1% and they had no visibility into customer behavior.",
      solution: "Migrated to TrendHub with a custom mobile-first theme, one-click checkout, and AI recommendation engine. Integrated with their existing ERP and email marketing platform.",
      results: [
        { metric: "Conversion Rate", value: "+340%" },
        { metric: "Mobile Revenue", value: "+280%" },
        { metric: "Cart Abandonment", value: "-44 pts" },
        { metric: "AOV Increase", value: "+35%" },
      ],
    },
    faqs: [
      { question: "Can I migrate from Shopify or WooCommerce?", answer: "Yes. We provide fully managed migrations from all major platforms including Shopify, WooCommerce, Magento, BigCommerce, and custom-built stores. Your products, customers, and order history come with you." },
      { question: "What payment methods do you support?", answer: "We support 40+ payment gateways including Stripe, PayPal, Square, Braintree, Apple Pay, Google Pay, Klarna, Afterpay, and regional processors for 50+ countries." },
      { question: "How does the AI recommendation engine work?", answer: "Our ML engine analyzes browsing behavior, purchase history, and product attributes in real time to surface the most relevant products for each shopper. It typically increases AOV by 25-40% within 30 days." },
      { question: "Is the platform PCI-DSS compliant?", answer: "Yes. TrendHub is PCI-DSS Level 1 certified — the highest level of compliance. All payment data is tokenized and never stored on our servers." },
      { question: "What kind of support do you provide?", answer: "All plans include 24/7 technical support via chat and email. Growth and Enterprise plans include a dedicated merchant success manager and priority phone support." },
    ],
    pricingTiers: [
      { name: "Starter", price: "$299", period: "month", description: "For new brands launching their first online store.", features: ["Up to 500 products", "2 staff accounts", "Unlimited bandwidth", "AI recommendations (basic)", "Stripe & PayPal", "Email support", "99.9% uptime SLA"], cta: "Start Free Trial" },
      { name: "Growth", price: "$799", period: "month", description: "For scaling brands ready to accelerate revenue.", features: ["Unlimited products", "10 staff accounts", "Advanced AI recommendations", "Abandoned cart recovery", "40+ payment gateways", "Multi-currency", "Priority support", "Analytics dashboard", "99.99% uptime SLA"], highlighted: true, cta: "Get Started" },
      { name: "Enterprise", price: "Custom", period: "year", description: "For high-volume retailers and enterprise brands.", features: ["Everything in Growth", "Dedicated infrastructure", "Custom AI models", "White-label option", "ERP/WMS integration", "Dedicated success manager", "24/7 phone support", "Custom SLA", "Headless commerce API"], cta: "Contact Sales" },
    ],
    trustBadges: ["PCI-DSS Level 1", "SOC 2 Type II", "Shopify Plus Partner", "Stripe Verified Partner", "Google Shopping Partner"],
    newsletterHeadline: "The Commerce Brief",
    newsletterSubtext: "Weekly insights on e-commerce trends, conversion optimization, and retail technology — curated for brand builders.",
  },
};
