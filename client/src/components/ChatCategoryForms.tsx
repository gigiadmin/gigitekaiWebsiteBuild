import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface CategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  category: 'ai-assessment' | 'cloud-migration' | 'automation' | 'security-audit' | 'bug-report' | 'general-help' | null;
}

export function ChatCategoryForms({ isOpen, onClose, category }: CategoryFormProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const contactMutation = trpc.contact.submit.useMutation();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    company: '',
    phone: '',
    subject: '',
    description: '',
    assessmentType: '',
    currentSetup: '',
    goals: '',
    processDetails: '',
    scope: '',
    stepsToReproduce: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let subject = '';
      let description = '';

      switch (category) {
        case 'ai-assessment':
          subject = `AI Assessment Request - ${formData.company}`;
          description = `Assessment Type: ${formData.assessmentType}\n\nCompany: ${formData.company}\nPhone: ${formData.phone}\n\nDetails: ${formData.description}`;
          break;
        case 'cloud-migration':
          subject = `Cloud Migration Inquiry - ${formData.company}`;
          description = `Current Setup: ${formData.currentSetup}\n\nGoals: ${formData.goals}\n\nAdditional Details: ${formData.description}`;
          break;
        case 'automation':
          subject = `Automation Request - ${formData.company}`;
          description = `Process Details: ${formData.processDetails}\n\nAdditional Information: ${formData.description}`;
          break;
        case 'security-audit':
          subject = `Security Audit Request - ${formData.company}`;
          description = `Scope: ${formData.scope}\n\nAdditional Details: ${formData.description}`;
          break;
        case 'bug-report':
          subject = `Bug Report`;
          description = `Bug Description: ${formData.description}\n\nSteps to Reproduce: ${formData.stepsToReproduce}`;
          break;
        case 'general-help':
          subject = formData.subject || 'General Help Request';
          description = formData.description;
          break;
      }

      await contactMutation.mutateAsync({
        name: formData.name,
        email: formData.email,
        subject,
        message: description,
      });

      toast.success('Form submitted successfully! We\'ll be in touch soon.');
      onClose();
      setFormData({
        name: user?.name || '',
        email: user?.email || '',
        company: '',
        phone: '',
        subject: '',
        description: '',
        assessmentType: '',
        currentSetup: '',
        goals: '',
        processDetails: '',
        scope: '',
        stepsToReproduce: '',
      });
    } catch (error) {
      toast.error('Failed to submit form. Please try again.');
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFormContent = () => {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Common fields */}
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-1">Name *</label>
          <Input
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Your name"
            required
            className="bg-gray-800 border-gray-700 text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-200 mb-1">Email *</label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="your@email.com"
            required
            className="bg-gray-800 border-gray-700 text-white"
          />
        </div>

        {/* Category-specific fields */}
        {(category === 'ai-assessment' || category === 'cloud-migration' || category === 'automation' || category === 'security-audit') && (
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Company *</label>
            <Input
              value={formData.company}
              onChange={(e) => handleInputChange('company', e.target.value)}
              placeholder="Your company name"
              required
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>
        )}

        {(category === 'ai-assessment' || category === 'cloud-migration' || category === 'automation' || category === 'security-audit') && (
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Phone</label>
            <Input
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="(727) 382-6909"
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>
        )}

        {category === 'ai-assessment' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Assessment Type *</label>
              <Select value={formData.assessmentType} onValueChange={(value) => handleInputChange('assessmentType', value)}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Select assessment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ai-readiness">AI Readiness Audit</SelectItem>
                  <SelectItem value="copilot-readiness">Copilot Readiness</SelectItem>
                  <SelectItem value="m365-optimization">Microsoft 365 Optimization</SelectItem>
                  <SelectItem value="security-assessment">Security Assessment</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {category === 'cloud-migration' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Current Setup *</label>
              <Textarea
                value={formData.currentSetup}
                onChange={(e) => handleInputChange('currentSetup', e.target.value)}
                placeholder="Describe your current infrastructure (on-premises, hybrid, cloud, etc.)"
                required
                className="bg-gray-800 border-gray-700 text-white"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Migration Goals *</label>
              <Textarea
                value={formData.goals}
                onChange={(e) => handleInputChange('goals', e.target.value)}
                placeholder="What are your goals for cloud migration?"
                required
                className="bg-gray-800 border-gray-700 text-white"
                rows={3}
              />
            </div>
          </>
        )}

        {category === 'automation' && (
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Process Details *</label>
            <Textarea
              value={formData.processDetails}
              onChange={(e) => handleInputChange('processDetails', e.target.value)}
              placeholder="Describe the processes you want to automate"
              required
              className="bg-gray-800 border-gray-700 text-white"
              rows={4}
            />
          </div>
        )}

        {category === 'security-audit' && (
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Audit Scope *</label>
            <Textarea
              value={formData.scope}
              onChange={(e) => handleInputChange('scope', e.target.value)}
              placeholder="What areas should the security audit cover? (e.g., Microsoft 365, Azure, on-premises systems, compliance requirements)"
              required
              className="bg-gray-800 border-gray-700 text-white"
              rows={4}
            />
          </div>
        )}

        {category === 'bug-report' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Bug Description *</label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe the bug you encountered"
                required
                className="bg-gray-800 border-gray-700 text-white"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Steps to Reproduce *</label>
              <Textarea
                value={formData.stepsToReproduce}
                onChange={(e) => handleInputChange('stepsToReproduce', e.target.value)}
                placeholder="1. Step one\n2. Step two\n3. Step three"
                required
                className="bg-gray-800 border-gray-700 text-white"
                rows={3}
              />
            </div>
          </>
        )}

        {category === 'general-help' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Subject *</label>
              <Input
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                placeholder="What do you need help with?"
                required
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Details *</label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Please provide more details"
                required
                className="bg-gray-800 border-gray-700 text-white"
                rows={4}
              />
            </div>
          </>
        )}

        {(category === 'ai-assessment' || category === 'cloud-migration' || category === 'automation' || category === 'security-audit') && (
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Additional Details</label>
            <Textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Any additional information you'd like to share"
              className="bg-gray-800 border-gray-700 text-white"
              rows={3}
            />
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-cyan-600 hover:bg-cyan-700"
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
        </div>
      </form>
    );
  };

  const getTitleForCategory = () => {
    switch (category) {
      case 'ai-assessment':
        return 'AI Assessment Request';
      case 'cloud-migration':
        return 'Cloud Migration Inquiry';
      case 'automation':
        return 'Automation Request';
      case 'security-audit':
        return 'Security Audit Request';
      case 'bug-report':
        return 'Report a Bug';
      case 'general-help':
        return 'General Help';
      default:
        return 'Contact Us';
    }
  };

  return (
    <Dialog open={isOpen && category !== null} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>{getTitleForCategory()}</DialogTitle>
        </DialogHeader>
        {renderFormContent()}
      </DialogContent>
    </Dialog>
  );
}
