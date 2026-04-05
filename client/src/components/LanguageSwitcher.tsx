import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '@/i18n';
import { Globe } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === i18n.language) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (code: string) => {
    i18n.changeLanguage(code);
    setOpen(false);
  };

  if (compact) {
    // Mobile: full-width button list
    return (
      <div className="space-y-1">
        {SUPPORTED_LANGUAGES.map(lang => (
          <button
            key={lang.code}
            onClick={() => handleChange(lang.code)}
            className={`flex items-center gap-2 w-full py-2.5 px-3 text-sm rounded-lg transition-colors ${
              i18n.language === lang.code
                ? 'text-[#00D4FF] bg-[#00D4FF]/10'
                : 'text-gray-600 dark:text-gray-300 hover:text-[#00D4FF]'
            }`}
          >
            <Globe size={16} />
            <span>{lang.flag} {lang.label}</span>
            {i18n.language === lang.code && (
              <span className="ml-auto text-xs text-[#00D4FF]">✓</span>
            )}
          </button>
        ))}
      </div>
    );
  }

  // Desktop: dropdown
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-[#00D4FF] hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
        title="Change language"
        aria-label="Change language"
      >
        <Globe size={18} />
        <span className="text-xs font-medium uppercase">{currentLang.code}</span>
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1 w-40 bg-white dark:bg-[#0F1629] border border-gray-200 dark:border-[rgba(0,212,255,0.15)] rounded-lg shadow-xl shadow-black/10 dark:shadow-black/40 py-1 z-50">
          {SUPPORTED_LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => handleChange(lang.code)}
              className={`flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors ${
                i18n.language === lang.code
                  ? 'text-[#00D4FF] bg-[#00D4FF]/5'
                  : 'text-gray-600 dark:text-gray-300 hover:text-[#00D4FF] hover:bg-gray-50 dark:hover:bg-[rgba(0,212,255,0.05)]'
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
              {i18n.language === lang.code && (
                <span className="ml-auto text-[#00D4FF]">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
