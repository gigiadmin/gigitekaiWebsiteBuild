/**
 * PortfolioLegalDemo.tsx — Legal services demo site
 * Showcases Legal Pro capabilities
 */

import { DemoSiteTemplate } from '@/components/DemoSiteTemplate';

const LEGAL_SERVICES = [
  {
    title: 'Corporate Law',
    description: 'Contract drafting, M&A support, corporate governance, and regulatory compliance services.',
    icon: '📋',
  },
  {
    title: 'Litigation Support',
    description: 'Expert legal representation, case management, and dispute resolution with proven track record.',
    icon: '⚖️',
  },
  {
    title: 'Legal Consulting',
    description: 'Strategic legal advice, risk assessment, and compliance frameworks for enterprises.',
    icon: '🎯',
  },
];

const LEGAL_FEATURES = [
  'Expert Attorneys',
  'Secure Document Management',
  'Case Tracking System',
  'Compliance Monitoring',
  '24/7 Legal Support',
  'Transparent Billing',
];

export default function PortfolioLegalDemo() {
  return (
    <DemoSiteTemplate
      name="Legal Pro"
      tagline="Corporate Law & Legal Consulting"
      description="Navigate complex legal landscapes with confidence. Our cloud-based legal platform combines expert attorneys with AI-powered document analysis, compliance tracking, and secure case management to streamline your legal operations."
      icon="⚖️"
      color="#6366F1"
      features={LEGAL_FEATURES}
      services={LEGAL_SERVICES}
    />
  );
}
