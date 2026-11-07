/**
 * Minimal read-only client for the existing public blog procedures
 * (server/routers/blog.ts: blog.listPosts, blog.getPostBySlug).
 *
 * Uses plain fetch against the existing tRPC HTTP endpoint so the public site
 * does not need the full tRPC/react-query stack. The API contract is unchanged.
 * Dates are returned as ISO strings (superjson meta is read for Date fields).
 */

export interface BlogListItem {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  category: string | null;
  readTime: number | null;
  authorName: string | null;
  featuredImage: string | null;
  publishedAt: string | null;
  createdAt: string | null;
}

export interface BlogPost extends BlogListItem {
  content: string;
}

interface TrpcEnvelope<T> {
  result?: { data?: { json?: T; meta?: unknown } | T };
  error?: { json?: { message?: string } };
}

async function call<T>(procedure: string, input?: unknown): Promise<T> {
  const url = new URL(`/api/trpc/${procedure}`, window.location.origin);
  if (input !== undefined) url.searchParams.set("input", JSON.stringify({ json: input }));
  const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
  if (res.status === 404) throw new NotFoundError();
  const body = (await res.json()) as TrpcEnvelope<T>;
  if (!res.ok || body.error) {
    const msg = body.error?.json?.message || `Request failed (${res.status})`;
    if (/not found/i.test(msg)) throw new NotFoundError();
    throw new Error(msg);
  }
  const data = body.result?.data as { json?: T } | T | undefined;
  if (data && typeof data === "object" && "json" in (data as object)) return (data as { json: T }).json;
  return data as T;
}

export class NotFoundError extends Error {
  constructor() {
    super("Not found");
    this.name = "NotFoundError";
  }
}

export function listPosts(): Promise<BlogListItem[]> {
  return call<BlogListItem[]>("blog.listPosts");
}

export function getPostBySlug(slug: string): Promise<BlogPost> {
  return call<BlogPost>("blog.getPostBySlug", { slug });
}

export function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}
