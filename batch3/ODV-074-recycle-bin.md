# OneDrive Recycle Bin Recovery

**Category:** OneDrive > Recovery
**Article Code:** ODV-074
**Tier:** 1
**Audience:** Administrators / Technicians
**Estimated Resolution Time:** 5-20 minutes (up to 30 minutes for PowerShell-based restores)

## Symptoms / When to Use

- A user reports files or folders missing from their OneDrive.
- Content was accidentally deleted and needs recovery within the retention window.
- Items are not in the first-stage recycle bin because the bin was emptied.
- An entire OneDrive is missing after the user account was deleted.
- A large number of files were changed or deleted at once (for example, a sync error or ransomware event).

## Background

OneDrive for work or school accounts uses a **two-stage recycle bin**:

- **First-stage recycle bin** — visible to the user. Deleted items land here.
- **Second-stage recycle bin** — visible only to site collection administrators. Items purged from the first stage (or emptied by the user) move here.

A single **93-day** retention window spans both stages for work/school accounts (personal Microsoft accounts retain deleted items for **30 days**). After 93 days, items are permanently deleted from wherever they reside. The recycle bin is not indexed, so eDiscovery search cannot locate its content.

Separately, **Files Restore** can roll an entire OneDrive back to any point in the last **30 days**, and a **deleted user's OneDrive** is retained (default 30 days, then a 93-day deleted state) and can be restored by a SharePoint Administrator via PowerShell.

## Resolution

### Step 1: Restore from the first-stage recycle bin

Have the user (or sign in as them) go to the OneDrive web app.

1. Browse to `https://<tenant>-my.sharepoint.com` and sign in.
2. In the left navigation, select **Recycle bin**.
3. Point to each item and select the circle check box, then select **Restore**. Files return to their original location.

To restore many items at once, scroll to the last item, hold **Shift**, and select it to select the full range, then **Restore**. Bulk restore is more reliable from the web than from a synced client.

### Step 2: Check the second-stage recycle bin

If the item is not in the first-stage bin, it may have been purged to the second stage.

1. At the bottom of the recycle bin page, select **Can't find what you're looking for? Check the Second-stage recycle bin**.
2. Highlight the item and select **Restore**. The item returns to the first-stage recycle bin (restore again there if needed) or its original location.

The second-stage bin requires site collection administrator rights on the OneDrive. If the technician lacks access, grant it in Step 4.

### Step 3: Use Files Restore for bulk or point-in-time recovery

For mass deletions or corruption, restore the whole OneDrive to a prior state.

1. In the OneDrive web app, select the **Settings** gear, then **Restore your OneDrive**.
2. Use the date drop-down or drag across the activity histogram to pick a restore point within the last 30 days.
3. Confirm to roll back all changes after that point.

### Step 4: Restore a deleted user's OneDrive (PowerShell)

If the user was deleted more than 30 days ago they no longer appear in the Microsoft 365 admin center, and the OneDrive must be restored with the SharePoint Online Management Shell.

Connect as a SharePoint Administrator:

```powershell
Connect-SPOService -Url https://<tenant>-admin.sharepoint.com
```

Confirm the OneDrive is available for restore (URL is based on the UPN):

```powershell
Get-SPODeletedSite -Identity https://<tenant>-my.sharepoint.com/personal/user1_contoso_com
```

If you do not know the URL, list deleted personal sites:

```powershell
Get-SPODeletedSite -IncludeOnlyPersonalSite | FT url
```

Restore the OneDrive to an active state:

```powershell
Restore-SPODeletedSite -Identity https://<tenant>-my.sharepoint.com/personal/user1_contoso_com
```

Assign an administrator so you can access the data:

```powershell
Set-SPOUser -Site https://<tenant>-my.sharepoint.com/personal/user1_contoso_com -LoginName admin@contoso.com -IsSiteCollectionAdmin $True
```

Recover the needed files via the browser, then reassign or clean up the site per policy.

## Troubleshooting

- **"Items could not be restored" on multi-select:** Restore from the OneDrive web recycle bin (not the sync client) and use Shift-select; restoring one at a time also works.
- **Item is in neither bin:** If more than 93 days have passed it is permanently deleted. Check for a Microsoft Purview retention policy or eDiscovery hold — held content may sit in the **Preservation Hold library** and be recoverable there.
- **`Restore-SPODeletedSite` fails:** A site may already exist at that URL, or the deletion exceeded the 93-day deleted-state window. Confirm with `Get-SPODeletedSite` first.
- **Restore succeeds but the user cannot see files:** Verify permissions were reassigned (Step 4) and that the user account is licensed and active.

## Prevention

- Deploy **Known Folder Move** so Desktop, Documents, and Pictures sync to OneDrive automatically.
- Configure Microsoft Purview **retention policies** to preserve OneDrive content beyond the default recycle bin window.
- Set the **default file retention for deleted OneDrive users** in the SharePoint admin center to align with your data-retention SLA.
- Educate users that emptying the recycle bin moves items to the admin-only second stage, not permanent deletion — but only within 93 days.
- Monitor for mass-deletion events and act quickly, since the retention clock starts at deletion.

**Tags:** onedrive, recycle-bin, second-stage, files-restore, restore-spodeletedsite, sharepoint-online-management-shell, deleted-user, retention, data-recovery
