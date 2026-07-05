# Teams Channel Moderation and Posting Permissions

**Category:** Teams > Channels
**Article Code:** TMS-068
**Tier:** 2
**Audience:** Administrators / Technicians (with team owner / end-user guidance)
**Estimated Resolution Time:** 15–30 minutes per channel; 30–60 minutes for a scripted rollout across multiple teams

## Symptoms / When to Use

- A team owner wants an **announcements-only** channel where members can read but not start new posts.
- Members are replying to broadcast posts that should be read-only (e.g., leadership updates, incident notifications).
- Guests are posting in a channel that should be restricted to internal staff.
- A connector or bot must be the only source of new posts (e.g., a live-site/monitoring channel), and human members should not start threads.
- A class or training team needs only instructors/moderators to open new discussions.
- You need to standardize posting permissions across many channels/teams programmatically rather than clicking through each one.
- A user reports "I can't start a new conversation in this channel" and you need to confirm whether moderation is the cause.

## Background

By default, standard (non-private) channels are **unmoderated**: any team member can start posts, reply, and react. Team owners can enable moderation to control who starts new posts and whether members may reply.

Two independent controls exist:

1. **Who can start a new post** — mapped to the Graph property `userNewMessageRestriction`, with values `everyone`, `everyoneExceptGuests`, or `moderators`.
2. **Reply and submission permissions** — mapped to `replyRestriction` (`everyone` or `authorAndModerators`), plus `allowNewMessageFromBots` and `allowNewMessageFromConnectors`.

When moderation is turned **On**, only moderators can start new posts. **Team owners are moderators by default and cannot be removed.** Owners can promote members to moderator; moderators can add or remove other moderators within that channel.

Important scope limits:

- Moderation applies to **standard channels only**. It is **not available for the General channel or private channels**.
- Configuration is done from the **Teams desktop or web client** (Manage channel), or via **Microsoft Graph / Graph PowerShell**.
- The `MicrosoftTeams` PowerShell module's `Set-TeamChannel` cmdlet only updates a channel's display name and description — it does **not** expose moderation settings. Use the Graph route below for scripting.

## Resolution

### Step 1: Exclude guests without full moderation (owner, GUI)

This is the lightest control and does not require turning moderation on.

1. Open the channel in Teams (desktop or web).
2. Select **More options (…)** next to the channel name > **Manage channel**.
3. Under **Who can start a new post?**, select **Everyone except guests can start a new post**.

Members and owners can still post; guests are blocked from starting new posts.

### Step 2: Turn on moderation for an announcements-style channel (owner, GUI)

1. In the channel, select **More options (…)** > **Manage channel**.
2. Under **Channel moderation**, select **On**. Only moderators can now start new posts.
3. Under **Who are the moderators?**, select **Manage**, then add or remove team members as moderators. Owners are always moderators.
4. Under **Team member permissions**, set the checkboxes for what non-moderators may do:
   - Allow members to **reply** to channel messages (clear this for a true read-only announcements channel).
   - Allow members to **pin** channel messages.
   - Allow **bots** to submit channel messages.
   - Allow **connectors** to submit channel messages.

### Step 3: Configure moderation at scale with Graph PowerShell

For bulk or repeatable configuration, use the **Microsoft.Graph.Beta.Teams** module. The moderation properties are exposed by `Update-MgBetaTeamChannel` through the `moderationSettings` object.

Install and connect with a delegated scope that can write channel settings:

```powershell
Install-Module Microsoft.Graph.Beta.Teams -Scope CurrentUser

Connect-MgGraph -Scopes "ChannelSettings.ReadWrite.All"
```

Resolve the team (group) ID and channel ID you want to modify:

```powershell
# Find the team by display name
$team = Get-MgGroup -Filter "displayName eq 'Company Announcements'"
$teamId = $team.Id

# List channels to grab the target channel's Id
Get-MgTeamChannel -TeamId $teamId | Select-Object DisplayName, Id
$channelId = (Get-MgTeamChannel -TeamId $teamId `
    -Filter "displayName eq 'Announcements'").Id
```

Apply moderation so only moderators post, members may still reply, and connectors/bots are allowed:

```powershell
Import-Module Microsoft.Graph.Beta.Teams

$params = @{
    moderationSettings = @{
        userNewMessageRestriction     = "moderators"
        replyRestriction              = "everyone"
        allowNewMessageFromBots       = $true
        allowNewMessageFromConnectors = $true
    }
}

Update-MgBetaTeamChannel -TeamId $teamId -ChannelId $channelId `
    -BodyParameter $params
```

