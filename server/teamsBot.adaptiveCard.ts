/**
 * Teams Adaptive Card Builder
 * Creates interactive ticket cards for Teams with quick actions
 */

export interface AdaptiveCardAction {
  type: "Action.OpenUrl" | "Action.Submit";
  title: string;
  url?: string;
  data?: Record<string, any>;
  style?: "positive" | "destructive" | "default";
}

export interface TicketCardOptions {
  ticketId: number;
  title: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low";
  status: string;
  category: string;
  customerName: string;
  createdAt: Date;
  baseUrl?: string;
  actions?: AdaptiveCardAction[];
}

/**
 * Get priority color for adaptive card
 */
function getPriorityColor(priority: string): string {
  switch (priority) {
    case "critical":
      return "Attention";
    case "high":
      return "Warning";
    case "medium":
      return "Accent";
    case "low":
      return "Good";
    default:
      return "Default";
  }
}

/**
 * Get priority emoji
 */
function getPriorityEmoji(priority: string): string {
  switch (priority) {
    case "critical":
      return "🔴";
    case "high":
      return "🟠";
    case "medium":
      return "🟡";
    case "low":
      return "🟢";
    default:
      return "⚪";
  }
}

/**
 * Get status emoji
 */
function getStatusEmoji(status: string): string {
  switch (status) {
    case "open":
      return "🆕";
    case "in_progress":
      return "⚙️";
    case "on_hold":
      return "⏸️";
    case "resolved":
      return "✅";
    case "closed":
      return "🔒";
    default:
      return "❓";
  }
}

/**
 * Build adaptive card for ticket
 */
export function buildTicketCard(options: TicketCardOptions): Record<string, any> {
  const baseUrl = options.baseUrl || "https://gigitekai.com";
  const ticketUrl = `${baseUrl}/helpdesk/ticket/${options.ticketId}`;
  const adminTicketUrl = `${baseUrl}/admin/helpdesk?ticket=${options.ticketId}`;

  const defaultActions: AdaptiveCardAction[] = [
    {
      type: "Action.OpenUrl",
      title: "👁️ View Ticket",
      url: ticketUrl,
      style: "positive",
    },
    {
      type: "Action.OpenUrl",
      title: "⚙️ Manage",
      url: adminTicketUrl,
      style: "default",
    },
  ];

  const actions = options.actions || defaultActions;

  return {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        contentUrl: null,
        content: {
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          type: "AdaptiveCard",
          version: "1.4",
          body: [
            {
              type: "Container",
              style: "emphasis",
              bleed: true,
              items: [
                {
                  type: "ColumnSet",
                  columns: [
                    {
                      type: "Column",
                      width: "stretch",
                      items: [
                        {
                          type: "TextBlock",
                          text: `🎫 Ticket #${options.ticketId}`,
                          weight: "Bolder",
                          size: "Large",
                          color: "Accent",
                        },
                      ],
                    },
                    {
                      type: "Column",
                      width: "auto",
                      items: [
                        {
                          type: "TextBlock",
                          text: `${getPriorityEmoji(options.priority)} ${options.priority.toUpperCase()}`,
                          weight: "Bolder",
                          color: getPriorityColor(options.priority),
                          horizontalAlignment: "Right",
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              type: "Container",
              items: [
                {
                  type: "TextBlock",
                  text: options.title,
                  weight: "Bolder",
                  size: "Medium",
                  wrap: true,
                },
                {
                  type: "TextBlock",
                  text: options.description,
                  wrap: true,
                  size: "Small",
                  maxLines: 3,
                  color: "Default",
                  spacing: "Small",
                },
              ],
            },
            {
              type: "FactSet",
              facts: [
                {
                  title: "Status:",
                  value: `${getStatusEmoji(options.status)} ${options.status.replace(/_/g, " ").toUpperCase()}`,
                },
                {
                  title: "Category:",
                  value: options.category.replace(/_/g, " ").toUpperCase(),
                },
                {
                  title: "Customer:",
                  value: options.customerName,
                },
                {
                  title: "Created:",
                  value: formatDate(options.createdAt),
                },
              ],
            },
          ],
          actions: actions.map((action) => ({
            type: action.type,
            title: action.title,
            ...(action.type === "Action.OpenUrl" && { url: action.url }),
            ...(action.type === "Action.Submit" && { data: action.data }),
            style: action.style || "default",
          })),
        },
      },
    ],
  };
}

/**
 * Build quick reply card for Teams
 */
export function buildQuickReplyCard(
  ticketId: number,
  ticketTitle: string,
  baseUrl: string = "https://gigitekai.com"
): Record<string, any> {
  return {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        contentUrl: null,
        content: {
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          type: "AdaptiveCard",
          version: "1.4",
          body: [
            {
              type: "Container",
              items: [
                {
                  type: "TextBlock",
                  text: `Reply to Ticket #${ticketId}`,
                  weight: "Bolder",
                  size: "Medium",
                },
                {
                  type: "TextBlock",
                  text: ticketTitle,
                  wrap: true,
                  size: "Small",
                  color: "Accent",
                  spacing: "Small",
                },
                {
                  type: "Input.Text",
                  id: "reply_text",
                  placeholder: "Type your reply here...",
                  isMultiline: true,
                  maxLength: 1000,
                },
              ],
            },
          ],
          actions: [
            {
              type: "Action.Submit",
              title: "📤 Send Reply",
              data: {
                action: "reply",
                ticketId,
              },
              style: "positive",
            },
            {
              type: "Action.OpenUrl",
              title: "👁️ View Full Ticket",
              url: `${baseUrl}/helpdesk/ticket/${ticketId}`,
              style: "default",
            },
          ],
        },
      },
    ],
  };
}

/**
 * Build status update card for Teams
 */
export function buildStatusUpdateCard(
  ticketId: number,
  currentStatus: string,
  baseUrl: string = "https://gigitekai.com"
): Record<string, any> {
  const statuses = ["open", "in_progress", "on_hold", "resolved", "closed"];

  return {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        contentUrl: null,
        content: {
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          type: "AdaptiveCard",
          version: "1.4",
          body: [
            {
              type: "Container",
              items: [
                {
                  type: "TextBlock",
                  text: `Update Status for Ticket #${ticketId}`,
                  weight: "Bolder",
                  size: "Medium",
                },
                {
                  type: "TextBlock",
                  text: `Current Status: ${currentStatus}`,
                  wrap: true,
                  size: "Small",
                  color: "Accent",
                  spacing: "Small",
                },
                {
                  type: "Input.ChoiceSet",
                  id: "new_status",
                  choices: statuses.map((s) => ({
                    title: s.replace(/_/g, " ").toUpperCase(),
                    value: s,
                  })),
                  value: currentStatus,
                  style: "compact",
                },
              ],
            },
          ],
          actions: [
            {
              type: "Action.Submit",
              title: "✅ Update Status",
              data: {
                action: "update_status",
                ticketId,
              },
              style: "positive",
            },
          ],
        },
      },
    ],
  };
}

