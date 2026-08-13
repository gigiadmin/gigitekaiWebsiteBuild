# GigitekAI Permanent Independent Hosting & Disaster-Recovery Master Plan

**Objective:** Establish a permanent, production-grade, Manus-independent hosting infrastructure for GigitekAI (`gigitekai.com`), ensuring 99.9% uptime, zero platform lock-in, and full operational control over source code, database, file storage, secrets, integrations, and the Aria AI assistant.

---

## 1. Executive Summary & Core Decisions

To ensure `gigitekai.com` remains online regardless of Manus platform availability, GigitekAI will operate on an **Azure-first, GoDaddy-DNS-controlled, GitHub-governed** architecture.

| Component | Independent Target | Management & Authority |
|---|---|---|
| **Domain Registrar & DNS** | GoDaddy | Harry / GigitekAI Team (Authoritative DNS zone) |
| **Control Plane & CI/CD** | Private GitHub repository (`gigiadmin/gigitekaiWebsiteBuild.git`) | GitHub Actions (automated build, test, container push) |
| **Container Runtime** | Azure Container Apps | Scalable Node 22 Express / tRPC server with zero Manus dependency |
| **Database** | Azure Database for MySQL Flexible Server | Managed relational database with automated backups & point-in-time recovery |
| **File Storage** | Azure Blob Storage | Secure, immutable object storage for attachments, voice recordings, and exports |
| **Secrets & Keys** | Azure Key Vault | Managed identity and encrypted secret storage for API keys and webhooks |
| **Edge & TLS** | Azure Front Door / Container Apps Edge | WAF, global caching, automated TLS certificates for `gigitekai.com` |

---

## 2. Target Architecture Diagram

```mermaid
flowchart LR
  GD[GoDaddy DNS\ngigitekai.com] --> AFD[Azure Front Door / TLS Edge\n WAF + Global Routing]
   AFD --> ACA[Azure Container Apps\n gigitekai-web-api (React + Express + tRPC)]
  
  subgraph Azure Production Environment
    ACA --> DB[(Azure MySQL Flexible Server\n Drizzle ORM + Encrypted Backups)]
    ACA --> BLOB[(Azure Blob Storage\n Attachments • Voicemails • Exports)]
    ACA --> KV[Azure Key Vault\n Managed Identity + Secrets]
    ACA --> BUS[Azure Service Bus / Redis\n Async Jobs & Realtime Coordination]
  end

  GH[Private GitHub Repo] --> GH_CI[GitHub Actions CI/CD]
  GH_CI --> GHCR[GHCR / ACR Container Registry]
  GHCR --> ACA
```

---

## 3. Phased Execution Roadmap

### Phase 1: Preparation & Export (Day 1)
1. **Source Code:** Verify sync to `https://github.com/gigiadmin/gigitekaiWebsiteBuild.git`.
2. **Database Export:** Generate a full logical MySQL dump (`mysqldump`).
3. **Storage Inventory:** Export list of uploaded file keys and sync objects to local backup.
4. **Secrets Inventory:** Document environment variable names (`DATABASE_URL`, `JWT_SECRET`, `STRIPE_SECRET_KEY`, `MS_GRAPH_CLIENT_ID`, `AZURE_COMMUNICATION_CONNECTION_STRING`, etc.).

### Phase 2: Independent Infrastructure Provisioning (Days 2–3)
1. **Azure Resource Group:** Create `rg-gigitekai-prod`.
2. **Database:** Provision Azure Database for MySQL Flexible Server; import exported `.sql` dump.
3. **Storage:** Provision Azure Blob Storage account and create `app-files` container.
4. **Secrets:** Provision Azure Key Vault and store all production secrets securely.
5. **Container Registry:** Configure GitHub Container Registry (GHCR) and Azure Container Registry (ACR).

### Phase 3: Container Deployment & Staging Validation (Days 4–5)
1. **Build & Test:** Run multi-stage Docker build locally and in GitHub Actions.
2. **Deploy to Staging:** Deploy container revision to Azure Container Apps linked to staging domain (`staging.gigitekai.com`).
3. **Smoke Tests:** Validate public routes, Knowledge Base (`/kb`), Web Intake forms, ACS email notifications, Teams webhooks, Stripe checkout, and Aria chat persistence.

### Phase 4: Production DNS Cutover (Day 6)
1. **Lower TTL:** Reduce GoDaddy DNS TTL to 300 seconds.
2. **Final Sync:** Execute final database and object-storage synchronization.
3. **Point DNS:** Update GoDaddy A/CNAME records to point `gigitekai.com` and `www.gigitekai.com` to the Azure edge.
4. **Verify Live Edge:** Confirm valid TLS certificate, zero 403 errors, and 100% functional user flows.

---

## 4. Preserving & Upgrading Aria in Independent Hosting

The Aria AI assistant will operate fully within the independent container deployment:
- **Persistent Chat History:** Stored in the Azure MySQL database (`chat_sessions`, `chat_messages`), ensuring no chat loss on refresh.
- **Multi-Model Gateway:** Runs server-side via `server/_core/multiLLM.ts`, supporting Anthropic Claude, Gemini, and local Ollama.
- **Knowledge Base Grounding:** Directly queries the local Drizzle MySQL tables containing all 80+ KB articles.
- **Voice & TTS:** Operates using browser Web Speech API and Azure Speech Services configured via Azure Key Vault secrets.

---

## 5. Disaster Recovery & Operational Runbook

1. **RPO / RTO Targets:** Recovery Point Objective (RPO) < 15 minutes (MySQL PITR); Recovery Time Objective (RTO) < 2 hours.
2. **Automated Backups:** Nightly encrypted MySQL backups and blob versioning.
3. **Rollback Strategy:** If cutover encounters issues, GoDaddy DNS records can be temporarily reverted while retaining the standalone Azure deployment for debugging.
