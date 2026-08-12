import { describe, expect, it } from "vitest";
import { formSubmissionsRouter } from "./formSubmissions";

const publicCaller = () =>
  formSubmissionsRouter.createCaller({
    user: null,
    req: {} as any,
    res: {} as any,
  });

const nonAdminCaller = () =>
  formSubmissionsRouter.createCaller({
    user: { id: "user-123", role: "user" } as any,
    req: {} as any,
    res: {} as any,
  });

const validSubmission = {
  email: "test@example.com",
  name: "Test User",
  phone: "609-555-0100",
  company: "Test Company",
  category: "inquiry",
  message: "This is a valid test message for form validation.",
  source: "website",
};

describe("formSubmissionsRouter", () => {
  describe("submitForm validation", () => {
    it("rejects an invalid email before writing a submission", async () => {
      await expect(
        publicCaller().submitForm({ ...validSubmission, email: "invalid-email" })
      ).rejects.toThrow();
    });

    it("requires a name of at least two characters", async () => {
      await expect(
        publicCaller().submitForm({ ...validSubmission, name: "A" })
      ).rejects.toThrow();
    });

    it("requires a phone number and a meaningful message", async () => {
      await expect(
        publicCaller().submitForm({ ...validSubmission, phone: "123", message: "short" })
      ).rejects.toThrow();
    });

    it("requires a form category", async () => {
      await expect(
        publicCaller().submitForm({ ...validSubmission, category: "" })
      ).rejects.toThrow();
    });
  });

  describe("admin operations", () => {
    it("blocks a non-admin from listing intake submissions", async () => {
      await expect(nonAdminCaller().getAll()).rejects.toThrow(/permission/i);
    });

    it("blocks a non-admin from reading an intake submission", async () => {
      await expect(nonAdminCaller().getById({ id: 1 })).rejects.toThrow(/permission/i);
    });

    it("blocks a non-admin from changing intake status", async () => {
      await expect(
        nonAdminCaller().updateStatus({ id: 1, status: "contacted" })
      ).rejects.toThrow(/permission/i);
    });

    it("blocks a non-admin from deleting an intake submission", async () => {
      await expect(nonAdminCaller().delete({ id: 1 })).rejects.toThrow(/permission/i);
    });

    it("blocks a non-admin from bulk deleting intake submissions", async () => {
      await expect(nonAdminCaller().bulkDelete({ ids: [1, 2] })).rejects.toThrow(
        /permission/i
      );
    });
  });
});