/**
 * Build Quick Assist remote help card for Teams
 */
export function buildQuickAssistCard(
  ticketId: number,
  ticketTitle: string,
  sessionCode: string,
  baseUrl: string = "https://gigitekai.com"
): Record<string, any> {
  const quickAssistUrl = `https://aka.ms/remotehelp?code=${sessionCode}`;
  const adminTicketUrl = `${baseUrl}/admin/helpdesk?ticket=${ticketId}`;

  return {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        contentUrl: null,
        content: {
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          type: "AdaptiveCard",
          version: "1.4",
          body: [
            {
              type: "Container",
              style: "emphasis",
              bleed: true,
              items: [
                {
                  type: "TextBlock",
                  text: "🖥️ Quick Assist Remote Support Session",
                  weight: "Bolder",
                  size: "Large",
                  color: "Accent",
                },
              ],
            },
            {
              type: "Container",
              items: [
                {
                  type: "TextBlock",
                  text: `Ticket #${ticketId}: ${ticketTitle}`,
                  weight: "Bolder",
                  size: "Medium",
                  wrap: true,
                },
                {
                  type: "TextBlock",
                  text: "A remote support session has been initiated. Share the session code with the customer to begin.",
                  wrap: true,
                  size: "Small",
                  spacing: "Medium",
                },
              ],
            },
            {
              type: "Container",
              style: "good",
              items: [
                {
                  type: "TextBlock",
                  text: "Session Code:",
                  weight: "Bolder",
                  size: "Small",
                },
                {
                  type: "TextBlock",
                  text: sessionCode,
                  weight: "Bolder",
                  size: "ExtraLarge",
                  color: "Accent",
                  fontType: "Monospace",
                },
              ],
            },
            {
              type: "Container",
              items: [
                {
                  type: "TextBlock",
                  text: "📋 Instructions:",
                  weight: "Bolder",
                  size: "Small",
                  spacing: "Medium",
                },
                {
                  type: "TextBlock",
                  text: "1. Share the session code with the customer\n2. Customer visits https://aka.ms/remotehelp and enters the code\n3. You will receive a connection request\n4. Accept to start the remote session",
                  wrap: true,
                  size: "Small",
                  spacing: "Small",
                },
              ],
            },
          ],
          actions: [
            {
              type: "Action.OpenUrl",
              title: "🔗 Start Remote Session",
              url: quickAssistUrl,
              style: "positive",
            },
            {
              type: "Action.OpenUrl",
              title: "🎫 View Ticket",
              url: adminTicketUrl,
              style: "default",
            },
          ],
        },
      },
    ],
  };
}

/**
 * Format date for Teams card
 */
function formatDate(date: Date): string {
  return new Date(date).toLocaleString("en-US", {
    timeZone: "America/New_York",
    dateStyle: "medium",
    timeStyle: "short",
  });
}
