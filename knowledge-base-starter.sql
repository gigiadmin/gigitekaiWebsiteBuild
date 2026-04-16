-- GigitekAI Knowledge Base Starter Entries
-- Copy and paste these SQL commands into your Database UI's SQL query tool

INSERT INTO knowledgeBase (category, title, content, keywords, priority, createdAt, updatedAt) VALUES

-- Microsoft 365 & Cloud
('Microsoft 365', 'How to Enable Multi-Factor Authentication (MFA)', 
'Multi-Factor Authentication adds an extra layer of security to your Microsoft 365 account. To enable MFA:

1. Go to https://account.microsoft.com/security
2. Click "Advanced security options"
3. Under "Additional security verification", click "Set up additional security"
4. Choose your verification method (authenticator app, phone number, or email)
5. Complete the verification process
6. Save your backup codes in a secure location

MFA significantly reduces the risk of unauthorized access to your account.', 
'MFA, authentication, security, Microsoft 365, two-factor, 2FA', 9, NOW(), NOW()),

('Microsoft 365', 'How to Reset a User Password in Microsoft 365 Admin Center',
'To reset a user password in Microsoft 365:

1. Go to admin.microsoft.com
2. Click "Users" > "Active Users"
3. Select the user whose password you want to reset
4. Click "Reset password"
5. Choose "Generate a temporary password" or "Let the user create their own password"
6. Click "Reset"
7. Share the temporary password securely with the user

The user will be prompted to change their password on next login.', 
'password, reset, Microsoft 365, admin, user management, account', 8, NOW(), NOW()),

('Microsoft 365', 'How to Add a User to a Microsoft 365 Group',
'To add a user to a Microsoft 365 group:

1. Go to admin.microsoft.com
2. Click "Groups" > "Groups"
3. Select the group you want to add the user to
4. Click the "Members" tab
5. Click "Add members"
6. Search for and select the user
7. Click "Add"
8. Click "Close"

The user will now have access to the group''s resources and conversations.', 
'groups, add user, Microsoft 365, team, collaboration', 7, NOW(), NOW()),

('Microsoft 365', 'How to Enable Email Forwarding in Outlook',
'To set up email forwarding in Outlook:

1. Go to https://outlook.office.com
2. Click the Settings gear icon
3. Click "View all Outlook settings"
4. Click "Forwarding"
5. Check "Enable forwarding"
6. Enter the email address where you want emails forwarded
7. Choose whether to keep a copy of forwarded emails
8. Click "Save"

Your emails will now be automatically forwarded to the specified address.', 
'forwarding, email, Outlook, Microsoft 365, mail rules', 6, NOW(), NOW()),

-- Managed IT Services
('Managed IT Services', 'What is Backup and Disaster Recovery (BDR)?',
'Backup and Disaster Recovery (BDR) is a critical service that protects your business data:

**Backup** - Regular copies of your data stored in a secure location
**Disaster Recovery** - A plan and process to restore operations after an outage

Benefits:
- Protection against ransomware and data loss
- Compliance with industry regulations
- Business continuity in case of emergencies
- Reduced downtime and recovery time

GigitekAI offers automated BDR solutions that protect your files, databases, and systems 24/7.', 
'backup, disaster recovery, BDR, data protection, ransomware, continuity', 9, NOW(), NOW()),

('Managed IT Services', 'How to Troubleshoot Network Connectivity Issues',
'If you''re experiencing network problems:

1. **Restart your router** - Unplug for 30 seconds, then plug back in
2. **Check your connection** - Ensure cables are properly connected
3. **Restart your device** - Reboot your computer or device
4. **Check network settings** - Verify you''re connected to the correct network
5. **Run network diagnostics** - Use built-in network troubleshooting tools
6. **Check for updates** - Ensure network drivers are up to date
7. **Contact support** - If issues persist, contact our helpdesk

For persistent issues, our team can perform remote diagnostics and repairs.', 
'network, connectivity, internet, troubleshooting, wifi, ethernet', 7, NOW(), NOW()),

('Managed IT Services', 'What is Zero Trust Security?',
'Zero Trust is a modern security approach that assumes no user or device is trusted by default:

Key principles:
- Verify every user and device before granting access
- Use multi-factor authentication (MFA)
- Implement least-privilege access (users only get what they need)
- Monitor all network activity
- Encrypt all data in transit and at rest

Benefits:
- Reduced risk of data breaches
- Better compliance with regulations
- Improved visibility into network activity
- Faster threat detection and response

GigitekAI implements Zero Trust principles across all client environments.', 
'zero trust, security, authentication, access control, network security', 8, NOW(), NOW()),

-- Cybersecurity
('Cybersecurity', 'How to Recognize and Report Phishing Emails',
'Phishing emails are designed to trick you into revealing sensitive information. Watch for:

Red flags:
- Suspicious sender email address
- Urgent or threatening language
- Requests for passwords or personal information
- Unexpected attachments or links
- Poor grammar or spelling
- Generic greetings ("Dear Customer" instead of your name)

What to do:
1. Do NOT click links or download attachments
2. Do NOT reply with personal information
3. Report the email as phishing to your IT team
4. Delete the email
5. If you clicked a link, change your password immediately

Contact support@gigitekai.com to report suspicious emails.', 
'phishing, email security, scam, malware, cybersecurity, threat', 9, NOW(), NOW()),

