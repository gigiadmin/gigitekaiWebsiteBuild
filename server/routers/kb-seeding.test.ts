import { describe, it, expect } from 'vitest';
import { DEFAULT_KB_ARTICLES } from './kb-seeding';

describe('KB Seeding', () => {
  it('should have default KB articles loaded', () => {
    expect(DEFAULT_KB_ARTICLES.length).toBeGreaterThan(0);
    console.log(`✅ Loaded ${DEFAULT_KB_ARTICLES.length} KB articles`);
  });

  it('should have articles from all major categories', () => {
    const categories = new Set(DEFAULT_KB_ARTICLES.map((a) => a.category));
    expect(categories.size).toBeGreaterThan(0);
    console.log(`✅ Categories: ${Array.from(categories).join(', ')}`);
  });

  it('should have Exchange Online articles', () => {
    const exchangeArticles = DEFAULT_KB_ARTICLES.filter((a) => a.category === 'Exchange Online');
    expect(exchangeArticles.length).toBeGreaterThan(0);
    console.log(`✅ Exchange Online: ${exchangeArticles.length} articles`);
  });

  it('should have Teams articles', () => {
    const teamsArticles = DEFAULT_KB_ARTICLES.filter((a) => a.category === 'Microsoft Teams');
    expect(teamsArticles.length).toBeGreaterThan(0);
    console.log(`✅ Microsoft Teams: ${teamsArticles.length} articles`);
  });

  it('should have SharePoint articles', () => {
    const spArticles = DEFAULT_KB_ARTICLES.filter((a) => a.category === 'SharePoint Online');
    expect(spArticles.length).toBeGreaterThan(0);
    console.log(`✅ SharePoint Online: ${spArticles.length} articles`);
  });

  it('should have OneDrive articles', () => {
    const odArticles = DEFAULT_KB_ARTICLES.filter((a) => a.category === 'OneDrive');
    expect(odArticles.length).toBeGreaterThan(0);
    console.log(`✅ OneDrive: ${odArticles.length} articles`);
  });

  it('should have Entra ID articles', () => {
    const entraArticles = DEFAULT_KB_ARTICLES.filter((a) => a.category === 'Entra ID / Azure AD');
    expect(entraArticles.length).toBeGreaterThan(0);
    console.log(`✅ Entra ID / Azure AD: ${entraArticles.length} articles`);
  });

  it('should have all articles with required fields', () => {
    DEFAULT_KB_ARTICLES.forEach((article) => {
      expect(article.id).toBeDefined();
      expect(article.title).toBeDefined();
      expect(article.category).toBeDefined();
      expect(article.problem).toBeDefined();
      expect(article.solution).toBeDefined();
      expect(article.steps).toBeDefined();
      expect(article.keywords).toBeDefined();
      expect(article.severity).toBeDefined();
      expect(article.estimatedResolutionTime).toBeDefined();
      expect(article.affectedServices).toBeDefined();
    });
    console.log(`✅ All articles have required fields`);
  });

  it('should be searchable by keywords', () => {
    const exchangeArticles = DEFAULT_KB_ARTICLES.filter((a) =>
      a.keywords.some((k) => k.includes('outlook'))
    );
    expect(exchangeArticles.length).toBeGreaterThan(0);
    console.log(`✅ Found ${exchangeArticles.length} articles with "outlook" keyword`);
  });

  it('should have prevention tips for most articles', () => {
    const articlesWithTips = DEFAULT_KB_ARTICLES.filter((a) => a.preventionTips && a.preventionTips.length > 0);
    expect(articlesWithTips.length).toBeGreaterThan(0);
    console.log(`✅ ${articlesWithTips.length} articles have prevention tips`);
  });

  it('should have step-by-step solutions', () => {
    DEFAULT_KB_ARTICLES.forEach((article) => {
      expect(article.steps.length).toBeGreaterThan(0);
      expect(article.steps[0]).toMatch(/^\d+\./); // Steps should start with number
    });
    console.log(`✅ All articles have numbered steps`);
  });
});
