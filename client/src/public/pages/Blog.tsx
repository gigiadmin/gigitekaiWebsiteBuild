import { useEffect, useState } from "react";
import { Link } from "wouter";
import { PAGE_SEO } from "../site.config";
import { Section } from "../components/ui";
import { usePageMeta } from "../components/Seo";
import { formatDate, listPosts, type BlogListItem } from "../lib/blogApi";

export default function Blog() {
  usePageMeta({ ...PAGE_SEO["/blog"], path: "/blog" });
  const [posts, setPosts] = useState<BlogListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listPosts()
      .then((p) => !cancelled && setPosts(p))
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <section className="section section--hero" style={{ paddingBottom: 56 }}>
        <div className="container">
          <div className="stack stack-24 measure-wide">
            <p className="eyebrow">Insights</p>
            <h1 className="display">Notes from the work.</h1>
            <p className="lead measure">Practical articles on managed IT, Microsoft 365, AI automation, security, and cloud.</p>
          </div>
        </div>
      </section>
      <Section tight>
        {error && <p className="notice">Articles are unavailable right now. Please try again shortly.</p>}
        {!error && posts === null && <p className="loading">Loading articles…</p>}
        {posts && posts.length === 0 && <p className="body">No articles published yet.</p>}
        {posts && posts.length > 0 && (
          <ul className="rows" style={{ maxWidth: 760 }}>
            {posts.map((p) => (
              <li key={p.id}>
                <Link href={`/blog/${p.slug}`} className="post-row">
                  <span className="post-row__meta">
                    {[formatDate(p.publishedAt ?? p.createdAt), p.category, p.readTime ? `${p.readTime} min read` : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                  <span className="post-row__title">{p.title}</span>
                  {p.excerpt && <span className="body">{p.excerpt}</span>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}
