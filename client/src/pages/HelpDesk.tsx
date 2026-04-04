import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function HelpDesk() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate("/helpdesk/dashboard");
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] to-[#141B2D] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00D4FF] mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] to-[#141B2D]">
      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-[#0A0E1A]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#00D4FF] rounded-lg flex items-center justify-center">
              <span className="text-[#0A0E1A] font-bold text-sm">?</span>
            </div>
            <span className="text-white font-bold">GigitekAI Help Desk</span>
          </div>
          <a href="/" className="text-gray-400 hover:text-white transition">Back to Site</a>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Help Desk Support
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            Get help from our support team. Create tickets, track your requests, and get quick resolutions.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-[#141B2D] border border-gray-800 rounded-lg p-6 hover:border-[#00D4FF] transition">
            <div className="w-12 h-12 bg-[#00D4FF]/10 rounded-lg flex items-center justify-center mb-4">
              <span className="text-[#00D4FF] text-xl">📋</span>
            </div>
            <h3 className="text-white font-semibold mb-2">Create Tickets</h3>
            <p className="text-gray-400 text-sm">
              Submit support requests with priority levels and categories for faster resolution.
            </p>
          </div>

          <div className="bg-[#141B2D] border border-gray-800 rounded-lg p-6 hover:border-[#00D4FF] transition">
            <div className="w-12 h-12 bg-[#00D4FF]/10 rounded-lg flex items-center justify-center mb-4">
              <span className="text-[#00D4FF] text-xl">👁️</span>
            </div>
            <h3 className="text-white font-semibold mb-2">Track Progress</h3>
            <p className="text-gray-400 text-sm">
              Monitor your ticket status in real-time and see updates from our support team.
            </p>
          </div>

          <div className="bg-[#141B2D] border border-gray-800 rounded-lg p-6 hover:border-[#00D4FF] transition">
            <div className="w-12 h-12 bg-[#00D4FF]/10 rounded-lg flex items-center justify-center mb-4">
              <span className="text-[#00D4FF] text-xl">💬</span>
            </div>
            <h3 className="text-white font-semibold mb-2">Direct Communication</h3>
            <p className="text-gray-400 text-sm">
              Communicate directly with our support team through ticket replies and updates.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-[#141B2D] border border-[#00D4FF]/30 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Ready to get support?</h2>
          <p className="text-gray-400 mb-6">
            Sign in with your account to access the help desk and create your first ticket.
          </p>
          <a href={getLoginUrl()}>
            <Button size="lg" className="bg-[#00D4FF] hover:bg-[#00B8CC] text-[#0A0E1A] font-semibold">
              Sign In to Help Desk
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
