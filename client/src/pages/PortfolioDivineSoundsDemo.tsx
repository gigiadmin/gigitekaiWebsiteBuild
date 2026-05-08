/**
 * PortfolioDivineSoundsDemo.tsx — Divine Sounds real client showcase
 * Showcases audio and sound services
 */

import { DemoSiteTemplate } from '@/components/DemoSiteTemplate';

const DIVINESOUNDS_SERVICES = [
  {
    title: 'Audio Production',
    description: 'Professional recording, mixing, and mastering with state-of-the-art studio equipment.',
    icon: '🎙️',
  },
  {
    title: 'Sound Design',
    description: 'Custom sound effects, ambient soundscapes, and audio branding for media and entertainment.',
    icon: '🎵',
  },
  {
    title: 'Music Composition',
    description: 'Original music composition, arrangement, and orchestration for any project or medium.',
    icon: '🎼',
  },
];

const DIVINESOUNDS_FEATURES = [
  'Professional Studio',
  'Expert Sound Engineers',
  'Royalty-Free Music',
  'Fast Turnaround',
  'Custom Composition',
  'Multi-Format Delivery',
];

export default function PortfolioDivineSoundsDemo() {
  return (
    <DemoSiteTemplate
      name="Divine Sounds"
      tagline="Professional Audio & Sound Services"
      description="Elevate your projects with professional audio production and sound design. Divine Sounds combines technical expertise with creative vision to deliver exceptional audio experiences for music, podcasts, films, games, and corporate media."
      icon="🎵"
      color="#FF6B9D"
      features={DIVINESOUNDS_FEATURES}
      services={DIVINESOUNDS_SERVICES}
    />
  );
}
