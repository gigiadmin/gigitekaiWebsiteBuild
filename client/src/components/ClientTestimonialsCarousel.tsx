import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

interface Testimonial {
  id: number;
  name: string;
  title: string;
  company: string;
  quote: string;
  rating: number;
  image?: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Sarah Chen",
    title: "CIO",
    company: "Fortune 500 Financial Services",
    quote:
      "GigitekAI's AI-powered helpdesk reduced our support tickets by 40% in the first month. The intelligent routing and automated responses have transformed our IT operations.",
    rating: 5,
  },
  {
    id: 2,
    name: "Michael Rodriguez",
    title: "VP of Operations",
    company: "Healthcare Network",
    quote:
      "The compliance automation alone saved us 280+ hours annually. GigitekAI's Zero Trust infrastructure gives us peace of mind with HIPAA and SOC 2 requirements.",
    rating: 5,
  },
  {
    id: 3,
    name: "Jennifer Park",
    title: "IT Director",
    company: "Manufacturing Company",
    quote:
      "Deployment was seamless. Within 3 months, we saw a 3x ROI. The multi-system orchestration handles our AWS, Azure, and on-prem infrastructure effortlessly.",
    rating: 5,
  },
  {
    id: 4,
    name: "David Thompson",
    title: "Chief Technology Officer",
    company: "SaaS Startup",
    quote:
      "GigitekAI's AI agents are like having a full IT team. The 24/7 support and intelligent escalation to humans when needed is exactly what we needed to scale.",
    rating: 5,
  },
  {
    id: 5,
    name: "Lisa Martinez",
    title: "Operations Manager",
    company: "Retail Chain",
    quote:
      "The ROI calculator showed 40% operational cost reduction. We've hit that target and are now exploring their advanced AI agent features for customer service.",
    rating: 5,
  },
];

export default function ClientTestimonialsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  useEffect(() => {
    if (!isAutoPlay) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 6000); // Change every 6 seconds

    return () => clearInterval(timer);
  }, [isAutoPlay]);

  const goToPrevious = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? testimonials.length - 1 : prev - 1
    );
    setIsAutoPlay(false);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    setIsAutoPlay(false);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlay(false);
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#0A0E1A] to-[#0F1420]">
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Trusted by Enterprise Leaders
          </h2>
          <p className="text-lg text-gray-400">
            See how GigitekAI transforms IT operations for Fortune 500 companies
          </p>
        </div>

        {/* Testimonial Card */}
        <div className="relative bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border border-cyan-500/20 rounded-lg p-8 sm:p-10 min-h-[320px] flex flex-col justify-between">
          {/* Quote Mark */}
          <div className="absolute top-4 right-6 text-cyan-500/20 text-5xl">"</div>

          {/* Testimonial Content */}
          <div className="flex-1">
            {/* Rating */}
            <div className="flex gap-1 mb-6">
              {Array.from({ length: currentTestimonial.rating }).map((_, i) => (
                <Star
                  key={i}
                  size={18}
                  className="fill-yellow-400 text-yellow-400"
                />
              ))}
            </div>

            {/* Quote */}
            <p className="text-lg text-gray-200 mb-8 leading-relaxed italic">
              "{currentTestimonial.quote}"
            </p>
          </div>

          {/* Author Info */}
          <div className="border-t border-cyan-500/10 pt-6">
            <p className="text-white font-semibold text-lg">
              {currentTestimonial.name}
            </p>
            <p className="text-cyan-400 text-sm">
              {currentTestimonial.title} • {currentTestimonial.company}
            </p>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between mt-8">
          {/* Previous Button */}
          <button
            onClick={goToPrevious}
            className="p-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 transition-colors"
            aria-label="Previous testimonial"
          >
            <ChevronLeft size={24} />
          </button>

          {/* Dot Indicators */}
          <div className="flex gap-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? "bg-cyan-500 w-8"
                    : "bg-cyan-500/30 w-2 hover:bg-cyan-500/50"
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>

          {/* Next Button */}
          <button
            onClick={goToNext}
            className="p-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 transition-colors"
            aria-label="Next testimonial"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Auto-play Toggle */}
        <div className="text-center mt-6">
          <button
            onClick={() => setIsAutoPlay(!isAutoPlay)}
            className="text-sm text-gray-400 hover:text-cyan-400 transition-colors"
          >
            {isAutoPlay ? "⏸ Pause" : "▶ Auto-play"}
          </button>
        </div>
      </div>
    </section>
  );
}
