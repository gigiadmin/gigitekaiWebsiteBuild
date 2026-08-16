/*
  GigitekAI Premium Footer — Minimal, institutional
*/

export default function PremiumFooter() {
  return (
    <footer className="bg-black border-t border-white/5 py-16">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          {/* Logo */}
          <a href="/" className="font-['Space_Grotesk'] text-xl font-bold text-white no-underline">
            Gigitek<span className="text-[#00D4FF]">AI</span>
          </a>

          {/* Quick links */}
          <div className="flex flex-wrap items-center gap-6 lg:gap-10">
            <a href="/services" className="text-[#F5F5F5]/50 hover:text-white text-sm font-['DM_Sans'] transition-colors no-underline">Services</a>
            <a href="/about" className="text-[#F5F5F5]/50 hover:text-white text-sm font-['DM_Sans'] transition-colors no-underline">About</a>
            <a href="/kb" className="text-[#F5F5F5]/50 hover:text-white text-sm font-['DM_Sans'] transition-colors no-underline">Insights</a>
            <a href="/contact" className="text-[#F5F5F5]/50 hover:text-white text-sm font-['DM_Sans'] transition-colors no-underline">Contact</a>
            <a href="https://www.linkedin.com/in/gigitekinc" target="_blank" rel="noopener noreferrer" className="text-[#F5F5F5]/50 hover:text-white text-sm font-['DM_Sans'] transition-colors no-underline">LinkedIn</a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[#F5F5F5]/30 text-xs font-['DM_Sans']">
            &copy; 2026 GigitekAI LLC. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="/privacy" className="text-[#F5F5F5]/30 hover:text-[#F5F5F5]/60 text-xs font-['DM_Sans'] transition-colors no-underline">Privacy</a>
            <a href="/terms" className="text-[#F5F5F5]/30 hover:text-[#F5F5F5]/60 text-xs font-['DM_Sans'] transition-colors no-underline">Terms</a>
            <span className="text-[#F5F5F5]/20 text-xs font-['DM_Sans']">
              Created by <a href="https://gigitekai.com" className="text-[#F5F5F5]/30 hover:text-[#00D4FF] no-underline transition-colors">GigitekAI</a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

