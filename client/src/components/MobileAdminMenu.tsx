import { useState } from "react";
import { Menu, X, Home, BarChart3, Settings, LogOut, Users, FileText, MessageSquare, Zap, Bell, Globe, TrendingUp, ExternalLink } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";

const menuSections = [
  {
    title: "OVERVIEW",
    items: [
      { label: "Dashboard", icon: Home, path: "/admin" },
      { label: "Metrics", icon: BarChart3, path: "/admin/metrics" },
    ],
  },
  {
    title: "OPERATIONS",
    items: [
      { label: "Helpdesk", icon: MessageSquare, path: "/admin/helpdesk" },
      { label: "Live Chat", icon: MessageSquare, path: "/admin/chat" },
      { label: "AI Agents", icon: Zap, path: "/admin/agents" },
      { label: "Notifications", icon: Bell, path: "/admin/notifications" },
    ],
  },
  {
    title: "CONTENT",
    items: [
      { label: "Blog", icon: FileText, path: "/admin/blog" },
      { label: "Newsletter", icon: Globe, path: "/admin/newsletter" },
      { label: "Knowledge Base", icon: FileText, path: "/admin/kb" },
    ],
  },
  {
    title: "ANALYTICS",
    items: [
      { label: "M365 Health Status", icon: TrendingUp, path: "/admin/m365-health" },
    ],
  },
  {
    title: "SETTINGS",
    items: [
      { label: "Users", icon: Users, path: "/admin/users" },
      { label: "Preferences", icon: Settings, path: "/admin/preferences" },
    ],
  },
];

export default function MobileAdminMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [, navigate] = useLocation();
  const { logout } = useAuth();

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
  };

  return (
    <>
      {/* Hamburger Button - Only visible on mobile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-40 md:hidden p-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Menu Sidebar */}
      <div
        className={`fixed left-0 top-0 h-screen w-64 bg-gray-900 border-r border-gray-800 z-40 md:hidden transform transition-transform duration-300 ease-in-out overflow-y-auto ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <img
            src="/manus-storage/gigitekai-logo-optimized_0b6c5e05.webp"
            alt="GigitekAI logo"
            className="h-10 w-auto object-contain max-w-[150px]"
          />
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded text-gray-400 hover:text-white"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Home Link */}
        <div className="px-4 py-3 border-b border-gray-800">
          <button
            onClick={() => { navigate("/"); setIsOpen(false); }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-cyan-400 hover:bg-gray-800 transition-colors text-sm font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            Back to Main Site
          </button>
        </div>

        {/* Menu Sections */}
        <nav className="p-4 space-y-6">
          {menuSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.path}>
                      <button
                        onClick={() => handleNavigation(item.path)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-cyan-400 transition-colors text-sm"
                      >
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800 bg-gray-900">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:bg-red-900/20 transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </>
  );
}
