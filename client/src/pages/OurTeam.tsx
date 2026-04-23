/*
  GigitekAI Our Team Page
  Design: Cyberpunk Minimalism meets Enterprise Precision
  Colors: Deep navy-black (#0A0E1A) + Electric cyan (#00D4FF)
*/

import SiteNavBar2024 from "@/components/SiteNavBar2024";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import { useSEO } from "@/hooks/useSEO";
import { SEO_CONFIG } from "@/lib/seoConfig";

interface TeamMember {
  id: number;
  name: string;
  role: string;
  department: string;
  bio: string;
  expertise: string[];
}

const teamMembers: TeamMember[] = [
  {
    id: 1,
    name: "Harry Henry Santiago",
    role: "CEO & Founder",
    department: "Leadership",
    bio: "Microsoft 365 Architect with 20+ years of IT experience. Visionary leader building AI-first technology company.",
    expertise: ["Microsoft 365", "Cloud Architecture", "Strategic Planning", "AI Implementation"],
  },
  {
    id: 2,
    name: "Sarah Johnson",
    role: "VP of Engineering",
    department: "Engineering",
    bio: "Cloud infrastructure expert leading our technical team. Specializes in AWS and Azure enterprise solutions.",
    expertise: ["AWS", "Azure", "Cloud Infrastructure", "DevOps"],
  },
  {
    id: 3,
    name: "Michael Chen",
    role: "AI & ML Lead",
    department: "Engineering",
    bio: "Machine learning specialist driving our AI implementation initiatives. Passionate about intelligent automation.",
    expertise: ["Machine Learning", "AI/LLM", "Python", "Data Science"],
  },
  {
    id: 4,
    name: "Jennifer Rodriguez",
    role: "Security Director",
    department: "Security",
    bio: "Cybersecurity expert with deep knowledge of zero-trust architecture and compliance frameworks.",
    expertise: ["Cybersecurity", "Zero Trust", "Compliance", "Risk Management"],
  },
  {
    id: 5,
    name: "David Thompson",
    role: "Solutions Architect",
    department: "Solutions",
    bio: "Enterprise solutions specialist helping clients design tailored cloud and AI strategies.",
    expertise: ["Solution Design", "Enterprise Architecture", "Client Strategy", "Digital Transformation"],
  },
  {
    id: 6,
    name: "Emily Watson",
    role: "Customer Success Manager",
    department: "Customer Success",
    bio: "Dedicated to ensuring our clients achieve their business objectives through our services.",
    expertise: ["Customer Success", "Account Management", "Project Management", "Communication"],
  },
  {
    id: 7,
    name: "James Martinez",
    role: "DevOps Engineer",
    department: "Engineering",
    bio: "Infrastructure automation expert optimizing deployment pipelines and cloud operations.",
    expertise: ["DevOps", "CI/CD", "Kubernetes", "Infrastructure as Code"],
  },
  {
    id: 8,
    name: "Lisa Anderson",
    role: "Business Analyst",
    department: "Solutions",
    bio: "Bridges business and technology, translating client needs into technical solutions.",
    expertise: ["Business Analysis", "Requirements Gathering", "Process Optimization", "Consulting"],
  },
];

export default function OurTeam() {
  useSEO({ ...SEO_CONFIG["/our-team"], path: "/our-team" });

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#0A0E1A] to-[#0F1428]">
      <SiteNavBar2024 />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6 font-display">
                Our Team
              </h1>
              <p className="text-xl text-gray-300">
                50+ talented professionals dedicated to transforming enterprise technology
              </p>
            </div>
          </div>
        </section>

        {/* Team Culture */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-cyan-500/20">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="text-center">
                <div className="text-3xl font-bold text-cyan-400 mb-2">100%</div>
                <p className="text-gray-300">Remote Friendly</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-cyan-400 mb-2">50+</div>
                <p className="text-gray-300">Team Members</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-cyan-400 mb-2">20+</div>
                <p className="text-gray-300">Certifications</p>
              </div>
            </div>
            <p className="text-gray-300 text-lg text-center mb-4">
              Our team is composed of industry experts, certified professionals, and passionate innovators. We work collaboratively across time zones to deliver excellence for our clients.
            </p>
          </div>
        </section>

        {/* Team Members Grid */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-cyan-500/5 border-y border-cyan-500/20">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-12 text-center">Meet Our Leadership & Specialists</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="p-6 rounded-lg border border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-transparent hover:border-cyan-400/50 hover:bg-cyan-500/10 transition"
                >
                  {/* Avatar Placeholder */}
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 mb-4 flex items-center justify-center">
                    <span className="text-white font-bold text-xl">
                      {member.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-1">{member.name}</h3>
                  <p className="text-cyan-400 font-semibold mb-1">{member.role}</p>
                  <p className="text-sm text-gray-400 mb-3">{member.department}</p>

                  <p className="text-sm text-gray-300 mb-4 line-clamp-3">{member.bio}</p>

                  <div className="flex flex-wrap gap-2">
                    {member.expertise.slice(0, 2).map((skill, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-1 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                      >
                        {skill}
                      </span>
                    ))}
                    {member.expertise.length > 2 && (
                      <span className="text-xs px-2 py-1 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        +{member.expertise.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Culture Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-8">Our Culture</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold text-cyan-400 mb-3">Continuous Learning</h3>
                <p className="text-gray-300">
                  We invest in professional development with certifications, training, and conference attendance to keep our team at the forefront of technology.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-cyan-400 mb-3">Collaborative Innovation</h3>
                <p className="text-gray-300">
                  We believe the best solutions come from diverse perspectives. Our teams collaborate across disciplines to solve complex challenges.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-cyan-400 mb-3">Work-Life Balance</h3>
                <p className="text-gray-300">
                  100% remote-friendly with flexible hours. We trust our team to deliver great work while maintaining healthy work-life balance.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-cyan-400 mb-3">Client-Centric</h3>
                <p className="text-gray-300">
                  Every decision we make is guided by our commitment to client success. Your goals are our goals.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Join Us CTA */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-cyan-500/5 border-t border-cyan-500/20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-6">Join Our Team</h2>
            <p className="text-gray-300 text-lg mb-8">
              We're always looking for talented professionals to join our mission of transforming enterprise technology.
            </p>
            <a
              href="/contact"
              className="inline-block px-8 py-3 bg-cyan-500 text-white font-semibold rounded-lg hover:bg-cyan-600 transition"
            >
              Get In Touch
            </a>
          </div>
        </section>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
