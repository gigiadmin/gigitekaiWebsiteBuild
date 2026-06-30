/**
 * CreateTicket page — user-facing ticket creation.
 * Uses the unified CreateTicketModal component.
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import HelpdeskNav from "@/components/HelpdeskNav";
import { CreateTicketModal } from "@/components/CreateTicketModal";

export default function CreateTicket() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/helpdesk");
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] to-[#141B2D] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#00D4FF] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] via-[#0F1629] to-[#0A0E1A]">
      <HelpdeskNav />
      <CreateTicketModal
        mode="user"
        open={true}
        onClose={() => navigate("/helpdesk/dashboard")}
        onSuccess={() => navigate("/helpdesk/dashboard")}
      />
    </div>
  );
}
