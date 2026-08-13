# GigitekAI Off-Manus Export & Migration Runbook

**Purpose:** Step-by-step instructions for exporting the GigitekAI source code, database, uploaded files, and integration configuration from the Manus platform to independent infrastructure (such as GitHub and Azure).

---

## 1. Export Source Code

Your application code is already synchronized and version-controlled. You have two ways to get it:

### Method A: Push to your GitHub repository (Already Connected)
The project is already linked to your GitHub repository (`user_github` remote pointing to `https://github.com/gigiadmin/gigitekaiWebsiteBuild.git`).
1. Ensure all changes are committed:
   ```bash
   cd /home/ubuntu/gigitekai
   git status
   ```
2. Push the latest production state to GitHub:
   ```bash
   git push user_github main
   ```
3. Your code, components, Drizzle schema (`drizzle/schema.ts`), tRPC routers (`server/routers.ts`), and documentation (`docs/`) are now fully backed up in your private GitHub repository.

### Method B: Download as a ZIP archive
You can also download the complete project directory as a ZIP file from the project Management UI (Code panel → Download all files) or via the sandbox if needed.

---

## 2. Export Database (MySQL / TiDB)

Because the live database holds your helpdesk tickets, user records, KB articles, and chat history, exporting it safely is critical.

1. **Generate a logical SQL dump:**
   ```bash
   mysqldump -h <db_host> -u <db_user> -p<db_password> <db_name> --single-transaction --routines --events > /home/ubuntu/gigitekai_db_backup.sql
   ```
   *(Note: Your current environment variables for `DATABASE_URL` contain the connection parameters).*
2. **Secure the backup:** Encrypt the SQL dump and upload it to secure private storage (e.g., an encrypted S3 bucket or Azure Blob container).
3. **Target Import:** When setting up your new MySQL instance (such as Azure Database for MySQL Flexible Server), restore the schema and data:
   ```bash
   mysql -h <new_db_host> -u <new_db_user> -p <db_name> < gigitekai_db_backup.sql
   ```

---

## 3. Export Uploaded Files & Media

All user-uploaded attachments, voicemails, audio recordings, and generated assets reside in S3-compatible cloud storage.

1. **Inventory storage keys:** Review your database tables (`chat_messages`, `tickets`, `call_logs`, etc.) for URLs pointing to uploaded assets.
2. **Download media assets:** Use an S3 sync tool or script to download the asset bucket contents to a local backup directory or Azure Blob Storage container:
   ```bash
   # Example pattern using AWS CLI or S3-compatible client
   aws s3 sync s3://your-storage-bucket /home/ubuntu/gigitekai_file_backup/
   ```
3. **Upload to target storage:** Upload the synchronized folder to your new storage provider (e.g., Azure Blob Storage container `app-files`).

---

## 4. Export Configuration and Secrets Inventory

Do not export raw secret values into Git. Instead, document your **environment variables by name and owner** so you can provision them into your new Key Vault or hosting environment:

- `DATABASE_URL`
- `JWT_SECRET`
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`
- `MS_GRAPH_CLIENT_ID` / `MS_GRAPH_CLIENT_SECRET` / `MS_GRAPH_TENANT_ID`
- `AZURE_CLIENT_ID` / `AZURE_CLIENT_SECRET` / `AZURE_TENANT_ID`
- `AZURE_COMMUNICATION_CONNECTION_STRING`
- `TEAMS_WEBHOOK_URL` / `TEAMS_BOT_CLIENT_SECRET`
- `GEMINI_API_KEY` / `CLAUDE_API_KEY`
- `UPTIMEROBOT_API_KEY`

---

## 5. Summary Checklist for Migration

1. [ ] **Source:** Push `main` to `https://github.com/gigiadmin/gigitekaiWebsiteBuild.git`.
2. [ ] **Database:** Run `mysqldump` and store the `.sql` file securely.
3. [ ] **Files:** Sync uploaded media assets from S3 storage to your new blob storage.
4. [ ] **Secrets:** Inventory all required environment variable names (without hardcoding passwords in Git).
5. [ ] **Host:** Deploy the Docker container to Azure Container Apps or your independent server.
6. [ ] **DNS:** Point GoDaddy DNS records to your new independent production endpoint.
