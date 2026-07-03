# ARIA Company Brain — KB Ingestion & Retrieval Strategy

## Overview

Transform ARIA Admin Search into a comprehensive knowledge engine by:
1. **Unifying KB retrieval** — Switch from direct `kbArticles` queries to the `searchIndex` table
2. **Auto-indexing on KB writes** — Hook `indexContent()` into KB create/update procedures
3. **External doc integration** — Ingest Microsoft Learn, Sherweb docs, Jira, Confluence, GitHub, Slack, Teams
4. **Smart knowledge graph** — Build cross-references and auto-link solutions

---

## Phase 2: KB Article Indexing & Retrieval

### Current State
- **ARIA queries**: `kbArticles` table directly using LIKE search (title, content, category)
- **Search index**: Populated manually for blog posts and static services, but **NOT used by ARIA**
- **KB CRUD**: `createArticle` and `updateArticle` do NOT call `indexContent()`
- **Public search**: Uses `searchIndex` via `searchContent()`, but admin ARIA does not

### Implementation Steps

#### 2.1 Hook KB Indexing on Create/Update

**File**: `server/routers/helpdesk-kb.ts`

```typescript
import { indexContent } from "../search";

// In createArticle mutation (after db.insert):
const article = await db.insert(kbArticles).values({...});
const articleId = result[0]?.insertId;

// Index the new article
if (articleId && input.isPublished) {
  await indexContent({
    contentType: "kb",
    sourceId: articleId.toString(),
    title: input.title,
    excerpt: input.content.substring(0, 300),
    content: input.content,
    url: `/kb/${articleId}`,
    metadata: {
      category: input.category,
      tags: input.tags ? input.tags.split(",") : [],
      audience: "technician", // Default; can be extended
      difficulty: "intermediate", // Default
    },
  });
}

// In updateArticle mutation (after db.update):
// Re-index the updated article
if (input.isPublished) {
  await indexContent({
    contentType: "kb",
    sourceId: input.id.toString(),
    title: updates.title || articles[0].title,
    excerpt: (updates.content || articles[0].content).substring(0, 300),
    content: updates.content || articles[0].content,
    url: `/kb/${input.id}`,
    metadata: {
      category: updates.category || articles[0].category,
      tags: updates.tags ? updates.tags.split(",") : (articles[0].tags?.split(",") || []),
      audience: articles[0].audience || "technician",
      difficulty: articles[0].difficulty || "intermediate",
    },
  });
}
```

#### 2.2 Create Admin KB Search Procedure

**File**: `server/routers/adminSearch.ts`

Add a new procedure to retrieve KB articles from `searchIndex`:

```typescript
// Helper: Search KB articles from searchIndex
async function searchKBFromIndex(query: string, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];

  const results = await db
    .select()
    .from(searchIndex)
    .where(
      and(
        eq(searchIndex.contentType, "kb"),
        or(
          like(searchIndex.title, `%${query}%`),
          like(searchIndex.content, `%${query}%`),
          like(searchIndex.excerpt, `%${query}%`)
        )
      )
    )
    .limit(limit);

  return results.map(r => ({
    title: r.title,
    excerpt: r.excerpt,
    url: r.url,
    metadata: r.metadata ? JSON.parse(r.metadata) : {},
  }));
}
```

#### 2.3 Update ARIA Live Context Builder

**File**: `server/routers/adminSearch.ts` (lines 156-198)

Replace the direct `kbArticles` query with `searchIndex` retrieval:

```typescript
if (scope.kb) {
  try {
    // Get KB stats from kbArticles
    const [kbTotal] = await db.select({ c: count() }).from(kbArticles);
    const [kbPublished] = await db.select({ c: count() }).from(kbArticles).where(eq(kbArticles.isPublished, 1));

    // Search KB from searchIndex
    const kbSearchResults = await searchKBFromIndex(query, 5);
    
    // Get recent KB articles from searchIndex
    const recentKb = await db
      .select()
      .from(searchIndex)
      .where(eq(searchIndex.contentType, "kb"))
      .orderBy(desc(searchIndex.createdAt))
      .limit(5);

    stats.kb = { total: kbTotal.c, published: kbPublished.c, indexed: recentKb.length };

    let kbSection = `KNOWLEDGE BASE:\n  Total Articles: ${kbTotal.c} | Published: ${kbPublished.c} | Indexed: ${recentKb.length}\n`;

    if (kbSearchResults.length > 0) {
      kbSection += `\nKB Articles matching "${query}":\n`;
      kbSection += kbSearchResults.map(a =>
        `  - ${a.title}\n    ${a.excerpt?.substring(0, 150)}\n    URL: ${a.url}`
      ).join("\n");
    }

    if (recentKb.length > 0) {
      kbSection += `\nMost Recent KB Articles:\n`;
      kbSection += recentKb.map(a => `  - ${a.title} (${a.url})`).join("\n");
    }

    sections.push(kbSection);
  } catch {
    sections.push("KB data temporarily unavailable.");
  }
}
```

