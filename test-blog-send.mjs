/**
 * Test script: Generate AI blog post and send to subscribers
 * Run: node test-blog-send.mjs
 */

const API_URL = "http://localhost:3000/api/trpc";

async function testBlogGeneration() {
  console.log("🚀 Starting blog generation test...\n");

  try {
    // Step 1: Generate blog post
    console.log("📝 Step 1: Generating AI blog post...");
    const generateResponse = await fetch(`${API_URL}/blog.generateDaily`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    if (!generateResponse.ok) {
      throw new Error(`Generation failed: ${generateResponse.status}`);
    }

    const generateResult = await generateResponse.json();
    console.log("✅ Blog post generated");
    console.log(`   Title: ${generateResult.result?.data?.title || "N/A"}`);
    console.log(`   Excerpt: ${generateResult.result?.data?.excerpt?.substring(0, 100) || "N/A"}...\n`);

    // Step 2: Send to subscribers
    console.log("📧 Step 2: Sending to newsletter subscribers...");
    const sendResponse = await fetch(`${API_URL}/blog.sendToSubscribers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: generateResult.result?.data?.title || "Daily AI Insight",
        excerpt: generateResult.result?.data?.excerpt || "Check out today's AI insight",
        slug: generateResult.result?.data?.slug || "daily-ai-insight",
      }),
    });

    if (!sendResponse.ok) {
      throw new Error(`Send failed: ${sendResponse.status}`);
    }

    const sendResult = await sendResponse.json();
    console.log("✅ Emails sent");
    console.log(`   Sent: ${sendResult.result?.data?.sent || 0}`);
    console.log(`   Failed: ${sendResult.result?.data?.failed || 0}\n`);

    console.log("🎉 Test completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }
}

testBlogGeneration();
