/*
  Harry's Contact Landing Page
  URL: gigitekai.com/hh
  Professional contact card with QR code
*/

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Globe, Download } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import { SEO_CONFIG } from "@/lib/seoConfig";

export default function ContactHarry() {
  useSEO({ ...SEO_CONFIG["/hh"], path: "/hh" });

  const [downloadReady] = useState(true);

  const headshot = "/manus-storage/harry-headshot_7c4b2215.jpg";
  const qrCode = "/manus-storage/qr-code-hh_5c26fc79.png";

  const handleAddContact = () => {
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:Harry Henry Santiago
TITLE:CEO & Founder
ORG:GigitekAI
EMAIL:harry@gigitekai.com
TEL:+1-(727) 382-5776
URL:https://gigitekai.com
END:VCARD`;

    const blob = new Blob([vcard], { type: "text/vcard" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Harry-Henry-Santiago.vcf";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Background accent */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          {/* Card */}
          <div className="bg-slate-800/50 backdrop-blur-lg border border-cyan-500/20 rounded-2xl p-8 shadow-2xl">
            {/* Headshot */}
            <div className="mb-8">
              <img
                src={headshot}
                alt="Harry Henry Santiago"
                className="w-full h-80 object-cover rounded-xl shadow-lg"
              loading="lazy"
            />
            </div>

            {/* Name & Title */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">
                Harry Henry Santiago
              </h1>
              <p className="text-cyan-400 font-semibold text-lg">
                CEO & Founder
              </p>
              <p className="text-slate-400 text-sm mt-1">GigitekAI</p>
            </div>

            {/* Contact Info */}
            <div className="space-y-4 mb-8">
              {/* Email */}
              <a
                href="mailto:harry@gigitekai.com"
                className="flex items-center gap-3 p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors group"
              >
                <Mail className="w-5 h-5 text-cyan-400 group-hover:text-cyan-300" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-400">Email</p>
                  <p className="text-white text-sm truncate">
                    harry@gigitekai.com
                  </p>
                </div>
              </a>

              {/* Phone */}
              <a
                href="tel:+1727-382-5776"
                className="flex items-center gap-3 p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors group"
              >
                <Phone className="w-5 h-5 text-cyan-400 group-hover:text-cyan-300" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-400">Phone</p>
                  <p className="text-white text-sm">(727) 382-5776</p>
                </div>
              </a>

              {/* Website */}
              <a
                href="https://gigitekai.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors group"
              >
                <Globe className="w-5 h-5 text-cyan-400 group-hover:text-cyan-300" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-400">Website</p>
                  <p className="text-white text-sm truncate">gigitekai.com</p>
                </div>
              </a>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 mb-8">
              <button
                onClick={handleAddContact}
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                Add Contact
              </button>

              <a
                href="https://gigitekai.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <button className="w-full border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 font-semibold py-2 rounded-lg transition-colors">
                  Visit GigitekAI
                </button>
              </a>
            </div>

            {/* QR Code */}
            <div className="bg-white p-4 rounded-lg flex flex-col items-center gap-3">
              <img
                src={qrCode}
                alt="QR Code to this page"
                className="w-40 h-40"
              loading="lazy"
            />
              <p className="text-xs text-slate-600 text-center font-medium">
                Scan to save contact
              </p>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-slate-700/50 text-center">
              <p className="text-xs text-slate-500">
                Microsoft 365 Architect | MSP CEO
              </p>
              <p className="text-xs text-slate-500 mt-1">
                AI • Automation • IT Modernization
              </p>
            </div>
          </div>

          {/* Bottom branding */}
          <div className="text-center mt-8">
            <p className="text-slate-500 text-sm">
              Powered by{" "}
              <span className="text-cyan-400 font-semibold">GigitekAI</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
