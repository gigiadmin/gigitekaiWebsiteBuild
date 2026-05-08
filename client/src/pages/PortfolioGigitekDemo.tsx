/**
 * PortfolioGigitekDemo.tsx — GigitekAI real client showcase
 * Showcases our own capabilities and services
 */

import { DemoSiteTemplate } from '@/components/DemoSiteTemplate';

const GIGITEK_SERVICES = [
  {
    title: 'Cloud Infrastructure',
    description: 'Enterprise-grade AWS, Azure, and Google Cloud deployment with 99.9% uptime SLA.',
    icon: '☁️',
  },
  {
    title: 'AI Automation',
    description: 'Intelligent agents, process automation, and AI-powered workflows tailored to your business.',
    icon: '🤖',
  },
  {
    title: 'Helpdesk & Support',
    description: 'Tier 1-3 support, ticket management, and AI-powered customer service solutions.',
    icon: '🎧',
  },
];

const GIGITEK_FEATURES = [
  '99.9% Uptime SLA',
  'Multi-Cloud Support',
  'AI Agent Automation',
  'Zero Trust Security',
  'HIPAA & SOC 2 Ready',
  '24/7 Support',
];

export default function PortfolioGigitekDemo() {
  return (
    <DemoSiteTemplate
      name="GigitekAI"
      tagline="Cloud & AI Solutions for Enterprise"
      description="Transform your business with enterprise-grade cloud infrastructure and intelligent AI automation. GigitekAI delivers measurable ROI through 40% operational cost reduction, 10x faster AI deployment, and 280+ hours freed monthly for typical organizations."
      icon="🚀"
      color="#00D4FF"
      features={GIGITEK_FEATURES}
      services={GIGITEK_SERVICES}
    />
  );
}
