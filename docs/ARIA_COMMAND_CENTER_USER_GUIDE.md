# Aria Command Center — User Guide

**Version:** 2.0  
**Last Updated:** July 14, 2026  
**Author:** GigitekAI Engineering  
**Audience:** GigitekAI Engineers, Technicians, and Administrators

---

## Overview

Aria is GigitekAI's AI-powered operations assistant, purpose-built to serve as the central intelligence layer for administrating our helpdesk, Microsoft 365 environment, Azure infrastructure, and client support systems. She lives at **Admin Portal → Aria Command Center** and functions as a natural language interface to your entire operational stack.

Aria understands context. She knows your open tickets, SLA status, M365 service health, agent workloads, voicemails, and knowledge base — all in real time. She responds via text and voice (Microsoft Azure Neural TTS, Jenny voice), and supports multi-turn conversations so you can drill into issues naturally.

---

## Getting Started

### Accessing Aria

1. Log into the GigitekAI Admin Portal at `gigitekai.com/admin`
2. Navigate to **Aria Command Center** from the sidebar (or click the "Aria AI" button in the top nav)
3. Aria will greet you with a voice message and display a **Morning Briefing** if there are any system alerts

### Interface Layout

| Area | Description |
|------|-------------|
| **Top Bar** | Status indicator (Idle/Thinking/Searching/Speaking), voice toggle, settings gear |
| **Chat Area** | Full conversation history with markdown rendering, code blocks, and tables |
| **Input Bar** | Text input, voice recording button, send, clear, and save buttons |
| **Right Sidebar** (desktop) | Quick Actions, System Status metrics, Ticket Volume sparkline, Workflow History |
| **Mobile Sphere** (mobile) | Compact holographic sphere with animated state indicator above the input |

---

## Core Capabilities

### 1. Natural Language Queries

Ask Aria anything in plain English. She has live access to:

- **Helpdesk tickets** — status, priority, category, SLA compliance, history
- **Microsoft 365 health** — Exchange, Teams, SharePoint, OneDrive service status
- **Agent metrics** — workload, resolution times, satisfaction scores
- **Knowledge Base** — search and reference published KB articles
- **Voicemails** — recent transcriptions and caller info
- **System uptime** — UptimeRobot monitoring data

**Examples:**

```
Show me all critical tickets from the last 24 hours
What's the M365 service health status?
How many tickets did we resolve this week?
Give me a PowerShell command to check mailbox permissions
What's our current SLA compliance rate?
```

### 2. Conversation Memory

Aria remembers the last 5 messages in your conversation. You can ask follow-up questions naturally without repeating context:

```
You: Show me all open tickets
Aria: [displays 12 open tickets by priority]
You: What about the critical ones?
Aria: [filters to show only critical tickets with details]
You: Assign the oldest one to me
Aria: [assigns ticket #247 to your account]
```

### 3. Multi-Turn Context

Aria maintains awareness of what you've discussed. If you ask about "that ticket" or "the one from yesterday," she'll use conversation history to resolve the reference.

---

## Slash Commands

Slash commands are instant shortcuts that bypass natural language processing for common operations. Type `/` in the input field to see the autocomplete dropdown.

| Command | Arguments | Description |
|---------|-----------|-------------|
| `/tickets` | `[filter]` | Show ticket summary. Optional: `critical`, `open`, `mine` |
| `/status` | — | Full system dashboard (tickets + SLA + uptime + agents + M365) |
| `/health` | — | Microsoft 365 service health status |
| `/sla` | `[client]` | SLA breach report. Optional: filter by client name |
| `/kb` | `[search term]` | Search knowledge base articles |
| `/ps` | `[task]` | Get PowerShell command for a specific task |
| `/assign` | `<ticket#>` | Assign a ticket (e.g., `/assign 247`) |
| `/close` | `<ticket#>` | Close a ticket with notes |
| `/escalate` | `<ticket#>` | Escalate ticket to critical priority |
| `/triage` | `<ticket#>` | Run full AI triage — classify + suggest assignee |
| `/provision` | `[client name]` | Start client provisioning workflow |
| `/help` | — | Display all available commands |

