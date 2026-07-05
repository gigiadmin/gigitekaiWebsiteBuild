# Teams Meeting Breakout Rooms Not Working

**Category:** Teams > Meetings
**Article Code:** TMS-078
**Tier:** 2
**Audience:** Administrators / Technicians (with end-user guidance)
**Estimated Resolution Time:** 15-45 minutes (plus up to 24 hours for policy propagation)

## Symptoms / When to Use

Use this article when an organizer reports one or more of the following:

- The **Rooms** (breakout rooms) icon is missing from the meeting control bar during a live meeting.
- The **Breakout rooms** option does not appear under **More options** when editing a scheduled meeting.
- Breakout rooms can be created but cannot be **opened**, or participants are not moved into their assigned rooms.
- A presenter cannot be appointed as a **breakout room manager**, or the appointed manager sees no controls.
- Pre-assignment of participants is unavailable ("Assign participants" greyed out).
- The feature works for some organizers but not others in the same tenant.
- Breakout rooms are missing after the organizer joined from Teams web, a mobile device, or a Teams Room.

## Background

Breakout rooms are gated at three layers. A failure at any layer produces the symptoms above:

1. **Tenant policy.** The `CsTeamsMeetingPolicy` assigned to the **organizer** controls availability via the `AllowBreakoutRooms` parameter (Boolean, default `True`). The policy that matters is the organizer's, not the attendee's. If the organizer holds a custom or restricted policy with the setting disabled, no one in that meeting gets breakout rooms.
2. **Client and role.** Only a **meeting organizer, co-organizer, or an appointed breakout room manager** can create and manage rooms. Managers must be a **presenter in the organizer's own organization** — external/guest presenters cannot be made managers. Creation and management require **Teams on desktop** (Windows or macOS). The Teams web client and mobile apps can *participate* in rooms but cannot create or manage them.
3. **Meeting state.** Pre-meeting configuration only surfaces **after meeting invites have been sent**. Automatic participant assignment must be done up front — you cannot switch to automatic assignment later in the meeting.

Policy changes are not instant. Assignment of a Teams meeting policy typically applies within a few hours but can take **up to 24 hours** to fully propagate. The affected user must also fully restart Teams to pick up the change.

## Resolution

Work top-down: confirm the organizer's policy first, then role/client, then meeting configuration.

### Step 1: Connect to Microsoft Teams PowerShell

Install (once) and connect using the MicrosoftTeams module.

```powershell
Install-Module -Name MicrosoftTeams -Scope CurrentUser -Force
Connect-MicrosoftTeams
```

### Step 2: Identify the policy assigned to the organizer

Breakout room availability follows the organizer. Confirm which meeting policy that user holds.

```powershell
Get-CsUserPolicyAssignment -Identity "organizer@contoso.com" -PolicyType TeamsMeetingPolicy
```

If no per-user policy is returned, the user inherits the **Global (Org-wide default)** policy.

### Step 3: Check the AllowBreakoutRooms setting on that policy

Inspect the specific policy identified in Step 2 (replace `Global` with the policy name if a custom one is assigned).

```powershell
Get-CsTeamsMeetingPolicy -Identity "Global" | Select-Object Identity, AllowBreakoutRooms
```

`AllowBreakoutRooms` must be `True`. If it is `False`, continue to Step 4.

### Step 4: Enable breakout rooms on the policy

Update the policy in place. This affects every user assigned to it.

```powershell
Set-CsTeamsMeetingPolicy -Identity "Global" -AllowBreakoutRooms $true
```

If you must not change a shared policy for all its users, create a dedicated policy instead:

```powershell
New-CsTeamsMeetingPolicy -Identity "Allow-BreakoutRooms" -AllowBreakoutRooms $true
```

### Step 5: Assign the policy to the affected organizer

Only needed if you created a new policy in Step 4.

```powershell
Grant-CsTeamsMeetingPolicy -Identity "organizer@contoso.com" -PolicyName "Allow-BreakoutRooms"
```

To roll the change out to a group rather than individual users, use group-based assignment:

