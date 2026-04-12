/**
 * Sticky CTA Bar Component
 * Persistent call-to-action bar that stays visible during scroll
 * Integrated with Microsoft 365 Calendar for booking strategy calls
 */
import { useState, useEffect } from "react";
import { X, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface StickyCTABarProps {
  onClose?: () => void;
}

interface BookingFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  preferredDate: string;
  preferredTime: string;
}

export function StickyCTABar({ onClose }: StickyCTABarProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [formData, setFormData] = useState<BookingFormData>({
    name: "",
    email: "",
    phone: "",
    company: "",
    preferredDate: "",
    preferredTime: "10:00",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const bookingMutation = trpc.calendar.bookMeeting.useMutation();

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
    sessionStorage.setItem("ctaBarClosed", "true");
  };

  useEffect(() => {
    if (sessionStorage.getItem("ctaBarClosed") === "true") {
      setIsVisible(false);
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed ${
        isMinimized ? "bottom-4 right-4" : "bottom-0 left-0 right-0"
      } z-50 transition-all duration-300`}
    >
      {isMinimized ? (
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold py-3 px-6 rounded-full shadow-lg flex items-center gap-2"
        >
          <Calendar size={20} />
          Schedule Call
        </button>
      ) : (
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-t border-cyan-500/30 px-4 py-4 shadow-2xl">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg">
                Ready to Transform Your IT?
              </h3>
              <p className="text-gray-400 text-sm">
                Schedule a free 15-minute strategy call with our team
              </p>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => setShowBookingModal(true)}
                className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold py-2 px-6 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <Calendar size={18} />
                Book Now
              </button>

              <button
                onClick={() => setIsMinimized(true)}
                className="text-gray-400 hover:text-white p-2 transition-colors"
                title="Minimize"
              >
                <span className="text-xl">−</span>
              </button>

              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-white p-2 transition-colors"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-cyan-500/30">
          <DialogHeader>
            <DialogTitle className="text-white">Schedule Your Strategy Call</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="text-sm text-gray-300 mb-2 block">Full Name</label>
              <Input
                placeholder="Your name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-gray-500"
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-sm text-gray-300 mb-2 block">Email Address</label>
              <Input
                type="email"
                placeholder="your@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-gray-500"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="text-sm text-gray-300 mb-2 block">Phone Number</label>
              <Input
                type="tel"
                placeholder="(609) 555-1234"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-gray-500"
              />
            </div>

            {/* Company */}
            <div>
              <label className="text-sm text-gray-300 mb-2 block">Company</label>
              <Input
                placeholder="Your company name"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-gray-500"
              />
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-300 mb-2 block">Preferred Date</label>
                <Input
                  type="date"
                  value={formData.preferredDate}
                  onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-2 block">Preferred Time</label>
                <Input
                  type="time"
                  value={formData.preferredTime}
                  onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              onClick={async () => {
                if (!formData.name || !formData.email || !formData.preferredDate) {
                  toast.error("Please fill in all required fields");
                  return;
                }

                setIsSubmitting(true);
                try {
                  await bookingMutation.mutateAsync({
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    company: formData.company,
                    preferredDate: formData.preferredDate,
                    preferredTime: formData.preferredTime,
                  });

                  toast.success("Meeting scheduled! Check your email for confirmation.");
                  setShowBookingModal(false);
                  setFormData({
                    name: "",
                    email: "",
                    phone: "",
                    company: "",
                    preferredDate: "",
                    preferredTime: "10:00",
                  });
                } catch (error) {
                  toast.error("Failed to schedule meeting. Please try again.");
                } finally {
                  setIsSubmitting(false);
                }
              }}
              disabled={isSubmitting}
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold"
            >
              {isSubmitting ? "Scheduling..." : "Schedule Meeting"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