**Autocomplete:** As you type `/`, a dropdown appears showing matching commands with descriptions. Click any command to auto-fill it.

**Examples:**

```
/tickets critical          → Shows all critical priority tickets
/ps Get-Mailbox           → Returns the PowerShell command with parameters
/triage 305               → AI classifies ticket #305 and suggests best assignee
/sla Contoso              → Shows SLA status for Contoso client
```

---

## Voice Interaction

### Speaking to Aria

1. Click the **Voice** button (microphone icon) or press the hotkey
2. Speak your question clearly
3. Aria transcribes your speech (Azure Whisper) and processes it
4. Response appears in chat AND is spoken back via Azure Neural TTS (Jenny voice)

### Voice Settings

Access via the **gear icon** in the top bar:

| Setting | Options | Description |
|---------|---------|-------------|
| **TTS Mode** | Voice Only / Text Only / Both | Controls whether Aria speaks responses |
| **Speed** | 0.5x – 2.0x | Speaking rate (shown as Azure prosody rate) |
| **Wake Word** | On/Off | Require "Hey Aria" before processing voice input |
| **Mic Sensitivity** | 0.1 – 0.8 | Voice activity detection threshold |

### Speaking Indicator

When Aria is speaking, you'll see:
- **Desktop:** The holographic sphere displays an animated green waveform + "SPEAKING" badge
- **Mobile:** The compact sphere above the input shows the same animated indicator
- **Top Bar:** Status changes to green "Speaking" with a stop button

Click the **stop** button (VolumeX icon) at any time to interrupt Aria mid-speech.

---

## Proactive Briefing

When you first open the Command Center (with no existing chat history), Aria automatically checks:

1. **SLA Breaches** — tickets exceeding response/resolution time targets
2. **Critical/High Priority Tickets** — open tickets needing immediate attention
3. **M365 Service Degradation** — any Microsoft service experiencing issues
4. **Unread Voicemails** — new voicemails awaiting review

If any alerts are detected, Aria displays a **Morning Briefing** card and announces critical issues via voice. If everything is green, she confirms all systems are operational.

---

## AI Ticket Triage

Aria can automatically classify and route tickets using AI:

### Auto-Classification (on ticket creation)

Every new ticket is automatically analyzed for:
- **Priority:** critical / high / medium / low
- **Category:** network / hardware / software / security / m365 / billing / other
- **Confidence Score:** 0–1 indicating classification certainty
- **Reasoning:** One-sentence explanation of the classification

### Manual Triage via Slash Command

```
/triage 305
```

This runs a full triage cycle:
1. Classifies priority and category
2. Suggests next actions
3. Recommends the best assignee based on agent workload and expertise

### Assignee Suggestion Logic

The AI considers:
- Agent current ticket load (7-day average)
- SLA breach history (fewer breaches = higher priority)
- Category expertise matching
- Availability and schedule

---

## Inline Dashboard Widgets

The right sidebar displays live operational data:

- **Open Tickets** — count with warning indicator if > 5
- **System Status** — current uptime percentage
- **Critical Issues** — count with red warning if > 0
- **Avg Resolution** — average ticket resolution time
- **KB Articles** — total published knowledge base articles
- **Ticket Volume (7d)** — sparkline bar chart showing daily created vs. resolved tickets

Click any metric card to ask Aria for a detailed breakdown of that metric.

---

## Quick Actions

The right sidebar provides one-click access to:

| Action | Description |
|--------|-------------|
| **Provision Client** | Launch the multi-system client provisioning workflow |
| **Run Workflow** | Execute a predefined automation workflow |
| **Agent Status** | View real-time agent availability and metrics |
| **Settings** | Open voice/mic configuration panel |

