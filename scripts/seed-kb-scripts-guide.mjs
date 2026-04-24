/**
 * Seed script: Create and publish KB article
 * "How to Add Scripts to the GigitekAI Scripts Repository"
 * Run with: node scripts/seed-kb-scripts-guide.mjs
 */
import "dotenv/config";
import mysql from "mysql2/promise";

const connection = await mysql.createConnection({
  uri: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const slug = "how-to-add-scripts-to-gigitekai-scripts-repository";
const now = Date.now();

const content = `# How to Add Scripts to the GigitekAI Scripts Repository

## Overview

The GigitekAI Scripts Repository is a centralized GitHub repository that stores all production-verified operations and maintenance scripts used by the GigitekAI platform. This article explains how to add a new script to the repository so the entire team can access and use it.

**Repository URL:** https://github.com/gigiadmin/gigitekai-scripts

---

## Repository Structure

Scripts are organized into folders by category:

| Folder | Contents |
|--------|----------|
| \`powershell/\` | Microsoft Teams, M365, and Azure PowerShell scripts |
| \`database/\` | Database cleanup, migration, and maintenance scripts |
| \`email/\` | Email testing and mailbox management scripts |
| \`admin/\` | Admin user setup and management scripts |
| \`kb/\` | Knowledge Base article import and publishing scripts |
| \`blog/\` | Blog post seeding and management scripts |
| \`teams/\` | Teams integration testing scripts |
| \`testing/\` | LLM and API integration testing scripts |

---

## Method 1: From Your Local Machine (Recommended)

This method is best when you already have the repository cloned on your computer.

### Step 1: Copy the script into the correct folder

Open PowerShell and copy your script into the appropriate category folder:

\`\`\`powershell
copy C:\\path\\to\\your\\new-script.mjs C:\\Scripts\\gigitekai-scripts\\database\\
\`\`\`

### Step 2: Commit and push to GitHub

\`\`\`powershell
cd C:\\Scripts\\gigitekai-scripts
git add .
git commit -m "Add: brief description of what the script does"
git push
\`\`\`

The script is now live on GitHub and available to the entire team.

---

## Method 2: Directly on GitHub (No Local Setup Required)

Use this method if you do not have the repository cloned locally.

1. Go to **https://github.com/gigiadmin/gigitekai-scripts**
2. Navigate into the folder that matches your script type (e.g., \`database/\`)
3. Click **Add file → Create new file** or **Upload files**
4. Paste your script content or upload the file directly
5. Scroll down, enter a commit message describing what the script does
6. Click **Commit changes**

---

## Step 3: Update the README (Best Practice)

After adding a script, open \`README.md\` in the repository root and add a row to the matching category table:

\`\`\`markdown
| \`your-new-script.mjs\` | What it does | ✅ Verified |
\`\`\`

Then commit the README update:

\`\`\`powershell
git add README.md
git commit -m "Docs: add your-new-script.mjs to README"
git push
\`\`\`

---

## Script Header Standard

Every script should include a comment block at the top explaining what it does. This makes it easy for any team member to understand and use the script without guessing.

**Node.js (.mjs) example:**

\`\`\`javascript
/**
 * Script Name: cleanup-example.mjs
 * Purpose: Brief description of what this script does
 *
 * Usage:
 *   node cleanup-example.mjs
 *
 * Required environment variables:
 *   DATABASE_URL — MySQL/TiDB connection string
 *
 * Verified: Yes — tested in production on [date]
 */
\`\`\`

**PowerShell (.ps1) example:**

\`\`\`powershell
<#
.SYNOPSIS
    Brief description of what this script does.

.DESCRIPTION
    Detailed description of the script's purpose and behavior.

.NOTES
    Requirements: MicrosoftTeams PowerShell module
    Verified: Yes — tested in production on [date]
#>
\`\`\`

---

## Cloning the Repository for the First Time

If you have not yet cloned the repository to your local machine, run the following in PowerShell:

\`\`\`powershell
cd C:\\Scripts
git clone https://github.com/gigiadmin/gigitekai-scripts.git
cd gigitekai-scripts
\`\`\`

---

## Quick Reference

| Task | Command |
|------|---------|
| Clone the repo | \`git clone https://github.com/gigiadmin/gigitekai-scripts.git\` |
| Add all changes | \`git add .\` |
| Commit changes | \`git commit -m "Add: description"\` |
| Push to GitHub | \`git push\` |
| Pull latest changes | \`git pull\` |

---

## Need Help?

Contact the GigitekAI development team at support@gigitekai.com or open a support ticket through the helpdesk portal.`;

// Check if article already exists by title
const [existing] = await connection.execute(
  "SELECT id FROM kbArticles WHERE title = ? LIMIT 1",
  ["How to Add Scripts to the GigitekAI Scripts Repository"]
);

if (existing.length > 0) {
  console.log(`Article already exists with id ${existing[0].id}, updating...`);
  await connection.execute(
    `UPDATE kbArticles SET 
      content = ?, category = ?, tags = ?, isPublished = 1, updatedAt = NOW()
     WHERE id = ?`,
    [
      content,
      "developer-tools",
      JSON.stringify(["github", "scripts", "git", "developer-tools", "operations"]),
      existing[0].id,
    ]
  );
  console.log("✅ Article updated and published.");
} else {
  await connection.execute(
    `INSERT INTO kbArticles 
      (title, content, category, tags, isPublished, createdBy, createdAt, updatedAt, viewCount, averageRating, ratingCount, commentCount)
     VALUES (?, ?, ?, ?, 1, 1, NOW(), NOW(), 0, 0.00, 0, 0)`,
    [
      "How to Add Scripts to the GigitekAI Scripts Repository",
      content,
      "developer-tools",
      JSON.stringify(["github", "scripts", "git", "developer-tools", "operations"]),
    ]
  );
  console.log("✅ Article created and published successfully.");
}

const [result] = await connection.execute(
  "SELECT id, title, isPublished FROM kbArticles WHERE title = ? LIMIT 1",
  ["How to Add Scripts to the GigitekAI Scripts Repository"]
);
console.log("Article details:", result[0]);

await connection.end();
