#!/usr/bin/env node
/**
 * Comprehensive Form Testing Suite
 * Tests all 5 submission forms on GigitekAI
 */

const BASE_URL = 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api/trpc`;

// Test results tracker
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function log(test, status, message) {
  const emoji = status === 'PASS' ? '✅' : '❌';
  console.log(`${emoji} ${test}: ${message}`);
  results.tests.push({ test, status, message });
  if (status === 'PASS') results.passed++;
  else results.failed++;
}

async function testAriaWidgetEscalation() {
  console.log('\n📋 Test 1: Aria Widget Ticket Escalation');
  try {
    const response = await fetch(`${API_BASE}/aibot.escalateToHelpDesk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        json: {
          sessionId: `test-session-${Date.now()}`,
          visitorName: 'Test User',
          visitorEmail: 'test@example.com',
          issue: 'Test ticket from Aria widget',
          idempotencyKey: `test-key-${Date.now()}`
        }
      })
    });
    
    const data = await response.json();
    if (data.result?.data?.ticketId) {
      log('Aria Escalation', 'PASS', `Ticket created: #${data.result.data.ticketId}`);
    } else {
      log('Aria Escalation', 'FAIL', JSON.stringify(data));
    }
  } catch (error) {
    log('Aria Escalation', 'FAIL', error.message);
  }
}

async function testMainHelpdeskForm() {
  console.log('\n📋 Test 2: Main Helpdesk Form (/helpdesk/tickets/new)');
  try {
    const response = await fetch(`${API_BASE}/helpdesk.createTicket`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        json: {
          title: 'Test Helpdesk Ticket',
          description: 'Testing main helpdesk form submission',
          category: 'General Support',
          priority: 'Low',
          source: 'web'
        }
      })
    });
    
    const data = await response.json();
    if (data.result?.data?.ticketId) {
      log('Helpdesk Form', 'PASS', `Ticket created: #${data.result.data.ticketId}`);
    } else {
      log('Helpdesk Form', 'FAIL', JSON.stringify(data));
    }
  } catch (error) {
    log('Helpdesk Form', 'FAIL', error.message);
  }
}

async function testAdminTicketForm() {
  console.log('\n📋 Test 3: Admin Ticket Form');
  try {
    const response = await fetch(`${API_BASE}/helpdesk.adminCreateTicket`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        json: {
          title: 'Admin Test Ticket',
          description: 'Testing admin ticket creation form',
          category: 'General Support',
          priority: 'Medium',
          requesterName: 'Admin Test User',
          requesterEmail: 'admin-test@example.com',
          channel: 'email'
        }
      })
    });
    
    const data = await response.json();
    if (data.result?.data?.ticketId) {
      log('Admin Form', 'PASS', `Ticket created: #${data.result.data.ticketId}`);
    } else if (data.error?.code === 'UNAUTHORIZED') {
      log('Admin Form', 'PASS', 'Authorization check working (expected for non-admin)');
    } else {
      log('Admin Form', 'FAIL', JSON.stringify(data));
    }
  } catch (error) {
    log('Admin Form', 'FAIL', error.message);
  }
}

async function testContactForm() {
  console.log('\n📋 Test 4: Contact Form');
  try {
    const response = await fetch(`${API_BASE}/contact.submitForm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        json: {
          name: 'Test Contact',
          email: 'contact-test@example.com',
          company: 'Test Company',
          message: 'This is a test contact form submission with enough content to pass validation'
        }
      })
    });
    
    const data = await response.json();
    if (data.result?.data?.success || data.result?.data?.id) {
      log('Contact Form', 'PASS', 'Contact submission successful');
    } else {
      log('Contact Form', 'FAIL', JSON.stringify(data));
    }
  } catch (error) {
    log('Contact Form', 'FAIL', error.message);
  }
}

async function testKnowledgeBasePage() {
  console.log('\n📋 Test 5: Knowledge Base Page (/kb)');
  try {
    const response = await fetch(`${API_BASE}/kb.list`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        json: {
          page: 1,
          limit: 10
        }
      })
    });
    
    const data = await response.json();
    if (data.result?.data?.articles) {
      log('KB Page', 'PASS', `Retrieved ${data.result.data.articles.length} articles`);
    } else {
      log('KB Page', 'FAIL', JSON.stringify(data));
    }
  } catch (error) {
    log('KB Page', 'FAIL', error.message);
  }
}

async function testDuplicatePrevention() {
  console.log('\n📋 Test 6: Duplicate Prevention (Idempotency)');
  try {
    const idempotencyKey = `dup-test-${Date.now()}`;
    
    // First submission
    const response1 = await fetch(`${API_BASE}/aibot.escalateToHelpDesk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        json: {
          sessionId: `dup-session-${Date.now()}`,
          visitorName: 'Duplicate Test',
          visitorEmail: 'dup-test@example.com',
          issue: 'Testing duplicate prevention',
          idempotencyKey: idempotencyKey
        }
      })
    });
    
    const data1 = await response1.json();
    const ticketId1 = data1.result?.data?.ticketId;
    
    // Second submission with same key
    const response2 = await fetch(`${API_BASE}/aibot.escalateToHelpDesk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        json: {
          sessionId: `dup-session-${Date.now()}`,
          visitorName: 'Duplicate Test',
          visitorEmail: 'dup-test@example.com',
          issue: 'Testing duplicate prevention',
          idempotencyKey: idempotencyKey
        }
      })
    });
    
    const data2 = await response2.json();
    const isDuplicate = data2.result?.data?.isDuplicate;
    
    if (isDuplicate && ticketId1) {
      log('Duplicate Prevention', 'PASS', `Duplicate detected and prevented`);
    } else {
      log('Duplicate Prevention', 'FAIL', `isDuplicate: ${isDuplicate}, ticketId: ${ticketId1}`);
    }
  } catch (error) {
    log('Duplicate Prevention', 'FAIL', error.message);
  }
}

async function runAllTests() {
  console.log('🚀 Starting Comprehensive Form Tests\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`API Base: ${API_BASE}\n`);
  
  await testAriaWidgetEscalation();
  await testMainHelpdeskForm();
  await testAdminTicketForm();
  await testContactForm();
  await testKnowledgeBasePage();
  await testDuplicatePrevention();
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Test Results: ${results.passed} passed, ${results.failed} failed`);
  console.log('='.repeat(50));
  
  process.exit(results.failed > 0 ? 1 : 0);
}

runAllTests().catch(error => {
  console.error('Test suite error:', error);
  process.exit(1);
});
