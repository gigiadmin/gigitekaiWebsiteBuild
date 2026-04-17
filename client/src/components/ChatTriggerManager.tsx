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
  const [showPrompt, setShowPrompt] = useState(false);
  const [currentTrigger, setCurrentTrigger] = useState<ChatTrigger | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const scrollRef = useRef<boolean>(false);
  const exitIntentRef = useRef<boolean>(false);
  const triggeredRef = useRef<Set<string>>(new Set());

  // Load triggered history from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('chat_triggers_triggered');
    if (stored) {
      const parsed = JSON.parse(stored);
      triggeredRef.current = new Set(parsed);
    }
  }, []);

  // Check if trigger has been shown recently (cooldown)
  const canTrigger = (trigger: ChatTrigger): boolean => {
    const key = `chat_trigger_${trigger.id}_time`;
    const lastTriggered = localStorage.getItem(key);
    if (!lastTriggered) return true;
    
    const elapsed = (Date.now() - parseInt(lastTriggered)) / 1000 / 60; // minutes
    return elapsed >= trigger.cooldownMinutes;
  };

  // Record trigger execution
  const recordTrigger = (triggerId: string) => {
    const key = `chat_trigger_${triggerId}_time`;
    localStorage.setItem(key, Date.now().toString());
    triggeredRef.current.add(triggerId);
  };

  // Time-based trigger
  useEffect(() => {
    const timeTrigger = triggers.find(t => t.type === 'time' && t.enabled);
    if (!timeTrigger) return;

    const seconds = typeof timeTrigger.triggerValue === 'number' ? timeTrigger.triggerValue : 30;
    
    timeoutRef.current = setTimeout(() => {
      if (canTrigger(timeTrigger)) {
        setCurrentTrigger(timeTrigger);
        setShowPrompt(true);
        recordTrigger(timeTrigger.id);
        onTrigger?.(timeTrigger.id);
      }
    }, seconds * 1000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [triggers, onTrigger]);

  // Scroll-based trigger
  useEffect(() => {
    const scrollTrigger = triggers.find(t => t.type === 'scroll' && t.enabled);
    if (!scrollTrigger) return;

    const handleScroll = () => {
      if (scrollRef.current) return;

      const percentage = typeof scrollTrigger.triggerValue === 'number' 
        ? scrollTrigger.triggerValue 
        : 50;
      
      const scrollPercentage = 
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;

      if (scrollPercentage >= percentage && canTrigger(scrollTrigger)) {
        scrollRef.current = true;
        setCurrentTrigger(scrollTrigger);
        setShowPrompt(true);
        recordTrigger(scrollTrigger.id);
        onTrigger?.(scrollTrigger.id);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [triggers, onTrigger]);

  // Exit intent trigger
  useEffect(() => {
    const exitTrigger = triggers.find(t => t.type === 'exit_intent' && t.enabled);
    if (!exitTrigger) return;

    const handleMouseLeave = (e: MouseEvent) => {
      if (exitIntentRef.current) return;
      
      // Only trigger if mouse is leaving from top of page
      if (e.clientY <= 0 && canTrigger(exitTrigger)) {
        exitIntentRef.current = true;
        setCurrentTrigger(exitTrigger);
        setShowPrompt(true);
        recordTrigger(exitTrigger.id);
        onTrigger?.(exitTrigger.id);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [triggers, onTrigger]);

  // Page-specific trigger
  useEffect(() => {
    const pageTrigger = triggers.find(t => t.type === 'page_specific' && t.enabled);
    if (!pageTrigger) return;

    const currentPath = window.location.pathname;
    const triggerPath = typeof pageTrigger.triggerValue === 'string' 
      ? pageTrigger.triggerValue 
      : '';

    if (currentPath.includes(triggerPath) && canTrigger(pageTrigger)) {
      setCurrentTrigger(pageTrigger);
      setShowPrompt(true);
      recordTrigger(pageTrigger.id);
      onTrigger?.(pageTrigger.id);
    }
  }, [triggers, onTrigger]);

  const handleClose = () => {
    setShowPrompt(false);
    setCurrentTrigger(null);
  };

  if (!showPrompt || !currentTrigger) return null;

  return (
    <div className="fixed bottom-20 right-6 z-40 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-[#141B2D] border border-[#00D4FF]/50 rounded-lg shadow-lg p-4 max-w-sm">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#00D4FF]/20">
              <MessageCircle size={16} className="text-[#00D4FF]" />
            </div>
            <span className="text-sm font-semibold text-white">GigitekAI</span>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Message */}
        <p className="text-sm text-gray-300 mb-4">{currentTrigger.message}</p>

        {/* CTA */}
        <Button className="w-full bg-[#00D4FF] hover:bg-[#00B8D4] text-[#0A0E1A] font-semibold text-sm">
          Start Chat
        </Button>
      </div>
    </div>
  );
}

// Default triggers
const DEFAULT_TRIGGERS: ChatTrigger[] = [
  {
    id: 'time_30s',
    type: 'time',
    triggerValue: 30, // 30 seconds
    message: 'Have questions about AI automation? Our team is here to help!',
    enabled: true,
    cooldownMinutes: 60,
  },
  {
    id: 'scroll_50',
    type: 'scroll',
    triggerValue: 50, // 50% scroll
    message: 'Interested in learning more? Chat with our AI expert now.',
    enabled: true,
    cooldownMinutes: 120,
  },
  {
    id: 'exit_intent',
    type: 'exit_intent',
    triggerValue: '',
    message: 'Before you go, let us show you how much you could save!',
    enabled: true,
    cooldownMinutes: 180,
  },
  {
    id: 'roi_calculator',
    type: 'page_specific',
    triggerValue: '/roi-calculator',
    message: 'Need help interpreting your ROI results? Let\'s chat!',
    enabled: true,
    cooldownMinutes: 90,
  },
];
