/*
  GigitekAI Blog Detail Page — Database-driven individual article view
*/

import { useLocation, useRoute } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import { ArrowLeft, Calendar, Clock, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";

export default function BlogDetail() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/blog/:slug");

  const slug = params?.slug ?? "";

  const { data: post, isLoading, error } = trpc.blog.getPostBySlug.useQuery(
    { slug },
    { enabled: !!slug }
  );

  if (!match || !slug) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Article not found</h1>
            <button
              onClick={() => navigate("/blog")}
              className="text-[#00D4FF] hover:underline"
            >
              Back to all articles
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin text-[#00D4FF] mr-3" size={28} />
          <span className="text-gray-500 text-lg">Loading article…</span>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Article not found</h1>
            <p className="text-gray-500 mb-6">
              This article may have been moved or is no longer available.
            </p>
            <button
              onClick={() => navigate("/blog")}
              className="text-[#00D4FF] hover:underline"
            >
              Back to all articles
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const displayDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date(post.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Header */}
        <section className="py-12 bg-white border-b border-gray-100">
          <div className="container max-w-3xl">
            <button
              onClick={() => navigate("/blog")}
              className="flex items-center gap-2 text-[#00D4FF] hover:gap-3 transition-all mb-6"
            >
              <ArrowLeft size={18} />
              Back to all articles
            </button>
            <div className="flex items-center gap-3 mb-4">
              <span
                className="text-xs font-bold uppercase tracking-widest text-[#00D4FF]"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {post.category}
              </span>
              <span className="text-xs text-gray-400">{post.readTime}</span>
            </div>
            <h1
              className="text-5xl font-bold text-gray-900 mb-4 leading-tight"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {post.title}
            </h1>
            <div className="flex items-center gap-6 text-gray-500 text-sm">
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                {displayDate}
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} />
                {post.readTime}
              </div>
              {post.authorName && (
                <div className="flex items-center gap-2">
                  <span>By {post.authorName}</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-16 bg-gray-50">
          <div className="container max-w-3xl">
            <article className="bg-white rounded-2xl p-12 prose prose-lg max-w-none">
              <Streamdown>{post.content}</Streamdown>
            </article>

            {/* CTA */}
            <div className="mt-12 bg-white rounded-2xl p-8 border border-gray-100 text-center">
              <h3
                className="text-2xl font-bold text-gray-900 mb-2"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Ready to transform your business?
              </h3>
              <p className="text-gray-600 mb-6">
                Let's discuss how GigitekAI can help you achieve your cloud and AI goals.
              </p>
              <button
                onClick={() => navigate("/#contact")}
                className="btn-cyan"
              >
                Get in Touch
              </button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
