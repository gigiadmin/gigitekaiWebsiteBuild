import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// KB articles with metadata
const kbArticles = [
  {
    category: "Account & Authentication",
    title: "Password Reset & Account Lockout Guide",
    file: "kb-articles/01-password-reset-guide.md",
    keywords: "password, reset, account, locked, unlock, credentials, authentication, login, forgot password",
    priority: 5,
  },
  {
    category: "Network & Connectivity",
    title: "WiFi & Network Connectivity Troubleshooting",
    file: "kb-articles/02-wifi-network-connectivity.md",
    keywords: "WiFi, network, connectivity, internet, connection, WiFi not working, no internet, slow internet",
    priority: 5,
  },
  {
    category: "Email & Communication",
    title: "Email Access & Outlook Troubleshooting",
    file: "kb-articles/03-email-access-outlook.md",
    keywords: "email, outlook, mail, cannot access, sync, webmail, authentication, IMAP, SMTP",
    priority: 5,
  },
  {
    category: "Hardware & Peripherals",
    title: "Printer Setup & Troubleshooting",
    file: "kb-articles/04-printer-setup-troubleshooting.md",
    keywords: "printer, printing, paper jam, print quality, network printer, driver, setup",
    priority: 4,
  },
  {
    category: "Network & Connectivity",
    title: "VPN Connection & Troubleshooting Guide",
    file: "kb-articles/05-vpn-connection-guide.md",
    keywords: "VPN, virtual private network, remote access, connection, authentication, security",
    priority: 4,
  },
  {
    category: "Hardware & Peripherals",
    title: "Peripheral Devices Troubleshooting",
    file: "kb-articles/06-peripheral-devices-troubleshooting.md",
    keywords: "keyboard, mouse, monitor, headphones, USB, peripheral, device, not working",
    priority: 3,
  },
  {
    category: "Software & Applications",
    title: "Browser Cache & Cookies Troubleshooting",
    file: "kb-articles/07-browser-cache-cookies.md",
    keywords: "browser, cache, cookies, clear cache, Chrome, Firefox, Edge, Safari, slow loading",
    priority: 3,
  },
  {
    category: "Mobile & Remote Access",
    title: "Mobile Device Setup & Troubleshooting",
    file: "kb-articles/08-mobile-device-setup.md",
    keywords: "mobile, iPhone, Android, phone, tablet, email setup, app, mobile device",
    priority: 3,
  },
  {
    category: "Cloud Services",
    title: "Microsoft 365 Troubleshooting",
    file: "kb-articles/09-microsoft-365-troubleshooting.md",
    keywords: "Microsoft 365, Office 365, Outlook, Teams, OneDrive, SharePoint, Word, Excel, cloud",
    priority: 5,
  },
  {
    category: "System & Performance",
    title: "Computer Performance Troubleshooting",
    file: "kb-articles/10-computer-performance-troubleshooting.md",
    keywords: "performance, slow, CPU, memory, RAM, disk space, startup, freezing, optimization",
    priority: 4,
  },
  {
    category: "Network & Infrastructure",
    title: "Advanced Network Troubleshooting",
    file: "kb-articles/11-network-troubleshooting-advanced.md",
    keywords: "network, DNS, IP, routing, latency, packet loss, firewall, advanced, IT",
    priority: 4,
  },
  {
    category: "Security & Compliance",
    title: "Security & Malware Prevention",
    file: "kb-articles/12-security-malware-prevention.md",
    keywords: "security, malware, antivirus, phishing, ransomware, protection, firewall, threat",
    priority: 5,
  },
  {
    category: "Data Protection",
    title: "Data Backup & Disaster Recovery",
    file: "kb-articles/13-backup-disaster-recovery.md",
    keywords: "backup, disaster recovery, data loss, restore, recovery, OneDrive, cloud backup",
    priority: 4,
  },
  {
    category: "Remote Work",
    title: "Remote Access & Troubleshooting",
    file: "kb-articles/14-remote-access-troubleshooting.md",
    keywords: "remote, remote desktop, RDP, remote access, connection, troubleshooting",
    priority: 4,
  },
  {
    category: "Software & Applications",
    title: "Application Troubleshooting & Optimization",
    file: "kb-articles/15-application-troubleshooting.md",
    keywords: "application, app, crash, error, won't start, slow, troubleshooting, optimization",
    priority: 4,
  },
];

async function importKBArticles() {
  let connection;
  try {
    // Connect to database
    connection = await mysql.createConnection(process.env.DATABASE_URL);
    console.log("🚀 Starting KB article import...\n");

    let importedCount = 0;
    let errorCount = 0;

    for (const article of kbArticles) {
      try {
        // Read markdown file
        const filePath = path.join(__dirname, article.file);
        const content = fs.readFileSync(filePath, "utf-8");

        // Insert into database
        const query = `
          INSERT INTO knowledgeBase (category, title, content, keywords, priority, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, NOW(), NOW())
        `;
        await connection.execute(query, [
          article.category,
          article.title,
          content,
          article.keywords,
          article.priority,
        ]);

        console.log(`✅ Imported: ${article.title}`);
        importedCount++;
      } catch (error) {
        console.error(`❌ Error importing ${article.title}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n📊 Import Summary:`);
    console.log(`   ✅ Successfully imported: ${importedCount} articles`);
    console.log(`   ❌ Failed: ${errorCount} articles`);
    console.log(`   📁 Total: ${kbArticles.length} articles`);

    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error("💥 Fatal error:", error);
    if (connection) await connection.end();
    process.exit(1);
  }
}

importKBArticles();
