#!/usr/bin/env node
/**
 * AI Strategic Briefing — Monthly Update Script
 * Runs on the first Monday of each month
 * Generates a draft update with current AI industry information
 */

import fetch from 'node-fetch';
import { invokeLLM } from '../server/_core/llm.js';

const BRIEFING_PAGE_PATH = '/AIStrategicBriefing';
const CURRENT_DATE = new Date();
const MONTH_YEAR = CURRENT_DATE.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

/**
 * Fetch recent AI news from multiple sources
 */
async function fetchAINews() {
  console.log('📰 Fetching recent AI industry news...\n');

  const newsPrompt = `
You are an enterprise AI research assistant. Aggregate recent AI news from the past 30 days.
Focus on:
1. Enterprise AI adoption, scaling, and security
2. Practical breakthroughs in LLMs and autonomous AI agents
3. Industry-specific automation (IT service desks, customer support)

Return a JSON object with this structure:
{
  "trends": [
    { "title": "Trend Name", "description": "Why this matters to enterprise IT leaders", "relevance": "enterprise/automation/security" }
  ],
  "breakthroughs": [
    { "title": "Product/Model Name", "company": "Company", "summary": "What it is", "useCase": "Enterprise use case", "date": "May 2026" }
  ],
  "metrics": [
    { "stat": "Statistic", "value": "Number/Percentage", "source": "Source Name", "insight": "What this means for enterprises" }
  ]
}

Be specific, cite recent announcements, and focus on practical business impact.
`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'You are an expert enterprise AI analyst. Provide accurate, recent information about AI industry developments.'
        },
        {
          role: 'user',
          content: newsPrompt
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'ai_briefing_update',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              trends: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    description: { type: 'string' },
                    relevance: { type: 'string' }
                  },
                  required: ['title', 'description', 'relevance']
                }
              },
              breakthroughs: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    company: { type: 'string' },
                    summary: { type: 'string' },
                    useCase: { type: 'string' },
                    date: { type: 'string' }
                  },
                  required: ['title', 'company', 'summary', 'useCase', 'date']
                }
              },
              metrics: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    stat: { type: 'string' },
                    value: { type: 'string' },
                    source: { type: 'string' },
                    insight: { type: 'string' }
                  },
                  required: ['stat', 'value', 'source', 'insight']
                }
              }
            },
            required: ['trends', 'breakthroughs', 'metrics']
          }
        }
      }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No content returned from LLM');

    return JSON.parse(content);
  } catch (error) {
    console.error('❌ Error fetching AI news:', error.message);
    return null;
  }
}

/**
 * Generate markdown content for the briefing
 */
function generateMarkdown(data) {
  if (!data) return null;

  let markdown = `# Strategic AI Briefing — ${MONTH_YEAR}\n\n`;
  markdown += `**DRAFT FOR REVIEW** — Generated on ${new Date().toLocaleDateString()}\n\n`;
  markdown += `---\n\n`;

  // Trends & Insights
  markdown += `## 📊 Trends & Insights\n\n`;
  data.trends.forEach((trend, idx) => {
    markdown += `### ${idx + 1}. ${trend.title}\n`;
    markdown += `${trend.description}\n\n`;
    markdown += `**Relevance:** ${trend.relevance}\n\n`;
  });

  // Latest AI Breakthroughs
  markdown += `## 🚀 Latest AI Breakthroughs\n\n`;
  data.breakthroughs.forEach((breakthrough, idx) => {
    markdown += `### ${idx + 1}. ${breakthrough.title}\n`;
    markdown += `**Company:** ${breakthrough.company} | **Date:** ${breakthrough.date}\n\n`;
    markdown += `**What it is:** ${breakthrough.summary}\n\n`;
    markdown += `**Enterprise Use Case:** ${breakthrough.useCase}\n\n`;
  });

  // Market Data & Metrics
  markdown += `## 📈 Market Data & Metrics\n\n`;
  data.metrics.forEach((metric) => {
    markdown += `- **${metric.stat}:** ${metric.value} *(Source: ${metric.source})*\n`;
    markdown += `  - ${metric.insight}\n\n`;
  });

  markdown += `---\n\n`;
  markdown += `**Next Update:** First Monday of next month\n`;

  return markdown;
}

/**
 * Main execution
 */
async function main() {
  console.log('🤖 AI Strategic Briefing — Monthly Update\n');
  console.log(`📅 Month: ${MONTH_YEAR}\n`);
  console.log('━'.repeat(60) + '\n');

  // Fetch news
  const newsData = await fetchAINews();
  if (!newsData) {
    console.error('❌ Failed to generate briefing update');
    process.exit(1);
  }

  // Generate markdown
  const markdown = generateMarkdown(newsData);
  if (!markdown) {
    console.error('❌ Failed to generate markdown');
    process.exit(1);
  }

  // Output draft
  console.log('📝 DRAFT UPDATE:\n');
  console.log(markdown);

  // Save to file for review
  const fs = await import('fs').then(m => m.promises);
  const draftPath = `/tmp/ai-briefing-draft-${CURRENT_DATE.toISOString().split('T')[0]}.md`;
  await fs.writeFile(draftPath, markdown);

  console.log('\n' + '━'.repeat(60));
  console.log(`✅ Draft saved to: ${draftPath}`);
  console.log('\n📧 NEXT STEP: Review the draft and publish to the page when ready.');
  console.log('   Path: /AIStrategicBriefing\n');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
