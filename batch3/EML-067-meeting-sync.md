# Outlook Meeting and Calendar Sync Problems

**Category:** Email > Calendar
**Article Code:** EML-067
**Tier:** 1
**Audience:** Technicians (with Exchange admin escalation)
**Estimated Resolution Time:** 20-45 minutes

Quick fixes for classic Outlook (Windows) desktop calendars that fall out of sync with the Exchange Online mailbox. Most cases resolve at the client with a rebuilt offline cache or a cleared calendar view.

## Symptoms / When to Use

- Meetings appear in Outlook on the web (OWA) but are missing from the classic Outlook desktop client, or vice versa.
- Accepted meetings do not land on the calendar, or declined/canceled meetings still show.
- Duplicate calendar items or stale reminders that keep reappearing.
- Recurring meetings show wrong times or the wrong time zone for one attendee.
- Free/busy shows incorrect availability; delegates can't see calendar changes.
- Mobile (Exchange ActiveSync) calendar is out of sync with the mailbox.

## Background

Classic Outlook works from a cached local copy of the mailbox (the `.ost` file). Calendar sync issues usually come from a corrupted `.ost`, a damaged calendar view or navigation pane, corrupted individual calendar items (bad global object IDs, missing required properties), or a stale free/busy message. Because OWA reads the mailbox directly on the server, "OWA is correct but Outlook is wrong" almost always points at the local cache or view — not the server data. Server-side item corruption and delegate/free-busy problems are the exceptions and require Exchange Online PowerShell.

## Resolution

### Step 1: Confirm where the data is correct

Have the user check the same meeting in OWA (`https://outlook.office.com`). If the item is correct in OWA but wrong in the desktop client, treat it as a client-side cache/view problem (Steps 2-4). If it's wrong in OWA too, the item is corrupt server-side — go to Step 5.

### Step 2: Rebuild the offline cache (.ost)

Clearing offline items forces a fresh download from the server and fixes most single-calendar sync gaps. In classic Outlook, right-click the affected calendar and select **Properties** > **Clear Offline Items** > **OK**, then force a resync:

```text
Send / Receive tab  >  Update Folder
```

If the whole profile is out of sync, close Outlook and rename the `.ost` (Outlook rebuilds it on next launch):

```cmd
ren "%LOCALAPPDATA%\Microsoft\Outlook\*.ost" *.ost.old
```

### Step 3: Reset corrupted views and navigation pane

Corrupted calendar views cause missing or misrendered items. Close Outlook, then run each switch (Start > Run, or the search box):

```cmd
outlook.exe /cleanviews
outlook.exe /resetnavpane
```

Note: after `/resetnavpane` you must re-add any previously opened shared calendars.

### Step 4: Fix stuck reminders

If reminders can't be dismissed or keep reappearing, close Outlook and run:

```cmd
outlook.exe /cleanreminders
```

### Step 5: Repair a server-side corrupt item (admin)

If the item is wrong in OWA, pull the calendar diagnostic logs from Exchange Online PowerShell to identify the bad item. In cloud mailboxes use `Get-CalendarDiagnosticObjects` (the on-premises `Get-CalendarDiagnosticLog` does **not** work against Exchange Online):

```powershell
Connect-ExchangeOnline
Get-CalendarDiagnosticObjects -Identity "user@contoso.com" -Subject "Weekly Sync" |
    Export-Csv "C:\Temp\caldiag.csv" -NoTypeInformation
```

The `CleanGlobalObjectID` column identifies the meeting. Have the organizer cancel and re-create the offending meeting to regenerate clean properties; attendees should ask the organizer to do so.

## Troubleshooting

- **Meetings still missing after cache rebuild:** run the Outlook Calendar diagnostic (SaRA-based CalCheck) to scan for corrupt items. Download from `https://aka.ms/sara-calcheck`, run `SetupProd_CalCheck.exe`; the scan starts automatically. On the classic standalone tool the equivalent is `calcheck -f -r` (moves flagged items to a CalCheck folder and mails a report). CalCheck only works with Exchange accounts, not IMAP/POP.
- **Free/busy or delegate data wrong:** the `/cleanfreebusy` switch was removed in Outlook 2016+ — use `outlook.exe /cleanroamedprefs`, or reset delegates server-side:

  ```powershell
  Remove-MailboxFolderPermission -Identity "user@contoso.com:\Calendar" -ResetDelegateUserCollection
  Add-MailboxFolderPermission -Identity "user@contoso.com:\Calendar" -User "delegate@contoso.com" -SharingPermissionFlag Delegate
  ```

- **Mobile calendar out of sync:** the ActiveSync partnership is likely corrupt. Remove the device relationship from the phone and from the mailbox, restart the device, then re-add the account.
- **Wrong time zone for one attendee only:** the attendee's stored work-hours/time-zone item is corrupt — escalate for an MFCMAPI reset of the `IPM.FlexibleWorkingHours` items.

## Prevention

- Keep classic Outlook and Windows fully patched; many calendar sync bugs are fixed in Click-to-Run updates.
- Discourage third-party calendar/meeting add-ins, which frequently corrupt items on write.
- Have organizers manage recurring series from a single client, and keep recurring series under ~1,300 occurrences (Outlook's hard limit).
- Prefer OWA or new Outlook as the source of truth when reconciling discrepancies.

**Tags:** outlook, calendar, meetings, sync, exchange-online, ost, calcheck, free-busy, activesync, delegates
