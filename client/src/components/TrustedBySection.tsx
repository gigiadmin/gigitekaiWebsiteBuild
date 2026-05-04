/*
  GigitekAI Trusted By Section — Client logo strip
  Mirrors appliedtech.us "Trusted By These Companies" section
*/

const partners = [
  { name: "Microsoft Azure", abbr: "Azure" },
  { name: "Amazon Web Services", abbr: "AWS" },
  { name: "Google Cloud", abbr: "GCP" },
  { name: "Salesforce", abbr: "Salesforce" },
  { name: "ServiceNow", abbr: "ServiceNow" },
  { name: "Cisco", abbr: "Cisco" },
  { name: "VMware", abbr: "VMware" },
  { name: "Palo Alto Networks", abbr: "Palo Alto" },
];

export default function TrustedBySection() {
  return (
    <section className="py-12 bg-gray-50 dark:bg-[#0F1629] border-y border-gray-100 dark:border-[rgba(0,212,255,0.1)]">
      <div style={{ maxWidth: '1280px', marginLeft: 'auto', marginRight: 'auto', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-8">
          Trusted Technology Partners
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
          {partners.map((partner) => (
            <div
              key={partner.name}
              className="flex items-center justify-center px-6 py-3 bg-white dark:bg-[#141B2D] rounded-lg border border-gray-100 dark:border-[rgba(0,212,255,0.15)] shadow-sm hover:border-[#00D4FF]/30 hover:shadow-md transition-all duration-200 min-w-[120px]"
            >
              <span
                className="text-gray-500 font-bold text-sm hover:text-[#00D4FF] transition-colors"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {partner.abbr}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
