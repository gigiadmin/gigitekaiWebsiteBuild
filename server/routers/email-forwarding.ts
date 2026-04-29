import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getMsGraphToken } from "../_core/email";
import { z } from "zod";

/**
 * Create or update a mail forwarding rule in Exchange via Microsoft Graph
 * This forwards emails from support@gigitekai.com to the Teams channel email address
 */
async function setupMailForwardingRule(teamsChannelEmail: string): Promise<{ success: boolean; message: string; ruleId?: string }> {
  const token = await getMsGraphToken();
  if (!token) {
    return {
      success: false,
      message: "Could not obtain MS Graph token",
    };
  }

  const supportEmail = "support@gigitekai.com";

  try {
    // First, check if a forwarding rule already exists
    const rulesUrl = `https://graph.microsoft.com/v1.0/users/${supportEmail}/mailFolders/inbox/messageRules`;
    
    const rulesResponse = await fetch(rulesUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!rulesResponse.ok) {
      console.error(`[Email Forwarding] Failed to fetch existing rules: ${rulesResponse.status}`);
      return {
        success: false,
        message: `Failed to fetch existing rules: ${rulesResponse.status}`,
      };
    }

    const rulesData = (await rulesResponse.json()) as { value: any[] };
    const existingRule = rulesData.value?.find((rule: any) => 
      rule.displayName === "Forward to Teams Help Desk"
    );

    // If rule exists, delete it first so we can recreate it
    if (existingRule) {
      console.log(`[Email Forwarding] Found existing rule ${existingRule.id}, deleting...`);
      const deleteUrl = `${rulesUrl}/${existingRule.id}`;
      const deleteResponse = await fetch(deleteUrl, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!deleteResponse.ok) {
        console.warn(`[Email Forwarding] Failed to delete existing rule: ${deleteResponse.status}`);
      }
    }

    // Create the forwarding rule
    const rulePayload = {
      displayName: "Forward to Teams Help Desk",
      enabled: true,
      conditions: {
        // Apply to all messages
      },
      actions: {
        // Forward to Teams channel email
        forwardTo: [
          {
            emailAddress: {
              address: teamsChannelEmail,
              name: "Teams Help Desk Channel",
            },
          },
        ],
        // Keep a copy in the inbox
        stopProcessingRules: false,
      },
    };

    const createUrl = rulesUrl;
    const createResponse = await fetch(createUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(rulePayload),
    });

    if (!createResponse.ok) {
      const errorDetail = await createResponse.text();
      console.error(`[Email Forwarding] Failed to create rule: ${createResponse.status} - ${errorDetail}`);
      return {
        success: false,
        message: `Failed to create forwarding rule: ${createResponse.status}`,
      };
    }

    const ruleData = (await createResponse.json()) as { id: string };
    console.log(`[Email Forwarding] Successfully created forwarding rule: ${ruleData.id}`);

    return {
      success: true,
      message: `Forwarding rule created successfully. All emails to ${supportEmail} will now be forwarded to ${teamsChannelEmail}`,
      ruleId: ruleData.id,
    };
  } catch (error) {
    console.error("[Email Forwarding] Error setting up mail forwarding:", error);
    return {
      success: false,
      message: `Error setting up mail forwarding: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Get the status of the mail forwarding rule
 */
async function getMailForwardingStatus(): Promise<{ enabled: boolean; targetEmail?: string; ruleId?: string }> {
  const token = await getMsGraphToken();
  if (!token) {
    return { enabled: false };
  }

  const supportEmail = "support@gigitekai.com";

  try {
    const rulesUrl = `https://graph.microsoft.com/v1.0/users/${supportEmail}/mailFolders/inbox/messageRules`;
    
    const response = await fetch(rulesUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return { enabled: false };
    }

    const data = (await response.json()) as { value: any[] };
    const forwardingRule = data.value?.find((rule: any) => 
      rule.displayName === "Forward to Teams Help Desk"
    );

    if (forwardingRule && forwardingRule.actions?.forwardTo?.[0]?.emailAddress?.address) {
      return {
        enabled: forwardingRule.enabled,
        targetEmail: forwardingRule.actions.forwardTo[0].emailAddress.address,
        ruleId: forwardingRule.id,
      };
    }

    return { enabled: false };
  } catch (error) {
    console.error("[Email Forwarding] Error checking mail forwarding status:", error);
    return { enabled: false };
  }
}

export const emailForwardingRouter = router({
  /**
   * Setup mail forwarding from support@gigitekai.com to Teams channel
   * Owner only
   */
  setupForwarding: protectedProcedure
    .use(({ ctx, next }) => {
      // Only allow the owner to set up forwarding
      if (ctx.user.role !== "admin" && ctx.user.openId !== process.env.OWNER_OPEN_ID) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the owner can set up email forwarding" });
      }
      return next({ ctx });
    })
    .input(z.object({
      teamsChannelEmail: z.string().email("Invalid Teams channel email"),
    }))
    .mutation(async ({ input }) => {
      return await setupMailForwardingRule(input.teamsChannelEmail);
    }),

  /**
   * Get the current mail forwarding status
   * Owner only
   */
  getForwardingStatus: protectedProcedure
    .use(({ ctx, next }) => {
      if (ctx.user.role !== "admin" && ctx.user.openId !== process.env.OWNER_OPEN_ID) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the owner can view email forwarding status" });
      }
      return next({ ctx });
    })
    .query(async () => {
      return await getMailForwardingStatus();
    }),

  /**
   * Disable mail forwarding
   * Owner only
   */
  disableForwarding: protectedProcedure
    .use(({ ctx, next }) => {
      if (ctx.user.role !== "admin" && ctx.user.openId !== process.env.OWNER_OPEN_ID) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the owner can disable email forwarding" });
      }
      return next({ ctx });
    })
    .mutation(async () => {
      const token = await getMsGraphToken();
      if (!token) {
        return {
          success: false,
          message: "Could not obtain MS Graph token",
        };
      }

      const supportEmail = "support@gigitekai.com";

      try {
        const rulesUrl = `https://graph.microsoft.com/v1.0/users/${supportEmail}/mailFolders/inbox/messageRules`;
        
        const response = await fetch(rulesUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          return {
            success: false,
            message: "Failed to fetch rules",
          };
        }

        const data = (await response.json()) as { value: any[] };
        const forwardingRule = data.value?.find((rule: any) => 
          rule.displayName === "Forward to Teams Help Desk"
        );

        if (!forwardingRule) {
          return {
            success: false,
            message: "Forwarding rule not found",
          };
        }

        const deleteUrl = `${rulesUrl}/${forwardingRule.id}`;
        const deleteResponse = await fetch(deleteUrl, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!deleteResponse.ok) {
          return {
            success: false,
            message: `Failed to delete rule: ${deleteResponse.status}`,
          };
        }

        console.log("[Email Forwarding] Forwarding rule disabled");
        return {
          success: true,
          message: "Forwarding rule disabled successfully",
        };
      } catch (error) {
        console.error("[Email Forwarding] Error disabling forwarding:", error);
        return {
          success: false,
          message: `Error disabling forwarding: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    }),
});
