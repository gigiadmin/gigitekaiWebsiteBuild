/*
  GigitekAI Blog Page — Database-driven insights and articles
  Features: category filter pills, client-side filtering
*/

import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import SiteNavBar2024 from "@/components/SiteNavBar2024";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import LeadCapturePopup from "@/components/LeadCapturePopup";
import { ArrowLeft, Calendar, Clock, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import NewsletterSignup from "@/components/NewsletterSignup";

export default function Blog() {
  const [, navigate] = useLocation();
  const { data: posts, isLoading, error } = trpc.blog.listPosts.useQuery();

  // ── category filter state ──────────────────────────────────────────────────
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const categories = useMemo(() => {
    if (!posts) return [];
    const unique = Array.from(new Set(posts.map((p) => p.category).filter(Boolean)));
    return ["All", ...unique.sort()];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    if (!posts) return [];
    if (activeCategory === "All") return posts;
    return posts.filter((p) => p.category === activeCategory);
  }, [posts, activeCategory]);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteNavBar2024 />
      <main className="flex-1">
        {/* Header */}
        <section className="py-16 bg-white border-b border-gray-100">
          <div className="container">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-[#00D4FF] hover:gap-3 transition-all mb-6"
            >
              <ArrowLeft size={18} />
              Back to Home
            </button>
            <h1
              className="text-5xl font-bold text-gray-900 mb-4"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Insights & Articles
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl">
              Stay ahead with the latest in cloud infrastructure, artificial intelligence, and enterprise technology.
            </p>
          </div>
        </section>

        {/* Newsletter signup banner */}
        <NewsletterSignup variant="banner" source="/blog" />

        {/* Blog posts */}
        <section className="py-16 bg-gray-50">
          <div className="container">
            {isLoading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-[#00D4FF] mr-3" size={28} />
                <span className="text-gray-500 text-lg">Loading articles…</span>
              </div>
            )}

            {error && (
              <div className="text-center py-20">
                <p className="text-red-500 text-lg">Failed to load articles. Please try again later.</p>
              </div>
            )}

            {!isLoading && !error && posts && posts.length === 0 && (
              <div className="text-center py-20">
                <p className="text-gray-500 text-lg">No articles published yet. Check back soon.</p>
              </div>
            )}

            {!isLoading && !error && posts && posts.length > 0 && (
              <>
                {/* ── Category filter pills ──────────────────────────────── */}
                {categories.length > 2 && (
                  <div className="flex flex-wrap gap-2 mb-10">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all duration-200 ${
                          activeCategory === cat
                            ? "bg-[#00D4FF] text-[#0A0E1A] border-[#00D4FF] shadow-[0_0_12px_rgba(0,212,255,0.35)]"
                            : "bg-white text-gray-600 border-gray-200 hover:border-[#00D4FF]/50 hover:text-[#00D4FF]"
                        }`}
                        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}

                {/* ── Article list ───────────────────────────────────────── */}
                {filteredPosts.length === 0 ? (
                  <div className="text-center py-20">
                    <p className="text-gray-500 text-lg">
                      No articles in <span className="font-semibold text-[#00D4FF]">{activeCategory}</span> yet.
                    </p>
                    <button
                      onClick={() => setActiveCategory("All")}
                      className="mt-4 text-sm text-[#00D4FF] hover:underline"
                    >
                      View all articles
                    </button>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {filteredPosts.map((post) => (
                      <article
                        key={post.id}
                        className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-[#00D4FF]/30 hover:shadow-lg transition-all duration-300 p-8 cursor-pointer group"
                        onClick={() => navigate(`/blog/${post.slug}`)}
                      >
                        <div className="flex items-start justify-between gap-6">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveCategory(post.category);
                                }}
                                className="text-xs font-bold uppercase tracking-widest text-[#00D4FF] hover:underline"
                                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                              >
                                {post.category}
                              </button>
                              <span className="text-xs text-gray-400">{post.readTime}</span>
                            </div>
                            <h2
                              className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-[#00D4FF] transition-colors"
                              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                            >
                              {post.title}
                            </h2>
                            <p className="text-gray-600 text-base leading-relaxed mb-4">
                              {post.excerpt}
                            </p>
                            <div className="flex items-center gap-4 text-gray-400 text-sm">
                              <div className="flex items-center gap-1">
                                <Calendar size={14} />
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
                              <div className="flex items-center gap-1">
                                <Clock size={14} />
                                {post.readTime}
                              </div>
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
      <LeadCapturePopup />
      <ScrollToTop />
    </div>
  );
}
