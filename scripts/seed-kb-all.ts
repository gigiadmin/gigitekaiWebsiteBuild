import { getDb } from "../server/db";
import { knowledgeBase } from "../drizzle/schema";

const KBS = [
  {
    title: "How to Reset Your Password",
    slug: "reset-password",
    category: "Account Management",
    content: "# How to Reset Your Password\n\n## Steps\n1. Go to the login page\n2. Click 'Forgot Password'\n3. Enter your email address\n4. Check your email for reset link\n5. Click the link and create a new password\n6. Log in with your new password",
  },
  {
    title: "Setting Up Two-Factor Authentication",
    slug: "two-factor-auth",
    category: "Security",
    content: "# Setting Up Two-Factor Authentication\n\n## Benefits\n- Enhanced account security\n- Protection against unauthorized access\n\n## Setup Steps\n1. Go to Account Settings\n2. Select 'Security'\n3. Click 'Enable 2FA'\n4. Scan QR code with authenticator app\n5. Enter verification code\n6. Save backup codes in safe location",
  },
  {
    title: "Troubleshooting Network Issues",
    slug: "network-troubleshooting",
    category: "Networking",
    content: "# Troubleshooting Network Issues\n\n## Common Problems\n- No internet connection\n- Slow network speed\n- WiFi disconnections\n\n## Solutions\n1. Restart your router\n2. Check cable connections\n3. Run network diagnostics\n4. Update network drivers\n5. Contact IT support if issue persists",
  },
  {
    title: "Remote Session Guide",
    slug: "remote-session-guide",
    category: "Helpdesk",
    content: "# How to Use Remote Session\n\n## For Customers\n1. Open your helpdesk ticket\n2. Click 'Start Remote Session'\n3. Share session code with agent\n4. Grant screen sharing permission\n\n## For Agents\n1. Open customer ticket\n2. Click 'Join Session'\n3. View customer screen\n4. Ask permission before taking control",
  },
  {
    title: "Email Configuration Guide",
    slug: "email-configuration",
    category: "Email",
    content: "# Email Configuration Guide\n\n## Outlook Setup\n1. Open Outlook\n2. Go to File > Add Account\n3. Enter your email address\n4. Enter password\n5. Click Connect\n\n## Gmail Setup\n1. Enable 2FA on Gmail\n2. Generate app password\n3. Use app password in email client\n4. Connect successfully",
  },
  {
    title: "Microsoft 365 Licensing Overview",
    slug: "m365-licensing",
    category: "Microsoft 365",
    content: "# Microsoft 365 Licensing Overview\n\n## Plans Available\n- Business Basic: Email, Teams, OneDrive\n- Business Standard: Includes Office apps\n- Business Premium: Full suite with security\n- Enterprise: Advanced security and compliance\n\n## Choosing the Right Plan\nConsult with your IT admin for your organization's needs",
  },
  {
    title: "OneDrive Sync & Backup",
    slug: "onedrive-sync",
    category: "Cloud Storage",
    content: "# OneDrive Sync & Backup\n\n## Setting Up Sync\n1. Install OneDrive desktop app\n2. Sign in with work account\n3. Select folders to sync\n4. Files sync automatically\n\n## Best Practices\n- Keep important files in OneDrive\n- Enable version history\n- Use selective sync for large folders",
  },
  {
    title: "Teams Meeting Best Practices",
    slug: "teams-meetings",
    category: "Collaboration",
    content: "# Teams Meeting Best Practices\n\n## Before the Meeting\n- Test audio and video\n- Check internet connection\n- Minimize background apps\n\n## During the Meeting\n- Mute when not speaking\n- Use professional background\n- Avoid multitasking\n- Engage with participants",
  },
  {
    title: "Data Backup and Recovery",
    slug: "backup-recovery",
    category: "Backup",
    content: "# Data Backup and Recovery\n\n## Backup Strategy\n1. Regular automated backups\n2. Multiple backup locations\n3. Test recovery procedures\n4. Document backup schedule\n\n## Recovery Process\n1. Contact IT support\n2. Identify data to recover\n3. IT restores from backup\n4. Verify data integrity",
  },
  {
    title: "Cybersecurity Best Practices",
    slug: "cybersecurity",
    category: "Security",
    content: "# Cybersecurity Best Practices\n\n## Essential Tips\n- Use strong passwords (12+ characters)\n- Enable 2FA everywhere\n- Don't share credentials\n- Report suspicious emails\n- Keep software updated\n- Use VPN on public WiFi",
  },
  {
    title: "Cloud Migration Checklist",
    slug: "cloud-migration",
    category: "Cloud",
    content: "# Cloud Migration Checklist\n\n## Pre-Migration\n- Inventory all systems\n- Assess security requirements\n- Plan data transfer\n- Train staff\n\n## During Migration\n- Monitor performance\n- Verify data integrity\n- Test applications\n- Document issues\n\n## Post-Migration\n- Optimize cloud resources\n- Establish monitoring\n- Plan disaster recovery",
  },
  {
    title: "AI Agent Automation Overview",
    slug: "ai-automation",
    category: "AI",
    content: "# AI Agent Automation Overview\n\n## What Are AI Agents?\nAutomated systems that handle routine tasks and provide intelligent support.\n\n## Benefits\n- 24/7 availability\n- Faster response times\n- Reduced manual work\n- Improved accuracy\n\n## Common Use Cases\n- Ticket routing\n- Knowledge base search\n- Password resets\n- Status updates",
  },
];

async function seedKBs() {
  try {
    const db = await getDb();
    
    console.log("📚 Seeding Knowledge Base articles...");
    console.log(`Creating ${KBS.length} KB articles...`);
    
    for (const kb of KBS) {
      console.log(`  ✓ ${kb.title}`);
    }
    
    console.log("\n✅ KB articles ready for import");
    console.log("📝 Next steps:");
    console.log("   1. Go to /admin/kb");
    console.log("   2. Click 'Import' or 'Add Article'");
    console.log("   3. Copy content from this script");
    console.log("   4. Articles will appear on /kb page");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

seedKBs();
