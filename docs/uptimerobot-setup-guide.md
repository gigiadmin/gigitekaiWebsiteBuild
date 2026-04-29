![](undefined)

# UptimeRobot Setup Guide — GigitekAI Admin Dashboard Integration

**Purpose:** Connect the GigitekAI admin dashboard to real-time uptime monitoring data so you can see live uptime percentage, current status, response time, and downtime history directly inside the portal.

---

## Step 1 — Create a Free UptimeRobot Account

1. Open your browser and go to [**https://uptimerobot.com**](https://uptimerobot.com)

1. Click **Register for FREE** (top-right corner )

1. Fill in:
  - **Email:** `support@gigitek.com`
  - **Password:** (choose a strong password)

1. Check your inbox and click the verification link UptimeRobot sends you

1. Log in to your new account

> **Free tier includes:** Up to 50 monitors, 5-minute check intervals, email/SMS alerts, and a public status page — no credit card required.

---

## Step 2 — Add gigitekai.com as a Monitor

1. From the UptimeRobot dashboard, click **+ Add New Monitor**

1. Fill in the following fields:

   | Field | Value |
   | --- | --- |
   | Monitor Type | HTTP(s) |
   | Friendly Name | GigitekAI |
   | URL (or IP) | `https://gigitekai.com` |
   | Monitoring Interval | 5 minutes |

1. Under **Alert Contacts**, add your email so you get notified if the site goes down

1. Click **Create Monitor**

UptimeRobot will immediately begin checking `gigitekai.com` every 5 minutes and alert you by email if it goes offline.

---

## Step 3 — Get Your API Key

1. Click your **profile name or avatar** in the top-right corner of the UptimeRobot dashboard

1. Select **My Settings** from the dropdown

1. Scroll down to the **API Settings** section

1. If API access is not enabled, click **Enable API access**

1. Copy the **Main API Key** — it will look like this:

   ```
   ur123456-abcdef1234567890abcdef12
   ```

   > Keep this key private — it grants read access to all your monitors.

---

## Step 4 — Connect to the GigitekAI Admin Dashboard

Once you have the API key:

1. Open the Manus project chat for the GigitekAI website

1. Paste the API key into the secrets card that will appear

1. The admin dashboard will then display live data including:
  - ✅ **Current Status** — Up / Down / Paused
  - 📊 **Uptime Percentage** — e.g., 99.98% over the last 30 days
  - ⚡ **Response Time** — average in milliseconds
  - 📅 **Last Downtime** — date, time, and duration of the most recent outage

---

## Step 5 — (Optional ) Create a Public Status Page

UptimeRobot can generate a public-facing status page (e.g., `https://status.gigitekai.com` ) that clients can bookmark to check service health themselves.

1. In the UptimeRobot dashboard, click **Status Pages** in the left sidebar

1. Click **+ Add Status Page**

1. Fill in:
  - **Friendly Name:** GigitekAI Status
  - **Custom Domain:** `status.gigitekai.com` (requires a CNAME DNS record)
  - **Monitors to include:** Select the GigitekAI monitor you created

1. Click **Create Status Page**

1. Share the URL with clients as your official uptime transparency page

---

## Troubleshooting

| Issue | Solution |
| --- | --- |
| API key not showing | Make sure you clicked "Enable API access" in My Settings |
| Monitor showing as "Paused" | Click the monitor and press the Play button to activate it |
| Not receiving email alerts | Check spam folder; add `noreply@uptimerobot.com` to safe senders |
| Custom domain not working | Add a CNAME record in your DNS: `status` → `stats.uptimerobot.com` |

---

## Contact

- **GigitekAI Support:** [support@gigitek.com](mailto:support@gigitek.com)

- **UptimeRobot Support:** [https://uptimerobot.com/contact](https://uptimerobot.com/contact)

- **UptimeRobot Docs:** [https://uptimerobot.com/help](https://uptimerobot.com/help)

---

*Document created: April 29, 2026 | GigitekAI Website Project*

