/**
 * AdminTicketDetail.tsx
 * Wrapper component that provides admin authentication context to TicketDetail
 * Uses adminAuth.me instead of Manus OAuth useAuth() hook
 */

import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import TicketDetail from "./TicketDetail";
import { Loader2 } from "lucide-react";

/**
 * AdminTicketDetail wraps TicketDetail but ensures it uses admin authentication
 * instead of Manus OAuth. This allows the ticket detail page to work correctly
 * when accessed from /admin/helpdesk/:ticketId routes.
 */
export default function AdminTicketDetail() {
  const { ticketId } = useParams<{ ticketId: string }>();

  // Verify admin is authenticated via adminAuth (not Manus OAuth)
  // This check happens at the AdminLayout level, but we verify here too
  const { data: adminUser, isLoading } = trpc.adminAuth.me.useQuery(undefined, {
    retry: 2,
    retryDelay: 400,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] to-[#141B2D] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#00D4FF] animate-spin" />
      </div>
    );
  }

  if (!adminUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] to-[#141B2D] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg">Not authenticated</p>
          <p className="text-gray-400 text-sm mt-2">Please log in to view this ticket</p>
        </div>
      </div>
    );
  }

  // Render TicketDetail component with admin override so the AI panel and admin features show
  // TicketDetail uses useAuth().user?.role === 'admin' for isAdmin, but admin panel uses
  // a separate adminAuth session. We pass isAdminOverride=true to force admin view.
  return <TicketDetail isAdminOverride={true} />;
}
