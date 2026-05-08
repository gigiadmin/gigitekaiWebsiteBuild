/**
 * PortfolioTechDemo.tsx — Technology Startup demo site
 * Showcases TechVision capabilities
 */

import { DemoSiteTemplate } from '@/components/DemoSiteTemplate';

const TECH_SERVICES = [
  {
    title: 'SaaS Platform',
    description: 'Cloud-native software solutions with API-first architecture, real-time collaboration, and enterprise scalability.',
    icon: '☁️',
  },
  {
    title: 'Cloud Infrastructure',
    description: 'Multi-cloud deployment, auto-scaling, disaster recovery, and 99.99% uptime guarantees.',
    icon: '🔧',
  },
  {
    title: 'Custom Development',
    description: 'Full-stack development, AI integration, mobile apps, and enterprise software solutions.',
    icon: '💻',
  },
];

const TECH_FEATURES = [
  'API-First Architecture',
  'Real-Time Collaboration',
  'Enterprise Security',
  'Auto-Scaling',
  'Multi-Cloud Support',
  'AI-Powered Features',
];

export default function PortfolioTechDemo() {
  return (
    <DemoSiteTemplate
      name="TechVision"
      tagline="SaaS & Cloud Infrastructure"
      description="Build the future with cutting-edge technology. Our cloud-native platform provides the infrastructure, tools, and expertise you need to develop, deploy, and scale innovative software solutions that drive business growth."
      icon="💻"
      color="#3B82F6"
      features={TECH_FEATURES}
      services={TECH_SERVICES}
    />
  );
}
