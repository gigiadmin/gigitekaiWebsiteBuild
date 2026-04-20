-- GigitekAI Production Database Cleanup
-- Removes all test data from production database
-- Run with caution - this is irreversible!

-- Delete all ticket activity records
DELETE FROM ticketActivity;

-- Delete all ticket replies
DELETE FROM ticketReplies;

-- Delete all support tickets
DELETE FROM supportTickets;

-- Delete all real-time chat messages
DELETE FROM realtimeChatMessages;

-- Delete all real-time chat sessions
DELETE FROM realtimeChatSessions;

-- Delete all user sessions
DELETE FROM userSessions;

-- Verify cleanup
SELECT 
  (SELECT COUNT(*) FROM supportTickets) as ticket_count,
  (SELECT COUNT(*) FROM ticketReplies) as reply_count,
  (SELECT COUNT(*) FROM ticketActivity) as activity_count,
  (SELECT COUNT(*) FROM realtimeChatMessages) as message_count,
  (SELECT COUNT(*) FROM realtimeChatSessions) as session_count,
  (SELECT COUNT(*) FROM userSessions) as user_session_count;
