/*
  GigitekAI Careers Page
  Showcases open positions and company culture
*/

import { ArrowRight, MapPin, Briefcase } from "lucide-react";

const jobs = [
  {
    title: "Senior Cloud Architect",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    description: "Design and architect enterprise cloud solutions on AWS, Azure, and Google Cloud.",
  },
  {
    title: "AI/ML Engineer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    description: "Develop and deploy machine learning models and AI solutions for enterprise clients.",
  },
  {
    title: "Solutions Consultant",
    department: "Sales & Solutions",
    location: "North America",
    type: "Full-time",
    description: "Work with enterprise clients to design tailored cloud and AI solutions.",
  },
  {
    title: "Cloud Security Specialist",
    department: "Security",
    location: "Remote",
    type: "Full-time",
    description: "Build and maintain enterprise-grade security frameworks for cloud infrastructure.",
  },
  {
    title: "DevOps Engineer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    description: "Manage and optimize cloud infrastructure, CI/CD pipelines, and deployment automation.",
  },
  {
    title: "Sales Development Representative",
    department: "Sales",
    location: "North America",
    type: "Full-time",
    description: "Generate and qualify leads for our enterprise cloud and AI solutions.",
  },
];

export default function Careers() {
  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      {/* Hero Section */}
      <section className="py-20 px-4 border-b border-[rgba(0,212,255,0.1)]">
        <div className="container max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Join Our Team
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            Help enterprises transform with cloud infrastructure and AI solutions. We're looking for talented engineers, consultants, and leaders to join our mission.
          </p>
          <div className="grid grid-cols-3 gap-8 py-8">
            <div>
              <div className="text-3xl font-bold text-[#00D4FF] mb-2">500+</div>
              <div className="text-gray-400">Clients Transformed</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#00D4FF] mb-2">50+</div>
              <div className="text-gray-400">Team Members</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#00D4FF] mb-2">100%</div>
              <div className="text-gray-400">Remote Friendly</div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Join Section */}
      <section className="py-16 px-4 border-b border-[rgba(0,212,255,0.1)]">
        <div className="container max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Why Join GigitekAI?
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-6 bg-white/5 border border-white/10 rounded-lg hover:border-[#00D4FF]/30 transition-colors">
              <h3 className="text-xl font-bold mb-3 text-[#00D4FF]">Work on Impactful Projects</h3>
              <p className="text-gray-400">
                Help enterprises modernize their infrastructure and leverage AI to drive real business outcomes.
              </p>
            </div>
            <div className="p-6 bg-white/5 border border-white/10 rounded-lg hover:border-[#00D4FF]/30 transition-colors">
              <h3 className="text-xl font-bold mb-3 text-[#00D4FF]">Continuous Learning</h3>
              <p className="text-gray-400">
                Work with cutting-edge cloud and AI technologies. We invest in your professional development.
              </p>
            </div>
            <div className="p-6 bg-white/5 border border-white/10 rounded-lg hover:border-[#00D4FF]/30 transition-colors">
              <h3 className="text-xl font-bold mb-3 text-[#00D4FF]">Flexible & Remote</h3>
              <p className="text-gray-400">
                Work from anywhere with flexible hours. We trust our team to deliver great work.
              </p>
            </div>
            <div className="p-6 bg-white/5 border border-white/10 rounded-lg hover:border-[#00D4FF]/30 transition-colors">
              <h3 className="text-xl font-bold mb-3 text-[#00D4FF]">Competitive Compensation</h3>
              <p className="text-gray-400">
                Competitive salary, equity, health benefits, and professional development budget.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-16 px-4">
        <div className="container max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Open Positions
          </h2>
          <div className="space-y-4">
            {jobs.map((job, idx) => (
              <div
                key={idx}
                className="p-6 bg-white/5 border border-white/10 rounded-lg hover:border-[#00D4FF]/30 hover:bg-white/10 transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-[#00D4FF] transition-colors">
                      {job.title}
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">{job.department}</p>
                  </div>
                  <ArrowRight className="text-gray-600 group-hover:text-[#00D4FF] transition-colors" />
                </div>
                <p className="text-gray-400 mb-4">{job.description}</p>
                <div className="flex gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <MapPin size={14} />
                    {job.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <Briefcase size={14} />
                    {job.type}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 border-t border-[rgba(0,212,255,0.1)]">
        <div className="container max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Don't See Your Role?
          </h2>
          <p className="text-gray-400 mb-8">
            We're always looking for talented people. Send us your resume and let us know how you'd like to contribute.
          </p>
          <a
            href="mailto:careers@gigitekai.com"
            className="inline-block px-8 py-3 bg-[#00D4FF] text-[#0A0E1A] font-bold rounded-lg hover:bg-[#00D4FF]/90 transition-colors"
          >
            Get in Touch
          </a>
        </div>
      </section>
    </div>
  );
}