#### 2.4 Add KB Indexing Status to Admin Panel

**File**: `client/src/pages/AdminSearchIndexPage.tsx`

Add a section to show KB indexing status:

```typescript
// After populateIndex button, add:
<div className="mt-6 p-4 bg-slate-800 rounded-lg">
  <h3 className="text-cyan-400 font-semibold mb-2">KB Indexing Status</h3>
  <p className="text-sm text-gray-300">
    KB articles are automatically indexed when created or updated.
    Manual re-indexing is available via the "Populate Index" button above.
  </p>
  {stats?.byType?.kb && (
    <p className="text-sm text-gray-400 mt-2">
      Currently indexed: <span className="text-cyan-400">{stats.byType.kb}</span> KB articles
    </p>
  )}
</div>
```

---

## Phase 3: Microsoft Documentation Integration

### Strategy

1. **Microsoft Learn API** — Fetch learning paths, modules, and documentation
2. **Microsoft Support** — Scrape common issues and solutions
3. **Sherweb Public Docs** — Index partner documentation
4. **Ingestion Schedule** — Daily sync via Heartbeat

### Implementation

#### 3.1 Create Microsoft Docs Ingestion Service

**File**: `server/services/microsoftDocsIngestion.ts`

```typescript
import { indexContent } from "../search";

export async function ingestMicrosoftDocs() {
  const docs = [
    {
      id: "ms-365-security",
      title: "Microsoft 365 Security Best Practices",
      content: "...", // Fetch from Microsoft Learn API
      url: "https://learn.microsoft.com/en-us/microsoft-365/security/",
      category: "Microsoft 365",
    },
    // ... more docs
  ];

  for (const doc of docs) {
    await indexContent({
      contentType: "kb",
      sourceId: `ms-${doc.id}`,
      title: doc.title,
      excerpt: doc.content.substring(0, 300),
      content: doc.content,
      url: doc.url,
      metadata: {
        category: doc.category,
        tags: ["Microsoft", "Official Docs"],
        audience: "technician",
        difficulty: "intermediate",
        syncSource: "microsoft-learn",
      },
    });
  }
}
```

#### 3.2 Create Sherweb Docs Ingestion Service

**File**: `server/services/sherweb DocsIngestion.ts`

```typescript
export async function ingestSherweb Docs() {
  // Fetch from Sherweb public docs
  // Index each guide/article
}
```

#### 3.3 Schedule Daily Sync via Heartbeat

**File**: `references/periodic-updates.md` (add to scheduled tasks)

```
- Task: Sync Microsoft Docs & Sherweb Docs
  Frequency: Daily at 2 AM UTC
  Handler: POST /api/scheduled/sync-external-docs
  Timeout: 5 minutes
```

---

## Phase 4: External System Integration

### Connectors to Build

1. **Jira** — Index tickets, issues, and resolutions
2. **Confluence** — Index wiki pages and documentation
3. **GitHub** — Index issues, discussions, and code comments
4. **Slack** — Index resolved threads and Q&A
5. **Teams** — Index channel conversations and shared knowledge

### Implementation Pattern

Each connector follows:
1. **Authentication** — Store API tokens in secrets
2. **Fetcher** — Query the external API
3. **Transformer** — Convert to KB format
4. **Indexer** — Call `indexContent()`
5. **Scheduler** — Run daily or on-demand

**Example: Jira Connector**

