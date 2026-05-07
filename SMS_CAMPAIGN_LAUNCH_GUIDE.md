# GigitekAI SMS Campaign Launch Guide

## Overview

The SMS Campaign system allows you to send targeted text messages to opted-in contacts for marketing, product updates, and customer engagement. This guide walks you through launching your first campaign.

---

## Prerequisites

Before launching your first SMS campaign, ensure:

1. ✅ **Twilio Account**: Active Twilio account with SMS capabilities enabled
2. ✅ **Twilio Phone Number**: A dedicated phone number for sending SMS (e.g., +1-609-676-4483)
3. ✅ **Environment Variables**: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` configured
4. ✅ **Opted-In Contacts**: At least one contact with `smsOptIn = true` in the database
5. ✅ **TCPA Compliance**: All contacts must have explicitly opted in via the contact form checkbox

---

## Step 1: Add Opted-In Contacts

### Via Contact Form (Recommended)

1. Visit **https://gigitekai.com/contact**
2. Fill out the contact form:
   - Name, email, phone number (E.164 format: +1-609-555-1234)
   - Company, message
   - **Check the SMS opt-in checkbox** at the bottom
3. Submit the form
4. The contact is automatically added to the `smsContacts` table with `smsOptIn = true`

### Via Admin Panel (Manual Entry)

1. Go to **https://gigitekai.com/admin/sms-campaigns**
2. Click the **Contacts** tab
3. Click **+ Add Contact**
4. Enter:
   - Name
   - Phone (E.164 format: +1-609-555-1234)
   - Email
   - Opted In: **Yes**
5. Click **Save**

### Via Database (Direct Insert)

For bulk imports, insert directly into the `smsContacts` table:

```sql
INSERT INTO smsContacts (name, phone, email, smsOptIn, createdAt)
VALUES 
  ('John Smith', '+1-609-555-1234', 'john@example.com', 1, NOW()),
  ('Jane Doe', '+1-609-555-5678', 'jane@example.com', 1, NOW()),
  ('Bob Johnson', '+1-609-555-9999', 'bob@example.com', 1, NOW());
