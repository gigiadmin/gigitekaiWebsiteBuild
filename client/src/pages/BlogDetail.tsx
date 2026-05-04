/*
  GigitekAI Blog Detail Page — Database-driven individual article view
*/
import "@/styles/blog.css";

import { useLocation, useRoute } from "wouter";
import SiteNavBar2024 from "@/components/SiteNavBar2024";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import LeadCapturePopup from "@/components/LeadCapturePopup";
import ShareButtons from "@/components/ShareButtons";
import AuthorBioCard from "@/components/AuthorBioCard";
import NewsletterSignup from "@/components/NewsletterSignup";
import { ArrowLeft, Calendar, Clock, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";
import DOMPurify from "dompurify";
import { Helmet } from "react-helmet-async";
import Breadcrumb from "@/components/Breadcrumb";
import StructuredData from "@/components/StructuredData";

/** Returns the canonical URL for the current article */
function getArticleUrl(slug: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/blog/${slug}`;
  }
  return `https://gigitekai.com/blog/${slug}`;
}

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
        <SiteNavBar2024 />
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

  const breadcrumbs = [
    { label: "Blog", href: "/blog" },
    { label: post?.title || "Article" },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteNavBar2024 />
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
        <SiteNavBar2024 />
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

  const articleUrl = getArticleUrl(post.slug);
  const ogImage = post.featuredImage || "https://gigitekai.com/og-default.png";
  const ogDescription = post.excerpt.length > 160 ? post.excerpt.slice(0, 157) + "..." : post.excerpt;

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

  const blogPostingSchema = post ? {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: ogDescription,
    image: ogImage,
    url: articleUrl,
    datePublished: post.publishedAt ? new Date(post.publishedAt).toISOString() : new Date(post.createdAt).toISOString(),
    dateModified: new Date(post.updatedAt || post.createdAt).toISOString(),
    author: {
      "@type": "Person",
      name: post.authorName || "Harry Henry Santiago",
      jobTitle: "CEO & Founder, GigitekAI",
      url: "https://www.linkedin.com/in/gigitekinc",
    },
    publisher: {
      "@type": "Organization",
      name: "GigitekAI",
      url: "https://www.gigitekai.com",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl,
    },
  } : null;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.gigitekai.com" },
      { "@type": "ListItem", position: 2, name: "Blog", item: "https://www.gigitekai.com/blog" },
      { "@type": "ListItem", position: 3, name: post?.title || "Article", item: articleUrl },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col">
      {blogPostingSchema && <StructuredData data={blogPostingSchema} id="sd-blogposting" />}
      <StructuredData data={breadcrumbSchema} id="sd-breadcrumb" />
      <Helmet>
        <title>{post.title} | GigitekAI</title>
        <meta name="description" content={ogDescription} />
        {/* Open Graph */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:url" content={articleUrl} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:site_name" content="GigitekAI" />
        {post.publishedAt && (
          <meta property="article:published_time" content={new Date(post.publishedAt).toISOString()} />
        )}
        <meta property="article:author" content={post.authorName} />
        {/* Twitter / X card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={ogDescription} />
        <meta name="twitter:image" content={ogImage} />
      </Helmet>
      <SiteNavBar2024 />
      <main className="flex-1">
        {/* Header */}
        <section className="py-12 bg-white border-b border-gray-100">
          <div className="container max-w-3xl">
            <Breadcrumb items={breadcrumbs} />
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

            {/* Meta row: date · read time · author */}
            <div className="flex flex-wrap items-center gap-6 text-gray-500 text-sm mb-6">
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

            {/* Share buttons — top of article */}
            <ShareButtons url={articleUrl} title={post.title} />
          </div>
        </section>

        {/* Content */}
        <section className="py-16 bg-gray-50">
          <div className="container max-w-3xl">
            <article className="bg-white rounded-2xl p-12 prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-800 prose-strong:text-gray-900 prose-li:text-gray-800 prose-blockquote:text-gray-700 prose-a:text-[#00D4FF] prose-th:text-gray-900 prose-td:text-gray-800 [&_*]:text-gray-800 [&_h1]:text-gray-900 [&_h2]:text-gray-900 [&_h3]:text-gray-900 [&_h4]:text-gray-900 [&_p]:text-gray-800 [&_li]:text-gray-800 [&_blockquote]:text-gray-700 [&_strong]:text-gray-900 [&_td]:text-gray-800 [&_th]:text-gray-900">
              {/* Render HTML from TipTap editor; fall back to Markdown for legacy posts */}
              {post.content.trimStart().startsWith("<") ? (
                <div
                  className="tiptap-content"
                  dangerouslySetInnerHTML={{
                    __html: typeof window !== "undefined"
                      ? DOMPurify.sanitize(post.content)
                      : post.content,
                  }}
                />
              ) : (
                <div className="blog-article-content">
                  <Streamdown>{post.content}</Streamdown>
                </div>
              )}
            </article>

            {/* Author bio card */}
            <AuthorBioCard
              name={post.authorName}
              title={post.authorTitle}
              bio={post.authorBio}
              avatar={post.authorAvatar}
            />

            {/* Share buttons — bottom of article */}
            <div className="mt-4 bg-white rounded-2xl p-6 border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p
                  className="font-semibold text-gray-900 mb-0.5"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Found this article useful?
                </p>
                <p className="text-sm text-gray-500">Share it with your network.</p>
              </div>
              <ShareButtons url={articleUrl} title={post.title} />
            </div>

            {/* CTA */}
            <div className="mt-6 bg-white rounded-2xl p-8 border border-gray-100 text-center">
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

        {/* Newsletter signup — below article */}
        <section className="py-10 bg-gray-50">
          <div className="container max-w-3xl">
            <NewsletterSignup variant="compact" source={typeof window !== 'undefined' ? window.location.pathname : '/blog'} />
          </div>
        </section>
      </main>
      <Footer />
      <LeadCapturePopup context="Blog" />
      <ScrollToTop />
    </div>
  );
}