```powershell
New-CsGroupPolicyAssignment -GroupId "<group-object-id>" -PolicyType TeamsMeetingPolicy -PolicyName "Allow-BreakoutRooms" -Rank 1
```

### Step 6: Confirm the effective assignment and have the user restart Teams

```powershell
Get-CsUserPolicyAssignment -Identity "organizer@contoso.com" -PolicyType TeamsMeetingPolicy
```

Instruct the organizer to fully quit Teams (right-click the tray icon > **Quit**, not just close the window) and relaunch. Allow up to 24 hours if the icon still does not appear.

### Step 7: Verify the portal setting (GUI alternative)

If you prefer the admin center or need to confirm PowerShell changes landed:

1. Go to the [Teams admin center](https://admin.teams.microsoft.com/).
2. Navigate to **Meetings** > **Meeting policies**.
3. Open the policy assigned to the organizer.
4. Under **Meeting engagement**, confirm **Breakout rooms** is **On**.
5. Select **Save**.

### Step 8: Validate the meeting-level configuration

Have the organizer confirm the client-side prerequisites:

- They are joined on **Teams desktop** (Windows/macOS), signed in as the organizer or co-organizer.
- For pre-meeting setup, the meeting **invites have already been sent** — open the event > **More options** > **Breakout rooms**.
- To delegate, the intended manager is a **presenter within the organization**; then in the meeting select **Rooms** > **Rooms settings** > enable **Assign presenters to manage rooms**.

## Troubleshooting

**Icon present but rooms won't open.** Only **one** breakout room manager can control the rooms at a time. If a manager was appointed, the organizer must select **Rooms** > **Manage rooms** to take control back. Rooms also cannot open before the meeting has actually started.

**Participants aren't auto-moved into rooms.** Check **Rooms settings** > **Automatically move people to rooms**. When off, participants must click **Join** manually. When a time limit is set with auto-move off, participants choose whether to rejoin the main meeting.

**Cannot pre-assign or automatically assign later.** Automatic assignment is only offered at creation and only when invites were sent beforehand. If the meeting is already running without it, assign participants manually instead.

**Manager appointment fails.** The user must be an in-tenant **presenter** first (Meeting options > **Who can present**). External participants and guests are ineligible regardless of role.

**Works for one organizer, not another.** The two organizers hold different meeting policies. Re-run Steps 2-3 for the failing user; they are almost certainly on a policy with `AllowBreakoutRooms = $false`.

**Feature vanished mid-rollout.** Confirm the change wasn't overwritten by a **group policy assignment** with higher rank. Review effective assignment:

```powershell
Get-CsUserPolicyAssignment -Identity "organizer@contoso.com" -PolicyType TeamsMeetingPolicy
```

Direct (per-user) assignments win over group assignments; a stray group assignment can still confuse expectations if no direct assignment exists.

**Teams Room / web / mobile organizer.** These endpoints can join breakout rooms but cannot create or manage them. The organizer must manage from a desktop client, or appoint a desktop-based co-organizer/manager.

**Policy shows correct but UI still wrong.** Clear the Teams client cache after confirming the policy, then relaunch. Cached policy is a common cause of a correct backend setting not reflecting in the client.

## Prevention

- Keep `AllowBreakoutRooms = $true` in the **Global** policy unless a business reason requires disabling it, so the default experience is consistent.
- When restricting features, restrict narrowly with a dedicated policy rather than editing the Global policy that most users inherit.
- Standardize on **group-based policy assignment** for meeting policies so new hires inherit the correct settings automatically.
- Document that breakout room **creation/management is desktop-only** in end-user meeting guidance to cut ticket volume.
- Remind organizers to **send invites before** configuring rooms and to appoint co-organizers so meetings aren't dependent on a single host.
- After any meeting-policy change, note the up-to-24-hour propagation window in the ticket to set correct expectations.

**Tags:** teams, breakout-rooms, meetings, CsTeamsMeetingPolicy, AllowBreakoutRooms, meeting-policy, powershell, teams-admin-center, co-organizer, troubleshooting
