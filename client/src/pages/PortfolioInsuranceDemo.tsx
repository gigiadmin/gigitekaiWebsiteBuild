/**
 * PortfolioInsuranceDemo.tsx — Insurance industry demo site
 * Showcases InsureFlow capabilities
 */

import { DemoSiteTemplate } from '@/components/DemoSiteTemplate';

const INSURANCE_SERVICES = [
  {
    title: 'Health Insurance',
    description: 'Comprehensive health coverage with preventive care, telemedicine, and wellness programs.',
    icon: '🏥',
  },
  {
    title: 'Property & Casualty',
    description: 'Home, auto, and business insurance with fast claims processing and risk assessment.',
    icon: '🏠',
  },
  {
    title: 'Liability Coverage',
    description: 'Professional liability, general liability, and specialized coverage for enterprises.',
    icon: '🛡️',
  },
];

const INSURANCE_FEATURES = [
  'Fast Claims Processing',
  'AI Risk Assessment',
  'Digital Policy Management',
  'Real-Time Coverage Updates',
  'Mobile Claims Submission',
  'Fraud Detection',
];

export default function PortfolioInsuranceDemo() {
  return (
    <DemoSiteTemplate
      name="InsureFlow"
      tagline="Health, Property & Liability Insurance"
      description="Protect what matters most with modern insurance solutions. Our AI-powered platform streamlines underwriting, accelerates claims processing, and provides customers with transparent, flexible coverage options tailored to their needs."
      icon="🛡️"
      color="#F59E0B"
      features={INSURANCE_FEATURES}
      services={INSURANCE_SERVICES}
    />
  );
}
