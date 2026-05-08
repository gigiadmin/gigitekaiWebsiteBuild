/**
 * PortfolioFinanceDemo.tsx — Finance industry demo site
 * Showcases FinTech Solutions capabilities
 */

import { DemoSiteTemplate } from '@/components/DemoSiteTemplate';

const FINANCE_SERVICES = [
  {
    title: 'Digital Banking',
    description: 'Secure, scalable banking infrastructure with real-time transaction processing and compliance management.',
    icon: '🏦',
  },
  {
    title: 'Investment Management',
    description: 'Portfolio analysis, robo-advisory, and wealth management solutions powered by AI insights.',
    icon: '📊',
  },
  {
    title: 'Financial Advisory',
    description: 'Expert guidance on financial planning, risk management, and strategic investments.',
    icon: '💼',
  },
];

const FINANCE_FEATURES = [
  '99.9% Uptime SLA',
  'Bank-Grade Security',
  'Real-Time Analytics',
  'Compliance Ready',
  'Multi-Currency Support',
  'AI-Powered Insights',
];

export default function PortfolioFinanceDemo() {
  return (
    <DemoSiteTemplate
      name="FinTech Solutions"
      tagline="Digital Banking & Investment Management"
      description="Transform your financial services with enterprise-grade cloud infrastructure, AI-powered analytics, and secure transaction processing. We help financial institutions innovate faster while maintaining compliance and security."
      icon="💰"
      color="#00D97E"
      features={FINANCE_FEATURES}
      services={FINANCE_SERVICES}
    />
  );
}
