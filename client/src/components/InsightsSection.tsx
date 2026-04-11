/*
  GigitekAI Insights Section — "Stay Informed with the Latest in Cloud & AI"
  White/light background, 3-column blog post cards — database-driven
*/

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Calendar, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function InsightsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const { data: posts, isLoading } = trpc.blog.listPosts.useQuery();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  // Show up to 3 latest posts
  const displayPosts = posts?.slice(0, 3) ?? [];

  return (
    <section id="insights" className="py-20 bg-gray-50 dark:bg-[#0F1629]" ref={ref}>
      <div className="container">
        {/* Header */}
        <div
          className={`flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 transition-all duration-700 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div>
            <div className="section-label">The Insights Hub</div>
            <h2
              className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Stay Ahead with the Latest in Cloud & AI
            </h2>
          </div>
          <a
            href="/blog"
            className="btn-cyan text-sm whitespace-nowrap flex-shrink-0"
          >
            View All Insights <ArrowRight size={16} />
          </a>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-[#00D4FF] mr-3" size={24} />
            <span className="text-gray-400">Loading insights…</span>
          </div>
        )}

        {/* Post cards */}
        {!isLoading && displayPosts.length > 0 && (
          <div className="grid md:grid-cols-3 gap-6">
            {displayPosts.map((post, i) => (
              <article
                key={post.id}
                className={`bg-white dark:bg-[#141B2D] rounded-2xl overflow-hidden border border-gray-100 dark:border-[rgba(0,212,255,0.15)] hover:border-[#00D4FF]/30 hover:shadow-xl transition-all duration-300 group cursor-pointer ${
                  visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${200 + i * 100}ms` }}
                onClick={() => { window.location.href = `/blog/${post.slug}`; }}
              >
                {/* Category bar */}
                <div className="h-1 bg-[#00D4FF]" />
                
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className="text-xs font-bold uppercase tracking-widest text-[#00D4FF]"
                      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                      {post.category}
                    </span>
                    <span className="text-xs text-gray-400">{post.readTime}</span>
                  </div>

                  <h3
                    className="text-gray-900 dark:text-white font-bold text-lg leading-snug mb-3 group-hover:text-[#00D4FF] transition-colors"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {post.title}
                  </h3>

                  <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                      <Calendar size={12} />
                      {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : new Date(post.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                    </div>
                    <a
                      href={`/blog/${post.slug}`}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-[#00D4FF] hover:gap-2 transition-all"
                      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      Read more <ArrowRight size={14} />
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && displayPosts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-400">New insights coming soon. Check back shortly.</p>
          </div>
        )}
      </div>
    </section>
  );
}