('Cybersecurity', 'Best Practices for Strong Passwords',
'A strong password is your first line of defense against unauthorized access:

Requirements for strong passwords:
- At least 12 characters long
- Mix of uppercase and lowercase letters
- Numbers and special characters (!@#$%^&*)
- Unique for each account
- Not based on personal information

Best practices:
- Use a password manager to store passwords securely
- Change passwords regularly (every 90 days)
- Never share passwords via email or chat
- Never write passwords on sticky notes
- Enable multi-factor authentication (MFA)

GigitekAI recommends NordPass for secure password management.', 
'password, security, authentication, best practices, strong password', 8, NOW(), NOW()),

('Cybersecurity', 'How to Identify and Prevent Ransomware Attacks',
'Ransomware encrypts your files and demands payment for recovery. Prevention steps:

1. **Keep systems updated** - Install security patches immediately
2. **Use antivirus software** - Maintain up-to-date endpoint protection
3. **Enable backups** - Regular, offline backups are critical
4. **Train employees** - Teach staff to recognize suspicious emails
5. **Implement access controls** - Limit user permissions
6. **Monitor network activity** - Detect unusual behavior
7. **Have a response plan** - Know what to do if attacked

If infected:
- Isolate affected systems immediately
- Contact your IT team
- Do NOT pay ransom
- Report to law enforcement

GigitekAI provides 24/7 ransomware protection and response services.', 
'ransomware, malware, encryption, attack, security, protection', 9, NOW(), NOW()),

-- Troubleshooting
('Troubleshooting', 'How to Fix Slow Computer Performance',
'If your computer is running slowly:

Quick fixes:
1. Restart your computer
2. Close unnecessary programs and browser tabs
3. Clear your browser cache
4. Check disk space (ensure at least 10% free)
5. Disable startup programs you don''t need
6. Run antivirus scan
7. Update Windows and drivers

Advanced troubleshooting:
- Check Task Manager for resource-heavy processes
- Disable visual effects in Windows
- Upgrade RAM or storage if needed
- Scan for malware
- Check for hard drive errors

If issues persist, contact our helpdesk at support@gigitekai.com or call (727) 382-5776.', 
'slow, performance, computer, speed, optimization, troubleshooting', 7, NOW(), NOW()),

('Troubleshooting', 'How to Fix Email Sync Issues in Outlook',
'If your Outlook email is not syncing:

1. **Check internet connection** - Ensure you have active internet
2. **Restart Outlook** - Close and reopen the application
3. **Check account settings** - Verify email account is properly configured
4. **Disable offline mode** - Click "Send/Receive" > "Work Offline" to toggle off
5. **Clear cache** - Delete Outlook temporary files
6. **Update Outlook** - Install the latest version
7. **Check mailbox size** - Large mailboxes may sync slowly
8. **Disable add-ins** - Some add-ins can cause sync issues

If still not working:
- Check your email provider''s server status
- Verify your password is correct
- Contact support@gigitekai.com for assistance', 
'email, sync, Outlook, not working, troubleshooting, mail', 7, NOW(), NOW()),

-- Sales & Onboarding
('Sales', 'GigitekAI Services Overview',
'GigitekAI is a Managed Services Provider (MSP) specializing in:

**Core Services:**
- Helpdesk Support (Tier 1-3 technical support)
- Microsoft 365 Architecture & Licensing
- Cloud Infrastructure & Migration
- Cybersecurity & Threat Protection
- AI & Automation Solutions
- IT Modernization & Strategy

**Key Benefits:**
- 24/7 proactive monitoring and support
- Reduced IT costs through efficiency
- Enhanced security and compliance
- Scalable solutions for growing businesses
- Expert guidance from certified professionals

**Who We Serve:**
- Small to mid-size businesses (SMBs)
- Organizations across North America and South Pacific
- Companies seeking digital transformation

Contact our sales team at sales@gigitekai.com to schedule a consultation.', 
'services, overview, MSP, managed services, cloud, security', 8, NOW(), NOW()),

('Onboarding', 'New Employee Onboarding Checklist',
'When onboarding a new employee:

**Day 1:**
- Create user account in Active Directory
- Set up email account
- Provide laptop/desktop and peripherals
- Issue phone and mobile device
- Set up VPN access

**Week 1:**
- Complete security training
- Set up MFA on all accounts
- Configure backup and recovery
- Add to relevant Microsoft 365 groups
- Grant access to necessary applications

**Ongoing:**
- Monitor account activity
- Ensure compliance with security policies
- Provide continued support and training

Contact support@gigitekai.com if you need assistance with onboarding.', 
'onboarding, new employee, setup, account, training', 6, NOW(), NOW());
