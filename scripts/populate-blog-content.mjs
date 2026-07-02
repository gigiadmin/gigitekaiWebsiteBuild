/**
 * Script to generate full article content for blog posts with empty content
 * Run: node scripts/populate-blog-content.mjs
 */
import 'dotenv/config';
import { createConnection } from 'mysql2/promise';

const LLM_URL = process.env.BUILT_IN_FORGE_API_URL + '/v1/chat/completions';
const LLM_KEY = process.env.BUILT_IN_FORGE_API_KEY;

async function generateArticleContent(title, category, slug) {
  const prompt = `You are a senior technology journalist writing for GigitekAI, an AI-first Managed Services Provider (MSP). Write a comprehensive, engaging, Fortune 500-quality blog article about the following topic.

Article Title: "${title}"
Category: ${category}

Requirements:
- Write 800-1200 words of substantive, informative content
- Use markdown formatting with ## headers, bullet points, and bold text
- Include real-world business implications for enterprise IT leaders and MSPs
- Discuss how AI and managed services relate to this topic
- Include a "Key Takeaways" section at the end with 3-5 bullet points
- Write in a professional but accessible tone — authoritative, not academic
- Do NOT use generic filler phrases like "In today's rapidly evolving landscape"
- Ground the content in real facts and industry context
- Include practical insights that IT decision-makers can act on
- The article should feel like it was written by a human expert, not AI

Write the full article content in markdown format now:`;

  const response = await fetch(LLM_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${LLM_KEY}`,
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet',
      messages: [
        { role: 'user', content: prompt }
      ],
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`LLM API error: ${response.status} ${err}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function generateExcerpt(title, category) {
  const prompt = `Write a compelling 1-2 sentence excerpt (max 200 characters) for a blog article titled: "${title}" in the category "${category}". Make it engaging and informative. Just the excerpt text, no quotes.`;

  const response = await fetch(LLM_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${LLM_KEY}`,
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet',
      messages: [
        { role: 'user', content: prompt }
      ],
      max_tokens: 100,
    }),
  });

  if (!response.ok) {
    throw new Error(`LLM API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

async function main() {
  const conn = await createConnection(process.env.DATABASE_URL);
  
  try {
    // Get all published posts with empty content or excerpt
    const [posts] = await conn.execute(
      `SELECT id, title, excerpt, category, slug FROM blogPosts WHERE published = 1 ORDER BY id DESC`
    );
    
    console.log(`Found ${posts.length} published blog posts to process`);
    
    for (const post of posts) {
      const needsContent = !post.content || post.content.trim() === '';
      const needsExcerpt = !post.excerpt || post.excerpt.trim() === '';
      
      if (!needsContent && !needsExcerpt) {
        console.log(`✓ Skipping post ${post.id}: "${post.title.substring(0, 50)}" (already has content)`);
        continue;
      }
      
      console.log(`\n📝 Generating content for post ${post.id}: "${post.title.substring(0, 60)}..."`);
      
      let excerpt = post.excerpt;
      let content = post.content;
      
      if (needsExcerpt) {
        console.log('  → Generating excerpt...');
        excerpt = await generateExcerpt(post.title, post.category);
        console.log(`  ✓ Excerpt: ${excerpt.substring(0, 80)}...`);
      }
      
      if (needsContent) {
        console.log('  → Generating full article content...');
        content = await generateArticleContent(post.title, post.category, post.slug);
        console.log(`  ✓ Content generated: ${content.length} characters`);
      }
      
      // Update the database
      await conn.execute(
        `UPDATE blogPosts SET content = ?, excerpt = ?, updatedAt = NOW() WHERE id = ?`,
        [content, excerpt, post.id]
      );
      console.log(`  ✅ Updated post ${post.id} in database`);
      
      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 1000));
    }
    
    console.log('\n🎉 All blog posts updated successfully!');
  } finally {
    await conn.end();
  }
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
