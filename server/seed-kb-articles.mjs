import mysql from 'mysql2/promise';

const kbArticles = [
  // Tier 1 - Account & Authentication (4 articles)
  {
    title: "Password Reset Guide",
    content: "## How to Reset Your Password\n\n1. Go to the login page\n2. Click 'Forgot Password'\n3. Enter your email address\n4. Check your email for reset link\n5. Click the link and create a new password\n6. Log in with your new password\n\n**Note:** Password reset links expire after 24 hours.",
    category: "Tier 1 - Account & Authentication",
    tags: "password,reset,login,account",
    isPublished: true,
  },
  {
    title: "Two-Factor Authentication Setup",
    content: "## Enable Two-Factor Authentication\n\nTwo-factor authentication adds an extra layer of security to your account.\n\n### Steps:\n1. Go to Account Settings\n2. Click 'Security'\n3. Select 'Enable Two-Factor Authentication'\n4. Choose authentication method (SMS or Authenticator App)\n5. Follow the prompts to verify\n\n### Using an Authenticator App:\n- Download Google Authenticator, Microsoft Authenticator, or Authy\n- Scan the QR code\n- Enter the 6-digit code to confirm",
    category: "Tier 1 - Account & Authentication",
    tags: "security,2fa,authentication,mfa",
    isPublished: true,
  },
  {
    title: "Account Lockout Recovery",
    content: "## Recover from Account Lockout\n\nIf your account is locked after multiple failed login attempts:\n\n1. Wait 30 minutes for automatic unlock\n2. Or contact support@gigitekai.com\n3. Provide proof of identity\n4. We'll unlock your account within 2 hours\n\n**Prevention:** Use password manager to avoid typos and lockouts.",
    category: "Tier 1 - Account & Authentication",
    tags: "lockout,account,security,recovery",
    isPublished: true,
  },
  {
    title: "Email Verification Issues",
    content: "## Troubleshoot Email Verification\n\n### Didn't receive verification email?\n1. Check spam/junk folder\n2. Request new verification email from login page\n3. Whitelist support@gigitekai.com in your email\n\n### Email verification link expired?\n- Request a new verification email\n- Links expire after 48 hours\n\n### Still having issues?\nContact support with your email address and we'll help manually verify your account.",
    category: "Tier 1 - Account & Authentication",
    tags: "email,verification,signup,account",
    isPublished: true,
  },

  // Tier 1 - Network & Connectivity (4 articles)
  {
    title: "VPN Connection Guide",
    content: "## Connect to VPN\n\n### Windows:\n1. Settings > Network & Internet > VPN\n2. Click 'Add a VPN connection'\n3. Enter VPN details provided by IT\n4. Click 'Connect'\n\n### Mac:\n1. System Preferences > Network\n2. Click '+' to add VPN\n3. Enter VPN details\n4. Click 'Connect'\n\n### Troubleshooting:\n- Ensure firewall allows VPN\n- Check internet connection\n- Restart VPN client if connection drops",
    category: "Tier 1 - Network & Connectivity",
    tags: "vpn,network,connection,remote",
    isPublished: true,
  },
  {
    title: "WiFi Network Connectivity",
    content: "## Fix WiFi Connection Issues\n\n### Can't connect to WiFi?\n1. Forget the network and reconnect\n2. Restart your router (unplug 30 seconds)\n3. Move closer to router\n4. Check if WiFi is enabled on your device\n\n### Slow WiFi?\n- Reduce distance from router\n- Reduce number of connected devices\n- Check for interference from microwaves/cordless phones\n- Update WiFi drivers\n\n### WiFi keeps disconnecting?\n- Update router firmware\n- Change WiFi channel (try 1, 6, or 11 for 2.4GHz)\n- Contact IT support if issue persists",
    category: "Tier 1 - Network & Connectivity",
    tags: "wifi,internet,network,connectivity",
    isPublished: true,
  },
  {
    title: "Internet Connection Troubleshooting",
    content: "## Diagnose Internet Connection Problems\n\n### No internet access?\n1. Check if modem lights are on\n2. Restart modem (unplug 30 seconds)\n3. Check ethernet cable connection\n4. Restart your computer\n\n### Slow internet?\n- Run speed test at speedtest.net\n- Close bandwidth-heavy applications\n- Check for malware\n- Contact ISP if speeds are below expected\n\n### Intermittent disconnections?\n- Update network drivers\n- Check for loose cables\n- Reduce WiFi interference\n- Consider wired connection for stability",
    category: "Tier 1 - Network & Connectivity",
    tags: "internet,connection,network,troubleshooting",
    isPublished: true,
  },
  {
    title: "Remote Access Setup",
    content: "## Set Up Remote Access\n\n### Using Remote Desktop (Windows):\n1. Enable Remote Desktop on host computer\n2. Get host IP address (ipconfig in CMD)\n3. On remote computer: Remote Desktop Connection\n4. Enter host IP and credentials\n\n### Using TeamViewer:\n1. Download TeamViewer on both computers\n2. Share your ID with colleague\n3. They enter your ID to connect\n4. Grant permission when prompted\n\n### Security Tips:\n- Use strong passwords\n- Enable 2FA when available\n- Only share access with trusted users\n- Log out when done",
    category: "Tier 1 - Network & Connectivity",
    tags: "remote,access,teamviewer,rdp",
    isPublished: true,
  },

  // Tier 1 - Hardware & Peripherals (4 articles)
  {
    title: "Printer Setup Troubleshooting",
    content: "## Fix Printer Connection Issues\n\n### Printer not found?\n1. Ensure printer is powered on\n2. Check network connection (WiFi or Ethernet)\n3. Restart printer and computer\n4. Reinstall printer drivers from manufacturer website\n\n### Print jobs stuck in queue?\n1. Open Devices and Printers\n2. Right-click printer > 'See what's printing'\n3. Clear all jobs\n4. Restart print spooler service\n\n### Poor print quality?\n- Clean printer heads\n- Check ink/toner levels\n- Use correct paper type\n- Update printer firmware",
    category: "Tier 1 - Hardware & Peripherals",
    tags: "printer,hardware,printing,setup",
    isPublished: true,
  },
  {
    title: "USB Device Not Recognized",
    content: "## Troubleshoot USB Devices\n\n### USB device not detected?\n1. Try different USB port\n2. Restart computer\n3. Update USB drivers\n4. Check Device Manager for unknown devices\n5. Uninstall and reinstall device\n\n### USB drive not showing files?\n- Check if drive is write-protected\n- Scan for malware\n- Try on different computer\n- Use recovery software if data is critical\n\n### Slow USB transfer speed?\n- Use USB 3.0 port (blue)\n- Check cable for damage\n- Close other applications\n- Defragment drive (external drives only)",
    category: "Tier 1 - Hardware & Peripherals",
    tags: "usb,device,hardware,external",
    isPublished: true,
  },
  {
    title: "Monitor Display Issues",
    content: "## Fix Monitor Problems\n\n### No display output?\n1. Check power cable and monitor is on\n2. Try different video cable\n3. Restart computer\n4. Update graphics drivers\n5. Test with different monitor\n\n### Blurry or distorted display?\n- Adjust monitor resolution\n- Update graphics drivers\n- Check cable connections\n- Adjust monitor settings (brightness, contrast)\n\n### Multiple monitor setup not working?\n- Ensure graphics card supports multiple displays\n- Update drivers\n- Use correct video ports\n- Configure display settings in Windows",
    category: "Tier 1 - Hardware & Peripherals",
    tags: "monitor,display,graphics,video",
    isPublished: true,
  },
  {
    title: "Keyboard and Mouse Troubleshooting",
    content: "## Fix Keyboard and Mouse Issues\n\n### Wireless keyboard/mouse not working?\n1. Check batteries\n2. Ensure receiver is plugged in\n3. Re-pair device (hold pairing button)\n4. Update drivers\n5. Check for interference from other wireless devices\n\n### Keys not responding?\n- Clean keyboard (use compressed air)\n- Check for stuck keys\n- Update keyboard drivers\n- Try different USB port\n\n### Mouse cursor jumping?\n- Clean mouse sensor\n- Adjust mouse sensitivity in settings\n- Update mouse drivers\n- Check for malware\n- Try different surface for tracking",
    category: "Tier 1 - Hardware & Peripherals",
    tags: "keyboard,mouse,input,hardware",
    isPublished: true,
  },

  // Tier 1 - Software & Applications (3 articles)
  {
    title: "Browser Cache Cookies",
    content: "## Clear Browser Cache and Cookies\n\n### Google Chrome:\n1. Press Ctrl+Shift+Delete\n2. Select time range\n3. Check 'Cookies and other site data'\n4. Click 'Clear data'\n\n### Microsoft Edge:\n1. Press Ctrl+Shift+Delete\n2. Select time range\n3. Check 'Cookies and other site data'\n4. Click 'Clear now'\n\n### Firefox:\n1. Press Ctrl+Shift+Delete\n2. Select time range\n3. Check 'Cookies' and 'Cache'\n4. Click 'Clear Now'\n\n**Why clear cache?**\n- Fixes website loading issues\n- Improves browser performance\n- Protects privacy",
    category: "Tier 1 - Software & Applications",
    tags: "browser,cache,cookies,clearing",
    isPublished: true,
  },
  {
    title: "Application Installation Guide",
    content: "## Install Software Applications\n\n### From Microsoft Store:\n1. Open Microsoft Store\n2. Search for application\n3. Click 'Get' or 'Install'\n4. Wait for installation to complete\n\n### From Website:\n1. Download installer (.exe or .msi)\n2. Double-click to run\n3. Follow installation wizard\n4. Accept license agreement\n5. Choose installation location\n6. Complete installation\n\n### Troubleshooting:\n- Run as Administrator if installation fails\n- Disable antivirus temporarily\n- Ensure sufficient disk space\n- Check system requirements",
    category: "Tier 1 - Software & Applications",
    tags: "software,installation,applications,setup",
    isPublished: true,
  },
  {
    title: "Software Update and Maintenance",
    content: "## Keep Software Updated\n\n### Windows Updates:\n1. Settings > Update & Security\n2. Click 'Check for updates'\n3. Install available updates\n4. Restart if prompted\n\n### Application Updates:\n- Most apps auto-update\n- Check Help menu for 'Check for Updates'\n- Enable automatic updates in settings\n\n### Why update?\n- Security patches\n- Bug fixes\n- Performance improvements\n- New features\n\n**Best Practice:** Schedule updates during off-hours to avoid disruptions.",
    category: "Tier 1 - Software & Applications",
    tags: "updates,maintenance,software,patches",
    isPublished: true,
  },

  // Tier 2 - Microsoft 365 (2 articles)
  {
    title: "Microsoft 365 Email Access",
    content: "## Set Up Microsoft 365 Email\n\n### Outlook Desktop:\n1. Open Outlook\n2. File > Add Account\n3. Enter M365 email and password\n4. Complete authentication\n5. Select sync options\n\n### Outlook Web:\n1. Go to outlook.office.com\n2. Sign in with M365 credentials\n3. Inbox loads automatically\n\n### Mobile:\n1. Download Outlook app\n2. Add account\n3. Enter M365 credentials\n4. Configure sync settings\n\n**Troubleshooting:** If sync fails, verify credentials and check firewall settings.",
    category: "Tier 2 - Microsoft 365",
    tags: "microsoft365,email,outlook,setup",
    isPublished: true,
  },
  {
    title: "SharePoint and OneDrive Sync",
    content: "## Sync SharePoint and OneDrive Files\n\n### Set Up OneDrive Sync:\n1. Download OneDrive app\n2. Sign in with M365 account\n3. Choose folders to sync\n4. Files sync automatically\n\n### SharePoint Sync:\n1. Open SharePoint site\n2. Click 'Sync' button\n3. Select local folder\n4. Files sync to your computer\n\n### Troubleshooting Sync Issues:\n- Check internet connection\n- Restart OneDrive/SharePoint\n- Check available disk space\n- Verify file permissions\n- Update OneDrive to latest version",
    category: "Tier 2 - Microsoft 365",
    tags: "sharepoint,onedrive,sync,microsoft365",
    isPublished: true,
  },

  // Tier 2 - Security & Compliance (2 articles)
  {
    title: "Antivirus and Malware Protection",
    content: "## Protect Your Computer from Malware\n\n### Windows Defender:\n1. Settings > Update & Security > Windows Security\n2. Click 'Virus & threat protection'\n3. Run 'Quick scan' or 'Full scan'\n4. Quarantine any threats found\n\n### Best Practices:\n- Keep antivirus updated\n- Run regular scans\n- Don't open suspicious email attachments\n- Download only from trusted sources\n- Enable firewall\n\n### If Infected:\n1. Disconnect from internet\n2. Run full malware scan\n3. Quarantine or remove threats\n4. Change passwords\n5. Monitor account activity",
    category: "Tier 2 - Security & Compliance",
    tags: "security,malware,antivirus,protection",
    isPublished: true,
  },
  {
    title: "Data Backup and Recovery",
    content: "## Back Up Your Important Data\n\n### Windows Backup:\n1. Settings > System > Storage > Backup options\n2. Click 'Add a drive'\n3. Select external drive\n4. Enable automatic backup\n\n### Cloud Backup:\n1. Use OneDrive for documents\n2. Use Google Photos for photos\n3. Use cloud storage services\n\n### Disaster Recovery:\n- Maintain multiple backup copies\n- Test restore procedures regularly\n- Store backups in different locations\n- Encrypt sensitive backups\n\n**Recovery:** If data is lost, contact IT immediately for recovery assistance.",
    category: "Tier 2 - Security & Compliance",
    tags: "backup,recovery,data,protection",
    isPublished: true,
  },
];

async function seedKbArticles() {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable not set');
    }

    const connection = await mysql.createConnection(databaseUrl);

    console.log('Connected to database');

    // Insert articles
    for (const article of kbArticles) {
      const query = `
        INSERT INTO kbArticles (title, content, category, tags, isPublished, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      `;
      
      await connection.execute(query, [
        article.title,
        article.content,
        article.category,
        article.tags,
        article.isPublished ? 1 : 0,
      ]);
      
      console.log(`✓ Inserted: ${article.title}`);
    }

    console.log(`\n✅ Successfully seeded ${kbArticles.length} KB articles!`);
    await connection.end();
  } catch (error) {
    console.error('Error seeding KB articles:', error);
    process.exit(1);
  }
}

// Load environment variables
import('dotenv').then(() => seedKbArticles()).catch(console.error);
