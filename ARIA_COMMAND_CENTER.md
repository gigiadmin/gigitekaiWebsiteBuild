# Aria Command Center — Main Brain Architecture

## Overview
Aria becomes the unified intelligence hub for GigitekAI environment. Admins ask natural language questions and get answers backed by:
- Real-time system status (uptime, alerts, tickets)
- 932+ KB articles (searchable, contextual)
- Claude AI for advanced technical guidance
- Ticket history and patterns
- Admin environment context

## Components

### 1. Voice + Text Chat Interface
- **Location:** `/admin/aria-command-center`
- **Input:** Voice (speech-to-text) + Text
- **Output:** Text + Voice (text-to-speech)
- **Transcription:** Whisper API with IT terminology hints (Azure AD, M365, MSAL)

### 2. Claude AI Integration
- **Model:** Claude 3.5 Sonnet
- **Purpose:** Answer advanced technical questions
- **Examples:**
  - "How do I create a group in PowerShell for Exchange?"
  - "What's the best way to migrate users to Teams?"
  - "How do I troubleshoot Azure AD sync failures?"
- **Context:** Aria passes KB articles, ticket patterns, system status to Claude for informed answers

### 3. Real-time Dashboard
- **System Status Panel:**
  - Uptime SLA (24h, 7d, 30d, 365d)
  - Active alerts
  - Recent tickets (open, pending, resolved)
  - KB article usage stats
  
- **Quick Commands:**
  - "Show me open tickets"
  - "What's our uptime today?"
  - "Find articles about Exchange"
  - "Analyze ticket trends"

### 4. Unified Search
- **Search Scope:**
  - KB articles (932+) — phrase-based relevance ranking
  - Tickets (all) — status, priority, category
  - System status — uptime, alerts, metrics
  - Documentation — internal guides, playbooks
  
- **Smart Routing:**
  - Simple KB question → Search KB, return article
  - Complex technical question → Pass to Claude with KB context
  - System question → Query dashboard, return status
  - Ticket question → Search ticket history, analyze patterns

### 5. Admin Monitoring & Takeover
- **Live Chat View:**
  - See all active Aria conversations in real-time
  - Timestamp, user, message history
  - Admin can jump into conversation at any time
  
- **Session Takeover:**
  - "Take over" button to switch from Aria to human
  - Seamless handoff with conversation context
  - Admin can see Aria's reasoning/sources

### 6. Command Execution
- **Available Commands:**
  - `check uptime` — Show SLA metrics
  - `list tickets` — Show open/pending tickets
  - `search kb` — Find articles by keyword
  - `analyze ticket [id]` — Get AI analysis of ticket
  - `show alerts` — Display active alerts
  - `get report` — Generate admin report

## Data Flow

```
User Question (voice/text)
    ↓
Aria Speech-to-Text (if voice)
    ↓
Intent Detection (KB search? System status? Technical question?)
    ↓
Route to appropriate handler:
    - KB Search → phrase-based ranking → return articles
    - System Status → query dashboard → return metrics
    - Technical Question → Claude AI + KB context → return answer
    - Ticket Analysis → query database → return insights
    ↓
Generate Response (text + voice)
    ↓
Admin Monitoring (log conversation, allow takeover)
```

## Integration Points

### Backend (tRPC Routers)
- `aria.askQuestion` — Main entry point (handles voice/text)
- `aria.searchKB` — Search KB articles with context
- `aria.getSystemStatus` — Pull uptime, alerts, metrics
- `aria.getTickets` — Query ticket database
- `aria.analyzeTicket` — AI analysis of specific ticket
- `aria.executeCommand` — Run admin commands
- `aria.getConversations` — Admin monitoring (list active chats)
- `aria.takeoverSession` — Admin takeover

### Frontend (React Components)
- `AriaCommandCenter.tsx` — Main interface
- `AriaChatBox.tsx` — Chat input/output with voice
- `AriaDashboard.tsx` — Real-time status panel
- `AriaAdminMonitor.tsx` — Live conversation view
- `AriaVoiceInput.tsx` — Speech-to-text component
- `AriaVoiceOutput.tsx` — Text-to-speech component

### External APIs
- **Claude AI:** Advanced technical questions
- **Whisper API:** Speech-to-text (IT terminology)
- **TTS Service:** Text-to-speech (voice output)
- **Manus Built-in LLM:** Fallback for simple questions

## Database Schema

### ariaConversations
```sql
CREATE TABLE ariaConversations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  sessionId VARCHAR(255) UNIQUE,
  messages JSON, -- array of {role, content, timestamp, source}
  status ENUM('active', 'closed', 'takeover'),
  takenOverBy INT, -- admin user ID if taken over
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);
```

### ariaCommandLog
```sql
CREATE TABLE ariaCommandLog (
  id INT PRIMARY KEY AUTO_INCREMENT,
  conversationId INT,
  command VARCHAR(255),
  result JSON,
  executedAt TIMESTAMP
);
```

## Security & Privacy
- All conversations logged for audit
- Admin takeover requires admin role
- Claude API calls sanitized (no sensitive data)
- Voice transcriptions stored encrypted
- Commands limited to read-only operations (no destructive actions)

## Success Metrics
- Aria answers 80%+ of questions without admin escalation
- Average response time < 2 seconds
- Admin takeover rate < 5%
- User satisfaction > 4.5/5
- KB article discovery rate increases 40%+
