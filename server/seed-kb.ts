import { getDb } from "./db";
import { kbArticles } from "../drizzle/schema";

const kbData = [
  {
    title: 'Getting Started with Microsoft 365',
    content: `# Getting Started with Microsoft 365

Microsoft 365 is a comprehensive cloud-based productivity suite that includes email, collaboration tools, and security features.

## What's Included
- **Outlook**: Email and calendar management
- **Teams**: Chat, video calls, and collaboration
- **OneDrive**: Cloud file storage and sharing
- **SharePoint**: Team sites and document management
- **Office Apps**: Word, Excel, PowerPoint, and more

## First Steps
1. Sign in to your Microsoft 365 account at https://office.com
2. Familiarize yourself with the app launcher (grid icon in top-left)
3. Set up your Outlook email and calendar
4. Join your team's Teams workspace
5. Explore OneDrive for file storage

## Common Issues
- **Can't sign in?** Verify your email address and password. Use your organization's email format.
- **Apps not loading?** Clear your browser cache and try again.
- **Sync issues?** Check your internet connection and restart the app.

## Getting Help
Contact your IT support team for account issues or access problems.`,
    category: 'Microsoft 365',
    tags: JSON.stringify(['onboarding', 'microsoft-365', 'email', 'teams']),
    isPublished: 1,
  },
  {
    title: 'Troubleshooting Email Delivery Issues',
    content: `# Troubleshooting Email Delivery Issues

Email delivery problems can occur due to various reasons. Follow these steps to diagnose and resolve them.

## Check Email Settings
1. Verify your email address is correct
2. Confirm your account is active in Microsoft 365
3. Check if your mailbox is full (quota exceeded)
4. Verify your email rules aren't filtering messages

## Common Email Problems

### Emails Not Sending
- Check your internet connection
- Verify the recipient's email address is correct
- Ensure you're not blocked by the recipient
- Check if your account has sending restrictions

### Emails Not Receiving
- Check your Inbox and Junk folders
- Verify email forwarding rules aren't active
- Check if sender is on your blocked list
- Ensure your mailbox isn't full

### Slow Email Sync
- Restart Outlook or the web client
- Clear cache and temporary files
- Disable unnecessary add-ins
- Check your internet speed

## Advanced Troubleshooting
- Check email logs in your admin portal
- Verify DNS records for your domain
- Test email delivery with a test account
- Review security policies and compliance rules

## When to Contact Support
If you've tried these steps and still have issues, contact IT support with:
- Your email address
- When the issue started
- Steps you've already tried
- Error messages (if any)`,
    category: 'Email',
    tags: JSON.stringify(['email', 'outlook', 'troubleshooting', 'delivery']),
    isPublished: 1,
  },
  {
    title: 'Network Connectivity Troubleshooting',
    content: `# Network Connectivity Troubleshooting

Network issues can impact your ability to work. Use this guide to diagnose and fix connectivity problems.

## Quick Checks
1. **Verify WiFi Connection**: Check if you're connected to the correct network
2. **Restart Router**: Unplug for 30 seconds, then plug back in
3. **Check Cable Connections**: Ensure ethernet cables are firmly connected
4. **Restart Computer**: A simple restart often resolves connectivity issues

## Diagnose Connection Issues

### Check Internet Speed
- Use speedtest.net to measure your connection
- Compare results to your expected speed
- Contact your ISP if speeds are significantly lower

### Test Network Access
- Ping your router: \`ping 192.168.1.1\`
- Ping a public server: \`ping 8.8.8.8\`
- Check DNS: \`nslookup google.com\`

### Identify Problem Areas
- **Local network issue**: Can't connect to other devices
- **Internet issue**: Can't reach external websites
- **DNS issue**: Websites load slowly or not at all

## Advanced Troubleshooting

### Windows
1. Open Command Prompt (admin)
2. Run: \`ipconfig /all\` to see network details
3. Run: \`ipconfig /release\` then \`ipconfig /renew\` to reset IP
4. Run: \`ipconfig /flushdns\` to clear DNS cache

### Mac
1. Open Terminal
2. Run: \`ifconfig\` to see network details
3. Run: \`sudo dscacheutil -flushcache\` to clear DNS

## When to Contact Support
If basic troubleshooting doesn't work:
- Provide your device type and OS version
- Share network speed test results
- Describe when the issue started
- List any recent network changes`,
    category: 'Network',
    tags: JSON.stringify(['network', 'connectivity', 'internet', 'wifi']),
    isPublished: 1,
  },
  {
    title: 'Printer Setup and Troubleshooting',
    content: `# Printer Setup and Troubleshooting

Follow this guide to set up your printer and resolve common printing issues.

## Setting Up a Network Printer

### Windows
1. Go to Settings > Devices > Printers & Scanners
2. Click "Add a printer or scanner"
3. Select your printer from the list
4. Click "Add device"
5. Install drivers if prompted

### Mac
1. Go to System Preferences > Printers & Scanners
2. Click the "+" button
3. Select your printer
4. Click "Add"

## Troubleshooting Common Issues

### Printer Not Found
- Ensure printer is powered on and connected to network
- Check if printer is on the same network as your computer
- Restart both printer and computer
- Update printer drivers

### Print Jobs Stuck in Queue
1. Open Devices and Printers (Windows) or Printers & Scanners (Mac)
2. Right-click the printer and select "See what's printing"
3. Clear any stuck jobs
4. Restart the print spooler service (Windows)

### Poor Print Quality
- Check ink/toner levels
- Clean printer heads
- Verify paper quality
- Adjust print settings (quality/resolution)

### Printer Offline
- Check network connection
- Restart printer
- Verify IP address hasn't changed
- Update printer drivers
- Check firewall settings

## Network Printer Tips
- Set a static IP for your printer to prevent connection issues
- Regularly check for firmware updates
- Monitor ink/toner levels
- Clean printer regularly

## When to Contact Support
Contact IT if:
- Printer doesn't appear on network
- You need driver installation help
- Printer keeps going offline
- Print quality issues persist`,
    category: 'Hardware',
    tags: JSON.stringify(['printer', 'printing', 'hardware', 'setup']),
    isPublished: 1,
  },
  {
    title: 'Password Security Best Practices',
    content: `# Password Security Best Practices

Strong passwords are your first line of defense against unauthorized access. Follow these guidelines.

## Creating Strong Passwords

### Requirements
- **Minimum 12 characters** (longer is better)
- **Mix of character types**: uppercase, lowercase, numbers, symbols
- **Avoid common patterns**: dictionary words, sequential numbers, keyboard patterns
- **Unique per account**: Don't reuse passwords across services

### Examples of Strong Passwords
- \`Tr0pic@lSunset#2024\`
- \`BlueMoon$Whisper99\`
- \`Quantum*Leap&Forward7\`

### Examples to Avoid
- ❌ \`password123\`
- ❌ \`qwerty\`
- ❌ \`12345678\`
- ❌ \`yourname\`

## Password Management

### Use a Password Manager
- Store passwords securely
- Generate strong random passwords
- Sync across devices
- Recommended: Bitwarden, 1Password, LastPass

### Never
- Write passwords on sticky notes
- Share passwords via email or chat
- Use the same password everywhere
- Tell anyone your password

## Multi-Factor Authentication (MFA)

### Enable MFA for Critical Accounts
- Microsoft 365 accounts
- Email accounts
- Banking and financial accounts
- Cloud storage services

### MFA Methods
- **Authenticator app**: Most secure (Microsoft Authenticator, Google Authenticator)
- **SMS**: Convenient but less secure
- **Security key**: Hardware device for maximum security

## If Your Password is Compromised

1. **Change it immediately** on all affected accounts
2. **Enable MFA** if not already active
3. **Monitor accounts** for suspicious activity
4. **Report to IT** if it's a work account
5. **Check credit** if financial accounts are affected

## Regular Maintenance
- Change passwords every 90 days
- Update after security breaches
- Review password manager regularly
- Remove old/unused accounts`,
    category: 'Security',
    tags: JSON.stringify(['security', 'password', 'authentication', 'mfa']),
    isPublished: 1,
  },
];

export async function seedKnowledgeBase() {
  const db = await getDb();
  if (!db) {
    console.error('❌ Database not available');
    return false;
  }

  try {
    console.log('🌱 Seeding Knowledge Base Articles...');

    for (const article of kbData) {
      await db.insert(kbArticles).values({
        title: article.title,
        content: article.content,
        category: article.category,
        tags: article.tags,
        isPublished: article.isPublished ? 1 : 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      console.log(`✓ Seeded: ${article.title}`);
    }

    console.log(`\n✅ Successfully seeded ${kbData.length} KB articles!`);
    return true;
  } catch (error) {
    console.error('❌ Error seeding KB:', error);
    return false;
  }
}

// Run seeding if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedKnowledgeBase().then(() => process.exit(0));
}
