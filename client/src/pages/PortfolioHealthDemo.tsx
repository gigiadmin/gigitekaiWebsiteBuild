/**
 * PortfolioHealthDemo.tsx — Health Services demo site
 * Showcases HealthFirst capabilities
 */

import { DemoSiteTemplate } from '@/components/DemoSiteTemplate';

const HEALTH_SERVICES = [
  {
    title: 'Telemedicine',
    description: 'Virtual consultations with licensed physicians, prescription management, and follow-up care.',
    icon: '👨‍⚕️',
  },
  {
    title: 'Wellness Programs',
    description: 'Preventive care, fitness tracking, nutrition guidance, and mental health support.',
    icon: '💪',
  },
  {
    title: 'Patient Management',
    description: 'Integrated EHR, appointment scheduling, and secure patient communication platform.',
    icon: '📋',
  },
];

const HEALTH_FEATURES = [
  'HIPAA Compliant',
  'Licensed Physicians',
  '24/7 Availability',
  'Prescription Integration',
  'Health Records Access',
  'AI Health Insights',
];

export default function PortfolioHealthDemo() {
  return (
    <DemoSiteTemplate
      name="HealthFirst"
      tagline="Telemedicine & Wellness Services"
      description="Healthcare reimagined for the digital age. Our comprehensive platform connects patients with licensed physicians, provides personalized wellness programs, and maintains secure health records—all accessible from anywhere, anytime."
      icon="🏥"
      color="#EF4444"
      features={HEALTH_FEATURES}
      services={HEALTH_SERVICES}
    />
  );
}
