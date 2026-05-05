/*
  GigitekAI Footer — Deloitte-Style Professional Design
  - Professional layout with enhanced spacing and typography
  - +25% larger font sizes
  - Massive whitespace and professional spacing
  - Clean minimal design
*/

import { Linkedin, Twitter, Facebook, Youtube } from "lucide-react";

const footerLinks = {
  Services: [
    "Cloud Infrastructure",
    "AI & Machine Learning",
    "Managed IT Services",
    "Cybersecurity",
    "Data Analytics",
    "IT Strategy",
  ],
  Company: [
    "About Us",
    "Our Team",
    "Partners",
    "Contact Us",
  ],
  Resources: [
    "Insights Blog",
    "Support Portal",
  ],
  Industries: [
    "Healthcare",
    "Financial Services",
    "Manufacturing",
    "Retail & eCommerce",
    "Government",
    "Education",
  ],
};

const socials = [
  { icon: Linkedin, href: "https://www.linkedin.com/company/gigitekai", label: "LinkedIn" },
  { icon: Twitter, href: "https://twitter.com/gigitekai", label: "Twitter" },
  { icon: Facebook, href: "https://www.facebook.com/gigitekai", label: "Facebook" },
  { icon: Youtube, href: "https://www.youtube.com/@gigitekai", label: "YouTube" },
];

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-[#050810] border-t border-gray-200 dark:border-[rgba(0,212,255,0.1)]">
      {/* Main footer - +25% larger spacing */}
      <div className="container py-24 lg:py-32">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-16 lg:gap-20">
          {/* Brand - Professional styling - +25% larger */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <a href="/" className="flex items-center gap-0 mb-8">
              <span className="text-3xl font-bold leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                <span className="text-gray-900 dark:text-white">Gigitek</span><span className="text-[#00D4FF]">AI</span>
              </span>
            </a>
            <p className="text-gray-600 dark:text-gray-500 text-base leading-relaxed mb-10 max-w-xs">
              Enterprise cloud infrastructure, AI solutions, and managed services that transform how businesses operate and scale.
            </p>
            
            {/* Contact info - +25% larger */}
            <div className="space-y-4 mb-10">
              <a href="tel:+17273825776" className="flex items-center gap-4 text-base text-gray-600 dark:text-gray-400 hover:text-[#00D4FF] transition-colors group">
                <div className="w-10 h-10 rounded-lg bg-[#00D4FF]/10 border border-[#00D4FF]/20 flex items-center justify-center group-hover:border-[#00D4FF]/50 transition-all flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                </div>
                (727) 382-5776
              </a>
              <a href="mailto:support@gigitekai.com" className="flex items-center gap-4 text-base text-gray-600 dark:text-gray-400 hover:text-[#00D4FF] transition-colors group">
                <div className="w-10 h-10 rounded-lg bg-[#00D4FF]/10 border border-[#00D4FF]/20 flex items-center justify-center group-hover:border-[#00D4FF]/50 transition-all flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                </div>
                support@gigitekai.com
              </a>
            </div>
            
            {/* Social icons - +25% larger */}
            <div className="flex items-center gap-4">
              {socials.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-12 h-12 rounded-lg bg-white dark:bg-[#0F1629] border border-gray-300 dark:border-[rgba(0,212,255,0.2)] flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-[#00D4FF] hover:border-[#00D4FF]/50 hover:bg-[#00D4FF]/10 dark:hover:bg-[#00D4FF]/10 transition-all duration-200"
                >
                  <Icon size={20} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns - Professional styling - +25% larger */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4
                className="text-gray-900 dark:text-white font-bold text-base mb-8 uppercase tracking-wide"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {category}
              </h4>
              <ul className="space-y-4">
                {links.map((link) => {
                  let href = "#";
                  if (link === "About Us") href = "/about-us";
                  if (link === "Our Team") href = "/our-team";
                  if (link === "Partners") href = "/partners";
                  if (link === "Contact Us") href = "/contact";
                  if (link === "Insights Blog") href = "/blog";
                  if (link === "Support Portal") href = "/helpdesk";
                  if (link === "Cloud Infrastructure") href = "/services/cloud";
                  if (link === "AI & Machine Learning") href = "/services/ai";
                  if (link === "Managed IT Services") href = "/services/managed";
                  if (link === "Cybersecurity") href = "/services/security";
                  if (link === "Data Analytics") href = "/services/data";
                  if (link === "IT Strategy") href = "/services/strategy";
                  if (link === "Healthcare") href = "/industries/healthcare";
                  if (link === "Financial Services") href = "/industries/financial-services";
                  if (link === "Manufacturing") href = "/industries/manufacturing";
                  if (link === "Retail & eCommerce") href = "/industries/retail-ecommerce";
                  if (link === "Government") href = "/industries/government";
                  if (link === "Education") href = "/industries/education";
                  return (
                    <li key={link}>
                      <a
                        href={href}
                        className="text-gray-600 dark:text-gray-500 text-base hover:text-[#00D4FF] transition-colors duration-200"
                      >
                        {link}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar - Professional styling - +25% larger */}
      <div className="border-t border-gray-200 dark:border-[rgba(0,212,255,0.08)]">
        <div className="container py-10 lg:py-12 flex flex-col sm:flex-row items-center justify-between gap-8">
          <div>
            <p className="text-gray-600 dark:text-gray-600 text-sm">
              © {new Date().getFullYear()} GigitekAI LLC. All rights reserved.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-10 lg:gap-12">
            {/* Contact Info - +25% larger */}
            <div className="flex items-center gap-8 text-sm text-gray-600 dark:text-gray-500">
              <a href="tel:+17273825776" className="flex items-center gap-2 hover:text-[#00D4FF] transition-colors font-medium">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                (727) 382-5776
              </a>
              <span className="text-gray-400 dark:text-gray-700">•</span>
              <a href="mailto:support@gigitekai.com" className="flex items-center gap-2 hover:text-[#00D4FF] transition-colors font-medium">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                support@gigitekai.com
              </a>
            </div>
            
            {/* Legal Links - +25% larger */}
            <div className="flex items-center gap-8">
              <a
                href="/privacy-policy"
                className="text-gray-600 dark:text-gray-600 text-sm hover:text-[#00D4FF] transition-colors font-medium"
              >
                Privacy Policy
              </a>
              <span className="text-gray-400 dark:text-gray-700">•</span>
              <a
                href="/terms-of-service"
                className="text-gray-600 dark:text-gray-600 text-sm hover:text-[#00D4FF] transition-colors font-medium"
              >
                Terms of Service
              </a>
              <span className="text-gray-400 dark:text-gray-700">•</span>
              <a
                href="/sitemap.xml"
                className="text-gray-600 dark:text-gray-600 text-sm hover:text-[#00D4FF] transition-colors font-medium"
              >
                Sitemap
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
