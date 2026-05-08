/**
 * PortfolioConsultingDemo.tsx — Management Consulting demo site
 * Showcases Consulting Plus capabilities
 */

import { DemoSiteTemplate } from '@/components/DemoSiteTemplate';

const CONSULTING_SERVICES = [
  {
    title: 'Strategy Consulting',
    description: 'Business strategy, market analysis, and competitive positioning for sustainable growth.',
    icon: '🎯',
  },
  {
    title: 'Operations Optimization',
    description: 'Process improvement, cost reduction, and operational efficiency through data-driven insights.',
    icon: '⚙️',
  },
  {
    title: 'Digital Transformation',
    description: 'Technology adoption, change management, and organizational restructuring for the digital era.',
    icon: '🔄',
  },
];

const CONSULTING_FEATURES = [
  'Industry Expertise',
  'Data-Driven Insights',
  'Change Management',
  'Executive Coaching',
  'Implementation Support',
  'ROI Tracking',
];

export default function PortfolioConsultingDemo() {
  return (
    <DemoSiteTemplate
      name="Consulting Plus"
      tagline="Management & Digital Transformation"
      description="Transform your business with strategic consulting from industry experts. We combine deep domain knowledge with cutting-edge technology to help organizations navigate change, optimize operations, and achieve sustainable competitive advantage."
      icon="🎯"
      color="#8B5CF6"
      features={CONSULTING_FEATURES}
      services={CONSULTING_SERVICES}
    />
  );
}
