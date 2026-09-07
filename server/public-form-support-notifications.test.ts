import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

vi.mock("./_core/email", () => ({
  sendEmail: vi.fn().mockResolvedValue(true),
}));

import { sendEmail } from "./_core/email";
import {
  PUBLIC_FORM_SUPPORT_EMAIL,
  sendPublicFormSupportNotification,
} from "./_core/publicFormSupportNotification";

const formRouterFiles = [
  "routers/contact-form.ts",
  "routers/audit.ts",
  "routers/freeAuditRouter.ts",
  "routers/earlyAccess.ts",
  "routers/formSubmissions.ts",
  "routers/leadgen.ts",
  "routers/portal-access.ts",
  "routers/newsletter.ts",
  "routers/calendar.ts",
  "routers/aibot.ts",
  "routers/website-expansion.ts",
  "routers/service-status-subscriptions.ts",
  "routers/client-satisfaction-survey.ts",
  "routers/feedback.ts",
  "routers/helpdesk-survey.ts",
  "routers.ts",
];

describe("public form support notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("always sends the internal notification exclusively to support@gigitekai.com", async () => {
    await sendPublicFormSupportNotification({
      formName: "Test Form",
      submitterName: "Sample User",
      submitterEmail: "sample@example.com",
      fields: { Message: "Please contact me" },
    });

    expect(PUBLIC_FORM_SUPPORT_EMAIL).toBe("support@gigitekai.com");
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "support@gigitekai.com",
        replyTo: "sample@example.com",
      })
    );
  });

  it("escapes untrusted form values in the support email", async () => {
    await sendPublicFormSupportNotification({
      formName: "Test Form",
      fields: { Message: '<script>alert("x")</script>' },
    });

    const payload = vi.mocked(sendEmail).mock.calls[0][0];
    expect(payload.html).toContain("&lt;script&gt;");
    expect(payload.html).not.toContain("<script>");
  });

  it("keeps every identified form router wired to a direct or shared support notification", () => {
    for (const relativePath of formRouterFiles) {
      const source = readFileSync(join(process.cwd(), "server", relativePath), "utf8");
      expect(
        source.includes('to: "support@gigitekai.com"') ||
          source.includes("sendPublicFormSupportNotification")
      ).toBe(true);
    }
  });

  it("contains no legacy support@gigitek.com recipient in server routers", () => {
    for (const relativePath of formRouterFiles) {
      const source = readFileSync(join(process.cwd(), "server", relativePath), "utf8");
      expect(source).not.toMatch(/to:\s*["'`]support@gigitek\.com["'`]/);
    }
  });
});
