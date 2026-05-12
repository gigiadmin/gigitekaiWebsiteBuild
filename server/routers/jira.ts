import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";

/**
 * Jira API Router
 * Provides tRPC procedures to interact with Jira API
 */

const jiraUrl = process.env.JIRA_URL;
const jiraEmail = process.env.JIRA_EMAIL;
const jiraToken = process.env.JIRA_API_TOKEN;

// Helper to make authenticated Jira API calls
async function jiraFetch(endpoint: string, options: RequestInit = {}) {
  if (!jiraUrl || !jiraEmail || !jiraToken) {
    throw new Error("Jira credentials not configured");
  }

  const auth = Buffer.from(`${jiraEmail}:${jiraToken}`).toString("base64");
  const url = `${jiraUrl}/rest/api/3${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Jira API error: ${response.status} - ${error}`);
  }

  return response.json();
}

export const jiraRouter = router({
  /**
   * Get all Jira projects
   */
  getProjects: publicProcedure.query(async () => {
    try {
      const data = await jiraFetch("/project");
      return data;
    } catch (error) {
      console.error("[Jira] Error fetching projects:", error);
      throw error;
    }
  }),

  /**
   * Get issues for a project with optional JQL filter
   */
  getIssues: publicProcedure
    .input(
      z.object({
        jql: z.string().optional(),
        maxResults: z.number().optional().default(50),
      })
    )
    .query(async ({ input }) => {
      try {
        const jql = input.jql || "order by updated DESC";
        const data = await jiraFetch(
          `/search?jql=${encodeURIComponent(jql)}&maxResults=${input.maxResults}&fields=summary,status,priority,assignee,created,updated`
        );
        return data;
      } catch (error) {
        console.error("[Jira] Error fetching issues:", error);
        throw error;
      }
    }),

  /**
   * Get a specific issue by key
   */
  getIssue: publicProcedure
    .input(z.object({ key: z.string() }))
    .query(async ({ input }) => {
      try {
        const data = await jiraFetch(`/issue/${input.key}`);
        return data;
      } catch (error) {
        console.error("[Jira] Error fetching issue:", error);
        throw error;
      }
    }),

  /**
   * Get issue transitions (available status changes)
   */
  getTransitions: publicProcedure
    .input(z.object({ issueKey: z.string() }))
    .query(async ({ input }) => {
      try {
        const data = await jiraFetch(`/issue/${input.issueKey}/transitions`);
        return data.transitions;
      } catch (error) {
        console.error("[Jira] Error fetching transitions:", error);
        throw error;
      }
    }),

  /**
   * Transition an issue to a new status
   */
  transitionIssue: publicProcedure
    .input(
      z.object({
        issueKey: z.string(),
        transitionId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const data = await jiraFetch(
          `/issue/${input.issueKey}/transitions`,
          {
            method: "POST",
            body: JSON.stringify({
              transition: {
                id: input.transitionId,
              },
            }),
          }
        );
        return data;
      } catch (error) {
        console.error("[Jira] Error transitioning issue:", error);
        throw error;
      }
    }),

  /**
   * Add a comment to an issue
   */
  addComment: publicProcedure
    .input(
      z.object({
        issueKey: z.string(),
        comment: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const data = await jiraFetch(
          `/issue/${input.issueKey}/comments`,
          {
            method: "POST",
            body: JSON.stringify({
              body: {
                version: 3,
                type: "doc",
                content: [
                  {
                    type: "paragraph",
                    content: [
                      {
                        type: "text",
                        text: input.comment,
                      },
                    ],
                  },
                ],
              },
            }),
          }
        );
        return data;
      } catch (error) {
        console.error("[Jira] Error adding comment:", error);
        throw error;
      }
    }),

  /**
   * Get board information
   */
  getBoards: publicProcedure.query(async () => {
    try {
      const data = await jiraFetch("/board");
      return data.values;
    } catch (error) {
      console.error("[Jira] Error fetching boards:", error);
      throw error;
    }
  }),

  /**
   * Get sprints for a board
   */
  getSprints: publicProcedure
    .input(z.object({ boardId: z.number() }))
    .query(async ({ input }) => {
      try {
        const data = await jiraFetch(`/board/${input.boardId}/sprint`);
        return data.values;
      } catch (error) {
        console.error("[Jira] Error fetching sprints:", error);
        throw error;
      }
    }),
});
