/**
 * Portfolio Demo Sites Configuration
 * Defines all 7 industry demo sites for the GigitekAI portfolio showcase
 */

export interface ServiceItem {
  title: string;
  description: string;
  icon: string;
}

export interface PortfolioSiteConfig {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  accentColor: string;
  bgColor: string;
  services: ServiceItem[];
  aboutText: string;
  stats: Array<{ value: string; label: string }>;
}

export const PORTFOLIO_DEMO_SITES: Record<string, PortfolioSiteConfig> = {
  finance: {
    id: "finance",
    name: "FinTech Solutions",
    tagline: "Digital Banking & Investment Management",
    description:
      "Transform your financial services with enterprise-grade cloud infrastructure, AI-powered analytics, and secure transaction processing. We help financial institutions innovate faster while maintaining compliance and security.",
    icon: "💰",
    accentColor: "#00D97E",
    bgColor: "#0A1A12",
    services: [
      {
        title: "Digital Banking",
        description:
          "Secure, scalable banking infrastructure with real-time transaction processing and compliance management.",
        icon: "🏦",
      },
      {
        title: "Investment Management",
        description:
          "Portfolio analysis, robo-advisory, and wealth management solutions powered by AI insights.",
        icon: "📊",
      },
      {
        title: "Financial Advisory",
        description:
          "Expert guidance on financial planning, risk management, and strategic investments.",
        icon: "💼",
      },
    ],
    aboutText:
      "FinTech Solutions is a leading provider of digital banking and investment management platforms. With over 15 years of experience, we help financial institutions modernize their operations and deliver exceptional customer experiences. Our platform processes over $10 billion in transactions annually with 99.99% uptime.",
    stats: [
      { value: "$10B+", label: "Transactions Processed" },
      { value: "500+", label: "Financial Institutions" },
      { value: "99.99%", label: "Uptime SLA" },
      { value: "15+", label: "Years Experience" },
    ],
  },

  legal: {
    id: "legal",
    name: "Legal Pro",
    tagline: "Corporate Law & Legal Consulting",
    description:
      "Navigate complex legal landscapes with confidence. Our cloud-based legal platform combines expert attorneys with AI-powered document analysis, compliance tracking, and secure case management to streamline your legal operations.",
    icon: "⚖️",
    accentColor: "#818CF8",
    bgColor: "#0D0A1A",
    services: [
      {
        title: "Corporate Law",
        description:
          "Contract drafting, M&A support, corporate governance, and regulatory compliance services.",
        icon: "📋",
      },
      {
        title: "Litigation Support",
        description:
          "Expert legal representation, case management, and dispute resolution with proven track record.",
        icon: "⚖️",
      },
      {
        title: "Legal Consulting",
        description:
          "Strategic legal advice, risk assessment, and compliance frameworks for enterprises.",
        icon: "🎯",
      },
    ],
    aboutText:
      "Legal Pro brings together top-tier attorneys and cutting-edge technology to deliver exceptional legal services. Our team has successfully handled complex cases for Fortune 500 companies and emerging startups alike. We combine decades of legal expertise with modern AI tools to deliver faster, more accurate results.",
    stats: [
      { value: "500+", label: "Cases Won" },
      { value: "200+", label: "Corporate Clients" },
      { value: "98%", label: "Client Satisfaction" },
      { value: "20+", label: "Years of Practice" },
    ],
  },

  insurance: {
    id: "insurance",
    name: "InsureFlow",
    tagline: "Health, Property & Liability Insurance",
    description:
      "Protect what matters most with modern insurance solutions. Our AI-powered platform streamlines underwriting, accelerates claims processing, and provides customers with transparent, flexible coverage options tailored to their needs.",
    icon: "🛡️",
    accentColor: "#FBBF24",
    bgColor: "#1A1200",
    services: [
      {
        title: "Health Insurance",
        description:
          "Comprehensive health coverage with preventive care, telemedicine, and wellness programs.",
        icon: "🏥",
      },
      {
        title: "Property & Casualty",
        description:
          "Home, auto, and business insurance with fast claims processing and risk assessment.",
        icon: "🏠",
      },
      {
        title: "Liability Coverage",
        description:
          "Professional liability, general liability, and specialized coverage for enterprises.",
        icon: "🛡️",
      },
    ],
    aboutText:
      "InsureFlow revolutionizes insurance with intelligent underwriting and rapid claims processing. We serve over 100,000 customers across North America with transparent pricing and exceptional service. Our AI-powered platform reduces claims processing time by 70% compared to industry average.",
    stats: [
      { value: "100K+", label: "Customers Served" },
      { value: "70%", label: "Faster Claims" },
      { value: "$500M+", label: "Claims Paid" },
      { value: "24/7", label: "Support Available" },
    ],
  },

  vc: {
    id: "vc",
    name: "VenturePeak",
    tagline: "Venture Capital & Startup Funding",
    description:
      "Fuel innovation and growth. We provide early-stage funding, strategic mentorship, and access to our network of industry leaders. Our data-driven approach helps founders scale faster and achieve sustainable growth.",
    icon: "📈",
    accentColor: "#F472B6",
    bgColor: "#1A0A14",
    services: [
      {
        title: "Early-Stage Funding",
        description:
          "Seed and Series A funding for innovative startups with mentorship and network access.",
        icon: "🚀",
      },
      {
        title: "Portfolio Management",
        description:
          "Strategic oversight, performance tracking, and growth acceleration for portfolio companies.",
        icon: "📈",
      },
      {
        title: "Startup Mentorship",
        description:
          "Expert guidance from industry veterans on strategy, operations, and scaling.",
        icon: "🎯",
      },
    ],
    aboutText:
      "VenturePeak is a premier venture capital firm focused on early-stage technology companies. We have successfully funded and mentored 50+ startups, with 15 exits and a combined valuation exceeding $2 billion. Our portfolio spans AI, fintech, healthtech, and enterprise software.",
    stats: [
      { value: "50+", label: "Portfolio Companies" },
      { value: "$2B+", label: "Combined Valuation" },
      { value: "15", label: "Successful Exits" },
      { value: "$500M", label: "Assets Under Management" },
    ],
  },

  health: {
    id: "health",
    name: "HealthFirst",
    tagline: "Telemedicine & Wellness Services",
    description:
      "Healthcare reimagined for the digital age. Our comprehensive platform connects patients with licensed physicians, provides personalized wellness programs, and maintains secure health records — all accessible from anywhere, anytime.",
    icon: "🏥",
    accentColor: "#F87171",
    bgColor: "#1A0A0A",
    services: [
      {
        title: "Telemedicine",
        description:
          "Virtual consultations with licensed physicians, prescription management, and follow-up care.",
        icon: "👨‍⚕️",
      },
      {
        title: "Wellness Programs",
        description:
          "Preventive care, fitness tracking, nutrition guidance, and mental health support.",
        icon: "💪",
      },
      {
        title: "Patient Management",
        description:
          "Integrated EHR, appointment scheduling, and secure patient communication platform.",
        icon: "📋",
      },
    ],
    aboutText:
      "HealthFirst brings quality healthcare to your fingertips. With a network of 500+ licensed physicians and 1M+ patients served, we are transforming how people access and manage their health. Our HIPAA-compliant platform ensures your data is always secure.",
    stats: [
      { value: "1M+", label: "Patients Served" },
      { value: "500+", label: "Licensed Physicians" },
      { value: "HIPAA", label: "Compliant" },
      { value: "4.9★", label: "Patient Rating" },
    ],
  },

  consulting: {
    id: "consulting",
    name: "Consulting Plus",
    tagline: "Management & Digital Transformation",
    description:
      "Transform your business with strategic consulting from industry experts. We combine deep domain knowledge with cutting-edge technology to help organizations navigate change, optimize operations, and achieve sustainable competitive advantage.",
    icon: "🎯",
    accentColor: "#A78BFA",
    bgColor: "#0E0A1A",
    services: [
      {
        title: "Strategy Consulting",
        description:
          "Business strategy, market analysis, and competitive positioning for sustainable growth.",
        icon: "🎯",
      },
      {
        title: "Operations Optimization",
        description:
          "Process improvement, cost reduction, and operational efficiency through data-driven insights.",
        icon: "⚙️",
      },
      {
        title: "Digital Transformation",
        description:
          "Technology adoption, change management, and organizational restructuring for the digital era.",
        icon: "🔄",
      },
    ],
    aboutText:
      "Consulting Plus has guided 200+ organizations through successful digital transformations. Our team of experienced consultants brings proven methodologies and industry best practices to drive measurable results. We have delivered an average of 35% cost reduction and 2x productivity improvement for our clients.",
    stats: [
      { value: "200+", label: "Transformations" },
      { value: "35%", label: "Avg Cost Reduction" },
      { value: "2x", label: "Productivity Gain" },
      { value: "95%", label: "Client Retention" },
    ],
  },

  tech: {
    id: "tech",
    name: "TechVision",
    tagline: "SaaS & Cloud Infrastructure",
    description:
      "Build the future with cutting-edge technology. Our cloud-native platform provides the infrastructure, tools, and expertise you need to develop, deploy, and scale innovative software solutions that drive business growth.",
    icon: "💻",
    accentColor: "#60A5FA",
    bgColor: "#0A0E1A",
    services: [
      {
        title: "SaaS Platform",
        description:
          "Cloud-native software solutions with API-first architecture, real-time collaboration, and enterprise scalability.",
        icon: "☁️",
      },
      {
        title: "Cloud Infrastructure",
        description:
          "Multi-cloud deployment, auto-scaling, disaster recovery, and 99.99% uptime guarantees.",
        icon: "🔧",
      },
      {
        title: "Custom Development",
        description:
          "Full-stack development, AI integration, mobile apps, and enterprise software solutions.",
        icon: "💻",
      },
    ],
    aboutText:
      "TechVision empowers companies to innovate faster with cloud-native technology. We have built and deployed 100+ applications serving millions of users across industries. Our team of 50+ engineers specializes in scalable, secure, and high-performance software solutions.",
    stats: [
      { value: "100+", label: "Apps Deployed" },
      { value: "10M+", label: "Users Served" },
      { value: "99.99%", label: "Uptime SLA" },
      { value: "50+", label: "Expert Engineers" },
    ],
  },
};
