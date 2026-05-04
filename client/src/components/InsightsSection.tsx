/*
  GigitekAI "What's New" / Insights Section
  Shows the 3 most recent blog posts from the database
  First post gets a featured "NEW" badge and larger card
  Subsequent posts are compact side-by-side cards
*/
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Calendar, Sparkles, Clock, Loader2 } from "lucide-react";
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

  const displayPosts = posts?.slice(0, 3) ?? [];
  const [featured, ...rest] = displayPosts;

  const formatDate = (post: typeof featured) =>
    new Date(post.publishedAt ?? post.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <section id="insights" className="py-20 bg-gray-50 dark:bg-[#0F1629]" ref={ref}>
      <div style={{ maxWidth: '1280px', marginLeft: 'auto', marginRight: 'auto', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>

        {/* Header */}
        <div
          className={`flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 transition-all duration-700 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00D4FF]/10 border border-[#00D4FF]/25">
                <Sparkles size={12} className="text-[#00D4FF]" />
                <span
                  className="text-xs font-bold uppercase tracking-widest text-[#00D4FF]"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  What's New
                </span>
              </div>
            </div>
            <h2
              className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Latest from GigitekAI
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-base max-w-xl">
              Stay ahead with our latest insights on AI, cloud infrastructure, and managed IT.
            </p>
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

        {/* Posts Layout: featured (3/5) + secondary stack (2/5) */}
        {!isLoading && displayPosts.length > 0 && (
          <div className="grid lg:grid-cols-5 gap-6">

            {/* Featured post */}
            {featured && (
              <article
                className={`lg:col-span-3 bg-white dark:bg-[#141B2D] rounded-2xl overflow-hidden border border-gray-100 dark:border-[rgba(0,212,255,0.15)] hover:border-[#00D4FF]/40 hover:shadow-2xl hover:shadow-[#00D4FF]/5 transition-all duration-300 group cursor-pointer flex flex-col ${
                  visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: "150ms" }}
                onClick={() => { window.location.href = `/blog/${featured.slug}`; }}
              >
                <div className="h-1 bg-gradient-to-r from-[#00D4FF] to-[#0099CC]" />
                <div className="p-8 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#00D4FF] text-[#0A0E1A] text-xs font-bold uppercase tracking-wide">
                      <Sparkles size={10} />
                      New
                    </span>
                    <span
                      className="text-xs font-bold uppercase tracking-widest text-[#00D4FF]"
                      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                      {featured.category}
                    </span>
                  </div>
                  <h3
                    className="text-gray-900 dark:text-white font-bold text-2xl md:text-3xl leading-snug mb-4 group-hover:text-[#00D4FF] transition-colors"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {featured.title}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-base leading-relaxed mb-8 flex-1">
                    {featured.excerpt}
                  </p>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-white/5">
                    <div className="flex items-center gap-4 text-gray-400 text-xs">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={13} />
                        {formatDate(featured)}
                      </span>
                      {featured.readTime && (
                        <span className="flex items-center gap-1.5">
                          <Clock size={13} />
                          {featured.readTime}
                        </span>
                      )}
                    </div>
                    <a
                      href={`/blog/${featured.slug}`}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#00D4FF] hover:gap-3 transition-all"
                      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      Read article <ArrowRight size={15} />
                    </a>
                  </div>
                </div>
              </article>
            )}

            {/* Secondary posts */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {rest.map((post, i) => (
                <article
                  key={post.id}
                  className={`flex-1 bg-white dark:bg-[#141B2D] rounded-2xl overflow-hidden border border-gray-100 dark:border-[rgba(0,212,255,0.15)] hover:border-[#00D4FF]/30 hover:shadow-xl transition-all duration-300 group cursor-pointer flex flex-col ${
                    visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                  }`}
                  style={{ transitionDelay: `${300 + i * 120}ms` }}
                  onClick={() => { window.location.href = `/blog/${post.slug}`; }}
                >
                  <div className="h-0.5 bg-gradient-to-r from-[#00D4FF]/50 to-transparent" />
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className="text-xs font-bold uppercase tracking-widest text-[#00D4FF]"
                        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                      >
                        {post.category}
                      </span>
                      {post.readTime && (
                        <span className="flex items-center gap-1 text-gray-400 text-xs">
                          <Clock size={11} />
                          {post.readTime}
                        </span>
                      )}
                    </div>
                    <h3
                      className="text-gray-900 dark:text-white font-bold text-lg leading-snug mb-2 group-hover:text-[#00D4FF] transition-colors"
                      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                      {post.title}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-4 flex-1 line-clamp-3">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100 dark:border-white/5">
                      <span className="flex items-center gap-1.5 text-gray-400 text-xs">
                        <Calendar size={12} />
                        {formatDate(post)}
                      </span>
                      <a
                        href={`/blog/${post.slug}`}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-[#00D4FF] hover:gap-2 transition-all"
                        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        Read <ArrowRight size={13} />
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && displayPosts.length === 0 && (
          <div className="text-center py-16">
            <Sparkles size={32} className="text-[#00D4FF]/30 mx-auto mb-3" />
            <p className="text-gray-400">New insights coming soon. Check back shortly.</p>
          </div>
        )}
      </div>
    </section>
  );
}
