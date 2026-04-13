/*
  GigitekAI Footer — Dark background, links, social, copyright
  Mirrors appliedtech.us footer structure
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
    "Careers",
    "Our Team",
    "Partners",
    "Press",
    "Contact Us",
  ],
  Resources: [
    "Insights Blog",
    "Case Studies",
    "Whitepapers",
    "Webinars",
    "Documentation",
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

// Note: Update these URLs with actual GigitekAI social media profiles when available

export default function Footer() {
  return (
    <footer className="bg-gray-100 dark:bg-[#050810] border-t border-gray-200 dark:border-[rgba(0,212,255,0.1)]">
      {/* Main footer */}
      <div className="container py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <a href="#" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-md bg-[#00D4FF] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 2L18 7V13L10 18L2 13V7L10 2Z" fill="#0A0E1A" />
                  <path d="M10 6L14 8.5V13.5L10 16L6 13.5V8.5L10 6Z" fill="#00D4FF" />
                </svg>
              </div>
              <span className="font-bold text-xl text-gray-900 dark:text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Gigitek<span className="text-[#00D4FF]">AI</span>
              </span>
            </a>
            <p className="text-gray-500 text-sm leading-relaxed mb-6 max-w-xs">
              Enterprise cloud infrastructure, AI solutions, and managed services that transform how businesses operate and scale.
            </p>
            <div className="flex items-center gap-3">
              {socials.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-lg bg-gray-200 dark:bg-white/5 border border-gray-300 dark:border-white/10 flex items-center justify-center text-gray-400 hover:text-[#00D4FF] hover:border-[#00D4FF]/30 hover:bg-[#00D4FF]/10 transition-all"
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
                  if (link === "About Us") href = "/about";
                  if (link === "Careers") href = "/careers";
                  if (link === "Contact Us") href = "/#contact";
                  if (link === "Insights Blog") href = "/blog";
                  return (
                  <li key={link}>
                    <a
                      href={href}
                      className="text-gray-500 text-sm hover:text-[#00D4FF] transition-colors"
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
            <p className="text-gray-600 text-xs">
              © {new Date().getFullYear()} GigitekAI LLC. All rights reserved.
            </p>
          </div>
          <div className="flex items-center gap-6">
            {["Privacy Policy", "Terms of Service", "Accessibility", "Sitemap"].map((item) => (
              <a
                key={item}
                href="#"
                className="text-gray-600 text-xs hover:text-[#00D4FF] transition-colors"
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
