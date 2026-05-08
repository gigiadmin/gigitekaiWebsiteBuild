/**
 * PortfolioVCDemo.tsx — Venture Capital demo site
 * Showcases VenturePeak capabilities
 */

import { DemoSiteTemplate } from '@/components/DemoSiteTemplate';

const VC_SERVICES = [
  {
    title: 'Early-Stage Funding',
    description: 'Seed and Series A funding for innovative startups with mentorship and network access.',
    icon: '🚀',
  },
  {
    title: 'Portfolio Management',
    description: 'Strategic oversight, performance tracking, and growth acceleration for portfolio companies.',
    icon: '📈',
  },
  {
    title: 'Startup Mentorship',
    description: 'Expert guidance from industry veterans on strategy, operations, and scaling.',
    icon: '🎯',
  },
];

const VC_FEATURES = [
  'Industry Expertise',
  'Network Access',
  'Growth Acceleration',
  'Performance Analytics',
  'Exit Strategy Planning',
  'Founder Support',
];

export default function PortfolioVCDemo() {
  return (
    <DemoSiteTemplate
      name="VenturePeak"
      tagline="Venture Capital & Startup Funding"
      description="Fuel innovation and growth. We provide early-stage funding, strategic mentorship, and access to our network of industry leaders. Our data-driven approach helps founders scale faster and achieve sustainable growth."
      icon="📈"
      color="#EC4899"
      features={VC_FEATURES}
      services={VC_SERVICES}
    />
  );
}