```typescript
export async function ingestJiraIssues() {
  const jiraUrl = process.env.JIRA_URL;
  const jiraToken = process.env.JIRA_API_TOKEN;

  const response = await fetch(`${jiraUrl}/rest/api/3/search`, {
    headers: {
      "Authorization": `Bearer ${jiraToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jql: "resolution = Done AND created >= -30d",
      fields: ["summary", "description", "resolution"],
    }),
  });

  const data = await response.json();

  for (const issue of data.issues) {
    await indexContent({
      contentType: "kb",
      sourceId: `jira-${issue.key}`,
      title: issue.fields.summary,
      excerpt: issue.fields.description?.substring(0, 300) || "",
      content: issue.fields.description || "",
      url: `${jiraUrl}/browse/${issue.key}`,
      metadata: {
        category: "Jira Issues",
        tags: ["Jira", "Resolved"],
        syncSource: "jira",
        externalUid: issue.key,
      },
    });
  }
}
```

---

## Phase 5: Knowledge Graph & Auto-Linking

### Strategy

1. **Extract entities** — Use LLM to identify topics, products, issues
2. **Build relationships** — Link related KB articles
3. **Auto-suggest solutions** — When ARIA sees a query, suggest related articles
4. **Cross-reference** — Show "Related Articles" in KB UI

### Implementation

```typescript
// Helper: Extract entities from KB article
async function extractEntities(title: string, content: string) {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "Extract key entities (products, issues, solutions) from this KB article. Return as JSON array.",
      },
      {
        role: "user",
        content: `Title: ${title}\n\nContent: ${content}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "entities",
        schema: {
          type: "object",
          properties: {
            products: { type: "array", items: { type: "string" } },
            issues: { type: "array", items: { type: "string" } },
            solutions: { type: "array", items: { type: "string" } },
          },
        },
      },
    },
  });

  return JSON.parse(response.content);
}

// Helper: Find related articles
async function findRelatedArticles(articleId: number, limit: number = 5) {
  const db = await getDb();
  const article = await db.select().from(kbArticles).where(eq(kbArticles.id, articleId));
  if (!article.length) return [];

  const entities = await extractEntities(article[0].title, article[0].content);
  
  // Search for articles with matching entities
  const relatedResults = await db
    .select()
    .from(searchIndex)
    .where(
      and(
        eq(searchIndex.contentType, "kb"),
        or(
          like(searchIndex.content, `%${entities.products[0]}%`),
          like(searchIndex.content, `%${entities.issues[0]}%`),
          like(searchIndex.content, `%${entities.solutions[0]}%`)
        )
      )
    )
    .limit(limit);

  return relatedResults;
}
```

---

## Phase 6: Testing & Optimization

### Test Scenarios

1. **KB Create/Update** — Verify articles are indexed immediately
2. **ARIA Search** — Query KB and verify results from `searchIndex`
3. **External Docs** — Verify Microsoft/Sherweb docs are indexed
4. **Jira/Confluence** — Verify external system data is indexed
5. **Knowledge Graph** — Verify related articles are suggested

### Performance Optimization

1. **Batch indexing** — Index multiple articles in parallel
2. **Caching** — Cache frequently accessed KB articles
3. **Full-text search** — Upgrade from LIKE to MySQL FULLTEXT
4. **Embedding vectors** — Add semantic search via embeddings

---

## Database Schema Updates

### New Fields to Expose in KB CRUD

Update `helpdesk-kb.ts` to support:
- `audience` (end-user, technician, admin)
- `difficulty` (beginner, intermediate, advanced)
- `estimatedResolutionTime`
- `ariaEnabled` (toggle ARIA recommendations)
- `articleCode` (internal reference code)

### New Tables (Optional)

- `kbRelationships` — Store article-to-article links
- `kbEntities` — Store extracted entities (products, issues, solutions)
- `externalDocSources` — Track sync sources and last-sync timestamps

---

## Deployment Checklist

- [ ] Hook `indexContent()` into KB create/update
- [ ] Update ARIA live context to use `searchIndex`
- [ ] Add KB indexing status to admin panel
- [ ] Implement Microsoft Docs ingestion
- [ ] Implement Sherweb Docs ingestion
- [ ] Build Jira connector
- [ ] Build Confluence connector
- [ ] Build GitHub connector
- [ ] Build Slack connector
- [ ] Build Teams connector
- [ ] Implement knowledge graph extraction
- [ ] Add related articles UI
- [ ] Test end-to-end ARIA retrieval
- [ ] Optimize search performance
- [ ] Deploy to production

---

## Success Metrics

1. **KB Coverage** — 50+ articles indexed and searchable
2. **ARIA Accuracy** — 90%+ relevance in KB recommendations
3. **Search Speed** — <500ms for KB queries
4. **External Docs** — 100+ Microsoft/Sherweb docs indexed
5. **Knowledge Graph** — 80%+ of articles have related links

---

## Notes

- Use fictitious domains (e.g., `gigitest.com`) in KB examples per requirements
- Focus on Microsoft 365, Sherweb, and MSP-specific content
- Prioritize end-user support articles (30+ articles goal)
- Ensure ARIA recommendations are disabled until KB is sufficiently built up
