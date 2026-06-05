/*
  Tampa Bay Presence Section — Local Trust & Social Proof
  Case studies from healthcare, legal, and construction firms in Tampa Bay
*/

import { MapPin, Award, Users, TrendingUp } from "lucide-react";

const caseStudies = [
  {
    id: 1,
    company: "Bay Area Medical Group",
    industry: "Healthcare",
    location: "Tampa, FL",
    challenge: "HIPAA compliance gaps, manual backup processes, ransomware risk",
    result: "Achieved HIPAA compliance, 99.9% uptime, reduced security incidents by 95%",
    impact: "40% reduction in IT overhead",
    quote: "GigitekAI made compliance simple. We went from worried to confident in 30 days.",
  },
  {
    id: 2,
    company: "Clearwater Legal Partners",
    industry: "Legal Services",
    location: "Clearwater, FL",
    challenge: "Client data security, email compliance, remote work infrastructure",
    result: "Secure remote work setup, email encryption, audit-ready systems",
    impact: "Zero security incidents in 18 months",
    quote: "They understand legal firm needs. No generic solutions—just what we need.",
  },
  {
    id: 3,
    company: "Tampa Bay Construction Co.",
    industry: "Construction",
    location: "Tampa, FL",
    challenge: "Project data loss, field team connectivity, compliance documentation",
    result: "Cloud-based project management, secure field access, automated compliance",
    impact: "30% faster project delivery",
    quote: "We're a construction company, not IT experts. They made it work for us.",
  },
];

const localStats = [
  { icon: MapPin, label: "Tampa Bay Based", value: "Local Team" },
  { icon: Users, label: "SMB Clients", value: "50+ Served" },
  { icon: Award, label: "Compliance Ready", value: "HIPAA, Legal, Construction" },
  { icon: TrendingUp, label: "Average ROI", value: "3-4 Month Payback" },
];

function CaseStudyCard({ study }: { study: typeof caseStudies[0] }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-gray-700 bg-gradient-to-br from-gray-900 to-black p-8 hover:border-cyan-500/50 transition-all duration-300">
      {/* Background accent */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full blur-3xl -mr-20 -mt-20 group-hover:from-cyan-500/20 transition-all duration-300" />

      <div className="relative z-10">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-lg font-bold text-white">{study.company}</h3>
              <p className="text-sm text-cyan-400">{study.industry}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <MapPin size={14} />
                {study.location}
              </div>
            </div>
          </div>
        </div>

        {/* Quote */}
        <blockquote className="mb-6 pb-6 border-l-2 border-cyan-500/50 pl-4">
          <p className="text-gray-300 italic text-sm">"{study.quote}"</p>
        </blockquote>

        {/* Challenge & Result */}
        <div className="space-y-4 mb-6">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Challenge</p>
            <p className="text-sm text-gray-300">{study.challenge}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Result</p>
            <p className="text-sm text-gray-300">{study.result}</p>
          </div>
        </div>

        {/* Impact highlight */}
        <div className="bg-gradient-to-r from-cyan-500/10 to-transparent p-4 rounded-lg">
          <p className="text-sm font-semibold text-cyan-400">{study.impact}</p>
        </div>
      </div>
    </div>
  );
}

export default function TampaBayPresenceSection() {
  return (
    <section className="relative py-20 bg-black overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,212,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,212,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="container relative z-10">
        {/* Header */}
        <div className="max-w-2xl mb-16">
          <div className="section-label mb-4">TRUSTED BY TAMPA BAY</div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Local Expertise.{" "}
            <span
              style={{
                background: "linear-gradient(90deg, #00D4FF, #00EEFF)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Real Results.
            </span>
          </h2>
          <p className="text-lg text-gray-300">
            We're based in Tampa Bay and understand the unique challenges facing healthcare, legal, and construction firms in our community.
          </p>
        </div>

        {/* Local Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {localStats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="text-center">
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-cyan-400" />
                  </div>
                </div>
                <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
                <p className="text-lg font-bold text-cyan-400">{stat.value}</p>
              </div>
            );
          })}
        </div>

        {/* Case Studies */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-white mb-8">Case Studies</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {caseStudies.map((study) => (
              <CaseStudyCard key={study.id} study={study} />
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center pt-8 border-t border-gray-700">
          <p className="text-gray-300 mb-6">
            Ready to join 50+ Tampa Bay businesses reducing risk and automating operations?
          </p>
          <a href="/contact" className="btn-cyan inline-flex items-center gap-2">
            Start Your Tampa Bay Journey
          </a>
        </div>
      </div>
    </section>
  );
}
