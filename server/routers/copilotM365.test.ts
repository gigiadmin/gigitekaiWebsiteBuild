import { describe, it, expect, vi, beforeEach } from "vitest";
import { copilotM365Router } from "./copilotM365";
import * as m365Graph from "../_core/m365Graph";

// Mock M365 Graph functions
vi.mock("../_core/m365Graph", () => ({
  getM365Users: vi.fn(),
  getUserCalendarEvents: vi.fn(),
  getUserRecentEmails: vi.fn(),
  getUserOneDriveFiles: vi.fn(),
  analyzeUserM365Activity: vi.fn(),
  getOrganizationM365Stats: vi.fn(),
}));

describe("Copilot M365 Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getOrgStats", () => {
    it("should return organization statistics", async () => {
      const mockStats = {
        totalUsers: 100,
        activeUsers: 85,
        teamsUsage: 70,
        exchangeUsage: 95,
        sharepointUsage: 60,
      };

      vi.mocked(m365Graph.getOrganizationM365Stats).mockResolvedValueOnce(mockStats);

      const result = await copilotM365Router.createCaller({
        user: { id: 1, role: "admin" },
      } as any).getOrgStats();

      expect(result.success).toBe(true);
      expect(result.stats).toEqual(mockStats);
    });

    it("should handle errors gracefully", async () => {
      vi.mocked(m365Graph.getOrganizationM365Stats).mockRejectedValueOnce(
        new Error("API Error")
      );

      const result = await copilotM365Router.createCaller({
        user: { id: 1, role: "admin" },
      } as any).getOrgStats();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("listUsers", () => {
    it("should return list of M365 users", async () => {
      const mockUsers = [
        {
          id: "user1",
          displayName: "John Doe",
          userPrincipalName: "john@company.com",
          mail: "john@company.com",
        },
        {
          id: "user2",
          displayName: "Jane Smith",
          userPrincipalName: "jane@company.com",
          mail: "jane@company.com",
        },
      ];

      vi.mocked(m365Graph.getM365Users).mockResolvedValueOnce(mockUsers as any);

      const result = await copilotM365Router.createCaller({
        user: { id: 1, role: "admin" },
      } as any).listUsers();

      expect(result.success).toBe(true);
      expect(result.users).toEqual(mockUsers);
      expect(result.count).toBe(2);
    });
  });

  describe("getUserCalendar", () => {
    it("should return user calendar events", async () => {
      const mockEvents = [
        {
          id: "event1",
          subject: "Team Meeting",
          start: { dateTime: "2026-04-19T10:00:00Z" },
          end: { dateTime: "2026-04-19T11:00:00Z" },
          organizer: { emailAddress: { address: "organizer@company.com" } },
          attendees: [],
        },
      ];

      vi.mocked(m365Graph.getUserCalendarEvents).mockResolvedValueOnce(mockEvents as any);

      const result = await copilotM365Router.createCaller({
        user: { id: 1, role: "admin" },
      } as any).getUserCalendar({ userEmail: "user@company.com" });

      expect(result.success).toBe(true);
      expect(result.events).toEqual(mockEvents);
      expect(result.count).toBe(1);
    });
  });

  describe("getUserEmails", () => {
    it("should return user recent emails", async () => {
      const mockEmails = [
        {
          id: "email1",
          subject: "Project Update",
          from: { emailAddress: { address: "sender@company.com", name: "John" } },
          receivedDateTime: "2026-04-18T15:00:00Z",
          bodyPreview: "Here is the project update...",
        },
      ];

      vi.mocked(m365Graph.getUserRecentEmails).mockResolvedValueOnce(mockEmails as any);

      const result = await copilotM365Router.createCaller({
        user: { id: 1, role: "admin" },
      } as any).getUserEmails({ userEmail: "user@company.com", topCount: 20 });

      expect(result.success).toBe(true);
      expect(result.emails).toEqual(mockEmails);
      expect(result.count).toBe(1);
    });
  });

  describe("getUserFiles", () => {
    it("should return user OneDrive files", async () => {
      const mockFiles = [
        {
          id: "file1",
          name: "Document.docx",
          webUrl: "https://company.sharepoint.com/...",
          lastModifiedDateTime: "2026-04-18T10:00:00Z",
          createdDateTime: "2026-04-17T09:00:00Z",
          size: 1024000,
        },
      ];

      vi.mocked(m365Graph.getUserOneDriveFiles).mockResolvedValueOnce(mockFiles as any);

      const result = await copilotM365Router.createCaller({
        user: { id: 1, role: "admin" },
      } as any).getUserFiles({ userEmail: "user@company.com" });

      expect(result.success).toBe(true);
      expect(result.files).toEqual(mockFiles);
      expect(result.count).toBe(1);
      expect(result.totalSize).toBe(1024000);
    });
  });

  describe("analyzeUserActivity", () => {
    it("should analyze user M365 activity", async () => {
      const mockAnalysis = {
        summary: "User activity summary",
        insights: ["Insight 1", "Insight 2"],
        recommendations: ["Recommendation 1"],
      };

      vi.mocked(m365Graph.analyzeUserM365Activity).mockResolvedValueOnce(mockAnalysis);

      const result = await copilotM365Router.createCaller({
        user: { id: 1, role: "admin" },
      } as any).analyzeUserActivity({ userEmail: "user@company.com" });

      expect(result.success).toBe(true);
      expect(result.analysis).toEqual(mockAnalysis);
    });
  });

  describe("getUserProfile", () => {
    it("should return comprehensive user profile", async () => {
      const mockCalendar = [
        {
          id: "event1",
          subject: "Meeting",
          start: { dateTime: "2026-04-19T10:00:00Z" },
          end: { dateTime: "2026-04-19T11:00:00Z" },
          organizer: { emailAddress: { address: "org@company.com" } },
          attendees: [],
        },
      ];

      const mockEmails = [
        {
          id: "email1",
          subject: "Email",
          from: { emailAddress: { address: "sender@company.com", name: "Sender" } },
          receivedDateTime: "2026-04-18T15:00:00Z",
          bodyPreview: "Preview",
        },
      ];

      const mockFiles = [
        {
          id: "file1",
          name: "File.docx",
          webUrl: "https://...",
          lastModifiedDateTime: "2026-04-18T10:00:00Z",
          createdDateTime: "2026-04-17T09:00:00Z",
          size: 1024000,
        },
      ];

      const mockActivity = {
        summary: "Summary",
        insights: ["Insight"],
        recommendations: ["Recommendation"],
      };

      vi.mocked(m365Graph.getUserCalendarEvents).mockResolvedValueOnce(mockCalendar as any);
      vi.mocked(m365Graph.getUserRecentEmails).mockResolvedValueOnce(mockEmails as any);
      vi.mocked(m365Graph.getUserOneDriveFiles).mockResolvedValueOnce(mockFiles as any);
      vi.mocked(m365Graph.analyzeUserM365Activity).mockResolvedValueOnce(mockActivity);

      const result = await copilotM365Router.createCaller({
        user: { id: 1, role: "admin" },
      } as any).getUserProfile({ userEmail: "user@company.com" });

      expect(result.success).toBe(true);
      expect(result.profile).toBeDefined();
      expect(result.profile?.email).toBe("user@company.com");
      expect(result.profile?.calendar.eventsCount).toBe(1);
      expect(result.profile?.emails.count).toBe(1);
      expect(result.profile?.files.count).toBe(1);
    });
  });
});
