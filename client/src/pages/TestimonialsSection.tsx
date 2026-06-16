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

const testimonials: Testimonial[] = [];

export default function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
  };

  // Return empty if no testimonials
  if (testimonials.length === 0) {
    return (
      <section className="py-20 bg-[#0A0E1A]">
        <div className="container">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Client Testimonials</h2>
            <p className="text-gray-300 text-lg">Real client testimonials coming soon. We're collecting feedback from our growing customer base.</p>
          </div>
        </div>
      </section>
    );
  }

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section className="py-20 bg-[#0A0E1A]">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">What Our Clients Say</h2>
          <p className="text-gray-300">Real results from organizations using GigitekAI</p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="bg-gradient-to-br from-[#0F1629] to-[#0A0E1A] border-[#00D4FF]/20 p-8">
            {/* Stars */}
            <div className="flex gap-1 mb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={16} className="fill-amber-400 text-amber-400" />
              ))}
            </div>

            {/* Quote */}
            <p className="text-white text-lg mb-6 leading-relaxed">"{currentTestimonial.quote}"</p>

            {/* Author */}
            <div className="mb-6">
              <p className="text-white font-semibold">{currentTestimonial.author}</p>
              <p className="text-gray-400 text-sm">{currentTestimonial.company}</p>
            </div>

            {/* Metric */}
            <div className="bg-[#00D4FF]/10 border border-[#00D4FF]/20 rounded-lg p-4 mb-6">
              <p className="text-gray-300 text-sm">{currentTestimonial.metric}</p>
              <p className="text-[#00D4FF] text-2xl font-bold">{currentTestimonial.metricValue}</p>
            </div>

            {/* Navigation */}
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={goToPrevious}
                className="border-[#00D4FF]/30 hover:border-[#00D4FF]"
              >
                <ChevronLeft size={20} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={goToNext}
                className="border-[#00D4FF]/30 hover:border-[#00D4FF]"
              >
                <ChevronRight size={20} />
              </Button>
            </div>
          </Card>

          {/* Pagination dots */}
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? "bg-[#00D4FF]" : "bg-gray-600"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
