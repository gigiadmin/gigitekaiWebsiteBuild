import { useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import LeadMagnetModal, { LEAD_MAGNETS, type LeadMagnet } from './LeadMagnetModal';

export default function LeadMagnetsSection() {
  const [selectedMagnet, setSelectedMagnet] = useState<LeadMagnet | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDownloadClick = (magnet: typeof LEAD_MAGNETS[0]) => {
    setSelectedMagnet(magnet);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMagnet(null);
  };

  // Group by category
  const categories = Array.from(new Set(LEAD_MAGNETS.map(m => m.category)));
  const magnetsByCategory = categories.reduce((acc: Record<string, typeof LEAD_MAGNETS>, cat) => {
    acc[cat] = LEAD_MAGNETS.filter(m => m.category === cat);
    return acc;
  }, {});

  return (
    <section className="py-16 md:py-24 bg-[#0A0E1A] border-t border-slate-700/50">
      <div className="container mx-auto px-4 md:px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00D4FF]/10 border border-[#00D4FF]/30 mb-4">
            <Download size={16} className="text-[#00D4FF]" />
            <span className="text-sm font-medium text-[#00D4FF]">Free Resources</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Download Expert Resources
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Get practical templates, checklists, and guides to accelerate your IT transformation. 
            No credit card required.
          </p>
        </div>

        {/* Lead Magnets Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {LEAD_MAGNETS.map((magnet) => (
            <Card
              key={magnet.id}
              className="bg-[#141B2D] border-slate-700/50 p-6 hover:border-[#00D4FF]/50 transition-all cursor-pointer group"
              onClick={() => handleDownloadClick(magnet)}
            >
              {/* Icon */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-[#00D4FF]/20 group-hover:bg-[#00D4FF]/30 transition-colors">
                  <FileText size={24} className="text-[#00D4FF]" />
                </div>
                <span className="text-xs font-semibold text-[#00D4FF] bg-[#00D4FF]/10 px-2 py-1 rounded">
                  {magnet.category}
                </span>
              </div>

              {/* Title & Description */}
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-[#00D4FF] transition-colors">
                {magnet.title}
              </h3>
              <p className="text-sm text-gray-400 mb-4">{magnet.description}</p>

              {/* Download CTA */}
              <Button className="w-full bg-[#00D4FF]/20 hover:bg-[#00D4FF] text-[#00D4FF] hover:text-[#0A0E1A] border border-[#00D4FF]/50 hover:border-[#00D4FF] font-semibold transition-all flex items-center justify-center gap-2">
                <Download size={16} />
                Download
              </Button>
            </Card>
          ))}
        </div>

        {/* Why Download */}
        <div className="bg-[#141B2D] border border-slate-700/50 rounded-lg p-8 md:p-12">
          <h3 className="text-2xl font-bold text-white mb-8 text-center">Why Download These Resources?</h3>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Save Time',
                description: 'Pre-built templates and checklists save hours of planning and research',
              },
              {
                title: 'Industry Best Practices',
                description: 'Based on proven MSP frameworks and IT industry standards',
              },
              {
                title: 'Actionable Insights',
                description: 'Practical guidance you can implement immediately in your organization',
              },
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#00D4FF]/20 mx-auto mb-4">
                  <span className="text-lg font-bold text-[#00D4FF]">{idx + 1}</span>
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">{item.title}</h4>
                <p className="text-sm text-gray-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-400 mb-4">Built for IT professionals</p>
          <div className="flex items-center justify-center gap-8 flex-wrap">
            {['Free to Download', 'Expert-Written Guides', 'No Credit Card Required'].map((badge, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#00D4FF]"></div>
                <span className="text-sm text-gray-300">{badge}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedMagnet && (
        <LeadMagnetModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          leadMagnet={selectedMagnet}
        />
      )}
    </section>
  );
}
