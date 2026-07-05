#!/usr/bin/env python3
"""
Import batch3 CSV articles (58 missing articles) directly into kbArticles
"""
import csv
import os
import sys
import re
from urllib.parse import urlparse

# Add parent dir to path for dotenv
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# DB_URL passed via environment

import mysql.connector

DB_URL = os.getenv('DATABASE_URL')

def parse_db_url(url):
    """Parse MySQL URL"""
    u = urlparse(url)
    return {
        'host': u.hostname,
        'port': u.port or 3306,
        'user': u.username,
        'password': u.password,
        'database': u.path.lstrip('/'),
        'ssl_disabled': False,
        'use_unicode': True,
        'charset': 'utf8mb4'
    }

def extract_article_code(title):
    """Extract article code from title (e.g., "AZR-004: ..." -> "AZR-004")"""
    match = re.match(r'^([A-Z]+-\d+)', title)
    return match.group(1) if match else None

def parse_category(cat):
    """Parse category into main and subcategory"""
    if not cat:
        return 'General', None
    parts = [p.strip() for p in cat.split('>')]
    return parts[0] or 'General', parts[1] if len(parts) > 1 else None

def get_difficulty(content):
    """Determine difficulty from content"""
    lower = content.lower()
    if 'advanced' in lower or 'expert' in lower:
        return 'advanced'
    if 'beginner' in lower or 'basic' in lower:
        return 'beginner'
    return 'intermediate'

def main():
    conn = mysql.connector.connect(**parse_db_url(DB_URL))
    cursor = conn.cursor()
    print('✅ Connected to DB')

    # Read CSV
    with open('/home/ubuntu/upload/kb-batch3.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        articles = list(reader)

    print(f'📋 Parsed {len(articles)} articles from CSV')

    imported = 0
    skipped = 0
    errors = 0

    for article in articles:
        try:
            title = article['Title'].strip()
            content = article['Content'].strip()
            category_str = article.get('Category', 'General').strip()
            tags = article.get('Tags', '').strip()

            if not title or not content:
                print(f'  SKIP: Missing title or content')
                skipped += 1
                continue

            article_code = extract_article_code(title)
            if not article_code:
                print(f'  SKIP: Could not extract article code from "{title[:50]}"')
                skipped += 1
                continue

            # Check if already exists
            cursor.execute('SELECT id FROM kbArticles WHERE articleCode = %s LIMIT 1', (article_code,))
            if cursor.fetchone():
                print(f'  SKIP (exists): {article_code}')
                skipped += 1
                continue

            category, subcategory = parse_category(category_str)
            difficulty = get_difficulty(content)

            # Insert into kbArticles
            cursor.execute('''
                INSERT INTO kbArticles 
                (title, content, category, subcategory, tags, isPublished, audience, difficulty, 
                 articleCode, ariaEnabled, createdAt, updatedAt)
                VALUES (%s, %s, %s, %s, %s, 1, %s, %s, %s, 1, NOW(), NOW())
            ''', (title, content, category, subcategory, tags, 'technician', difficulty, article_code))

            # Insert into knowledgeBase (search index)
            cursor.execute('''
                INSERT INTO knowledgeBase (category, title, content, keywords, priority, createdAt, updatedAt)
                VALUES (%s, %s, %s, %s, %s, NOW(), NOW())
            ''', (category_str, title, content[:5000], f'{tags}, {title}', 2))

            conn.commit()
            print(f'  OK: {article_code}')
            imported += 1
        except Exception as err:
            print(f'  ERROR: {err}')
            errors += 1

    cursor.close()
    conn.close()

    print(f'\n=== Import complete ===')
    print(f'Imported: {imported}')
    print(f'Skipped: {skipped}')
    print(f'Errors: {errors}')

    # Final count
    conn = mysql.connector.connect(**parse_db_url(DB_URL))
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) as total FROM kbArticles WHERE isPublished = 1')
    total = cursor.fetchone()[0]
    print(f'Total published KB articles: {total}')
    cursor.close()
    conn.close()

if __name__ == '__main__':
    main()
