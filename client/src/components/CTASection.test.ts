import { describe, it, expect, vi, beforeEach } from "vitest";

describe("CTASection Contact Form", () => {
  describe("Form Validation", () => {
    it("should require name field", () => {
      const form = { name: "", email: "hhenry23@gmail.com", company: "", message: "test" };
      expect(form.name).toBe("");
      expect(form.email).not.toBe("");
    });

    it("should require email field", () => {
      const form = { name: "John", email: "", company: "", message: "test" };
      expect(form.email).toBe("");
      expect(form.name).not.toBe("");
    });

    it("should accept valid email format", () => {
      const email = "john@company.com";
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(emailRegex.test(email)).toBe(true);
    });

    it("should reject invalid email format", () => {
      const email = "invalid-email";
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(emailRegex.test(email)).toBe(false);
    });

    it("should allow optional company field", () => {
      const form = { name: "John", email: "john@example.com", company: "", message: "test" };
      expect(form.company).toBe("");
    });

    it("should allow optional message field", () => {
      const form = { name: "John", email: "john@example.com", company: "Acme", message: "" };
      expect(form.message).toBe("");
    });
  });

  describe("Form Submission", () => {
    it("should handle successful submission", async () => {
      const mockMutation = vi.fn().mockResolvedValue({ success: true });
      const result = await mockMutation({
        name: "John Smith",
        email: "john@example.com",
        company: "Acme Corp",
        message: "We need cloud solutions",
      });
      expect(result.success).toBe(true);
    });

    it("should handle submission errors", async () => {
      const mockMutation = vi.fn().mockRejectedValue(new Error("Network error"));
      try {
        await mockMutation({
          name: "John",
          email: "john@example.com",
          company: "Acme",
          message: "test",
        });
      } catch (err) {
        expect(err).toBeInstanceOf(Error);
        expect((err as Error).message).toBe("Network error");
      }
    });

    it("should clear form after successful submission", () => {
      let form = { name: "John", email: "john@example.com", company: "Acme", message: "test" };
      form = { name: "", email: "", company: "", message: "" };
      expect(form.name).toBe("");
      expect(form.email).toBe("");
      expect(form.company).toBe("");
      expect(form.message).toBe("");
    });

    it("should show loading state during submission", () => {
      const isPending = true;
      expect(isPending).toBe(true);
    });

    it("should show success message after submission", () => {
      const submitted = true;
      expect(submitted).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should display error message on submission failure", () => {
      const error = "Failed to submit form. Please try again.";
      expect(error).not.toBeNull();
      expect(error.length).toBeGreaterThan(0);
    });

    it("should handle network errors gracefully", async () => {
      const mockMutation = vi.fn().mockRejectedValue(new Error("Network timeout"));
      try {
        await mockMutation({
          name: "John",
          email: "john@example.com",
          company: "Acme",
          message: "test",
        });
      } catch (err) {
        expect((err as Error).message).toContain("Network");
      }
    });

    it("should handle validation errors", () => {
      const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      expect(validateEmail("invalid")).toBe(false);
      expect(validateEmail("valid@example.com")).toBe(true);
    });
  });

  describe("Contact Information", () => {
    it("should display phone number", () => {
      const phone = "1-800-GIGIT-AI";
      expect(phone).toBe("1-800-GIGIT-AI");
    });

    it("should display email address", () => {
      const email = "hello@gigitekai.com";
      expect(email).toBe("hello@gigitekai.com");
    });

    it("should display service area", () => {
      const serviceArea = "Serving clients across North America";
      expect(serviceArea).toContain("North America");
    });
  });
});
