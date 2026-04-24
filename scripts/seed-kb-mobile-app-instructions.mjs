#!/usr/bin/env node
/**
 * Seed KB Article: How to Add GigitekAI to Your Mobile Phone Home Screen
 * Adds instructions for Android and iPhone users
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gigitekai',
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

const articleContent = `# How to Add GigitekAI to Your Mobile Phone Home Screen

## For Android Users (Using Microsoft Edge)

### Step 1: Open Microsoft Edge
- Open the **Microsoft Edge** app on your Android phone
- If you don't have it, download it from the **Google Play Store**

### Step 2: Go to the GigitekAI Website
- In the address bar, type: \`gigitekai.com\`
- Press Enter or tap the search button
- Wait for the website to load completely

### Step 3: Add to Home Screen
1. Tap the **three dots menu** (⋯) in the top-right corner of Edge
2. Tap **"Apps and more"** or **"Add to home screen"**
3. A popup will appear asking to confirm
4. Tap **"Add"** or **"Install"**
5. The app will be added to your home screen!

### Step 4: Find Your New App
- Go back to your home screen
- Look for the **GigitekAI** icon
- Tap it to open the app anytime

---

## For iPhone Users (Using Microsoft Edge)

### Step 1: Open Microsoft Edge
- Open the **Microsoft Edge** app on your iPhone
- If you don't have it, download it from the **App Store**

### Step 2: Go to the GigitekAI Website
- In the address bar, type: \`gigitekai.com\`
- Press Enter or tap the search button
- Wait for the website to load completely

### Step 3: Add to Home Screen
1. Tap the **Share button** (looks like a box with an arrow ⬆️) at the bottom of the screen
2. Scroll down and tap **"Add to Home Screen"**
3. A screen will appear where you can name the shortcut
4. The default name is fine (or customize it if you want)
5. Tap **"Add"** in the top-right corner
6. The app will be added to your home screen!

### Step 4: Find Your New App
- Go back to your home screen
- Look for the **GigitekAI** icon
- Tap it to open the app anytime

---

## Tips

✅ **The app works just like the website** — it's a shortcut, not a separate app  
✅ **You can use it offline** — some pages will load from cache  
✅ **It opens in full-screen mode** — looks like a real app!  
✅ **You can remove it anytime** — just hold and delete like any app

---

## Need Help?

If you have any issues, reach out to the support team at **support@gigitekai.com** or use the **Support** tab on the website.
`;

async function seedKB() {
  const connection = await pool.getConnection();
  try {
    console.log('[KB Seeder] Starting mobile app instructions KB article...');

    // Insert KB article
    const [result] = await connection.execute(
      `INSERT INTO kbArticles (title, content, category, isPublished, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [
        'How to Add GigitekAI to Your Mobile Phone Home Screen',
        articleContent,
        'Getting Started',
        true,
      ]
    );

    console.log('[KB Seeder] ✅ KB article created successfully!');
    console.log(`[KB Seeder] Article ID: ${result.insertId}`);
    console.log('[KB Seeder] Title: How to Add GigitekAI to Your Mobile Phone Home Screen');
    console.log('[KB Seeder] Category: Getting Started');
    console.log('[KB Seeder] Status: Published');

  } catch (error) {
    console.error('[KB Seeder] ❌ Error:', error.message);
    process.exit(1);
  } finally {
    await connection.release();
    await pool.end();
  }
}

seedKB();
