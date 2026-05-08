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
  },
};
