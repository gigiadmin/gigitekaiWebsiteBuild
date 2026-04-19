import { describe, it, expect } from 'vitest';
import {
  GIGITEKAI_SYSTEM_PROMPT,
  GIGITEKAI_BUSINESS_PROCESSES,
  GIGITEKAI_TRAINING_DATA,
  RESPONSE_TEMPLATES,
} from './ai-training';

describe('AI Training System', () => {
  it('should have a comprehensive system prompt', () => {
    expect(GIGITEKAI_SYSTEM_PROMPT).toBeDefined();
    expect(GIGITEKAI_SYSTEM_PROMPT.length).toBeGreaterThan(1000);
    expect(GIGITEKAI_SYSTEM_PROMPT).toContain('GigitekAI');
    expect(GIGITEKAI_SYSTEM_PROMPT).toContain('Microsoft 365');
    console.log(`✅ System prompt loaded (${GIGITEKAI_SYSTEM_PROMPT.length} characters)`);
  });

  it('should have business process guidelines', () => {
    expect(GIGITEKAI_BUSINESS_PROCESSES).toBeDefined();
    expect(GIGITEKAI_BUSINESS_PROCESSES.ticketHandling).toBeDefined();
    expect(GIGITEKAI_BUSINESS_PROCESSES.clientCommunication).toBeDefined();
    expect(GIGITEKAI_BUSINESS_PROCESSES.knowledgeManagement).toBeDefined();
    console.log(`✅ Business processes defined`);
  });

  it('should have complete training data', () => {
    expect(GIGITEKAI_TRAINING_DATA.companyInfo).toBeDefined();
    expect(GIGITEKAI_TRAINING_DATA.services).toBeDefined();
    expect(GIGITEKAI_TRAINING_DATA.vendorPartners).toBeDefined();
    expect(GIGITEKAI_TRAINING_DATA.supportHours).toBeDefined();
    expect(GIGITEKAI_TRAINING_DATA.slaTargets).toBeDefined();
    console.log(`✅ Training data complete`);
  });

  it('should have company information', () => {
    const info = GIGITEKAI_TRAINING_DATA.companyInfo;
    expect(info.name).toBe('GigitekAI');
    expect(info.type).toContain('MSP');
    expect(info.website).toBe('https://gigitekai.com');
    console.log(`✅ Company info: ${info.name} - ${info.specialization}`);
  });

  it('should have all services listed', () => {
    const services = GIGITEKAI_TRAINING_DATA.services;
    expect(services.length).toBeGreaterThan(0);
    expect(services).toContain('Microsoft 365 Architecture & Licensing');
    expect(services).toContain('Helpdesk Support (Tier 1-3)');
    expect(services).toContain('AI Implementation & Automation');
    console.log(`✅ Services: ${services.length} services defined`);
  });

  it('should have vendor partners', () => {
    const partners = GIGITEKAI_TRAINING_DATA.vendorPartners;
    expect(partners.length).toBeGreaterThan(0);
    expect(partners).toContain('Microsoft');
    expect(partners).toContain('Sherweb');
    console.log(`✅ Vendor partners: ${partners.join(', ')}`);
  });

  it('should have SLA targets', () => {
    const sla = GIGITEKAI_TRAINING_DATA.slaTargets;
    expect(sla.critical).toBeDefined();
    expect(sla.high).toBeDefined();
    expect(sla.medium).toBeDefined();
    expect(sla.low).toBeDefined();
    console.log(`✅ SLA targets defined for all priority levels`);
  });

  it('should have common issues documented', () => {
    const issues = GIGITEKAI_TRAINING_DATA.commonIssues;
    expect(issues.length).toBeGreaterThan(0);
    expect(issues).toContain('Password resets and account lockouts');
    expect(issues).toContain('MFA setup and troubleshooting');
    console.log(`✅ Common issues: ${issues.length} issues documented`);
  });

  it('should have escalation criteria', () => {
    const criteria = GIGITEKAI_TRAINING_DATA.escalationCriteria;
    expect(criteria.length).toBeGreaterThan(0);
    expect(criteria).toContain('Service outages affecting multiple users');
    expect(criteria).toContain('Security incidents or suspected breaches');
    console.log(`✅ Escalation criteria: ${criteria.length} criteria defined`);
  });

  it('should have response templates', () => {
    expect(RESPONSE_TEMPLATES.greeting).toBeDefined();
    expect(RESPONSE_TEMPLATES.acknowledgment).toBeDefined();
    expect(RESPONSE_TEMPLATES.escalation).toBeDefined();
    expect(RESPONSE_TEMPLATES.resolution).toBeDefined();
    console.log(`✅ Response templates: ${Object.keys(RESPONSE_TEMPLATES).length} templates`);
  });

  it('should have support hours defined', () => {
    const hours = GIGITEKAI_TRAINING_DATA.supportHours;
    expect(hours.aiSupport).toBe('24/7 (AI agents)');
    expect(hours.humanSupport).toContain('9am-6pm EST');
    console.log(`✅ Support hours: AI 24/7, Human ${hours.humanSupport}`);
  });

  it('should have business process guidelines for ticket handling', () => {
    const processes = GIGITEKAI_BUSINESS_PROCESSES.ticketHandling;
    expect(processes.priority).toBeDefined();
    expect(processes.sla).toBeDefined();
    expect(processes.escalation).toBeDefined();
    expect(processes.documentation).toBeDefined();
    console.log(`✅ Ticket handling processes defined`);
  });

  it('should have client communication guidelines', () => {
    const processes = GIGITEKAI_BUSINESS_PROCESSES.clientCommunication;
    expect(processes.tone).toBeDefined();
    expect(processes.language).toBeDefined();
    expect(processes.updates).toBeDefined();
    expect(processes.followUp).toBeDefined();
    console.log(`✅ Client communication guidelines defined`);
  });
});
