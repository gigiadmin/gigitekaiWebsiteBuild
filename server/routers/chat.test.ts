import { describe, it, expect, beforeEach, vi } from "vitest";
import { chatRouter } from "./chat";
import { getDb } from "../db";
import { realtimeChatSessions, realtimeChatMessages, userSessions } from "../../drizzle/schema";

// Mock database and WebSocket functions
vi.mock("../db");
vi.mock("../_core/websocket");

describe("Chat Router", () => {
  const mockUser = {
    id: 1,
    openId: "test-user",
    name: "Test User",
    email: "test@example.com",
    role: "user" as const,
    loginMethod: "oauth",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const mockAdmin = {
    id: 2,
    openId: "admin-user",
    name: "Admin User",
    email: "admin@example.com",
    role: "admin" as const,
    loginMethod: "oauth",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  describe("getOrCreateSession", () => {
    it("should create a new chat session", async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            $returningId: vi.fn().mockResolvedValue([{ id: 1 }]),
          }),
        }),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const procedure = chatRouter.createCaller({
        user: mockUser,
        req: {} as any,
        res: {} as any,
      });

      const result = await procedure.getOrCreateSession({});

      expect(result).toBeDefined();
      expect(result.userId).toBe(mockUser.id);
      expect(result.status).toBe("active");
    });

    it("should return existing session if already active", async () => {
      const existingSession = {
        id: 1,
        userId: mockUser.id,
        adminId: null,
        status: "active" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        closedAt: null,
      };

      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([existingSession]),
          }),
        }),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const procedure = chatRouter.createCaller({
        user: mockUser,
        req: {} as any,
        res: {} as any,
      });

      const result = await procedure.getOrCreateSession({});

      expect(result.id).toBe(1);
      expect(result.status).toBe("active");
    });
  });

  describe("closeSession", () => {
    it("should close a chat session", async () => {
      const session = {
        id: 1,
        userId: mockUser.id,
        adminId: null,
        status: "active" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        closedAt: null,
      };

      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([session]),
          }),
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined),
          }),
        }),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const procedure = chatRouter.createCaller({
        user: mockUser,
        req: {} as any,
        res: {} as any,
      });

      const result = await procedure.closeSession({ sessionId: 1 });

      expect(result.success).toBe(true);
    });

    it("should throw error if user is not authorized", async () => {
      const session = {
        id: 1,
        userId: 999, // Different user
        adminId: null,
        status: "active" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        closedAt: null,
      };

      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([session]),
          }),
        }),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const procedure = chatRouter.createCaller({
        user: mockUser,
        req: {} as any,
        res: {} as any,
      });

      await expect(procedure.closeSession({ sessionId: 1 })).rejects.toThrow(
        "Unauthorized"
      );
    });
  });

  describe("getMessages", () => {
    it("should retrieve messages for a session", async () => {
      const session = {
        id: 1,
        userId: mockUser.id,
        adminId: mockAdmin.id,
        status: "active" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        closedAt: null,
      };

      const messages = [
        {
          id: 1,
          sessionId: 1,
          senderId: mockUser.id,
          senderRole: "user" as const,
          message: "Hello admin",
          isRead: false,
          createdAt: new Date(),
        },
        {
          id: 2,
          sessionId: 1,
          senderId: mockAdmin.id,
          senderRole: "admin" as const,
          message: "Hello user",
          isRead: false,
          createdAt: new Date(),
        },
      ];

      const mockDb = {
        select: vi.fn()
          .mockReturnValueOnce({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([session]),
            }),
          })
          .mockReturnValueOnce({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue(messages),
            }),
          }),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const procedure = chatRouter.createCaller({
        user: mockUser,
        req: {} as any,
        res: {} as any,
      });

      const result = await procedure.getMessages({ sessionId: 1 });

      expect(result).toHaveLength(2);
      expect(result[0].message).toBe("Hello admin");
      expect(result[1].message).toBe("Hello user");
    });

    it("should throw error if user is not authorized", async () => {
      const session = {
        id: 1,
        userId: 999, // Different user
        adminId: null,
        status: "active" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        closedAt: null,
      };

      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([session]),
          }),
        }),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const procedure = chatRouter.createCaller({
        user: mockUser,
        req: {} as any,
        res: {} as any,
      });

      await expect(procedure.getMessages({ sessionId: 1 })).rejects.toThrow(
        "Unauthorized"
      );
    });
  });

  describe("getUserSessions", () => {
    it("should retrieve user's active sessions", async () => {
      const sessions = [
        {
          id: 1,
          userId: mockUser.id,
          adminId: mockAdmin.id,
          status: "active" as const,
          createdAt: new Date(),
          updatedAt: new Date(),
          closedAt: null,
        },
      ];

      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(sessions),
          }),
        }),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const procedure = chatRouter.createCaller({
        user: mockUser,
        req: {} as any,
        res: {} as any,
      });

      const result = await procedure.getUserSessions();

      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe(mockUser.id);
    });
  });

  describe("getAdminSessions", () => {
    it("should retrieve all active sessions for admin", async () => {
      const sessions = [
        {
          id: 1,
          userId: mockUser.id,
          adminId: mockAdmin.id,
          status: "active" as const,
          createdAt: new Date(),
          updatedAt: new Date(),
          closedAt: null,
        },
      ];

      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(sessions),
          }),
        }),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const procedure = chatRouter.createCaller({
        user: mockAdmin,
        req: {} as any,
        res: {} as any,
      });

      const result = await procedure.getAdminSessions();

      expect(result).toHaveLength(1);
    });

    it("should throw error if user is not admin", async () => {
      const procedure = chatRouter.createCaller({
        user: mockUser,
        req: {} as any,
        res: {} as any,
      });

      await expect(procedure.getAdminSessions()).rejects.toThrow(
        "Only admins can view all sessions"
      );
    });
  });

  describe("markAsRead", () => {
    it("should mark messages as read", async () => {
      const mockDb = {
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined),
          }),
        }),
      };

      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const procedure = chatRouter.createCaller({
        user: mockUser,
        req: {} as any,
        res: {} as any,
      });

      const result = await procedure.markAsRead({ sessionId: 1 });

      expect(result.success).toBe(true);
    });
  });
});
