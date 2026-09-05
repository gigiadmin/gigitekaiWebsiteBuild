# GigitekAI Daily Insights Schedule

## Production Job

- **Job name:** `daily-gigitekai-insights`
- **Task UID:** `HVrjZbLTYJHyhbKPq9LAmL`
- **Callback:** `POST /api/scheduled/daily-insights`
- **Cron:** `0 0 13 * * *` (13:00 UTC daily; 9:00 AM Eastern during daylight-saving time)
- **Authentication:** Platform cron identity; non-cron requests receive HTTP 403
- **Duplicate control:** `ai_news_last_run_date` persists the successful Eastern date and prevents a second daily publication

## Recovery Verification

- Immediate verification run completed successfully on September 5, 2026.
- Scheduler response: HTTP 200 in 1.747 seconds.
- Published post: `https://gigitekai.com/blog/daily-recap-2026-09-05`
- Public blog API lists the recovered slug.
- Next scheduled execution after restoration: September 6, 2026 at 13:00 UTC.

## Operations

Use the project scheduler management interface or the sandbox command-line utility to inspect, pause, resume, update, or review this job. Preserve the task UID when changing the schedule. The scheduled endpoint must remain deployed before schedule changes are tested.

The previous in-process AI News and daily blog timers were removed from server startup because application instances may stop or restart between executions. The durable callback is now the authoritative daily publishing path.