```

**Important**: Always verify phone numbers are in E.164 format (+1-XXX-XXX-XXXX).

---

## Step 2: Create Your First Campaign

### Via Admin Dashboard

1. Go to **https://gigitekai.com/admin/sms-campaigns**
2. Click the **Campaigns** tab
3. Click **+ Create Campaign**
4. Fill in the campaign details:

| Field | Example | Notes |
|---|---|---|
| **Campaign Name** | Q2 Welcome Campaign | Internal reference only |
| **Message** | Welcome to GigitekAI! We're excited to help your business. Reply STOP to opt out. | Max 160 characters (SMS standard) |
| **Scheduled Date** | 2026-05-15 | Leave blank to send immediately |
| **Scheduled Time** | 10:00 AM | Leave blank to send immediately |
| **Target Contacts** | All opted-in | Select specific contacts or all |

5. Click **Preview** to see how the message will appear
6. Click **Schedule** or **Send Now**

---

## Template: Q2 Welcome Campaign

Use this template for your first campaign:

### Campaign Details

| Field | Value |
|---|---|
| **Campaign Name** | Q2 Welcome Campaign |
| **Message** | Welcome to GigitekAI! We're excited to help your business grow with AI-powered IT solutions. Visit gigitekai.com to learn more. Reply STOP to opt out. |
| **Character Count** | 158 characters (fits in 1 SMS) |
| **Target Audience** | All opted-in contacts |
| **Send Time** | Immediate or scheduled for business hours (9 AM - 5 PM) |
| **Expected Response** | STOP requests (handled automatically) |

### Message Variations (A/B Testing)

**Variant A (Professional):**
```
Welcome to GigitekAI! We're excited to help your business grow with AI-powered IT solutions. Visit gigitekai.com to learn more. Reply STOP to opt out.
```

**Variant B (Casual):**
```
Hey! 👋 Welcome to GigitekAI. Let's transform your IT with AI. Check us out at gigitekai.com. Reply STOP to unsubscribe.
```

**Variant C (Offer-Focused):**
```
Welcome to GigitekAI! Get 30% off your first month of managed IT services. Use code Q2LAUNCH at checkout. Reply STOP to opt out.
```

---

## Step 3: Monitor Campaign Performance

### View Campaign Metrics

1. Go to **https://gigitekai.com/admin/sms-campaigns**
2. Click the **Overview** tab
3. View real-time metrics:
   - **Total Contacts**: Opted-in contacts
   - **Campaigns Sent**: Total campaigns
   - **Messages Sent**: Total SMS sent
   - **Opt-Out Rate**: Percentage of STOP requests

### View Campaign Details

1. Click the **Campaigns** tab
2. Select a campaign to view:
   - Sent count
   - Delivery status
   - Sent timestamp
   - Message content

### View Opt-Outs

1. Click the **Opt-Out Log** tab
2. See all contacts who replied STOP
3. These contacts are automatically added to `smsOptOuts` table
4. **Important**: Never send to opt-out contacts (Twilio enforces this)

---

## TCPA Compliance Checklist

Before sending your first campaign, verify:

- [ ] **Explicit Opt-In**: All contacts have checked the SMS opt-in checkbox on the contact form
- [ ] **Clear Messaging**: SMS includes "Reply STOP to opt out" or similar language
- [ ] **Opt-Out Processing**: Opt-outs are automatically processed and stored in `smsOptOuts`
- [ ] **No Spam**: Messages are relevant and not excessive (recommended: 1-2 per week max)
- [ ] **Business Hours**: Send between 9 AM - 9 PM in recipient's timezone (if possible)
- [ ] **Accurate Sender ID**: Twilio phone number is clearly identifiable as GigitekAI
- [ ] **Privacy Policy**: SMS terms are included in Privacy Policy (Section 10)
- [ ] **Audit Trail**: All campaigns and opt-outs are logged in the database

---

## Campaign Best Practices

### Message Guidelines

1. **Keep it short**: SMS is 160 characters — be concise
2. **Include CTA**: Direct users to a specific action (visit website, reply, call)
3. **Personalization**: Use recipient name if possible
4. **Timing**: Send during business hours (9 AM - 5 PM)
5. **Frequency**: No more than 2-3 campaigns per week
6. **Brand voice**: Match GigitekAI's professional, AI-first tone

### Example Campaign Messages

**Product Update:**
```
GigitekAI Update: Our new AI ticket classifier is live! It auto-routes support tickets in seconds. Learn more: gigitekai.com/features. Reply STOP to opt out.
```

**Event Invitation:**
```
You're invited! Join our webinar on AI-powered IT on May 20. Register: gigitekai.com/webinar. Reply STOP to opt out.
```

**Special Offer:**
```
Limited time: 40% off managed IT services for Q2. Use code Q2SAVE at checkout. gigitekai.com. Reply STOP to opt out.
```

**Customer Feedback:**
```
How are we doing? Take our 2-minute survey: gigitekai.com/survey. Your feedback helps us improve. Reply STOP to opt out.
```

---

## Troubleshooting

### Campaign Not Sending

1. **Check Twilio credentials**: Verify `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` are set
2. **Check contact list**: Ensure at least one contact has `smsOptIn = true`
3. **Check phone format**: Verify all phone numbers are in E.164 format (+1-XXX-XXX-XXXX)
4. **Check Twilio balance**: Ensure your Twilio account has sufficient credits
5. **Review logs**: Check server logs for Twilio API errors

### Opt-Outs Not Processing

1. **Check Twilio webhook**: Verify Twilio is configured to send webhooks to your app
2. **Check database**: Verify `smsOptOuts` table exists and has entries
3. **Review logs**: Check for webhook processing errors

### High Bounce Rate

1. **Verify phone numbers**: Check for typos or invalid formats
2. **Check carrier**: Some carriers may block SMS from short codes
3. **Reduce frequency**: Too many campaigns can trigger carrier filters
4. **Contact Twilio support**: They can help diagnose carrier issues

---

## Advanced Features (Future)

The SMS system is designed to support future enhancements:

- **Scheduled campaigns**: Send at specific dates/times
- **Segmentation**: Target specific customer groups
- **A/B testing**: Compare message variants
- **Two-way SMS**: Receive and respond to customer replies
- **Personalization**: Dynamic content based on customer data
- **Analytics**: Detailed engagement metrics and ROI tracking

---

## Support & Resources

- **Admin Dashboard**: https://gigitekai.com/admin/sms-campaigns
- **Contact Form**: https://gigitekai.com/contact
- **Privacy Policy**: https://gigitekai.com/privacy (Section 10: SMS Terms)
- **Twilio Docs**: https://www.twilio.com/docs/sms
- **Support Email**: support@gigitekai.com

---

## Next Steps

1. ✅ Add your first opted-in contact via the contact form
2. ✅ Create the Q2 Welcome Campaign using the template above
3. ✅ Send the campaign to your contact list
4. ✅ Monitor metrics in the Overview tab
5. ✅ Iterate and refine future campaigns based on performance

---

**Last Updated:** May 2026  
**Version:** 1.0  
**TCPA Compliance:** ✅ Verified
