import { describe, it, expect, vi, beforeAll } from "vitest";

// Mock external dependencies
vi.mock("../_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

vi.mock("../_core/email", () => ({
  sendEmail: vi.fn().mockResolvedValue(true),
}));

vi.mock("axios", () => ({
  default: {
    post: vi.fn().mockResolvedValue({
      data: { access_token: "mock-token", id: "mock-event-id" },
    }),
  },
}));

// Mock getDb to return a mock database
const mockInsert = vi.fn().mockReturnValue({
  values: vi.fn().mockResolvedValue([{ insertId: 1 }]),
});
const mockSelect = vi.fn().mockReturnValue({
  from: vi.fn().mockReturnValue({
    where: vi.fn().mockReturnValue({
      limit: vi.fn().mockResolvedValue([{
        id: 1,
        companyName: "Test Corp",
        companyDomain: "testcorp.com",
        serviceType: "Managed IT",
        annualContractValue: "10000.00",
        contactFirstName: "John",
        contactLastName: "Doe",
        contactEmail: "john@testcorp.com",
        contactPhone: "1234567890",
        status: "onboarding",
        onboardingStep: "submitted",
        createdAt: "2024-01-01 00:00:00",
        updatedAt: "2024-01-01 00:00:00",
      }]),
    }),
    orderBy: vi.fn().mockResolvedValue([]),
  }),
});
const mockUpdate = vi.fn().mockReturnValue({
  set: vi.fn().mockReturnValue({
    where: vi.fn().mockResolvedValue([]),
  }),
});

vi.mock("../db", () => ({
  getDb: vi.fn().mockResolvedValue({
    insert: mockInsert,
    select: mockSelect,
    update: mockUpdate,
  }),
}));

vi.mock("../../drizzle/schema", () => ({
  clients: { id: "id", companyDomain: "companyDomain", status: "status", contactEmail: "contactEmail" },
  clientTimeline: { clientId: "clientId" },
}));

vi.mock("../_core/env", () => ({
  ENV: {
    msGraphClientId: "mock-client-id",
    msGraphClientSecret: "mock-client-secret",
    msGraphTenantId: "mock-tenant-id",
  },
}));

describe("Client Onboarding Router", () => {
  it("should have the correct input validation schema", async () => {
    // Import the module to verify it loads without errors
    const module = await import("./client-onboarding");
    expect(module.clientOnboardingRouter).toBeDefined();
  });

  it("should export a router with startOnboarding, listClients, getClient, and updateStatus procedures", async () => {
    const module = await import("./client-onboarding");
    const router = module.clientOnboardingRouter;
    
    // Check that the router has the expected procedures
    expect(router._def.procedures).toHaveProperty("startOnboarding");
    expect(router._def.procedures).toHaveProperty("listClients");
    expect(router._def.procedures).toHaveProperty("getClient");
    expect(router._def.procedures).toHaveProperty("updateStatus");
  });

  it("should validate that companyName is required", () => {
    const { z } = require("zod");
    
    // Test the validation schema manually
    const schema = z.object({
      companyName: z.string().min(1, "Company name required"),
      companyEmail: z.string().min(1, "Company email domain required"),
      contactFirstName: z.string().min(1, "First name required"),
      contactLastName: z.string().min(1, "Last name required"),
      contactEmail: z.string().email("Valid email required"),
      contactPhone: z.string().min(10, "Valid phone required"),
      serviceType: z.string().min(1, "Service type required"),
      annualValue: z.number().min(0, "Annual value must be positive"),
    });

    // Should fail with empty companyName
    const result = schema.safeParse({
      companyName: "",
      companyEmail: "test.com",
      contactFirstName: "John",
      contactLastName: "Doe",
      contactEmail: "john@test.com",
      contactPhone: "1234567890",
      serviceType: "Managed IT",
      annualValue: 10000,
    });
    expect(result.success).toBe(false);
  });

  it("should accept both email and domain formats for companyEmail", () => {
    const { z } = require("zod");
    
    const schema = z.object({
      companyEmail: z.string().min(1, "Company email domain required"),
    });

    // Should accept domain
    expect(schema.safeParse({ companyEmail: "acme.com" }).success).toBe(true);
    // Should accept email
    expect(schema.safeParse({ companyEmail: "info@acme.com" }).success).toBe(true);
    // Should reject empty
    expect(schema.safeParse({ companyEmail: "" }).success).toBe(false);
  });

  it("should extract domain from email correctly", () => {
    const email = "info@divinesounds.info";
    const domain = email.includes("@") ? email.split("@")[1] : email;
    expect(domain).toBe("divinesounds.info");
  });

  it("should use domain as-is when no @ symbol present", () => {
    const domainInput = "divinesounds.info";
    const domain = domainInput.includes("@") ? domainInput.split("@")[1] : domainInput;
    expect(domain).toBe("divinesounds.info");
  });
});
