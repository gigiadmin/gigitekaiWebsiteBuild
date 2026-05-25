import { db } from '../server/db.ts';
import { searchIndex } from '../drizzle/schema.ts';

async function populateSearchIndex() {
  try {
    console.log('🔍 Starting search index population...');
    
    // Get blog posts from database
    const blogPosts = await db.query.blogPosts.findMany({
      limit: 100,
    });
    
    // Get KB articles from database
    const kbArticles = await db.query.knowledgeBaseArticles.findMany({
      limit: 100,
    });
    
    // Insert blog posts into search index
    for (const post of blogPosts) {
      await db.insert(searchIndex).values({
        title: post.title || '',
        content: post.content || '',
        url: `/blog/${post.slug}`,
        category: 'blog',
        popularity: 0,
      }).onConflictDoNothing();
    }
    
    console.log(`✅ Indexed ${blogPosts.length} blog posts`);
    
    // Insert KB articles into search index
    for (const article of kbArticles) {
      await db.insert(searchIndex).values({
        title: article.title || '',
        content: article.content || '',
        url: `/kb/${article.id}`,
        category: 'kb',
        popularity: 0,
      }).onConflictDoNothing();
    }
    
    console.log(`✅ Indexed ${kbArticles.length} KB articles`);
    console.log('✅ Search index population complete!');
    
  } catch (error) {
    console.error('❌ Error populating search index:', error);
    process.exit(1);
  }
}

populateSearchIndex();
