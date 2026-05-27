-- Bulk insert 10 canned responses for GigitekAI helpdesk
-- Variables: {{requesterName}}, {{ticketId}}, {{ticketDetails}}, {{agentName}}, {{responseTime}}, {{planName}}, {{cancellationDate}}, {{specificResource}}, {{featureDetails}}, {{bugRef}}, {{actionRequested}}, {{seniorName}}, {{extraDetails}}

INSERT INTO cannedResponses (title, body, category, usageCount, createdBy, createdAt, updatedAt) VALUES

('Password Reset / Login Issue', 
'Hi {{requesterName}},

Thank you for reaching out about ticket #{{ticketId}}.

I''ve reset your password as requested. Your temporary password is: (Temp Password).

Please try logging in and update your password immediately.

If you continue to have issues with {{ticketDetails}}, let me know.

Best regards,
{{agentName}}
GigitekAI Support', 
'account_access', 0, NULL, NOW(), NOW()),

('Account Access / Permission Issue',
'Hello {{requesterName}},

Thank you for ticket #{{ticketId}}.

I have granted/updated access to {{specificResource}}. You should now be able to access the requested resources.

Please let me know if you''re still unable to see {{ticketDetails}}.

Best,
{{agentName}}',
'account_access', 0, NULL, NOW(), NOW()),

('General Acknowledgment',
'Hi {{requesterName}},

Thank you for contacting us regarding ticket #{{ticketId}}.

We have received your request about {{ticketDetails}} and are currently looking into it. You can expect an update by {{responseTime}}.

Thank you for your patience.

Kind regards,
{{agentName}}',
'general_support', 0, NULL, NOW(), NOW()),

('Feature Request',
'Hello {{requesterName}},

Thank you for your suggestion in ticket #{{ticketId}}.

Your request to {{featureDetails}} has been logged with our Product team.

We''ll reach out if we need more information about {{ticketDetails}}.

Best regards,
{{agentName}}
Product & Support',
'feature_request', 0, NULL, NOW(), NOW()),

('Bug Report',
'Hi {{requesterName}},

Thank you for reporting this in ticket #{{ticketId}}.

We have reproduced the issue with {{ticketDetails}} and escalated it to engineering (Bug Ref: {{bugRef}}).

We''ll keep you updated on the resolution timeline.

Appreciate your help!

Best,
{{agentName}}',
'bug_report', 0, NULL, NOW(), NOW()),

('How-To / Guidance Request',
'Hello {{requesterName}},

Thanks for ticket #{{ticketId}}.

Here''s how to resolve {{ticketDetails}}:

1. Go to (Location in App)
2. Click (Button/Tab)
3. Select (Option)

Let me know if this helps or if you need further assistance.

Best regards,
{{agentName}}',
'general_support', 0, NULL, NOW(), NOW()),

('Billing / Subscription Inquiry',
'Hi {{requesterName}},

Thank you for your question on ticket #{{ticketId}} regarding {{ticketDetails}}.

Your current plan is {{planName}}, renewing on (Renewal Date).

Would you like me to {{actionRequested}}?

Let me know how you''d like to proceed.

Best,
{{agentName}}',
'billing', 0, NULL, NOW(), NOW()),

('Performance / Slow Response',
'Hello {{requesterName}},

We''re sorry you''re experiencing issues with ticket #{{ticketId}} related to {{ticketDetails}}.

Our team is investigating. In the meantime, please try:
• Clearing browser cache
• Using Incognito mode
• Switching networks

We''ll update you soon regarding the issue.

Thank you for your patience.

Best regards,
{{agentName}}',
'general_support', 0, NULL, NOW(), NOW()),

('Cancellation Request',
'Hi {{requesterName}},

Thank you for ticket #{{ticketId}} about cancellation.

I''ve processed your request. Your subscription will end on {{cancellationDate}}.

You''ll retain access until then. Is there anything related to {{ticketDetails}} we could have improved?

Wishing you the best,

{{agentName}}
GigitekAI Support',
'billing', 0, NULL, NOW(), NOW()),

('Urgent / Escalation',
'Hello {{requesterName}},

Thank you for your urgent ticket #{{ticketId}} about {{ticketDetails}}.

This has been escalated to our senior team. {{seniorName}} will contact you shortly.

In the meantime, please provide any additional information about {{extraDetails}} if available.

We''re working on it!

Best regards,
{{agentName}}',
'general_support', 0, NULL, NOW(), NOW());
