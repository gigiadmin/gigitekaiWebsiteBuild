-- ============================================================================
-- GigitekAI Production Reset Script
-- Clears all test/development data while preserving schema and admin config
-- ============================================================================

-- DISABLE FOREIGN KEY CHECKS (temporarily)
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================
-- CLEAR TICKET & SUPPORT DATA
-- ============================================================================
TRUNCATE TABLE tickets;
TRUNCATE TABLE ticketReplies;
TRUNCATE TABLE ticketAttachments;
TRUNCATE TABLE ticketTags;
TRUNCATE TABLE ticketMergeHistory;
TRUNCATE TABLE ticketRouting;
TRUNCATE TABLE ticketSLATracking;
TRUNCATE TABLE ticketAssignments;

-- ============================================================================
-- CLEAR CONTACT & SUBMISSION DATA
-- ============================================================================
TRUNCATE TABLE contactSubmissions;
TRUNCATE TABLE customerInvites;
TRUNCATE TABLE customerFeedback;

-- ============================================================================
-- CLEAR CHAT & CONVERSATION DATA
-- ============================================================================
TRUNCATE TABLE chatSessions;
TRUNCATE TABLE chatMessages;
TRUNCATE TABLE conversationSummaries;
TRUNCATE TABLE chatTranscripts;

-- ============================================================================
-- CLEAR CALL & VOICEMAIL DATA
-- ============================================================================
TRUNCATE TABLE calls;
TRUNCATE TABLE callRecordings;
TRUNCATE TABLE callQualityMetrics;
TRUNCATE TABLE voicemailMessages;
TRUNCATE TABLE callDrafts;

-- ============================================================================
-- CLEAR METRICS & MONITORING DATA
-- ============================================================================
TRUNCATE TABLE agentMetrics;
TRUNCATE TABLE serviceHealthMonitoring;
TRUNCATE TABLE serviceStatusSubscriptions;
TRUNCATE TABLE uptimeRobotMetrics;
TRUNCATE TABLE m365HealthStatus;
TRUNCATE TABLE websiteTraffic;
TRUNCATE TABLE sentimentAnalysisResults;
TRUNCATE TABLE slaPredictions;

-- ============================================================================
-- CLEAR EMAIL & COMMUNICATION DATA
-- ============================================================================
TRUNCATE TABLE emailMessages;
TRUNCATE TABLE emailDigests;
TRUNCATE TABLE emailDripCampaigns;
TRUNCATE TABLE emailRecipientGroups;
TRUNCATE TABLE emailForwarding;
TRUNCATE TABLE smsCampaigns;

-- ============================================================================
-- CLEAR ACTIVITY & AUDIT LOGS
-- ============================================================================
TRUNCATE TABLE userActivity;
TRUNCATE TABLE adminAuditLog;
TRUNCATE TABLE systemLogs;

-- ============================================================================
-- CLEAR TEMPORARY/SESSION DATA
-- ============================================================================
TRUNCATE TABLE webPushSubscriptions;
TRUNCATE TABLE emailDigestSchedules;
TRUNCATE TABLE cannedResponses;
TRUNCATE TABLE kbAutoLinkingCache;

-- ============================================================================
-- RESET METRICS TO ZERO (for tables we keep)
-- ============================================================================
UPDATE agentMetrics SET 
  totalTicketsHandled = 0,
  averageResolutionTime = 0,
  customerSatisfactionScore = 0,
  firstResponseTime = 0,
  responseTime = 0,
  resolutionTime = 0,
  ticketsCreated = 0,
  ticketsResolved = 0,
  ticketsReopened = 0,
  averageHandlingTime = 0,
  qualityScore = 0,
  adherenceScore = 0,
  occupancyRate = 0,
  idleTime = 0,
  busyTime = 0,
  notReadyTime = 0,
  breakTime = 0
WHERE 1=1;

-- ============================================================================
-- PRESERVE IMPORTANT DATA (DO NOT TRUNCATE)
-- ============================================================================
-- users — Keep admin users and configuration
-- roles — Keep role definitions
-- permissions — Keep permission mappings
-- knowledgeBase — Keep KB articles (they're content, not test data)
-- kbFeedback — Keep feedback structure
-- blog — Keep blog posts
-- newsletter — Keep newsletter configuration
-- products — Keep product/pricing data
-- pricing — Keep pricing configuration
-- teams_channels — Keep Teams channel config
-- teamsWebhookConfig — Keep webhook configuration
-- adminNotifications — Keep notification settings
-- customerOnboarding — Keep onboarding workflows
-- aiTraining — Keep AI training data
-- agentGamification — Keep gamification rules

-- ============================================================================
-- RE-ENABLE FOREIGN KEY CHECKS
-- ============================================================================
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- VERIFICATION QUERIES (run these to confirm reset)
-- ============================================================================
-- SELECT 'tickets' as table_name, COUNT(*) as row_count FROM tickets
-- UNION ALL
-- SELECT 'ticketReplies', COUNT(*) FROM ticketReplies
-- UNION ALL
-- SELECT 'contactSubmissions', COUNT(*) FROM contactSubmissions
-- UNION ALL
-- SELECT 'chatSessions', COUNT(*) FROM chatSessions
-- UNION ALL
-- SELECT 'calls', COUNT(*) FROM calls
-- UNION ALL
-- SELECT 'users', COUNT(*) FROM users
-- UNION ALL
-- SELECT 'knowledgeBase', COUNT(*) FROM knowledgeBase;
