import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export interface UnifiedTicketFormProps {
  onSubmit: (data: TicketFormData) => Promise<void>;
  isLoading?: boolean;
  successMessage?: string;
  errorMessage?: string;
  title?: string;
  submitButtonText?: string;
  showPriority?: boolean;
  showCategory?: boolean;
}

export interface TicketFormData {
  name: string;
  email: string;
  subject: string;
  category?: string;
  priority?: string;
  description: string;
}

const CATEGORIES = [
  "Technical Support",
  "Billing",
  "Feature Request",
  "Bug Report",
  "General Inquiry",
  "Other",
];

const PRIORITIES = ["Low", "Medium", "High", "Critical"];

export default function UnifiedTicketForm({
  onSubmit,
  isLoading = false,
  successMessage = "Thank you! Your message has been sent.",
  errorMessage,
  title = "Contact Us",
  submitButtonText = "Send Message",
  showPriority = false,
  showCategory = false,
}: UnifiedTicketFormProps) {

  const [formData, setFormData] = useState<TicketFormData>({
    name: "",
    email: "",
    subject: "",
    category: "General Inquiry",
    priority: "Medium",
    description: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // NOTE: Do NOT auto-fill name/email from auth context on public-facing forms.
  // This prevents logged-in admin data from appearing for clients on shared devices.
  // The form always starts blank for privacy.

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }
    if (!formData.email.trim()) {
      setError("Email is required");
      return;
    }
    if (!formData.subject.trim()) {
      setError("Subject is required");
      return;
    }
    if (!formData.description.trim()) {
      setError("Message is required");
      return;
    }

    try {
      await onSubmit(formData);
      setSubmitted(true);
      // Reset form after 3 seconds
      setTimeout(() => {
        setFormData({
          name: "",
          email: "",
          subject: "",
          category: "General Inquiry",
          priority: "Medium",
          description: "",
        });
        setSubmitted(false);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    }
  };

  if (submitted) {
    return (
      <div className="flex items-center justify-center p-8 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
        <div className="text-center">
          <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-3" />
          <p className="text-green-800 dark:text-green-300 font-medium">
            {successMessage}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {title && (
        <h2 className="text-2xl font-bold mb-6 text-foreground">{title}</h2>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Error Message */}
        {(error || errorMessage) && (
          <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 dark:text-red-300 text-sm">
              {error || errorMessage}
            </p>
          </div>
        )}

        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">
            Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Your name"
            autoComplete="off"
            className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            disabled={isLoading}
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">
            Email *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="your@email.com"
            autoComplete="off"
            className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            disabled={isLoading}
          />
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">
            Subject *
          </label>
          <input
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            placeholder="What is this about?"
            className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            disabled={isLoading}
          />
        </div>

        {/* Category */}
        {showCategory && (
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              disabled={isLoading}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Priority */}
        {showPriority && (
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">
              Priority
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              disabled={isLoading}
            >
              {PRIORITIES.map((pri) => (
                <option key={pri} value={pri}>
                  {pri}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">
            Message *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Tell us more about your inquiry..."
            rows={5}
            className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
            disabled={isLoading}
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Sending..." : submitButtonText}
        </Button>
      </form>
    </div>
  );
}
