import { getMsGraphToken } from "./email";

const TEAMS_CHANNEL_EMAIL = "d0a20f98.gigitekai.com@amer.teams.ms";
const SUPPORT_EMAIL = "support@gigitekai.com";
const RULE_NAME = "Forward to Teams Help Desk";

/**
 * Check if the Teams forwarding rule already exists
 */
async function checkForwardingRuleExists(): Promise<{ exists: boolean; ruleId?: string }> {
  const token = await getMsGraphToken();
  if (!token) {
    return { exists: false };
  }

  try {
    const rulesUrl = `https://graph.microsoft.com/v1.0/users/${SUPPORT_EMAIL}/mailFolders/inbox/messageRules`;
    
    const response = await fetch(rulesUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.warn(`[Teams Forwarding] Failed to check existing rules: ${response.status}`);
      return { exists: false };
    }

    const data = (await response.json()) as { value: any[] };
    const existingRule = data.value?.find((rule: any) => rule.displayName === RULE_NAME);

    if (existingRule) {
      return { exists: true, ruleId: existingRule.id };
    }

    return { exists: false };
  } catch (error) {
    console.warn("[Teams Forwarding] Error checking for existing rule:", error);
    return { exists: false };
  }
}

/**
 * Create the Teams forwarding rule
 */
async function createForwardingRule(): Promise<{ success: boolean; ruleId?: string; message: string }> {
  const token = await getMsGraphToken();
  if (!token) {
    return {
      success: false,
      message: "Could not obtain MS Graph token",
    };
  }

  try {
    const rulesUrl = `https://graph.microsoft.com/v1.0/users/${SUPPORT_EMAIL}/mailFolders/inbox/messageRules`;

    const rulePayload = {
      displayName: RULE_NAME,
      enabled: true,
      conditions: {
        // Apply to all messages
      },
      actions: {
        // Forward to Teams channel email
        forwardTo: [
          {
            emailAddress: {
              address: TEAMS_CHANNEL_EMAIL,
              name: "Teams Help Desk Channel",
            },
          },
        ],
        // Keep a copy in the inbox
        stopProcessingRules: false,
      },
    };

    const response = await fetch(rulesUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(rulePayload),
    });

    if (!response.ok) {
      const errorDetail = await response.text();
      console.error(`[Teams Forwarding] Failed to create rule: ${response.status} - ${errorDetail}`);
      return {
        success: false,
        message: `Failed to create forwarding rule: ${response.status}`,
      };
    }

    const ruleData = (await response.json()) as { id: string };
    console.log(`[Teams Forwarding] ✅ Successfully created forwarding rule: ${ruleData.id}`);

    return {
      success: true,
      ruleId: ruleData.id,
      message: `Forwarding rule created. All emails to ${SUPPORT_EMAIL} will be forwarded to Teams channel.`,
    };
  } catch (error) {
    console.error("[Teams Forwarding] Error creating forwarding rule:", error);
    return {
      success: false,
      message: `Error creating forwarding rule: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Initialize Teams email forwarding on server startup
 * This is called automatically when the server starts
 */
export async function initializeTeamsForwarding(): Promise<void> {
  try {
    console.log("[Teams Forwarding] Checking Teams email forwarding setup...");

    // Check if rule already exists
    const { exists, ruleId } = await checkForwardingRuleExists();

    if (exists) {
      console.log(`[Teams Forwarding] ✅ Forwarding rule already exists (ID: ${ruleId})`);
      console.log(`[Teams Forwarding] Emails from ${SUPPORT_EMAIL} are being forwarded to Teams channel`);
      return;
    }

    console.log("[Teams Forwarding] No existing rule found. Creating new forwarding rule...");

    // Create the forwarding rule
    const result = await createForwardingRule();

    if (result.success) {
      console.log(`[Teams Forwarding] ${result.message}`);
    } else {
      console.warn(`[Teams Forwarding] ⚠️ Failed to create forwarding rule: ${result.message}`);
      console.warn(`[Teams Forwarding] Teams notifications may not work. Check MS Graph credentials.`);
    }
  } catch (error) {
    console.error("[Teams Forwarding] Unexpected error during initialization:", error);
  }
}
