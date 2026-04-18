# Password Reset & Account Lockout Guide

**Category:** Account Access | **Tier:** 1 | **Resolution Time:** 5-10 minutes | **Difficulty:** Beginner

## Overview

Password-related issues represent approximately 25% of all helpdesk tickets. This guide covers the most common password problems and their solutions. Whether you've forgotten your password, been locked out of your account, or are experiencing multi-factor authentication (MFA) issues, this article will help you regain access quickly.

## Common Password Issues

| Issue | Symptom | Typical Cause |
|-------|---------|---------------|
| Forgotten Password | Cannot remember login credentials | User hasn't used account recently |
| Account Lockout | Account locked after failed login attempts | Security policy triggered after 5-10 failed attempts |
| Caps Lock Enabled | Password appears incorrect | User accidentally has Caps Lock on |
| Wrong Keyboard Layout | Characters appear scrambled | Keyboard language setting changed |
| MFA Issues | Cannot receive verification code | Phone number outdated or MFA app misconfigured |
| Password Expired | System prompts for password change | Organizational security policy requires periodic resets |

## Solution Steps

### Step 1: Verify Basic Settings (Before Escalating)

Before requesting a password reset, confirm these basics:

1. **Check Caps Lock** - Ensure Caps Lock is OFF (the light on your keyboard should be dark)
2. **Verify Keyboard Language** - Confirm your keyboard is set to the correct language (usually English US)
3. **Check Spelling** - Carefully re-type your password, paying attention to special characters
4. **Confirm Username** - Use your full email address as the username (e.g., john.smith@company.com)
5. **Try Another Browser** - If using Chrome, try Firefox or Edge to rule out browser cache issues

### Step 2: Clear Browser Cache & Cookies

Cached credentials can cause login issues:

**For Chrome:**
1. Click the three-dot menu (top-right) → Settings
2. Select "Privacy and security" → "Clear browsing data"
3. Choose "All time" from the dropdown
4. Check "Cookies and other site data" and "Cached images and files"
5. Click "Clear data"
6. Restart your browser and try logging in again

**For Microsoft Edge:**
1. Click the three-dot menu (top-right) → Settings
2. Select "Privacy, search, and services"
3. Under "Clear browsing data," click "Choose what to clear"
4. Select "All time" and check "Cookies and other site data"
5. Click "Clear now"

**For Firefox:**
1. Click the hamburger menu (top-right) → Settings
2. Go to "Privacy & Security"
3. Under "Cookies and Site Data," click "Clear Data"
4. Check both options and click "Clear"

### Step 3: Request a Password Reset

If basic troubleshooting doesn't work:

1. **Go to the login page** - Navigate to https://gigitekai.com/login (or your organization's login portal)
2. **Click "Forgot Password?"** - Look for this link below the password field
3. **Enter your email address** - Use the email associated with your account
4. **Check your email** - Look for a password reset link (check spam/junk folder if not in inbox)
5. **Click the reset link** - This link expires after 24 hours
6. **Create a new password** - Follow the password requirements:
   - Minimum 12 characters
   - At least one uppercase letter (A-Z)
   - At least one lowercase letter (a-z)
   - At least one number (0-9)
   - At least one special character (!@#$%^&*)
7. **Confirm your new password** - Re-enter to verify
8. **Log in with new credentials** - Try logging in immediately

### Step 4: Handle Account Lockouts

If your account is locked after multiple failed login attempts:

1. **Wait 30 minutes** - Most systems automatically unlock after this period
2. **Try logging in again** - Use your correct password
3. **If still locked** - Contact your IT support team with your full name and email

**Prevention:** Write down your password in a secure location (password manager recommended) to avoid repeated failed attempts.

### Step 5: Troubleshoot Multi-Factor Authentication (MFA)

If you're not receiving MFA codes:

1. **Check your phone** - Ensure it has cellular or WiFi connectivity
2. **Verify phone number** - Confirm the phone number on file is correct
3. **Check spam folder** - MFA SMS messages sometimes go to spam
4. **Try authenticator app** - If using Microsoft Authenticator or Google Authenticator:
   - Open the app
   - Find GigitekAI or your organization name
   - Enter the 6-digit code shown
5. **Use backup codes** - If you have backup codes saved, use one of these
6. **Contact IT** - If none of the above work, reach out to support

## When to Escalate

Contact your IT support team if:

- Your password reset email never arrives (after checking spam folder)
- The password reset link is expired
- You're locked out and can't regain access after 30 minutes
- You're receiving error messages like "Invalid token" or "Link expired"
- You need to reset another user's password (admin only)
- You suspect unauthorized access to your account

## Security Best Practices

**Create a Strong Password:**
- Use a unique password for each account (don't reuse passwords)
- Use a password manager (Bitwarden, 1Password, LastPass) to store passwords securely
- Avoid using personal information (birthdate, pet names, addresses)
- Don't share your password with anyone, including IT staff

**Protect Your Account:**
- Enable multi-factor authentication (MFA) whenever available
- Keep your phone number and email address current
- Log out of shared computers
- Never click password reset links in emails—always go directly to the login page
- Report suspicious activity immediately

## FAQ

**Q: How often do I need to reset my password?**
A: Password reset frequency depends on your organization's security policy. Most companies require resets every 60-90 days. You'll receive a notification before expiration.

**Q: Can I use my old password again?**
A: No. Most systems prevent reusing passwords from the last 5-12 resets for security reasons.

**Q: What if I forget my new password immediately after resetting?**
A: You can request another reset. However, if you're locked out, you'll need to wait 30 minutes or contact IT support.

**Q: Is my password stored securely?**
A: Yes. Passwords are encrypted and stored securely. GigitekAI staff cannot see your password—we can only reset it.

**Q: Can I reset my password from my phone?**
A: Yes. The password reset process works on mobile browsers. However, you may need to use the desktop version for some features.

## Contact Support

If you've followed all steps and still cannot access your account:

- **Email:** support@gigitekai.com
- **Phone:** (609) 676-4483
- **Hours:** Monday-Friday, 8 AM - 6 PM EST
- **Response Time:** Usually within 1 hour during business hours

**Include in your support request:**
- Your full name
- Email address associated with the account
- Description of the issue
- Steps you've already tried
- Any error messages you received

---

**Last Updated:** April 2026 | **Version:** 1.0 | **Author:** GigitekAI Support Team
