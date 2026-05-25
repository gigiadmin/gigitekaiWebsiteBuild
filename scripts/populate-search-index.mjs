import { getDb } from '../server/db.ts';
import { searchIndex } from '../drizzle/schema.ts';

async function populateSearchIndex() {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    console.log('🔍 Starting search index population...\n');
    
    // Clear existing index
    await db.delete(searchIndex);
    console.log('✅ Cleared existing search index\n');
    
    // Get blog posts from database
    console.log('📝 Indexing blog posts...');
    const blogPosts = await db.query.blogPosts.findMany({
      limit: 100,
    });
    
    // Insert blog posts into search index
    for (const post of blogPosts) {
      await db.insert(searchIndex).values({
        contentType: 'blog',
        sourceId: `blog_${post.id}`,
        title: post.title || '',
        excerpt: post.excerpt || post.content?.substring(0, 200) || '',
        content: post.content || '',
        url: `/blog/${post.slug}`,
      });
    }
    console.log(`✅ Indexed ${blogPosts.length} blog posts\n`);
    
    // Get KB articles from database
    console.log('📚 Indexing KB articles...');
    const kbArticles = await db.query.kbArticles.findMany({
      limit: 200,
    });
    
    // Insert KB articles into search index
    for (const article of kbArticles) {
      await db.insert(searchIndex).values({
        contentType: 'kb',
        sourceId: `kb_${article.id}`,
        title: article.title || '',
        excerpt: article.content?.substring(0, 200) || '',
        content: article.content || '',
        url: `/kb/${article.id}`,
      });
    }
    console.log(`✅ Indexed ${kbArticles.length} KB articles\n`);
    
    // Index service pages
    console.log('🛠️ Indexing service pages...');
    const services = [
      { id: 'cloud', title: 'Cloud Infrastructure & Migration', excerpt: 'Enterprise-grade cloud solutions on AWS, Azure, and Google Cloud', url: '/services/cloud' },
      { id: 'ai', title: 'AI Agent Automation', excerpt: 'Intelligent automation agents that work 24/7 for your business', url: '/services/ai' },
      { id: 'helpdesk', title: 'AI-Powered Helpdesk', excerpt: 'Intelligent ticket management and customer support automation', url: '/services/helpdesk' },
      { id: 'security', title: 'Cybersecurity Solutions', excerpt: 'Zero Trust architecture and comprehensive security framework', url: '/services/security' },
      { id: 'microsoft365', title: 'Microsoft 365 Optimization', excerpt: 'Maximize your Microsoft 365 investment with expert optimization', url: '/services/microsoft-365' },
    ];
    
    for (const service of services) {
      await db.insert(searchIndex).values({
        contentType: 'service',
        sourceId: `service_${service.id}`,
        title: service.title,
        excerpt: service.excerpt,
        content: service.excerpt,
        url: service.url,
      });
    }
    console.log(`✅ Indexed ${services.length} service pages\n`);
    
    // Get total count
    const results = await db.select().from(searchIndex);
    console.log(`\n✨ Search index population complete!`);
    console.log(`📊 Total indexed items: ${results.length}\n`);
    
  } catch (error) {
    console.error('❌ Error populating search index:', error);
    process.exit(1);
  }
}

populateSearchIndex();
