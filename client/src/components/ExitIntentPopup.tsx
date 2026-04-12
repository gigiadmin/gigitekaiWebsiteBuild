/**
 * Exit Intent Popup Component
 * Triggers when user moves cursor to leave the site
 */
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface ExitIntentPopupProps {
  leadMagnet?: string;
}

export function ExitIntentPopup({ leadMagnet = "10 Signs Your Business Needs an IT Upgrade" }: ExitIntentPopupProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const captureMutation = trpc.leadgen.captureExitIntent.useMutation();

  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger if mouse is leaving from top of page
      if (e.clientY <= 0 && !isVisible && !submitted) {
        setIsVisible(true);
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    return () => document.removeEventListener("mouseleave", handleMouseLeave);
  }, [isVisible, submitted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !firstName || !lastName) {
      alert("Please fill in required fields");
      return;
    }

    try {
      await captureMutation.mutateAsync({
        email,
        firstName,
        lastName,
        phone,
        companyName,
        leadMagnetDownloaded: leadMagnet,
        pageUrl: window.location.href,
      });
      setSubmitted(true);
    } catch (error) {
      console.error("Failed to capture lead:", error);
      alert("Failed to submit. Please try again.");
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-cyan-500/30 rounded-lg max-w-md w-full p-8 relative">
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X size={24} />
        </button>

        {!submitted ? (
          <>
            <h2 className="text-2xl font-bold text-white mb-2">Wait! Before You Go...</h2>
            <p className="text-cyan-400 text-sm mb-6">
              Get our free guide: <span className="font-semibold">{leadMagnet}</span>
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="bg-slate-700 border-slate-600 text-white text-sm"
                />
                <Input
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="bg-slate-700 border-slate-600 text-white text-sm"
                />
              </div>

              <Input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-slate-700 border-slate-600 text-white text-sm"
              />

              <Input
                placeholder="Company (Optional)"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white text-sm"
              />

              <Input
                placeholder="Phone (Optional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white text-sm"
              />

              <Button
                type="submit"
                disabled={captureMutation.isPending}
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold"
              >
                {captureMutation.isPending ? "Sending..." : "Get Free Guide"}
              </Button>

              <button
                type="button"
                onClick={() => setIsVisible(false)}
                className="w-full text-gray-400 hover:text-white text-sm py-2"
              >
                No thanks, I'll pass
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📧</div>
            <h3 className="text-xl font-bold text-white mb-2">Check Your Email!</h3>
            <p className="text-gray-400 text-sm mb-6">
              We've sent your free guide to {email}. Our team will reach out within 24 hours.
            </p>
            <Button
              onClick={() => setIsVisible(false)}
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold"
            >
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
