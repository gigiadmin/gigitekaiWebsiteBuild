import { useState } from 'react';
import { X, Download, FileText, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export interface LeadMagnet {
  id: string;
  title: string;
  description: string;
  icon: 'pdf' | 'excel' | 'word' | 'doc';
  downloadUrl: string;
  category: string;
}

interface LeadMagnetModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadMagnet: LeadMagnet;
}

export default function LeadMagnetModal({ isOpen, onClose, leadMagnet }: LeadMagnetModalProps) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [company, setCompany] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !firstName) {
      alert('Please enter your email and name');
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate form submission
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Trigger download
      const link = document.createElement('a');
      link.href = leadMagnet.downloadUrl;
      link.download = `${leadMagnet.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setIsDownloaded(true);
      
      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
        setEmail('');
        setFirstName('');
        setCompany('');
        setIsDownloaded(false);
      }, 2000);
    } catch (error) {
      alert('Error downloading file');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="bg-[#141B2D] border-slate-700/50 max-w-md w-full p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        {!isDownloaded ? (
          <>
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#00D4FF]/20">
                  <FileText size={20} className="text-[#00D4FF]" />
                </div>
                <h2 className="text-xl font-bold text-white">{leadMagnet.title}</h2>
              </div>
              <p className="text-sm text-gray-400">{leadMagnet.description}</p>
            </div>

            {/* Form */}
            <form onSubmit={handleDownload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  First Name *
                </label>
                <Input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  className="bg-[#0A0E1A] border-slate-700 text-white placeholder-gray-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email *
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@company.com"
                  className="bg-[#0A0E1A] border-slate-700 text-white placeholder-gray-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Company (Optional)
                </label>
                <Input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Acme Corp"
                  className="bg-[#0A0E1A] border-slate-700 text-white placeholder-gray-500"
                />
              </div>

              {/* Trust message */}
              <p className="text-xs text-gray-500 text-center">
                We respect your privacy. No spam, ever.
              </p>

              {/* Download button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#00D4FF] hover:bg-[#00B8D4] text-[#0A0E1A] font-semibold flex items-center justify-center gap-2"
              >
                <Download size={16} />
                {isSubmitting ? 'Downloading...' : 'Download Now'}
              </Button>
            </form>
          </>
        ) : (
          /* Success state */
          <div className="text-center py-8">
            <div className="flex justify-center mb-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[#00D4FF]/20">
                <CheckCircle size={32} className="text-[#00D4FF]" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Download Started!</h3>
            <p className="text-sm text-gray-400 mb-4">
              Check your downloads folder. We've also sent a copy to your email.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

// Sample lead magnets
export const LEAD_MAGNETS: LeadMagnet[] = [
  {
    id: 'security-checklist',
    title: 'IT Security Checklist',
    description: 'Essential security measures every MSP should implement',
    icon: 'pdf',
    downloadUrl: '/manus-storage/IT_Security_Checklist_762136f5.pdf',
    category: 'Security',
  },
  {
    id: 'ai-roadmap',
    title: 'AI Implementation Roadmap',
    description: '12-month plan for integrating AI into your IT operations',
    icon: 'pdf',
    downloadUrl: '/manus-storage/AI_Implementation_Roadmap_c25c27bf.pdf',
    category: 'AI & Automation',
  },
  {
    id: 'cloud-migration',
    title: 'Cloud Migration Template',
    description: 'Step-by-step guide for migrating to cloud infrastructure',
    icon: 'excel',
    downloadUrl: '/manus-storage/Cloud_Migration_Template_f04b8808.pdf',
    category: 'Cloud',
  },
  {
    id: 'helpdesk-sla',
    title: 'Helpdesk SLA Template',
    description: 'Professional SLA document for IT support services',
    icon: 'word',
    downloadUrl: '/manus-storage/Helpdesk_SLA_Template_3a55e9ec.pdf',
    category: 'Operations',
  },
  {
    id: 'cyber-assessment',
    title: 'Cybersecurity Assessment',
    description: 'Comprehensive security audit checklist for your organization',
    icon: 'pdf',
    downloadUrl: '/manus-storage/Cybersecurity_Assessment_fcd05c07.pdf',
    category: 'Security',
  },
];
