import { useEffect, useState } from "react";
import DOMPurify from "dompurify";
import { marked } from "marked";
import { ArrowLink, Section } from "../components/ui";
import { usePageMeta } from "../components/Seo";
import { formatDate, getPostBySlug, NotFoundError, type BlogPost as Post } from "../lib/blogApi";
import NotFound from "./NotFound";

export default function BlogPost({ slug }: { slug: string }) {
  const [post, setPost] = useState<Post | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "missing" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    setState("loading");
    getPostBySlug(slug)
      .then((p) => {
        if (cancelled) return;
        setPost(p);
        setState("ok");
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setState(e instanceof NotFoundError ? "missing" : "error");
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  usePageMeta({
    title: post ? `${post.title} | GigitekAI` : "Insights | GigitekAI",
    description: post?.excerpt || "Article from GigitekAI.",
    path: `/blog/${slug}`,
  });

  if (state === "missing") return <NotFound />;

  const html =
    post && post.content
      ? DOMPurify.sanitize(post.content.trimStart().startsWith("<") ? post.content : (marked.parse(post.content, { async: false }) as string))
      : "";

  return (
    <>
      <section className="section section--hero" style={{ paddingBottom: 48 }}>
        <div className="container">
          <div className="stack stack-24" style={{ maxWidth: 720, margin: "0 auto" }}>
            <ArrowLink href="/blog" back>
              All articles
            </ArrowLink>
            {state === "loading" && <p className="loading">Loading article…</p>}
            {state === "error" && <p className="notice">This article is unavailable right now. Please try again shortly.</p>}
            {post && (
              <>
                <p className="post-row__meta">
                  {[formatDate(post.publishedAt ?? post.createdAt), post.authorName, post.readTime ? `${post.readTime} min read` : null]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <h1 className="h-cta">{post.title}</h1>
                {post.excerpt && <p className="lead">{post.excerpt}</p>}
              </>
            )}
          </div>
        </div>
      </section>
      {post && (
        <Section tight>
          {post.featuredImage && (
            <div className="article" style={{ marginBottom: 32 }}>
              <img src={post.featuredImage} alt="" loading="lazy" />
            </div>
          )}
          <article className="article" dangerouslySetInnerHTML={{ __html: html }} />
        </Section>
      )}
    </>
  );
}
