export const briefingData = {
  metadata: {
    edition: "April 2026",
    title: "AI Strategic Briefing",
    publishDate: "2026-04-21",
    summary:
      "Q1 2026 shattered every record in AI investment and consolidation. Global startup funding hit $297 billion, with AI startups absorbing 81% of all venture capital deployed worldwide. The industry is transitioning from adoption to acceleration — where execution, scale, and control define the next phase.",
    totalFunding: 441,
    majorDeals: 10,
    startupsTracked: 5,
    modelReleases: 4,
  },

  companies: [
    {
      id: 1,
      name: "SpaceX / xAI",
      type: "acquisition" as const,
      amount: 250,
      amountDisplay: "$250B",
      category: "AI + Space",
      focus: "AI + space integration",
      description:
        "Elon Musk's xAI acquired by SpaceX in a landmark deal that combines space technology with frontier AI capabilities.",
      mspImpact:
        "Signals the convergence of AI and infrastructure. MSPs should monitor how AI-powered infrastructure management becomes a competitive advantage in the cloud services market.",
      logoUrl: "https://via.placeholder.com/48?text=SpaceX",
      website: "https://spacex.com",
      fundingDate: "2026-04-15",
      sortOrder: 1,
    },
    {
      id: 2,
      name: "OpenAI",
      type: "funding" as const,
      amount: 122,
      amountDisplay: "$122B",
      category: "AI Infrastructure",
      focus: "Frontier AI models & infrastructure",
      description:
        "OpenAI raised $122B in Series C funding, valuing the company at $1.2 trillion and making it one of the most valuable AI companies globally.",
      mspImpact:
        "OpenAI's valuation reflects the market's confidence in large language models. MSPs should accelerate GPT-4 integration into customer workflows and prepare for enterprise AI adoption.",
      logoUrl: "https://via.placeholder.com/48?text=OpenAI",
      website: "https://openai.com",
      fundingDate: "2026-04-10",
      sortOrder: 2,
    },
    {
      id: 3,
      name: "Anthropic",
      type: "funding" as const,
      amount: 30,
      amountDisplay: "$30B",
      category: "AI Safety",
      focus: "Safe AI development",
      description:
        "Anthropic raised $30B in Series D funding, bringing total funding to $100B. The company is positioning itself as the 'safe AI' alternative to OpenAI.",
      mspImpact:
        "Anthropic's focus on AI safety and interpretability appeals to enterprise customers concerned about AI risks. MSPs can differentiate by offering Anthropic-based solutions for risk-averse clients.",
      logoUrl: "https://via.placeholder.com/48?text=Anthropic",
      website: "https://anthropic.com",
      fundingDate: "2026-04-08",
      sortOrder: 3,
    },
    {
      id: 4,
      name: "xAI",
      type: "funding" as const,
      amount: 20,
      amountDisplay: "$20B",
      category: "AI Research",
      focus: "AI research & Grok models",
      description:
        "xAI raised $20B in Series B funding before being acquired by SpaceX. The company developed Grok, a multimodal AI model designed for real-time reasoning.",
      mspImpact:
        "Grok's real-time reasoning capabilities make it attractive for time-sensitive applications like SOC automation and incident response. MSPs should evaluate Grok for security operations.",
      logoUrl: "https://via.placeholder.com/48?text=xAI",
      website: "https://x.ai",
      fundingDate: "2026-03-20",
      sortOrder: 4,
    },
    {
      id: 5,
      name: "Waymo",
      type: "funding" as const,
      amount: 16,
      amountDisplay: "$16B",
      category: "Autonomous Vehicles",
      focus: "Autonomous vehicles",
      description:
        "Waymo raised $16B in Series D funding to accelerate autonomous vehicle deployment and expand to new markets.",
      mspImpact:
        "While not directly relevant to MSPs, Waymo's success demonstrates AI's readiness for real-world deployment. MSPs should use this as a case study when pitching AI automation to conservative clients.",
      logoUrl: "https://via.placeholder.com/48?text=Waymo",
      website: "https://waymo.com",
      fundingDate: "2026-03-15",
      sortOrder: 5,
    },
    {
      id: 6,
      name: "LMArena",
      type: "funding" as const,
      amount: 1.7,
      amountDisplay: "$1.7B",
      category: "AI Evaluation",
      focus: "AI model evaluation & benchmarking",
      description:
        "LMArena raised $1.7B to build the infrastructure for evaluating and benchmarking large language models at scale.",
      mspImpact:
        "LMArena's benchmarking tools help MSPs evaluate which AI models are best suited for specific customer use cases. Integration with LMArena can improve model selection accuracy.",
      logoUrl: "https://via.placeholder.com/48?text=LMArena",
      website: "https://lmarena.ai",
      fundingDate: "2026-03-10",
      sortOrder: 6,
    },
    {
      id: 7,
      name: "Cursor",
      type: "funding" as const,
      amount: 0.9,
      amountDisplay: "$900M",
      category: "AI Development Tools",
      focus: "AI-powered code editor",
      description:
        "Cursor raised $900M in Series B funding to scale its AI-powered code editor, which uses GPT-4 for intelligent code generation and refactoring.",
      mspImpact:
        "Cursor demonstrates the market demand for AI-powered developer tools. MSPs can offer Cursor as a managed service to development-focused clients, creating new revenue streams.",
      logoUrl: "https://via.placeholder.com/48?text=Cursor",
      website: "https://cursor.sh",
      fundingDate: "2026-02-28",
      sortOrder: 7,
    },
    {
      id: 8,
      name: "Sierra AI",
      type: "funding" as const,
      amount: 0.5,
      amountDisplay: "$500M",
      category: "Enterprise AI",
      focus: "Conversational AI agents for enterprises",
      description:
        "Sierra AI raised $500M in Series B funding to build enterprise-grade conversational AI agents for customer service and support.",
      mspImpact:
        "Sierra AI's focus on enterprise customer service aligns perfectly with MSP helpdesk automation. MSPs can integrate Sierra AI to replace Tier 1 support workflows.",
      logoUrl: "https://via.placeholder.com/48?text=Sierra",
      website: "https://sierra.ai",
      fundingDate: "2026-02-15",
      sortOrder: 8,
    },
    {
      id: 9,
      name: "Noma Security",
      type: "funding" as const,
      amount: 0.132,
      amountDisplay: "$132M",
      category: "AI Security",
      focus: "AI & agent security platform",
      description:
        "Noma Security raised $132M in Series A funding to build security solutions for AI systems and autonomous agents.",
      mspImpact:
        "As MSPs deploy more AI agents, Noma Security becomes essential for securing those agents. MSPs can offer Noma as a managed security service for AI workloads.",
      logoUrl: "https://via.placeholder.com/48?text=Noma",
      website: "https://nomasecurity.com",
      fundingDate: "2026-02-01",
      sortOrder: 9,
    },
    {
      id: 10,
      name: "Microsoft / Cove AI",
      type: "acquisition" as const,
      amount: null,
      amountDisplay: "Undisclosed",
      category: "AI Collaboration",
      focus: "AI collaboration for teams",
      description:
        "Microsoft acquired Cove AI, a startup building AI-powered collaboration tools for Teams. The acquisition strengthens Microsoft's Copilot ecosystem.",
      mspImpact:
        "This acquisition signals Microsoft's commitment to embedding AI across the Microsoft 365 suite. MSPs should prepare for deeper AI integration in Teams, Outlook, and other M365 services.",
      logoUrl: "https://via.placeholder.com/48?text=Microsoft",
      website: "https://microsoft.com",
      fundingDate: "2026-04-01",
      sortOrder: 10,
    },
  ],

  models: [
    {
      id: 1,
      title: "Apple Intelligence (Gemini)",
      category: "Consumer AI",
      provider: "Apple / Google",
      releaseDate: "2026-04-01",
      description:
        "Apple has reportedly replaced Siri with Google Gemini integration across iPhones, representing a seismic shift in the consumer AI landscape. This partnership brings Google's most advanced AI capabilities to Apple's massive user base.",
      keyFeatures: [
        "Gemini-powered Siri replacement",
        "Deep iOS integration",
        "Access to Google's frontier AI models on Apple devices",
      ],
      mspImpact:
        "This partnership fundamentally changes the consumer AI landscape. MSPs managing Apple devices in enterprise environments should prepare for new AI-powered capabilities and potential security considerations.",
      logoUrl: "https://via.placeholder.com/48?text=Apple",
      website: "https://apple.com",
      sortOrder: 1,
    },
    {
      id: 2,
      title: "Gemini 3.1 Pro",
      category: "Multimodal AI",
      provider: "Google DeepMind",
      releaseDate: "2026-02-15",
      description:
        "Google's Gemini 3.1 Pro represents a significant leap in agentic coding and tool use capabilities. The model shows improved reasoning on complex problem-solving benchmarks and is designed for tasks requiring deep understanding and multi-step execution.",
      keyFeatures: [
        "Exceptional instruction following",
        "Improved agentic coding capabilities",
        "Enhanced tool use for complex workflows",
        "Natively multimodal reasoning",
      ],
      mspImpact:
        "Gemini 3.1 Pro's agentic capabilities make it a strong candidate for automating complex IT workflows. The Apple-Gemini partnership means this model will reach billions of iPhone users, reshaping consumer AI expectations.",
      logoUrl: "https://via.placeholder.com/48?text=Google",
      website: "https://google.com",
      sortOrder: 2,
    },
    {
      id: 3,
      title: "MAI-Transcribe-1",
      category: "Transcription & Voice",
      provider: "Microsoft",
      releaseDate: "2026-04-01",
      description:
        "Microsoft launched MAI-Transcribe-1 as part of three new in-house foundational AI models, marking a significant push toward AI self-sufficiency. This transcription model converts voice to text with high accuracy and efficiency, positioned as a cost-effective alternative to competing solutions.",
      keyFeatures: [
        "High-accuracy voice-to-text transcription",
        "Lower cost than competing models",
        "Built entirely in-house by Microsoft AI (MAI) group",
      ],
      mspImpact:
        "Signals Microsoft's move to reduce dependency on OpenAI for core AI capabilities. MSPs selling Microsoft 365 should monitor how these models integrate into the Copilot ecosystem.",
      logoUrl: "https://via.placeholder.com/48?text=Microsoft",
      website: "https://microsoft.com",
      sortOrder: 3,
    },
    {
      id: 4,
      title: "MAI-Voice-1",
      category: "Voice Generation",
      provider: "Microsoft",
      releaseDate: "2026-04-01",
      description:
        "MAI-Voice-1 is Microsoft's in-house voice generation model, capable of producing natural-sounding audio from text. Part of the MAI model trio, it demonstrates Microsoft's commitment to building a complete AI stack internally.",
      keyFeatures: [
        "Natural voice generation from text",
        "Cost-optimized for enterprise deployment",
        "Part of Microsoft's in-house AI model family",
      ],
      mspImpact:
        "Voice AI capabilities will likely be integrated into Teams, Copilot, and other M365 services. MSPs should prepare for voice-enabled AI workflows in client environments.",
      logoUrl: "https://via.placeholder.com/48?text=Microsoft",
      website: "https://microsoft.com",
      sortOrder: 4,
    },
  ],

  startups: [
    {
      id: 1,
      name: "Aembit",
      category: "Identity & Access Management",
      focus: "IAM for Agentic AI and Workloads",
      description:
        "Aembit specializes in Identity and Access Management (IAM) for Agentic AI and Workloads. Their platform provides controls over what AI agents can access, whether autonomous or user-driven, including conditions and accountability.",
      features: [
        "Blended Identity (linking agent identity to human identity)",
        "MCP Identity Gateway for controlling agent connections",
        "Granular access controls for AI agents",
      ],
      mspRelevance:
        "As MSP clients deploy AI agents that interact with sensitive systems, Aembit's IAM for agents becomes essential. MSPs can integrate Aembit to govern agent access across client environments — a natural extension of existing identity management services.",
      funding: "Series A",
      fundingDate: "2026-03-01",
      website: "https://aembit.io",
      logoUrl: "https://via.placeholder.com/48?text=Aembit",
      tags: ["IAM", "MCP", "agentic", "identity"],
      sortOrder: 1,
    },
    {
      id: 2,
      name: "Aurascape",
      category: "AI Security",
      focus: "Zero-Bypass MCP Gateway",
      description:
        "Aurascape launched a Zero-Bypass MCP Gateway that works with their AI Proxy to enable governance for trusted tools, identify high-risk activity related to MCP, and reduce bypass risk during agent interactions.",
      features: [
        "Zero-bypass MCP gateway",
        "AI proxy for governance",
        "High-risk activity detection",
        "Bypass risk reduction",
      ],
      mspRelevance:
        "Aurascape addresses a critical blind spot for MSPs: securing the Model Context Protocol layer. As agentic AI proliferates, MSPs can deploy Aurascape's gateway to ensure client AI agents operate within governed boundaries — a differentiated security offering.",
      funding: "Series A",
      fundingDate: "2026-02-15",
      website: "https://aurascape.ai",
      logoUrl: "https://via.placeholder.com/48?text=Aurascape",
      tags: ["MCP", "security", "governance", "proxy"],
      sortOrder: 2,
    },
    {
      id: 3,
      name: "Command Zero",
      category: "Security Operations",
      focus: "Agentic-driven SOC platform",
      description:
        "Command Zero offers an agentic-driven platform serving as the operating system for the Security Operations Center (SOC). It provides automation for alert triage, investigations, and prioritization.",
      features: [
        "Automated alert triage",
        "Investigation automation",
        "Prioritization engine",
        "Analyst workload reduction",
      ],
      mspRelevance:
        "Command Zero directly replaces Tier 1-2 SOC manual labor — perfectly aligned with MSP efficiency goals. By deploying Command Zero, MSPs can handle more client alerts without adding headcount, dramatically improving margins on managed security services.",
      funding: "Series A",
      fundingDate: "2026-03-10",
      website: "https://commandzero.io",
      logoUrl: "https://via.placeholder.com/48?text=Command",
      tags: ["SOC", "automation", "alert-triage", "agentic"],
      sortOrder: 3,
    },
    {
      id: 4,
      name: "Dropzone AI",
      category: "Security Operations",
      focus: "AI-powered SOC Analyst",
      description:
        "Dropzone AI provides a fully AI-powered, software-only approach to SOC alert handling. Their AI SOC Analyst platform addresses alert overload without requiring human analysts, offering improved consistency, scalability, and transparency.",
      features: [
        "AI SOC analyst",
        "Alert handling automation",
        "Software-only deployment",
        "MSSP-focused go-to-market",
      ],
      mspRelevance:
        "Dropzone AI's MSSP-focused go-to-market and software-only approach make it a natural fit for MSPs looking to scale security operations. The platform can serve as a force multiplier — allowing MSPs to deliver enterprise-grade SOC services to SMB clients at a fraction of traditional cost.",
      funding: "Series A",
      fundingDate: "2026-02-20",
      website: "https://dropzoneai.com",
      logoUrl: "https://via.placeholder.com/48?text=Dropzone",
      tags: ["SOC", "MSSP", "automation", "AI-analyst"],
      sortOrder: 4,
    },
    {
      id: 5,
      name: "Noma Security",
      category: "AI Security",
      focus: "Comprehensive AI & agent security",
      description:
        "Noma Security provides a comprehensive security platform for AI and agents. The startup has raised $132 million and built a full-fledged research team to address the unique security challenges posed by agentic AI systems.",
      features: [
        "AI model security",
        "Agent security",
        "Research-backed approach",
        "Channel-first strategy",
      ],
      mspRelevance:
        "Noma's channel-first strategy makes them an ideal partner for MSPs. As clients adopt AI agents, MSPs can offer Noma's AI security as a managed service — creating a new recurring revenue stream while addressing a critical gap in the market.",
      funding: "$132M Series A",
      fundingDate: "2026-03-05",
      website: "https://nomasecurity.com",
      logoUrl: "https://via.placeholder.com/48?text=Noma",
      tags: ["security", "agentic", "channel-first"],
      sortOrder: 5,
    },
  ],

  implications: [
    {
      id: 1,
      title: "AI Agent Deployment",
      priority: "high" as const,
      category: "Automation",
      description:
        "The rapid advancement and adoption of AI agents is reshaping how businesses operate. From customer service to security operations, AI agents are becoming production-ready and cost-effective.",
      whyItMatters:
        "AI agents are becoming the new standard for automating repetitive tasks. MSPs that don't offer AI agent deployment will lose market share to competitors who do.",
      actionItems: [
        "Audit current manual workflows for agent automation opportunities",
        "Evaluate agent security and governance requirements",
        "Build internal AI agent proof-of-concepts",
        "Develop pricing model for AI agent managed services",
      ],
      icon: "⚡",
      sortOrder: 1,
    },
    {
      id: 2,
      title: "Microsoft's AI Self-Sufficiency",
      priority: "high" as const,
      category: "Vendor Strategy",
      description:
        "Microsoft's launch of MAI (Microsoft AI) models signals a strategic shift toward reducing dependency on OpenAI. This has implications for how AI is integrated into Microsoft 365.",
      whyItMatters:
        "MSPs need to understand Microsoft's AI roadmap to properly advise clients on Copilot adoption and integration. Microsoft's in-house models may offer better pricing and integration than OpenAI alternatives.",
      actionItems: [
        "Monitor Microsoft's AI model releases and integration roadmap",
        "Evaluate MAI models for customer use cases",
        "Prepare clients for deeper Copilot integration in M365",
        "Build expertise in Microsoft's AI stack",
      ],
      icon: "🔧",
      sortOrder: 2,
    },
    {
      id: 3,
      title: "AI Security & Governance",
      priority: "high" as const,
      category: "Security",
      description:
        "As AI agents proliferate, security and governance become critical. New startups like Aembit, Aurascape, and Noma are addressing the unique security challenges of agentic AI.",
      whyItMatters:
        "Enterprises are concerned about AI security and governance. MSPs that can offer comprehensive AI security solutions will differentiate themselves and command premium pricing.",
      actionItems: [
        "Evaluate AI security platforms (Aembit, Aurascape, Noma)",
        "Develop AI security assessment process",
        "Build managed AI security service offering",
        "Train team on AI-specific security threats",
      ],
      icon: "🔐",
      sortOrder: 3,
    },
    {
      id: 4,
      title: "SOC Automation & Scaling",
      priority: "medium" as const,
      category: "Security Operations",
      description:
        "AI-powered SOC platforms like Command Zero and Dropzone AI are enabling MSPs to scale security operations without proportional headcount growth.",
      whyItMatters:
        "Security services are a high-margin offering for MSPs. AI-powered SOC automation can dramatically improve margins by reducing manual labor while maintaining service quality.",
      actionItems: [
        "Evaluate SOC automation platforms (Command Zero, Dropzone)",
        "Calculate ROI of AI-powered SOC vs. traditional SOC",
        "Pilot AI SOC platform with existing security clients",
        "Develop AI SOC managed service offering",
      ],
      icon: "🛡️",
      sortOrder: 4,
    },
    {
      id: 5,
      title: "Consumer AI Adoption",
      priority: "medium" as const,
      category: "Market Trends",
      description:
        "Apple's integration of Google Gemini signals that consumer AI is becoming mainstream. This will drive enterprise adoption as employees expect AI capabilities in their work tools.",
      whyItMatters:
        "Enterprise clients will demand AI capabilities in their business tools. MSPs need to be prepared to support and integrate AI across the employee experience.",
      actionItems: [
        "Prepare for increased employee AI tool adoption",
        "Develop AI governance policies for clients",
        "Build support processes for AI-powered applications",
        "Educate clients on AI security and compliance",
      ],
      icon: "📱",
      sortOrder: 5,
    },
    {
      id: 6,
      title: "Developer Tool Evolution",
      priority: "medium" as const,
      category: "Development",
      description:
        "AI-powered developer tools like Cursor are becoming mainstream, changing how software is built. This has implications for MSPs offering development services.",
      whyItMatters:
        "Development-focused clients will adopt AI coding tools. MSPs can offer managed AI development services or integrate AI tools into their development workflows.",
      actionItems: [
        "Evaluate AI-powered developer tools (Cursor, GitHub Copilot)",
        "Develop AI-assisted development service offering",
        "Train development team on AI coding tools",
        "Build pricing model for AI-assisted development",
      ],
      icon: "💻",
      sortOrder: 6,
    },
  ],

  vendorStack: [
    {
      name: "Sierra AI",
      category: "Customer Service Automation",
      description: "Replace Tier 1 helpdesk with AI agents",
      url: "https://sierra.ai",
    },
    {
      name: "Command Zero",
      category: "SOC Automation",
      description: "Automate alert triage and investigation",
      url: "https://commandzero.io",
    },
    {
      name: "Aembit",
      category: "Agent IAM",
      description: "Govern AI agent access and identity",
      url: "https://aembit.io",
    },
    {
      name: "Noma Security",
      category: "AI Security",
      description: "Secure AI models and agents",
      url: "https://nomasecurity.com",
    },
    {
      name: "Cursor",
      category: "Developer Tools",
      description: "AI-powered code editor for development teams",
      url: "https://cursor.sh",
    },
    {
      name: "OpenAI GPT-4",
      category: "Foundation Model",
      description: "Enterprise-grade language model for custom applications",
      url: "https://openai.com",
    },
  ],
};