For a strict read-only announcements channel (no member replies), set `replyRestriction` to `authorAndModerators`:

```powershell
$params = @{
    moderationSettings = @{
        userNewMessageRestriction     = "moderators"
        replyRestriction              = "authorAndModerators"
        allowNewMessageFromBots       = $false
        allowNewMessageFromConnectors = $false
    }
}

Update-MgBetaTeamChannel -TeamId $teamId -ChannelId $channelId `
    -BodyParameter $params
```

To exclude guests only (moderation effectively off, but guests blocked from new posts):

```powershell
$params = @{
    moderationSettings = @{
        userNewMessageRestriction = "everyoneExceptGuests"
        replyRestriction          = "everyone"
    }
}

Update-MgBetaTeamChannel -TeamId $teamId -ChannelId $channelId `
    -BodyParameter $params
```

To turn moderation **off** and restore default open posting, set `userNewMessageRestriction` back to `everyone`.

### Step 4: Provision a new channel with moderation baked in

When creating channels programmatically, set moderation at creation time with `New-MgBetaTeamChannel`:

```powershell
$params = @{
    displayName               = "Announcements"
    description               = "Read-only company announcements"
    membershipType            = "standard"
    moderationSettings = @{
        userNewMessageRestriction     = "moderators"
        replyRestriction              = "authorAndModerators"
        allowNewMessageFromBots       = $true
        allowNewMessageFromConnectors = $true
    }
}

New-MgBetaTeamChannel -TeamId $teamId -BodyParameter $params
```

### Step 5: Verify the applied settings

Confirm the change either in the client (**Manage channel** should now reflect the new state) or by reading the channel back through Graph and inspecting the moderation object.

```powershell
$channel = Get-MgBetaTeamChannel -TeamId $teamId -ChannelId $channelId
$channel.ModerationSettings | Format-List
```

## Troubleshooting

- **No "Channel moderation" option appears.** Confirm the channel is a **standard** channel. Moderation controls are hidden for the **General** channel and **private/shared** channels by design.
- **"Manage channel" is not visible or is read-only.** Only **team owners** (or existing channel moderators) can change moderation. Members see a read-only view. Verify the user's team role.
- **PowerShell error: parameter `-ModerationSettings` / property not recognized.** You are likely using the wrong module. Moderation properties are documented on the **beta** cmdlets (`Update-MgBetaTeamChannel`, `New-MgBetaTeamChannel`) in **Microsoft.Graph.Beta.Teams**. The `MicrosoftTeams` module's `Set-TeamChannel` does not support moderation — it only renames a channel or sets its description.
- **`Connect-MgGraph` succeeds but the update returns 403 / Forbidden.** The signed-in account needs `ChannelSettings.ReadWrite.All` (delegated) plus effective rights over the team (team owner). For app-only automation, grant `ChannelSettings.ReadWrite.Group` or `ChannelSettings.ReadWrite.All` and admin-consent it.
- **Changes don't appear immediately in the client.** Teams caches channel state. Have the user refresh, or fully restart the client. Propagation can lag a few minutes.
- **Guests can still post after selecting "Everyone except guests."** Confirm the user is actually a guest (external) identity and not a member. Also confirm tenant-level guest access is enabled/consistent; a member account added via B2B may still resolve as a member.
- **Members can't reply after moderation is on.** That is expected when `replyRestriction = authorAndModerators` (or the "Allow members to reply" checkbox is cleared). Re-enable replies if the intent was announcements with discussion.

## Prevention

- **Standardize with templates.** Define a small set of channel profiles (open, guests-excluded, announcements-only, connector-driven) and apply them with the Step 3 scripts so behavior is consistent across teams.
- **Assign at least two moderators** per moderated channel. Owners are moderators by default, but naming explicit backups prevents a single point of failure if an owner leaves.
- **Document the intent** in the channel description (e.g., "Announcements — replies disabled") so members understand why they can't post.
- **Review periodically.** Include moderated channels in quarterly Teams governance reviews to confirm the moderator list and restrictions still match business need.
- **Prefer beta cmdlets deliberately.** Moderation properties currently live in the Microsoft Graph beta surface; pin the `Microsoft.Graph.Beta.Teams` module version in your automation and retest after upgrades, since beta APIs can change.
- **Test on a pilot team first** before a tenant-wide rollout, and validate both the owner GUI view and the end-user experience.

**Tags:** teams, channels, moderation, posting-permissions, announcements, microsoft-graph, powershell, update-mgbetateamchannel, moderationsettings, governance
