import { LOGO_DATA_URL } from "@/lib/logoData";
/*
  GigitekAI Footer — Dark background, links, social, copyright
  Mirrors appliedtech.us footer structure
*/

import { Linkedin, Twitter, Facebook, Youtube } from "lucide-react";

const footerLinks = {
  Services: [
    "Cloud Infrastructure",
    "AI & Machine Learning",
    "Microsoft 365",
    "Managed IT Services",
    "Cybersecurity",
    "Data Analytics",
    "IT Strategy",
  ],
  Company: [
    "Partners",
    "Contact Us",
  ],
  Resources: [
    "Insights Blog",
    "Support Portal",
  ],
  Tools: [
    "Compliance Scorecard",
    "Florida IT Resiliency",
    "The Switch Program",
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

// Note: Update these URLs with actual GigitekAI social media profiles when available

export default function Footer() {
  return (
    <footer className="bg-gray-100 dark:bg-[#050810] border-t border-gray-200 dark:border-[rgba(0,212,255,0.1)]">
      {/* Main footer */}
      <div className="container py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <a href="/" className="flex items-center gap-2 mb-4">
              <img 
                src={LOGO_DATA_URL} 
                alt="GigitekAI logo" 
                className="h-12 w-auto object-contain"
                width="490"
                height="140"
                decoding="async"
              />
            </a>
            <p className="text-gray-300 text-sm leading-relaxed mb-4 max-w-xs">
              Security-first managed IT + governed AI for Tampa Bay SMBs. We help healthcare, legal, and construction firms reduce risk, ensure compliance, and automate operations.
            </p>
            <div className="space-y-2 mb-6">
              <a href="tel:+1727-382-6909" className="flex items-center gap-2 text-sm text-gray-300 hover:text-[#00D4FF] transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                (727) 382-6909
              </a>
              <a href="mailto:support@gigitekai.com" className="flex items-center gap-2 text-sm text-gray-300 hover:text-[#00D4FF] transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                support@gigitekai.com
              </a>
            </div>
            <div className="flex items-center gap-3">
              {socials.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-white/5 border border-gray-300 dark:border-white/10 flex items-center justify-center text-gray-300 hover:text-[#00D4FF] hover:border-[#00D4FF]/30 hover:bg-[#00D4FF]/10 transition-colors"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4
                className="text-gray-900 dark:text-white font-bold text-sm mb-4"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {category}
              </h4>
              <ul className="space-y-2.5">
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
                  if (link === "Microsoft 365") href = "/services/microsoft-365";
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
                  if (link === "Compliance Scorecard") href = "/compliance-scorecard";
                  if (link === "Florida IT Resiliency") href = "/florida-it-resiliency";
                  if (link === "The Switch Program") href = "/switch-program";
                  return (
                  <li key={link}>
                    <a
                      href={href}
                      className="text-gray-300 text-sm hover:text-[#00D4FF] transition-colors"
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

      {/* Bottom bar */}
      <div className="border-t border-gray-200 dark:border-[rgba(0,212,255,0.08)]">
        <div className="container py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-gray-300 text-xs">
              © {new Date().getFullYear()} GigitekAI LLC. All rights reserved.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Contact Info */}
            <div className="flex items-center gap-4 text-xs text-gray-300">
              <a href="tel:+1727-382-6909" className="flex items-center gap-1 hover:text-[#00D4FF] transition-colors font-medium">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                (727) 382-6909
              </a>
              <span className="text-gray-300">|</span>
              <a href="mailto:support@gigitekai.com" className="flex items-center gap-1 hover:text-[#00D4FF] transition-colors font-medium">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                support@gigitekai.com
              </a>
            </div>
            
            {/* Legal Links */}
            <div className="flex items-center gap-4">
              <a
                href="/privacy-policy"
                className="text-gray-300 text-xs hover:text-[#00D4FF] transition-colors font-medium underline underline-offset-2"
              >
                Privacy Policy
              </a>
              <span className="text-gray-300">|</span>
              <a
                href="/terms-of-service"
                className="text-gray-300 text-xs hover:text-[#00D4FF] transition-colors font-medium underline underline-offset-2"
              >
                Terms of Service
              </a>
              <span className="text-gray-300">|</span>
              <a
                href="/sitemap.xml"
                className="text-gray-300 text-xs hover:text-[#00D4FF] transition-colors"
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
