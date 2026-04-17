import { useEffect, useRef, useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatTrigger {
  id: string;
  type: 'time' | 'scroll' | 'exit_intent' | 'page_specific';
  triggerValue: number | string; // seconds for time, percentage for scroll, page path for page_specific
  message: string;
  enabled: boolean;
  cooldownMinutes: number;
}

interface ChatTriggerManagerProps {
  triggers?: ChatTrigger[];
  onTrigger?: (triggerId: string) => void;
}

export default function ChatTriggerManager({ 
  triggers = DEFAULT_TRIGGERS, 
  onTrigger 
}: ChatTriggerManagerProps) {
  // Component is disabled per user request
  return null;
}

// Default triggers - all disabled
const DEFAULT_TRIGGERS: ChatTrigger[] = [
  {
    id: 'time_30s',
    type: 'time',
    triggerValue: 30, // 30 seconds
    message: 'Have questions about AI automation? Our team is here to help!',
    enabled: false,
    cooldownMinutes: 60,
  },
  {
    id: 'scroll_50',
    type: 'scroll',
    triggerValue: 50, // 50% scroll
    message: 'Interested in learning more? Chat with our AI expert now.',
    enabled: false,
    cooldownMinutes: 120,
  },
  {
    id: 'exit_intent',
    type: 'exit_intent',
    triggerValue: '',
    message: 'Before you go, let us show you how much you could save!',
    enabled: false,
    cooldownMinutes: 180,
  },
  {
    id: 'roi_calculator',
    type: 'page_specific',
    triggerValue: '/roi-calculator',
    message: 'Need help interpreting your ROI results? Let\'s chat!',
    enabled: false,
    cooldownMinutes: 90,
  },
];
