/**
 * QA Test Runner - Automated testing for forms, links, and functionality
 * Run with: npx tsx server/qa-test-runner.ts
 */

import axios from "axios";
import * as cheerio from "cheerio";

interface TestResult {
  name: string;
  url: string;
  status: "PASS" | "FAIL" | "WARN";
  message: string;
  timestamp: string;
}

interface FormTest {
  name: string;
  url: string;
  formSelector: string;
  requiredFields: string[];
  testData: Record<string, string>;
}

interface LinkTest {
  name: string;
  url: string;
  linkSelector: string;
}

const BASE_URL = process.env.TEST_URL || "https://gigitekai.com";
const results: TestResult[] = [];

// Utility function to log results
function logResult(result: TestResult) {
  results.push(result);
  const icon = result.status === "PASS" ? "✓" : result.status === "FAIL" ? "✗" : "⚠";
  console.log(`${icon} [${result.status}] ${result.name}`);
  if (result.message) console.log(`  ${result.message}`);
}

// Test if a page loads successfully
async function testPageLoad(name: string, path: string): Promise<TestResult> {
  const url = `${BASE_URL}${path}`;
  try {
    const response = await axios.get(url, { timeout: 10000 });
    if (response.status === 200) {
      return {
        name,
        url,
        status: "PASS",
        message: `Page loaded successfully (${response.status})`,
        timestamp: new Date().toISOString(),
      };
    } else {
      return {
        name,
        url,
        status: "FAIL",
        message: `Unexpected status code: ${response.status}`,
        timestamp: new Date().toISOString(),
      };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      name,
      url,
      status: "FAIL",
      message: `Failed to load page: ${message}`,
      timestamp: new Date().toISOString(),
    };
  }
}

// Test if all links on a page are valid
async function testPageLinks(name: string, path: string): Promise<TestResult[]> {
  const url = `${BASE_URL}${path}`;
  const testResults: TestResult[] = [];

  try {
    const response = await axios.get(url, { timeout: 10000 });
    const $ = cheerio.load(response.data);
    const links = $("a[href]")
      .map((_: number, el: any) => $(el).attr("href"))
      .get();

    const uniqueLinks = Array.from(new Set(links)).filter(
      (link) => link && !link.startsWith("#") && !link.startsWith("javascript:")
    );

    console.log(`  Found ${uniqueLinks.length} links on ${path}`);

    for (const link of uniqueLinks.slice(0, 10)) {
      // Test first 10 links to avoid rate limiting
      if (!link) continue;

      const isExternal = link.startsWith("http");
      const testUrl = isExternal ? link : `${BASE_URL}${link}`;

      try {
        const linkResponse = await axios.head(testUrl, { timeout: 5000 });
        if (linkResponse.status === 200 || linkResponse.status === 301 || linkResponse.status === 302) {
          testResults.push({
            name: `Link: ${link}`,
            url: testUrl,
            status: "PASS",
            message: `Link valid (${linkResponse.status})`,
            timestamp: new Date().toISOString(),
          });
        } else {
          testResults.push({
            name: `Link: ${link}`,
            url: testUrl,
            status: "WARN",
            message: `Unexpected status: ${linkResponse.status}`,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        testResults.push({
          name: `Link: ${link}`,
          url: testUrl,
          status: "FAIL",
          message: `Link broken or unreachable`,
          timestamp: new Date().toISOString(),
        });
      }
    }
  } catch (error) {
    testResults.push({
      name,
      url,
      status: "FAIL",
      message: `Failed to test links: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date().toISOString(),
    });
  }

  return testResults;
}

// Test if a form exists and has required fields
async function testFormExists(test: FormTest): Promise<TestResult> {
  try {
    const response = await axios.get(test.url, { timeout: 10000 });
    const $ = cheerio.load(response.data);
    const form = $(test.formSelector);

    if (form.length === 0) {
      return {
        name: test.name,
        url: test.url,
        status: "FAIL",
        message: `Form not found with selector: ${test.formSelector}`,
        timestamp: new Date().toISOString(),
      };
    }

    const missingFields = test.requiredFields.filter((field) => !form.find(`[name="${field}"]`).length);

    if (missingFields.length > 0) {
      return {
        name: test.name,
        url: test.url,
        status: "FAIL",
        message: `Missing fields: ${missingFields.join(", ")}`,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      name: test.name,
      url: test.url,
      status: "PASS",
      message: `Form found with all required fields`,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      name: test.name,
      url: test.url,
      status: "FAIL",
      message: `Failed to test form: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date().toISOString(),
    };
  }
}

// Main test runner
async function runTests() {
  console.log(`\n🚀 Starting QA Test Suite for ${BASE_URL}\n`);
  console.log("=".repeat(60));

  // Test critical pages
  console.log("\n📄 Testing Page Loads...");
  const pages = [
    { name: "Homepage", path: "/" },
    { name: "Support", path: "/support" },
    { name: "Free Audit", path: "/free-audit" },
    { name: "Pricing", path: "/pricing" },
    { name: "Contact", path: "/contact" },
    { name: "Privacy Policy", path: "/privacy" },
    { name: "Knowledge Base", path: "/kb" },
    { name: "Blog", path: "/blog" },
  ];

  for (const page of pages) {
    const result = await testPageLoad(page.name, page.path);
    logResult(result);
  }

  // Test links on key pages
  console.log("\n🔗 Testing Links...");
  for (const page of pages.slice(0, 3)) {
    // Test first 3 pages to avoid rate limiting
    const linkResults = await testPageLinks(page.name, page.path);
    linkResults.forEach(logResult);
  }

  // Test forms
  console.log("\n📋 Testing Forms...");
  const forms: FormTest[] = [
    {
      name: "Contact Form",
      url: `${BASE_URL}/contact`,
      formSelector: "form",
      requiredFields: ["name", "email", "message"],
      testData: {
        name: "Test User",
        email: "test@example.com",
        message: "Test message",
      },
    },
    {
      name: "Free Audit Form",
      url: `${BASE_URL}/free-audit`,
      formSelector: "form",
      requiredFields: ["company", "email"],
      testData: {
        company: "Test Company",
        email: "test@example.com",
      },
    },
  ];

  for (const form of forms) {
    const result = await testFormExists(form);
    logResult(result);
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;
  const warned = results.filter((r) => r.status === "WARN").length;

  console.log(`\n📊 Test Summary:`);
  console.log(`  ✓ Passed: ${passed}`);
  console.log(`  ✗ Failed: ${failed}`);
  console.log(`  ⚠ Warned: ${warned}`);
  console.log(`  Total: ${results.length}\n`);

  // Save results to file
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const reportPath = `qa-test-report-${timestamp}.json`;
  require("fs").writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`📝 Report saved to: ${reportPath}\n`);

  // Exit with error code if tests failed
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch((error) => {
  console.error("Test runner error:", error);
  process.exit(1);
});
