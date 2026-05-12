import { useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Testimonial {
  id: string;
  quote: string;
  author: string;
  company: string;
  metric: string;
  metricValue: string;
  image?: string;
}

const testimonials: Testimonial[] = [
  {
    id: "1",
    quote:
      "GigitekAI transformed our IT operations. We reduced downtime by 85% and our team can now focus on strategic initiatives instead of firefighting.",
    author: "Sarah Johnson",
    company: "Tech Solutions Inc.",
    metric: "Uptime Improvement",
    metricValue: "85%",
  },
  {
    id: "2",
    quote:
      "The AI automation features alone saved us thousands per month. Their helpdesk integration is seamless and their support team is incredibly responsive.",
    author: "Mike Chen",
    company: "Growth Ventures LLC",
    metric: "Cost Reduction",
    metricValue: "40%",
  },
  {
    id: "3",
    quote:
      "We were overwhelmed managing multiple vendors. GigitekAI consolidated everything into one unified platform. Best decision we made for our infrastructure.",
    author: "Jennifer Martinez",
    company: "Enterprise Services Corp",
    metric: "Vendor Consolidation",
    metricValue: "6→1",
  },
];

export default function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-gray-900/20">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">What Our Clients Say</h2>
          <p className="text-gray-400 text-lg">
            See how GigitekAI is helping businesses like yours transform their IT operations
          </p>
        </div>

        {/* Testimonial Carousel */}
        <Card className="bg-[#0F1419]/60 border-gray-800/40 p-8 sm:p-12">
          <div className="flex items-start gap-6 mb-8">
            {/* Avatar Placeholder */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00D4FF] to-purple-500 flex-shrink-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {currentTestimonial.author.charAt(0)}
              </span>
            </div>

            {/* Stars */}
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="w-5 h-5 fill-[#00D4FF] text-[#00D4FF]"
                />
              ))}
            </div>
          </div>

          {/* Quote */}
          <blockquote className="text-xl text-gray-300 mb-8 leading-relaxed">
            "{currentTestimonial.quote}"
          </blockquote>

          {/* Author Info */}
          <div className="flex items-center justify-between mb-8 pb-8 border-b border-gray-800/40">
            <div>
              <p className="font-bold text-white">{currentTestimonial.author}</p>
              <p className="text-gray-400 text-sm">{currentTestimonial.company}</p>
            </div>

            {/* Metric */}
            <div className="text-right bg-[#00D4FF]/10 px-4 py-3 rounded-lg border border-[#00D4FF]/30">
              <p className="text-3xl font-bold text-[#00D4FF]">
                {currentTestimonial.metricValue}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {currentTestimonial.metric}
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentIndex
                      ? "bg-[#00D4FF] w-8"
                      : "bg-gray-700/40 hover:bg-gray-600/60"
                  }`}
                  aria-label={`Go to testimonial ${idx + 1}`}
                />
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPrevious}
                className="border-gray-800/40 hover:bg-gray-900/40"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNext}
                className="border-gray-800/40 hover:bg-gray-900/40"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Counter */}
          <div className="text-center mt-6 text-sm text-gray-500">
            {currentIndex + 1} / {testimonials.length}
          </div>
        </Card>
      </div>
    </div>
  );
}
