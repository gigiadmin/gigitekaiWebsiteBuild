/**
 * Sticky CTA Bar Component
 * Persistent call-to-action bar that stays visible during scroll
 * Integrated with Microsoft 365 Calendar for booking strategy calls
 * Availability: Monday, Wednesday, Friday — 11:00 AM to 3:00 PM EST
 */
import { useState, useEffect, useMemo } from "react";
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

// Generate available Mon/Wed/Fri dates up to 3 months out
function getAvailableDates(): { value: string; label: string }[] {
  const dates: { value: string; label: string }[] = [];
  const today = new Date();
  const end = new Date(today);
  end.setMonth(today.getMonth() + 3);

  const current = new Date(today);
  current.setDate(today.getDate() + 1); // Start from tomorrow

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  while (current <= end) {
    const dow = current.getDay();
    if (dow === 1 || dow === 3 || dow === 5) {
      const yyyy = current.getFullYear();
      const mm = String(current.getMonth() + 1).padStart(2, "0");
      const dd = String(current.getDate()).padStart(2, "0");
      const value = `${yyyy}-${mm}-${dd}`;
      const label = `${dayNames[dow]}, ${monthNames[current.getMonth()]} ${current.getDate()}, ${yyyy}`;
      dates.push({ value, label });
    }
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

// Available time slots: 11:00 AM – 2:30 PM EST (30-min intervals, 15-min meetings)
const TIME_SLOTS = [
  { value: "11:00", label: "11:00 AM EST" },
  { value: "11:30", label: "11:30 AM EST" },
  { value: "12:00", label: "12:00 PM EST" },
  { value: "12:30", label: "12:30 PM EST" },
  { value: "13:00", label: "1:00 PM EST" },
  { value: "13:30", label: "1:30 PM EST" },
  { value: "14:00", label: "2:00 PM EST" },
  { value: "14:30", label: "2:30 PM EST" },
];

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
    preferredTime: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const bookingMutation = trpc.calendar.bookMeeting.useMutation();

  const availableDates = useMemo(() => getAvailableDates(), []);

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

  const selectClass =
    "w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent";

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
            <p className="text-gray-400 text-sm pt-1">
              Available Mon, Wed & Fri — 11:00 AM to 3:00 PM EST
            </p>
          </DialogHeader>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="text-sm text-gray-300 mb-2 block">Full Name *</label>
              <Input
                placeholder="Your name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-gray-500"
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-sm text-gray-300 mb-2 block">Email Address *</label>
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

            {/* Date Dropdown */}
            <div>
              <label className="text-sm text-gray-300 mb-2 block">Select Date *</label>
              <select
                value={formData.preferredDate}
                onChange={(e) =>
                  setFormData({ ...formData, preferredDate: e.target.value, preferredTime: "" })
                }
                className={selectClass}
              >
                <option value="" disabled>
                  — Choose a date (Mon / Wed / Fri) —
                </option>
                {availableDates.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Time Dropdown — only shown after a date is selected */}
            {formData.preferredDate && (
              <div>
                <label className="text-sm text-gray-300 mb-2 block">Select Time (EST) *</label>
                <select
                  value={formData.preferredTime}
                  onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                  className={selectClass}
                >
                  <option value="" disabled>
                    — Choose a time slot —
                  </option>
                  {TIME_SLOTS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Submit Button */}
            <Button
              onClick={async () => {
                if (!formData.name || !formData.email || !formData.preferredDate || !formData.preferredTime) {
                  toast.error("Please fill in all required fields including date and time");
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
                    preferredTime: "",
                  });
                } catch (error) {
                  toast.error("Failed to schedule meeting. Please try again.");
                } finally {
                  setIsSubmitting(false);
                }
              }}
              disabled={isSubmitting || !formData.preferredDate || !formData.preferredTime}
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold disabled:opacity-50"
            >
              {isSubmitting ? "Scheduling..." : "Schedule Meeting"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
