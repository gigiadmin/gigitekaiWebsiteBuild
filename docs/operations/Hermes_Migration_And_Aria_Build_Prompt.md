# Hermes Migration & Aria AI Assistant Implementation Prompt

> **Context for Hermes:** You are tasked with executing a zero-downtime, production-grade migration of the **GigitekAI** platform (`gigitekai.com`) from platform-managed hosting (Manus) to independent, portable infrastructure (GitHub + Docker + Azure Container Apps / MySQL / Blob Storage), while fully preserving, hardening, and upgrading **Aria**—our AI assistant, chat, voice, and workflow orchestration engine.

---

## Part 1: Platform & Infrastructure Migration (Off-Manus)

### Objective
Containerize and deploy the full-stack GigitekAI application (React 19 + Express 4 + tRPC 11 + Drizzle ORM + MySQL) to portable cloud infrastructure under Harry's direct control.

### Core Architecture Requirements
1. **Control Plane:** Private GitHub repository (`gigiadmin/gigitekaiWebsiteBuild.git`). Branch protection on `main`; GitHub Actions CI/CD workflows for automated build, test, and image publication to GitHub Container Registry (GHCR) and Azure Container Registry (ACR).
2. **Runtime:** Dockerized multi-stage Node 22 build running as a non-root user. Deploy to **Azure Container Apps** (or equivalent independent container platform) with minimum 1 warm replica, health probes (`/healthz`, `/readyz`), and rolling revisions.
3. **Database:** Azure Database for MySQL Flexible Server (or standalone MySQL 8.4+). Migrate existing schema and data via `mysqldump` restore. Enforce TLS and least-privilege db user.
4. **Object Storage:** Replace platform storage proxy with an Azure Blob Storage adapter. Store all user attachments, audio recordings, voicemails, and generated exports in Blob Storage; store only metadata/URLs in MySQL.
5. **Secrets Management:** Store all API keys, database credentials, Microsoft Graph secrets, Stripe signing secrets, and Teams webhooks in **Azure Key Vault**. Access via managed identities in production.
6. **DNS & Edge:** GoDaddy remains the authoritative DNS registrar. Route `gigitekai.com`, `www.gigitekai.com`, and `mainx.gigitekai.com` through Azure Front Door (or Container Apps custom domain bindings) with managed TLS.

---

## Part 2: Aria AI Assistant & Voice Engine Upgrade

### Objective
Make **Aria** the robust, persistent, low-latency central intelligence ("brain") for the entire GigitekAI public site, client portal, and admin command center (`/admin/aria`), complete with multi-model fallback, voice synthesis, mobile audio playback, knowledge-base grounding, and secure tool access.

### Core Aria Specifications to Implement
1. **Persistent State & History:**
   - Store all Aria chat sessions and message histories in MySQL (`chat_sessions`, `chat_messages`) so conversations survive page refreshes, mobile browser suspensions, and device switches.
2. **Multi-Model LLM Gateway:**
   - Implement a robust fallback provider router (`server/_core/multiLLM.ts`): Primary = Anthropic Claude 3.5 Sonnet / Gemini 1.5 Flash; Fallback = local Ollama or backup API key.
   - Support structured JSON output and tool-calling schemas.
3. **Knowledge Base (KB) Grounding:**
   - Wire Aria directly into the GigitekAI Knowledge Base (80+ articles covering Microsoft 365, Azure AD, Entra ID, Intune, networking, hardware, and helpdesk).
   - Implement semantic vector search or robust keyword-context injection so Aria cites exact KB articles and support runbooks rather than hallucinating answers.
4. **Voice & Mobile Audio Fixes:**
   - Fix mobile browser audio playback for Aria's text-to-speech (TTS) responses. Ensure Azure Speech SDK / browser Web Speech API fallbacks work cleanly on iOS Safari and Android Chrome without silent blocking.
   - Provide a visual audio waveform indicator and playback controls (Play, Pause, Replay, Stop) directly in the Aria command center and floating widget.
5. **Agentic Tool Access & Workflow Orchestration:**
   - Equip Aria with secure tool permissions to:
     - Check UptimeRobot monitor statuses and trigger incident investigations.
     - Query helpdesk ticket statistics and create/assign tickets via tRPC procedures.
     - Interact with Microsoft Graph / Teams webhooks to post notifications or escalate chats.
     - Initiate IT Discovery and Security Assessment lead intake workflows.
6. **Privacy & Governance:**
   - Ensure customer data privacy (GDPR/HIPAA/SOC 2 readiness). Never log raw secrets or sensitive PII in plain text; scrub conversation transcripts before persisting unless the user explicitly saves them.

---

## Part 3: Implementation & Validation Checklist for Hermes

- [ ] **Step 1: Repository & Docker Setup**
  - Verify `Dockerfile`, `.dockerignore`, and `docker-compose.yml` are present and build successfully (`docker compose up --build`).
- [ ] **Step 2: Database Migration**
  - Run database migration schema push (`pnpm db:push`).
  - Import existing MySQL production dump (`gigitekai_db_backup.sql`) into the new managed MySQL instance.
- [ ] **Step 3: Storage & Secrets Integration**
  - Verify Blob Storage connection string and upload helper (`storagePut`, `storageGet`).
  - Populate Azure Key Vault with required environment variables and verify runtime secret injection.
- [ ] **Step 4: Aria & Chatroom Verification**
  - Test `/admin/aria` and the floating chat widget.
  - Verify chat history persistence across page refreshes.
  - Test mobile audio synthesis and playback on iOS/Android emulators.
  - Test KB grounding on technical queries (e.g., "How do I fix OneDrive sync errors?").
- [ ] **Step 5: End-to-End Smoke Test**
  - Verify public homepage (`gigitekai.com`), Knowledge Base (`/kb`), QR Hub (`/qr`), and Web Intake Discovery form (`/free-audit`).
  - Verify ACS email notifications and Teams webhooks fire successfully on test form submissions.
  - Confirm all 977+ Vitest unit tests pass successfully.
