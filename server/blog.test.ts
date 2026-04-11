/**
 * Blog Router — unit tests
 * Tests public read procedures and admin-only write procedures.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock getDb ────────────────────────────────────────────────────────────────

const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

vi.mock("./db", () => ({
  getDb: vi.fn(() => Promise.resolve(mockDb)),
}));

vi.mock("../drizzle/schema", () => ({
  blogPosts: { id: "id", slug: "slug", published: "published" },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((col, val) => ({ col, val })),
  desc: vi.fn((col) => ({ col })),
  and: vi.fn((...args) => args),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeChain(returnValue: unknown) {
  const chain: Record<string, unknown> = {};
  const methods = ["from", "where", "orderBy", "limit", "values", "set"];
  methods.forEach((m) => {
    chain[m] = vi.fn(() => chain);
  });
  // Terminal: make the chain itself thenable so await works
  chain.then = (resolve: (v: unknown) => void) => Promise.resolve(returnValue).then(resolve);
  return chain;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("blog router — listPosts", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns empty array when db is unavailable", async () => {
    const { getDb } = await import("./db");
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
    const { blogRouter } = await import("./routers/blog");
    // @ts-expect-error — calling internal resolver directly for unit test
    const result = await blogRouter._def.procedures.listPosts._def.resolver({ ctx: {} });
    expect(result).toEqual([]);
  });

  it("queries published posts ordered by publishedAt desc", async () => {
    const fakePosts = [
      { id: 1, slug: "post-one", title: "Post One", category: "AI", readTime: "5 min read" },
    ];
    const chain = makeChain(fakePosts);
    mockDb.select.mockReturnValue(chain);
    const { blogRouter } = await import("./routers/blog");
    // @ts-expect-error
    const result = await blogRouter._def.procedures.listPosts._def.resolver({ ctx: {} });
    expect(mockDb.select).toHaveBeenCalled();
    expect(result).toEqual(fakePosts);
  });
});

describe("blog router — getPostBySlug", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws NOT_FOUND when post does not exist", async () => {
    const chain = makeChain([]);
    mockDb.select.mockReturnValue(chain);
    const { blogRouter } = await import("./routers/blog");
    await expect(
      // @ts-expect-error
      blogRouter._def.procedures.getPostBySlug._def.resolver({
        ctx: {},
        input: { slug: "nonexistent" },
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("returns the post when found", async () => {
    const fakePost = { id: 2, slug: "my-post", title: "My Post", published: true };
    const chain = makeChain([fakePost]);
    mockDb.select.mockReturnValue(chain);
    const { blogRouter } = await import("./routers/blog");
    // @ts-expect-error
    const result = await blogRouter._def.procedures.getPostBySlug._def.resolver({
      ctx: {},
      input: { slug: "my-post" },
    });
    expect(result).toEqual(fakePost);
  });
});

describe("blog router — createPost (admin only)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws FORBIDDEN for non-admin users", async () => {
    const { blogRouter } = await import("./routers/blog");
    await expect(
      // @ts-expect-error
      blogRouter._def.procedures.createPost._def.resolver({
        ctx: { user: { role: "user" } },
        input: {
          slug: "test",
          title: "Test",
          excerpt: "Test",
          content: "Test",
          category: "AI",
          readTime: "5 min read",
          published: false,
        },
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("throws CONFLICT when slug already exists", async () => {
    const existingChain = makeChain([{ id: 1 }]);
    mockDb.select.mockReturnValue(existingChain);
    const { blogRouter } = await import("./routers/blog");
    await expect(
      // @ts-expect-error
      blogRouter._def.procedures.createPost._def.resolver({
        ctx: { user: { role: "admin" } },
        input: {
          slug: "existing-slug",
          title: "Test",
          excerpt: "Test",
          content: "Test",
          category: "AI",
          readTime: "5 min read",
          published: false,
        },
      })
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });
});

describe("blog router — deletePost (admin only)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws FORBIDDEN for non-admin users", async () => {
    const { blogRouter } = await import("./routers/blog");
    await expect(
      // @ts-expect-error
      blogRouter._def.procedures.deletePost._def.resolver({
        ctx: { user: { role: "agent" } },
        input: { id: 1 },
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("calls db.delete for admin users", async () => {
    const chain = makeChain([]);
    mockDb.delete.mockReturnValue(chain);
    const { blogRouter } = await import("./routers/blog");
    // @ts-expect-error
    const result = await blogRouter._def.procedures.deletePost._def.resolver({
      ctx: { user: { role: "admin" } },
      input: { id: 5 },
    });
    expect(mockDb.delete).toHaveBeenCalled();
    expect(result).toEqual({ success: true });
  });
});

describe("blog router — togglePublished (admin only)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws FORBIDDEN for non-admin users", async () => {
    const { blogRouter } = await import("./routers/blog");
    await expect(
      // @ts-expect-error
      blogRouter._def.procedures.togglePublished._def.resolver({
        ctx: { user: { role: "viewer" } },
        input: { id: 1, published: true },
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("calls db.update for admin users", async () => {
    const chain = makeChain([]);
    mockDb.update.mockReturnValue(chain);
    const { blogRouter } = await import("./routers/blog");
    // @ts-expect-error
    const result = await blogRouter._def.procedures.togglePublished._def.resolver({
      ctx: { user: { role: "admin" } },
      input: { id: 3, published: true },
    });
    expect(mockDb.update).toHaveBeenCalled();
    expect(result).toEqual({ success: true });
  });
});
