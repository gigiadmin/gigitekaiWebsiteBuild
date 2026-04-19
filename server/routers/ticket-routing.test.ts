import { describe, it, expect } from 'vitest';
import {
  determineRouting,
  getRoutingRulesForCategory,
  shouldEscalateTicket,
  ROUTING_RULES,
  ESCALATION_TRIGGERS,
  SLA_TARGETS,
  AGENT_SPECIALIZATIONS,
} from './ticket-routing';

describe('Ticket Routing System', () => {
  it('should have routing rules for all categories', () => {
    expect(Object.keys(ROUTING_RULES).length).toBeGreaterThan(0);
    expect(ROUTING_RULES['Exchange Online']).toBeDefined();
    expect(ROUTING_RULES['Microsoft Teams']).toBeDefined();
    expect(ROUTING_RULES['SharePoint Online']).toBeDefined();
    console.log(`✅ Routing rules: ${Object.keys(ROUTING_RULES).length} categories`);
  });

  it('should have escalation triggers defined', () => {
    expect(ESCALATION_TRIGGERS.failedAttempts).toBe(2);
    expect(ESCALATION_TRIGGERS.customerRequest).toBe(true);
    expect(ESCALATION_TRIGGERS.serviceOutage).toBe(true);
    console.log(`✅ Escalation triggers configured`);
  });

  it('should have SLA targets for all priorities', () => {
    expect(SLA_TARGETS.critical).toBeDefined();
    expect(SLA_TARGETS.high).toBeDefined();
    expect(SLA_TARGETS.medium).toBeDefined();
    expect(SLA_TARGETS.low).toBeDefined();
    console.log(`✅ SLA targets: critical=${SLA_TARGETS.critical.resolutionTime}m, high=${SLA_TARGETS.high.resolutionTime}m`);
  });

  it('should have agent specializations', () => {
    expect(AGENT_SPECIALIZATIONS.tier1).toBeDefined();
    expect(AGENT_SPECIALIZATIONS.tier2).toBeDefined();
    expect(AGENT_SPECIALIZATIONS.tier3).toBeDefined();
    console.log(`✅ Agent specializations: Tier 1, Tier 2, Tier 3`);
  });

  it('should route critical tickets to tier2', () => {
    const routing = determineRouting('Exchange Online', 'critical', 'Cannot access mailbox');
    expect(routing.agentTier).toBe('tier2');
    expect(routing.priority).toBe('critical');
    console.log(`✅ Critical ticket routed to ${routing.agentTier}`);
  });

  it('should route high priority tickets to tier2', () => {
    const routing = determineRouting('Microsoft Teams', 'high', 'Teams not working');
    expect(routing.agentTier).toBe('tier2');
    console.log(`✅ High priority ticket routed to ${routing.agentTier}`);
  });

  it('should route medium priority tickets to tier1', () => {
    const routing = determineRouting('SharePoint Online', 'medium', 'Permission issue');
    expect(routing.agentTier).toBe('tier1');
    console.log(`✅ Medium priority ticket routed to ${routing.agentTier}`);
  });

  it('should route low priority tickets to AI first', () => {
    const routing = determineRouting('General IT Support', 'low', 'How do I reset password?');
    expect(routing.agentTier).toBe('ai');
    expect(routing.autoResolveAttempt).toBe(true);
    console.log(`✅ Low priority ticket routed to AI for auto-resolution`);
  });

  it('should escalate after failed attempts', () => {
    const routing = determineRouting('Exchange Online', 'medium', 'Cannot send email', 2);
    expect(routing.shouldEscalate).toBe(true);
    expect(routing.escalationReason).toContain('Failed after 2 attempts');
    expect(routing.agentTier).toBe('tier3');
    console.log(`✅ Ticket escalated after failed attempts`);
  });

  it('should escalate service outages', () => {
    const routing = determineRouting('Microsoft Teams', 'critical', 'Teams is down for all users');
    expect(routing.shouldEscalate).toBe(true);
    expect(routing.escalationReason).toContain('service outage');
    console.log(`✅ Service outage escalated to tier3`);
  });

  it('should escalate security incidents', () => {
    const routing = determineRouting('Entra ID / Azure AD', 'critical', 'Suspected security breach');
    expect(routing.shouldEscalate).toBe(true);
    expect(routing.escalationReason).toContain('Security incident');
    console.log(`✅ Security incident escalated`);
  });

  it('should escalate data loss issues', () => {
    const routing = determineRouting('OneDrive', 'critical', 'Files deleted - data recovery needed');
    expect(routing.shouldEscalate).toBe(true);
    expect(routing.escalationReason).toContain('Data loss');
    console.log(`✅ Data loss issue escalated`);
  });

  it('should provide routing rules for categories', () => {
    const rules = getRoutingRulesForCategory('Exchange Online');
    expect(rules.tier1).toBeDefined();
    expect(rules.tier2).toBeDefined();
    expect(rules.tier3).toBeDefined();
    console.log(`✅ Exchange routing rules: ${rules.tier1.length} tier1, ${rules.tier2.length} tier2, ${rules.tier3.length} tier3`);
  });

  it('should detect escalation keywords', () => {
    const shouldEscalate1 = shouldEscalateTicket('medium', 0, 10, 'Service outage affecting all users');
    expect(shouldEscalate1).toBe(true);

    const shouldEscalate2 = shouldEscalateTicket('low', 0, 10, 'Security breach detected');
    expect(shouldEscalate2).toBe(true);

    const shouldEscalate3 = shouldEscalateTicket('low', 0, 10, 'How do I reset my password?');
    expect(shouldEscalate3).toBe(false);

    console.log(`✅ Escalation keyword detection working`);
  });

  it('should calculate SLA deadlines', () => {
    const now = Date.now();
    const routing = determineRouting('Exchange Online', 'critical', 'Cannot access');
    expect(routing.slaDeadline).toBeGreaterThan(now);
    expect(routing.slaDeadline).toBeLessThan(now + 2 * 60 * 60 * 1000); // Less than 2 hours
    console.log(`✅ SLA deadline calculated: ${new Date(routing.slaDeadline).toISOString()}`);
  });

  it('should provide estimated resolution times', () => {
    const critical = determineRouting('Exchange Online', 'critical', 'Outage');
    expect(critical.estimatedResolutionTime).toBe('1 hour');

    const high = determineRouting('Teams', 'high', 'Issue');
    expect(high.estimatedResolutionTime).toBe('2-4 hours');

    const medium = determineRouting('SharePoint', 'medium', 'Problem');
    expect(medium.estimatedResolutionTime).toBe('4-8 hours');

    const low = determineRouting('General', 'low', 'Question');
    expect(low.estimatedResolutionTime).toBe('24 hours');

    console.log(`✅ Estimated resolution times: critical=1h, high=2-4h, medium=4-8h, low=24h`);
  });

  it('should handle time-based escalation', () => {
    // High priority ticket that has been open for 2 hours (120 minutes)
    const shouldEscalate = shouldEscalateTicket('high', 0, 120, 'Normal issue');
    expect(shouldEscalate).toBe(true);

    // Same ticket but only 30 minutes elapsed
    const shouldNotEscalate = shouldEscalateTicket('high', 0, 30, 'Normal issue');
    expect(shouldNotEscalate).toBe(false);

    console.log(`✅ Time-based escalation working`);
  });

  it('should have tier specializations', () => {
    expect(AGENT_SPECIALIZATIONS.tier1.name).toBe('Tier 1 Support');
    expect(AGENT_SPECIALIZATIONS.tier1.maxTickets).toBe(20);
    expect(AGENT_SPECIALIZATIONS.tier2.maxTickets).toBe(10);
    expect(AGENT_SPECIALIZATIONS.tier3.maxTickets).toBe(5);
    console.log(`✅ Tier specializations: T1=${AGENT_SPECIALIZATIONS.tier1.maxTickets} tickets, T2=${AGENT_SPECIALIZATIONS.tier2.maxTickets}, T3=${AGENT_SPECIALIZATIONS.tier3.maxTickets}`);
  });
});
