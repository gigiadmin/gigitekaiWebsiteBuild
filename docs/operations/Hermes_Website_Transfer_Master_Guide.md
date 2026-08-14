# GigitekAI Website Transfer & Infrastructure Master Guide for Hermes

**Purpose:** This master guide and copy-paste prompt gives your Hermes coding agent everything required to transfer the complete GigitekAI platform off Manus and host it independently with 100% operational control.

---

## Part 1: Purpose of Docker, Railway, Cloudflare, and GitHub in the New Setup

Before starting the transfer, here is exactly how each tool serves your new production infrastructure:

| Tool | Role in New Infrastructure | Why Use It |
|---|---|---|
| **GitHub** | **Source Control & CI/CD Control Plane** | Stores your private repository (`gigiadmin/gigitekaiWebsiteBuild.git`). GitHub Actions automatically builds and tests your code on every push. |
| **Docker** | **Portable Runtime Packaging** | Packages your entire full-stack app (React frontend + Express/tRPC backend) into a single immutable container image. Runs identically on your local machine, Railway, Azure, or any cloud server. |
| **Railway** | **Fast Managed Full-Stack Hosting** | **Recommended Hosting Provider.** Unlike static hosts (Vercel/GitHub Pages), Railway natively runs your Express server, MySQL database, and background workers with zero server management overhead. It deploys directly from your GitHub repo in minutes. |
| **Cloudflare** | **DNS, Edge Security & Caching** | Optional enterprise edge. Can sit in front of Railway or Azure to provide Web Application Firewall (WAF), DDoS protection, TLS termination, and global caching for `gigitekai.com`. (Note: GoDaddy remains your domain registrar). |

---

## Part 2: Step-by-Step Transfer Sequence for Hermes

### Step 1: Clone and Initialize
1. Clone the repository from GitHub:
   ```bash
   git clone https://github.com/gigiadmin/gigitekaiWebsiteBuild.git
   cd gigitekaiWebsiteBuild
   ```
2. Install dependencies:
   ```bash
   pnpm install
   ```

### Step 2: Restore Database & Migrations
1. Unpack your Phase 1 database backup (`database_dump.sql` from your backup ZIP).
2. Connect to your new MySQL instance (Railway MySQL, Azure MySQL, or local MySQL).
3. Push Drizzle schema and import the backup dump:
   ```bash
   pnpm db:push
   mysql -h <host> -u <user> -p<password> <database> < database_dump.sql
   ```

### Step 3: Configure Environment Variables
Create a production `.env` file containing your production secrets (do not commit to Git):
- `DATABASE_URL`
- `JWT_SECRET`
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`
- `MS_GRAPH_CLIENT_ID` / `MS_GRAPH_CLIENT_SECRET` / `MS_GRAPH_TENANT_ID`
- `AZURE_COMMUNICATION_CONNECTION_STRING`
- `TEAMS_WEBHOOK_URL`
- `GEMINI_API_KEY` / `CLAUDE_API_KEY`
- `UPTIMEROBOT_API_KEY`

### Step 4: Build and Test Locally via Docker
1. Test container build locally:
   ```bash
   docker build -t gigitekai:latest .
   docker run -p 3000:3000 --env-file .env gigitekai:latest
   ```
2. Verify local health check at `http://localhost:3000/api/trpc/system.ping`.

### Step 5: Deploy to Railway (or Azure)
1. Connect your GitHub repository (`gigitekaiWebsiteBuild`) to Railway.
2. Add a MySQL plugin in Railway (or link your external MySQL URL).
3. Set your environment variables in Railway's dashboard.
4. Trigger the deployment. Railway will automatically build via Docker and launch your app.

### Step 6: DNS Cutover
1. In GoDaddy, point your root domain (`@`) and `www` to your new Railway/Azure application endpoint.
2. Verify SSL certificate generation and test public routes (`gigitekai.com`, `/kb`, `/qr`, `/free-audit`, Aria chat, and helpdesk).

---

## Part 3: Copy-Paste Prompt for Hermes

You can copy and paste the section below directly to your Hermes agent:

***

```markdown
You are my expert full-stack developer agent. I need you to take our private GitHub repository (https://github.com/gigiadmin/gigitekaiWebsiteBuild.git) and deploy the complete GigitekAI platform to independent production hosting on Railway (or Azure Container Apps), using Docker for containerization and MySQL for our database.

Here is what you need to do:

1. REPOSITORY & DEPENDENCIES:
   - Clone/pull the latest main branch from https://github.com/gigiadmin/gigitekaiWebsiteBuild.git
   - Install dependencies using pnpm.

2. DATABASE RESTORATION:
   - Use the provided database_dump.sql (from the Phase 1 backup bundle) to restore all 145 tables (helpdesk tickets, users, KB articles, chat history, and analytics) into our new production MySQL instance.
   - Run pnpm db:push to ensure Drizzle ORM schema is fully synchronized.

3. ENVIRONMENT & SECRETS CONFIGURATION:
   - Configure all required environment variables (Database URL, JWT secret, Stripe keys, Microsoft Graph / ACS credentials, Teams webhooks, and AI API keys) securely in the deployment environment.

4. DOCKER & CONTAINER DEPLOYMENT:
   - Ensure the Dockerfile and docker-compose.yml are fully optimized for production execution.
   - Deploy the application to Railway (or Azure) with automated CI/CD directly connected to our GitHub repository.

5. ARIA AI ASSISTANT & HELP DESK VERIFICATION:
   - Verify that Aria chat history persists in MySQL across page refreshes.
   - Verify that Knowledge Base search, AI multi-model gateway, and voice TTS work correctly.
   - Test public lead forms, discovery intake, ACS email notifications, and Teams webhooks.

6. FINAL SMOKE TEST:
   - Validate that gigitekai.com loads the production app with zero 403 errors and all 977+ Vitest tests passing successfully.
```
