import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import {
  LifeBuoy,
  LayoutDashboard,
  PlusCircle,
  MessageSquare,
  LogOut,
  Home,
  BookOpen,
} from "lucide-react";

interface HelpdeskNavProps {
  showBackToDashboard?: boolean;
  isAdmin?: boolean;
}

export default function HelpdeskNav({ isAdmin = false }: HelpdeskNavProps) {
  const { user, logout } = useAuth();
  const [location, navigate] = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/helpdesk");
  };

  return (
    <nav className="border-b border-[rgba(0,212,255,0.15)] bg-[#0A0E1A]/95 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left: Logo + Brand */}
          <div className="flex items-center gap-6">
            <a href="/helpdesk/dashboard" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-[#00D4FF] to-[#0088AA] rounded-xl flex items-center justify-center shadow-lg shadow-[#00D4FF]/20 group-hover:shadow-[#00D4FF]/40 transition-shadow">
                  <LifeBuoy className="w-5 h-5 text-[#0A0E1A]" strokeWidth={2.5} />
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0A0E1A]"></div>
              </div>
              <div>
                <span className="text-white font-bold text-lg block leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Support Center
                </span>
                <span className="text-[#00D4FF] text-xs font-medium">GigitekAI</span>
              </div>
            </a>

            {/* Nav Links (desktop) */}
            {user && (
              <div className="hidden md:flex items-center gap-1 ml-4">
                {isAdmin ? (
                  <>
                    <NavLink
                      href="/admin/helpdesk"
                      active={location === "/admin/helpdesk"}
                      icon={<LayoutDashboard className="w-4 h-4" />}
                      label="Tickets"
                    />
                    <NavLink
                      href="/admin/chat"
                      active={location === "/admin/chat"}
                      icon={<MessageSquare className="w-4 h-4" />}
                      label="Live Chat"
                    />
                  </>
                ) : (
                  <>
                    <NavLink
                      href="/helpdesk/dashboard"
                      active={location === "/helpdesk/dashboard"}
                      icon={<LayoutDashboard className="w-4 h-4" />}
                      label="My Tickets"
                    />
                    <NavLink
                      href="/helpdesk/tickets/new"
                      active={location === "/helpdesk/tickets/new"}
                      icon={<PlusCircle className="w-4 h-4" />}
                      label="New Ticket"
                    />
                    <NavLink
                      href="/helpdesk/guide"
                      active={location === "/helpdesk/guide"}
                      icon={<BookOpen className="w-4 h-4" />}
                      label="Agent Guide"
                    />
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right: User Info + Actions */}
          <div className="flex items-center gap-3">
            {/* Back to Main Site */}
            <a
              href="/"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-[#00D4FF] border border-gray-800 hover:border-[#00D4FF]/30 rounded-lg transition-all"
            >
              <Home className="w-3.5 h-3.5" />
              GigitekAI.com
            </a>

            {user && (
              <>
                {/* User badge */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#141B2D] border border-gray-800 rounded-lg">
                  <div className="w-6 h-6 bg-gradient-to-br from-[#00D4FF] to-[#0088AA] rounded-full flex items-center justify-center">
                    <span className="text-[#0A0E1A] text-xs font-bold">
                      {user.name?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  </div>
                  <span className="text-gray-300 text-sm font-medium">{user.name}</span>
                  {user.role === "admin" && (
                    <span className="px-1.5 py-0.5 bg-[#00D4FF]/10 text-[#00D4FF] text-[10px] font-bold rounded uppercase tracking-wider">
                      Admin
                    </span>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 h-8 px-3 text-xs"
                >
                  <LogOut className="w-3.5 h-3.5 mr-1" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile nav links */}
      {user && (
        <div className="md:hidden border-t border-[rgba(0,212,255,0.1)] px-4 py-2 flex gap-2 overflow-x-auto">
          <a
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-[#00D4FF] border border-gray-800 rounded-lg transition-all whitespace-nowrap"
          >
            <Home className="w-3.5 h-3.5" />
            GigitekAI.com
          </a>
          {isAdmin ? (
            <>
              <MobileNavLink href="/admin/helpdesk" active={location === "/admin/helpdesk"} label="Tickets" />
              <MobileNavLink href="/admin/chat" active={location === "/admin/chat"} label="Live Chat" />
            </>
          ) : (
            <>
              <MobileNavLink href="/helpdesk/dashboard" active={location === "/helpdesk/dashboard"} label="My Tickets" />
              <MobileNavLink href="/helpdesk/tickets/new" active={location === "/helpdesk/tickets/new"} label="New Ticket" />
              <MobileNavLink href="/helpdesk/guide" active={location === "/helpdesk/guide"} label="Agent Guide" />
            </>
          )}
        </div>
      )}
    </nav>
  );
}

function NavLink({ href, active, icon, label }: { href: string; active: boolean; icon: React.ReactNode; label: string }) {
  return (
    <a
      href={href}
      className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
        active
          ? "text-[#00D4FF] bg-[#00D4FF]/10"
          : "text-gray-400 hover:text-white hover:bg-white/5"
      }`}
    >
      {icon}
      {label}
    </a>
  );
}

function MobileNavLink({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <a
      href={href}
      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
        active
          ? "text-[#00D4FF] bg-[#00D4FF]/10 border border-[#00D4FF]/30"
          : "text-gray-400 border border-gray-800 hover:text-white"
      }`}
    >
      {label}
    </a>
  );
}