---

## Chat Management

### Persistent History

Chat history is saved to your browser's localStorage. It persists across page refreshes and browser sessions. Each message includes a timestamp.

### Preferences Persistence

All voice settings (speed, mode, sensitivity, wake word) are also saved to localStorage and restored on next visit.

### Exporting Chat

Click the **Download** button (arrow-down icon) to export your entire conversation as a `.txt` file for documentation or audit purposes.

### Clearing Chat

Click the **Trash** button to clear all messages. This also resets the proactive briefing so it will run again on next visit.

### Deleting Individual Messages

Hover over any message to reveal a red delete button in the top-right corner.

---

## Best Practices for Engineers

1. **Use slash commands for repetitive tasks** — `/tickets`, `/status`, and `/health` are faster than typing full questions
2. **Leverage conversation memory** — ask follow-ups naturally instead of re-stating context
3. **Start your day with Aria** — the proactive briefing catches issues before they escalate
4. **Use `/triage` on new tickets** — let AI classify before manually reviewing
5. **Voice mode for hands-free** — useful during incident response when you're working on multiple screens
6. **Export important conversations** — save chat logs for post-incident reviews
7. **Adjust speed for preference** — 1.2x–1.5x is optimal for most people during routine work

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Enter` | Send message |
| `Shift+Enter` | New line (if supported) |
| `/` | Opens slash command autocomplete |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Aria not responding | Check network connection; verify you're logged in as admin |
| Voice not working | Ensure microphone permissions are granted in browser settings |
| No sound output | Check that voice is enabled (Volume2 icon should be cyan) |
| Slow responses | Complex queries (ticket analysis, M365 health) may take 3–5 seconds |
| Stale data | Metrics refresh every 30 seconds; force refresh by asking the question again |
| Morning briefing not showing | Only appears on first load with empty chat; clear chat to trigger again |

---

## Architecture (For Developers)

| Component | Technology | Location |
|-----------|-----------|----------|
| Frontend | React + TypeScript + Tailwind | `client/src/pages/AriaCommandCenter.tsx` |
| Quick Action Modals | React components | `client/src/components/AriaQuickActionModals.tsx` |
| Backend Router | tRPC + Express | `server/routers/aria.ts` |
| AI Triage | LLM (structured output) | `server/routers/aiTriage.ts` |
| TTS Engine | Azure AI Speech (REST) | `server/ariaTtsRouter.ts` |
| Voice Transcription | Azure Whisper | `server/_core/voiceTranscription.ts` |
| LLM Provider | Claude (primary) + Built-in LLM (fallback) | `server/_core/llm.ts` |
| Database | MySQL/TiDB (Drizzle ORM) | `drizzle/schema.ts` |

### Data Flow

```
User Input → handleSend() → trpc.aria.askQuestion.mutate()
  → detectIntent() → route to handler
  → getFullLiveContext() → fetch tickets/M365/agents/KB
  → askClaudeWithContext() → LLM with system context + conversation history
  → response → addMessage() → speakAsAria() (if voice enabled)
```

### Adding New Intents

1. Add the intent keyword to `detectIntent()` in `server/routers/aria.ts`
2. Add a handler case in the `askQuestion` mutation
3. (Optional) Add a slash command in the frontend `SLASH_COMMANDS` object
4. Test with both text and voice input

---

## Security Notes

- Aria is **admin-only** — requires authenticated session with admin role
- All queries run server-side; no sensitive data is exposed to the browser
- Voice recordings are processed server-side and not stored
- Chat history is stored in browser localStorage only (not server-side)
- Azure TTS keys are server-side environment variables, never exposed to frontend

---

## Support

For issues with Aria, contact:
- **Email:** support@gigitekai.com
- **Teams:** #helpdesk-engineering channel
- **Escalation:** harry@gigitekai.com

---

*Built with precision by GigitekAI Engineering. Aria is your operations brain — use her.*
