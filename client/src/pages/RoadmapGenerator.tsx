import { useState } from "react";
import { useSEO } from "@/hooks/useSEO";
import SiteNavBar2024 from "@/components/SiteNavBar2024";
import Footer from "@/components/Footer";
import { Download, Zap, CheckCircle } from "lucide-react";

export default function RoadmapGenerator() {
  const [score, setScore] = useState<number | null>(null);
  const [email, setEmail] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  useSEO({
    title: "AI Roadmap Generator | GigitekAI",
    description: "Generate a personalized IT compliance remediation roadmap powered by AI.",
    path: "/roadmap-generator",
  });

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!score || !email) return;

    setGenerating(true);
    try {
      const response = await fetch("/api/trpc/roadmap.generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score, email }),
      });

      if (response.ok) {
        setGenerated(true);
        setTimeout(() => {
          setScore(null);
          setEmail("");
          setGenerated(false);
        }, 3000);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <SiteNavBar2024 />
      <main className="flex-1">
        <section className="pt-32 pb-12 px-4 border-b border-white/5">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              AI <span className="text-[#00D4FF]">Roadmap Generator</span>
            </h1>
            <p className="text-gray-400 text-lg">Get a personalized 90-day remediation plan powered by AI</p>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="p-8 rounded-xl border border-[#00D4FF]/20 bg-[#00D4FF]/5">
              <h3 className="text-2xl font-bold mb-6">Generate Your Roadmap</h3>
              <form onSubmit={handleGenerate} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Your Compliance Score</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Enter your score (0-100)"
                    value={score || ""}
                    onChange={(e) => setScore(e.target.value ? parseInt(e.target.value) : null)}
                    required
                    className="w-full px-4 py-3 bg-[#0A0E1A]/60 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00D4FF]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Your Email</label>
                  <input
                    type="email"
                    placeholder="your@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-[#0A0E1A]/60 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00D4FF]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={generating || !score || !email}
                  className="w-full bg-[#00D4FF] text-[#0A0E1A] px-6 py-3 rounded-lg font-bold hover:bg-[#00D4FF]/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Zap size={18} />
                  {generating ? "Generating..." : "Generate Roadmap"}
                </button>
              </form>

              {generated && (
                <div className="mt-6 p-4 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center gap-3">
                  <CheckCircle size={20} className="text-green-500" />
                  <div>
                    <p className="font-semibold">Roadmap Generated!</p>
                    <p className="text-sm text-gray-300">Check your email for your personalized 90-day plan</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-12 grid md:grid-cols-3 gap-6">
              <div className="p-6 rounded-lg border border-white/10 bg-[#0D1528]/50">
                <div className="text-3xl font-bold text-[#00D4FF] mb-2">90 Days</div>
                <p className="text-gray-400">Realistic timeline to reach 85+ score</p>
              </div>
              <div className="p-6 rounded-lg border border-white/10 bg-[#0D1528]/50">
                <div className="text-3xl font-bold text-[#00D4FF] mb-2">AI-Powered</div>
                <p className="text-gray-400">Personalized to your industry and score</p>
              </div>
              <div className="p-6 rounded-lg border border-white/10 bg-[#0D1528]/50">
                <div className="text-3xl font-bold text-[#00D4FF] mb-2">PDF Export</div>
                <p className="text-gray-400">Share with your team instantly</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
