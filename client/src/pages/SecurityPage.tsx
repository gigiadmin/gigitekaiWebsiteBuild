import { Shield, Lock, Key, FileText, CheckCircle } from "lucide-react";

export default function SecurityPage() {
  const securityPillars = [
    {
      icon: Shield,
      title: "Never used to train models",
      description:
        "Your data stays your data — never retained for training, never shared, never out of your tenant. Complete data isolation and confidentiality.",
    },
    {
      icon: Lock,
      title: "Tenant isolation & data residency",
      description:
        "A dedicated, encrypted environment for your organization, with the option to keep all data in your chosen jurisdiction. Full compliance with data sovereignty requirements.",
    },
    {
      icon: Key,
      title: "Role-based access & security controls",
      description:
        "Granular permissions and team-level access controls enforce security protocols and information barriers automatically. Zero Trust architecture.",
    },
    {
      icon: FileText,
      title: "Complete, exportable audit trail",
      description:
        "Every action, query, and output is logged — defensible for clients, regulators, and compliance audits. Full transparency and accountability.",
    },
  ];

  const complianceBadges = [
    { label: "SOC 2 Type II", icon: "✓" },
    { label: "ISO 27001", icon: "✓" },
    { label: "AES-256 Encryption", icon: "✓" },
    { label: "HIPAA Ready", icon: "✓" },
    { label: "GDPR Compliant", icon: "✓" },
    { label: "Zero Trust", icon: "✓" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 opacity-50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column */}
            <div>
              <div className="mb-6">
                <span className="inline-block text-cyan-400 text-sm font-semibold tracking-wider uppercase">
                  TRUST & SECURITY
                </span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
                Built for the duty of <span className="italic text-cyan-400">confidentiality.</span>
              </h1>
              <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                For enterprises managing critical infrastructure and sensitive data, security is not a procurement checkbox — it is a fundamental obligation. GigitekAI was designed from the first line of code to honor it.
              </p>

              {/* Compliance Badges */}
              <div className="flex flex-wrap gap-3 mb-8">
                {complianceBadges.map((badge, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-full text-sm text-slate-200 hover:border-cyan-400 transition-colors"
                  >
                    <span className="text-cyan-400 font-bold">{badge.icon}</span>
                    {badge.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column - Visual */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl blur-3xl"></div>
              <div className="relative bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8 md:p-12">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <Shield className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-white font-semibold mb-1">Enterprise-Grade Security</h3>
                      <p className="text-slate-400 text-sm">
                        Multi-layered defense mechanisms protecting your infrastructure 24/7
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Lock className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-white font-semibold mb-1">Data Sovereignty</h3>
                      <p className="text-slate-400 text-sm">
                        Your data remains under your control in your chosen jurisdiction
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Key className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-white font-semibold mb-1">Access Control</h3>
                      <p className="text-slate-400 text-sm">
                        Granular permissions and role-based access for every team member
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Pillars Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Security as a <span className="text-cyan-400">Core Value</span>
          </h2>
          <p className="text-xl text-slate-400 max-w-3xl">
            We don't bolt on security as an afterthought. It's woven into every layer of our infrastructure and operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {securityPillars.map((pillar, index) => {
            const Icon = pillar.icon;
            return (
              <div
                key={index}
                className="group bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8 hover:border-cyan-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-cyan-500/10 rounded-lg group-hover:bg-cyan-500/20 transition-colors">
                    <Icon className="w-6 h-6 text-cyan-400" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{pillar.title}</h3>
                <p className="text-slate-400 leading-relaxed">{pillar.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Compliance & Standards Section */}
      <div className="bg-slate-800/30 backdrop-blur border-y border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h2 className="text-4xl font-bold text-white mb-4 text-center">
            Industry-Leading <span className="text-cyan-400">Compliance</span>
          </h2>
          <p className="text-xl text-slate-400 text-center max-w-3xl mx-auto mb-12">
            We maintain certifications and compliance standards required by the most demanding enterprises and regulatory bodies.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-cyan-400 mb-2">SOC 2 Type II</div>
              <p className="text-slate-400">
                Independently audited controls for security, availability, and confidentiality
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-cyan-400 mb-2">ISO 27001</div>
              <p className="text-slate-400">
                International standard for information security management systems
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-cyan-400 mb-2">AES-256</div>
              <p className="text-slate-400">
                Military-grade encryption for data at rest and in transit
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Security Features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-4xl font-bold text-white mb-12 text-center">
          Advanced Security <span className="text-cyan-400">Features</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: "Multi-Factor Authentication",
              description: "Enforce MFA across all user accounts and administrative access",
            },
            {
              title: "Encryption Everywhere",
              description: "End-to-end encryption for data in transit and at rest",
            },
            {
              title: "Intrusion Detection",
              description: "Real-time monitoring and alerting for suspicious activities",
            },
            {
              title: "Automated Backups",
              description: "Redundant backups with geo-distributed failover capabilities",
            },
            {
              title: "Incident Response",
              description: "24/7 security operations center with rapid response protocols",
            },
            {
              title: "Compliance Reporting",
              description: "Automated audit trails and compliance documentation",
            },
          ].map((feature, index) => (
            <div key={index} className="flex items-start gap-4 p-6 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-cyan-400/30 transition-colors">
              <CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-white font-semibold mb-1">{feature.title}</h3>
                <p className="text-slate-400 text-sm">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-y border-slate-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to secure your infrastructure?
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Let's discuss how GigitekAI's security-first approach can protect your organization.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/web-discovery-intake"
              className="inline-block bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
            >
              Start Your Discovery
            </a>
            <a
              href="mailto:support@gigitekai.com"
              className="inline-block bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
            >
              Contact Security Team
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
