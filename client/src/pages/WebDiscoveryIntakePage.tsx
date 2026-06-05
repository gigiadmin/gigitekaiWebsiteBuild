import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

export default function WebDiscoveryIntakePage() {

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    category: "website-discovery",
    message: "",
  });

  const submitMutation = trpc.formSubmissions.submitForm.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setIsSubmitting(false);
      alert("Your discovery form has been submitted. We'll be in touch soon!");
      // Reset form after 3 seconds
      setTimeout(() => {
        setFormData({
          name: "",
          email: "",
          phone: "",
          company: "",
          category: "website-discovery",
          message: "",
        });
        setSubmitted(false);
      }, 3000);
    },
    onError: (error) => {
      setIsSubmitting(false);
      alert(error.message || "Failed to submit form. Please try again.");
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await submitMutation.mutateAsync({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        category: formData.category,
        message: formData.message,
        source: "web-discovery-intake",
      });
    } catch (error) {
      // Error is handled by onError callback
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Thank You!</h1>
          <p className="text-muted-foreground mb-6">
            Your web discovery intake form has been submitted successfully. Our team will review your information and contact you within 24 hours.
          </p>
          <a href="/" className="text-cyan-400 hover:text-cyan-300 underline">
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Web Discovery Intake
          </h1>
          <p className="text-lg text-muted-foreground">
            Tell us about your website needs and we'll provide a personalized discovery consultation.
          </p>
        </div>

        {/* Form */}
        <div className="bg-card border border-border rounded-lg p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                Full Name *
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                minLength={2}
                value={formData.name}
                onChange={handleChange}
                placeholder="Your full name"
                className="w-full"
                disabled={isSubmitting}
              />
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email Address *
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="your.email@company.com"
                className="w-full"
                disabled={isSubmitting}
              />
            </div>

            {/* Phone Field */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                Phone Number *
              </label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                required
                minLength={10}
                value={formData.phone}
                onChange={handleChange}
                placeholder="(123) 456-7890"
                className="w-full"
                disabled={isSubmitting}
              />
            </div>

            {/* Company Field */}
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-foreground mb-2">
                Company Name
              </label>
              <Input
                id="company"
                name="company"
                type="text"
                value={formData.company}
                onChange={handleChange}
                placeholder="Your company name (optional)"
                className="w-full"
                disabled={isSubmitting}
              />
            </div>

            {/* Category Field */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-foreground mb-2">
                Discovery Type *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-400"
                disabled={isSubmitting}
              >
                <option value="website-discovery">Website Discovery</option>
                <option value="redesign">Website Redesign</option>
                <option value="performance">Performance Optimization</option>
                <option value="seo">SEO Optimization</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Message Field */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                Tell us about your project *
              </label>
              <Textarea
                id="message"
                name="message"
                required
                minLength={10}
                value={formData.message}
                onChange={handleChange}
                placeholder="Describe your website needs, goals, and any specific requirements..."
                className="w-full min-h-[150px] resize-none"
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Minimum 10 characters required
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-semibold py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Discovery Form"
              )}
            </Button>

            {/* Info Text */}
            <p className="text-xs text-muted-foreground text-center">
              We respect your privacy. Your information will only be used to contact you about your web discovery consultation.
            </p>
          </form>
        </div>

        {/* Benefits Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-cyan-400 mb-2">24hrs</div>
            <p className="text-muted-foreground">Response time</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-cyan-400 mb-2">100%</div>
            <p className="text-muted-foreground">Confidential</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-cyan-400 mb-2">Expert</div>
            <p className="text-muted-foreground">Consultation</p>
          </div>
        </div>
      </div>
    </div>
  );
}
