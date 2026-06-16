/*
  Tampa Bay Presence Section — Local Trust & Social Proof
  Case studies placeholder - real case studies coming soon
*/

import { MapPin, Award, Users, TrendingUp } from "lucide-react";

const caseStudies: any[] = [];

const localStats = [
  { icon: MapPin, label: "Tampa Bay Based", value: "Local Team" },
  { icon: Users, label: "SMB Clients", value: "50+ Served" },
  { icon: Award, label: "Compliance Ready", value: "HIPAA, Legal, Construction" },
  { icon: TrendingUp, label: "Average ROI", value: "3-4 Month Payback" },
];

function CaseStudyCard({ study }: { study: any }) {
  return null;
}

export default function TampaBayPresenceSection() {
  // Return empty if no case studies
  if (caseStudies.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-[#0A0E1A]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-cyan-400 text-sm font-semibold uppercase tracking-widest mb-3">Tampa Bay Local Presence</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Trusted by Tampa Bay Businesses
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Real results from healthcare, legal, and construction firms in the Tampa Bay area.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {localStats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="text-center">
                <Icon className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
                <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                <p className="text-white font-bold text-lg">{stat.value}</p>
              </div>
            );
          })}
        </div>

        {/* Case Studies Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {caseStudies.map((study) => (
            <CaseStudyCard key={study.id} study={study} />
          ))}
        </div>
      </div>
    </section>
  );
}
