import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Zap, Brain, Shield, Cpu, Mail, ArrowRight } from "lucide-react";
import AriaAssistant from "@/components/AriaAssistant";

export default function Home() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [demoActive, setDemoActive] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      setEmail("");
      setTimeout(() => setSubmitted(false), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      {/* Aria AI Assistant Widget */}
      <AriaAssistant />
      {/* Animated background grid */}
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#00D4FF_1px,transparent_1px),linear-gradient(#00D4FF_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-cyan-500/20 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="text-2xl font-bold">
              <span className="text-white">Gigitek</span>
              <span className="text-cyan-400">AI</span>
            </div>
            <div className="text-sm text-cyan-400 font-mono">Agentic AI Solutions</div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-sm font-medium">
              <Zap className="w-4 h-4" />
              Building the Future of AI
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              <span className="block text-white mb-2">Agentic AI</span>
              <span className="block bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Reimagining Enterprise
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
              GigitekAI is building the next generation of AI-powered managed services. Our agentic AI solutions act as full employees, automating workflows, orchestrating systems, and delivering measurable ROI across Microsoft 365, cloud infrastructure, and intelligent helpdesk operations.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button
                onClick={() => setDemoActive(!demoActive)}
                className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold px-8 py-6 text-lg rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Brain className="w-5 h-5" />
                See AI Demo
              </Button>
              <Button
                variant="outline"
                className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10 px-8 py-6 text-lg rounded-lg"
              >
                Get Early Access
              </Button>
            </div>

            {/* Status Badge */}
            <div className="pt-8 text-center">
              <p className="text-sm text-slate-400 font-mono">
                🚀 Official Launch Coming Soon
              </p>
            </div>
          </div>
        </section>

        {/* Live Agentic AI Demo Section */}
        {demoActive && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-cyan-500/20">
            <div className="space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-3xl md:text-4xl font-bold">
                  Agentic AI in Action
                </h2>
                <p className="text-slate-400">
                  Watch our AI agents orchestrate complex workflows in real-time
                </p>
              </div>

              {/* Demo Container */}
              <div className="bg-slate-900/50 border border-cyan-500/30 rounded-lg p-8 backdrop-blur-sm space-y-6">
                {/* Demo Scenario 1: Helpdesk Automation */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
                    <h3 className="text-lg font-semibold text-cyan-300">
                      Scenario 1: Intelligent Helpdesk Agent
                    </h3>
                  </div>
                  <div className="bg-slate-950 rounded p-4 font-mono text-sm space-y-2 text-slate-300">
                    <div>
                      <span className="text-cyan-400">Agent:</span> Analyzing ticket...
                    </div>
                    <div>
                      <span className="text-cyan-400">Input:</span> "User cannot access
                      OneDrive"
                    </div>
                    <div>
                      <span className="text-green-400">✓ Classification:</span> Access
                      Issue
                    </div>
                    <div>
                      <span className="text-green-400">✓ Routing:</span> Identity Team
                    </div>
                    <div>
                      <span className="text-green-400">✓ Action:</span> Checking Entra
                      ID permissions...
                    </div>
                    <div>
                      <span className="text-green-400">✓ Resolution:</span> Restored
                      access in 45 seconds
                    </div>
                  </div>
                </div>

                {/* Demo Scenario 2: Multi-System Provisioning */}
                <div className="space-y-4 pt-6 border-t border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                    <h3 className="text-lg font-semibold text-blue-300">
                      Scenario 2: Multi-System Provisioning
                    </h3>
                  </div>
                  <div className="bg-slate-950 rounded p-4 font-mono text-sm space-y-2 text-slate-300">
                    <div>
                      <span className="text-blue-400">Agent:</span> New employee
                      onboarding...
                    </div>
                    <div>
                      <span className="text-blue-400">Input:</span> "Provision John
                      Doe - Sales"
                    </div>
                    <div>
                      <span className="text-green-400">✓ Entra ID:</span> User account
                      created
                    </div>
                    <div>
                      <span className="text-green-400">✓ Exchange:</span> Mailbox
                      provisioned
                    </div>
                    <div>
                      <span className="text-green-400">✓ Teams:</span> Added to Sales
                      channels
                    </div>
                    <div>
                      <span className="text-green-400">✓ Intune:</span> Device enrolled
                    </div>
                    <div>
                      <span className="text-green-400">✓ AWS:</span> Cloud access
                      configured
                    </div>
                    <div>
                      <span className="text-green-400">✓ Complete:</span> All systems
                      ready in 3.4 seconds
                    </div>
                  </div>
                </div>

                {/* Demo Stats */}
                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-700">
                  <div className="text-center space-y-2">
                    <div className="text-2xl font-bold text-cyan-400">40%</div>
                    <div className="text-xs text-slate-400">Cost Reduction</div>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="text-2xl font-bold text-blue-400">280+</div>
                    <div className="text-xs text-slate-400">Hours Freed Monthly</div>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="text-2xl font-bold text-purple-400">3.4s</div>
                    <div className="text-xs text-slate-400">Provisioning Time</div>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <Button
                  onClick={() => setDemoActive(false)}
                  variant="ghost"
                  className="text-slate-400 hover:text-cyan-400"
                >
                  Close Demo
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* Tech Stack & Vision Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-cyan-500/20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Vision */}
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                Our Vision: AI as Full Employees
              </h2>
              <p className="text-slate-300 leading-relaxed">
                We're building intelligent agents that work like full employees—not
                chatbots or scripts. Our agentic AI orchestrates across Microsoft 365,
                cloud infrastructure, and security systems to deliver enterprise-grade
                solutions at MSP speed.
              </p>
              <ul className="space-y-3">
                {[
                  "Autonomous workflow orchestration",
                  "Multi-system integration & provisioning",
                  "Intelligent helpdesk automation",
                  "Security & compliance automation",
                  "Real-time threat response",
                  "24/7 AI-powered support",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-300">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: Tech Stack */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold">Technology Stack</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Brain, label: "AI/ML", color: "text-cyan-400" },
                  { icon: Shield, label: "Security", color: "text-blue-400" },
                  { icon: Cpu, label: "Cloud", color: "text-purple-400" },
                  { icon: Zap, label: "Automation", color: "text-yellow-400" },
                ].map((tech, i) => {
                  const Icon = tech.icon;
                  return (
                    <div
                      key={i}
                      className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 flex flex-col items-center gap-2 hover:border-cyan-500/50 transition-colors"
                    >
                      <Icon className={`w-6 h-6 ${tech.color}`} />
                      <span className="text-sm font-medium text-slate-300">
                        {tech.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-700">
                <h4 className="font-semibold text-slate-300">Core Platforms</h4>
                <div className="text-sm text-slate-400 space-y-1">
                  <p>• Microsoft 365 (Entra ID, Exchange, Teams, Intune)</p>
                  <p>• AWS, Azure, Google Cloud</p>
                  <p>• Zero Trust & NIST Compliance</p>
                  <p>• HIPAA, SOC 2, PCI-DSS Ready</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Early Access Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-cyan-500/20">
          <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-lg p-12 text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              Be First to Experience GigitekAI
            </h2>
            <p className="text-slate-300 max-w-2xl mx-auto">
              Join enterprise leaders who are transforming their operations with
              agentic AI. Get early access to our platform and exclusive insights.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-500 rounded-lg"
                required
              />
              <Button
                type="submit"
                className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold px-6 rounded-lg whitespace-nowrap flex items-center justify-center gap-2"
              >
                {submitted ? "✓ Sent!" : "Get Access"}
                {!submitted && <ArrowRight className="w-4 h-4" />}
              </Button>
            </form>

            {submitted && (
              <p className="text-green-400 text-sm">
                Thank you! We'll be in touch soon.
              </p>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-700 mt-20 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <h4 className="font-semibold text-white mb-4">GigitekAI</h4>
                <p className="text-sm text-slate-400">
                  Enterprise AI solutions for modern businesses.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Services</h4>
                <ul className="text-sm text-slate-400 space-y-2">
                  <li>AI Automation</li>
                  <li>Managed Services</li>
                  <li>Cloud Infrastructure</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Contact</h4>
                <ul className="text-sm text-slate-400 space-y-2">
                  <li>support@gigitekai.com</li>
                  <li>(727) 382-6909</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Follow</h4>
                <ul className="text-sm text-slate-400 space-y-2">
                  <li>LinkedIn</li>
                  <li>Twitter</li>
                  <li>GitHub</li>
                </ul>
              </div>
            </div>

            <div className="border-t border-slate-700 pt-8 text-center text-sm text-slate-500">
              <p>© 2026 GigitekAI. All rights reserved. | Coming Soon</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
