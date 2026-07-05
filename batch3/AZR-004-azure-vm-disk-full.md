# Azure VM Disk Full — Diagnosing and Resolving Low or Exhausted Disk Space

**Category:** Azure > Compute
**Article Code:** AZR-004
**Tier:** 2
**Audience:** Administrators / Technicians
**Estimated Resolution Time:** 20–45 minutes

## Symptoms / When to Use

Use this article when an Azure Virtual Machine reports low or full disk space. Typical signals:

- Applications or services fail to start, or the VM becomes unresponsive.
- Windows event logs show "There is not enough space on the disk."
- Linux commands report "No space left on device" (`ENOSPC`).
- Azure Monitor "OS Disk / Data Disk % Free Space" alerts fire.
- Users cannot save files; logs stop being written; SQL/IIS/app pools crash.

## Background

Azure VMs use managed disks with a **fixed provisioned size**. The OS disk and each data disk are separate volumes with independent capacity. Running out of space happens for a few recurring reasons: unbounded log growth, Windows Update/component store bloat, temp files, database/transaction-log growth, or a volume that was simply provisioned too small for its workload. Because managed disks do not auto-expand, resolution is either **reclaiming space** inside the guest OS or **growing the disk** at the Azure platform level and then extending the partition inside the OS.

## Resolution

### Step 1: Identify which disk is full

**Windows (in the VM):**
```powershell
Get-Volume | Sort-Object SizeRemaining | Format-Table DriveLetter, FileSystemLabel, `
  @{N='Size(GB)';E={[math]::Round($_.Size/1GB,1)}}, `
  @{N='Free(GB)';E={[math]::Round($_.SizeRemaining/1GB,1)}}
```

**Linux (in the VM):**
```bash
df -h            # human-readable free space per filesystem
sudo du -xh / --max-depth=1 2>/dev/null | sort -rh | head -20   # biggest top-level dirs
```

### Step 2: Reclaim space inside the guest OS (do this first)

Reclaiming is faster and cheaper than resizing. Common wins:

**Windows:**
```powershell
# Clear Windows Update / component store bloat
Dism.exe /online /Cleanup-Image /StartComponentCleanup
# Purge temp files
Remove-Item "$env:TEMP\*","C:\Windows\Temp\*" -Recurse -Force -ErrorAction SilentlyContinue
# Find the largest files on C:
Get-ChildItem C:\ -Recurse -File -ErrorAction SilentlyContinue |
  Sort-Object Length -Descending | Select-Object FullName,
  @{N='GB';E={[math]::Round($_.Length/1GB,2)}} -First 20
```
Also check IIS logs (`C:\inetpub\logs`), SQL backups/`.ldf` files, and `C:\Windows\Minidump`.

**Linux:**
```bash
sudo journalctl --vacuum-size=200M        # trim systemd journal
sudo apt-get clean || sudo yum clean all  # package cache
# Find files >500MB
sudo find / -xdev -type f -size +500M -exec ls -lh {} \; 2>/dev/null
```

### Step 3: If reclaiming isn't enough, grow the managed disk

Expanding a disk requires the VM to be **deallocated** (stopped) for OS disks; data disks on many VM sizes support online resize, but stopping is the safe default. **You cannot shrink a managed disk** — only grow.

```bash
# Azure CLI — resize the OS or data disk (VM should be stopped/deallocated)
az vm deallocate --resource-group <rg> --name <vm>
az disk update --resource-group <rg> --name <disk-name> --size-gb 256
az vm start --resource-group <rg> --name <vm>
```

### Step 4: Extend the partition inside the OS

Growing the Azure disk does **not** grow the partition — the OS still sees the old size until you extend it.

**Windows:**
```powershell
$drive = "C"
$size = (Get-PartitionSupportedSize -DriveLetter $drive)
Resize-Partition -DriveLetter $drive -Size $size.SizeMax
```

**Linux (example for /dev/sda1):**
```bash
sudo growpart /dev/sda 1
sudo resize2fs /dev/sda1     # ext4;  use xfs_growfs /mountpoint for XFS
```

### Step 5: Verify

Re-run `Get-Volume` / `df -h` and confirm free space. Restart any services that failed, and clear the Azure Monitor alert once metrics recover.

## Troubleshooting

- **Resize-Partition shows no extra space:** confirm the disk resize completed in Azure and that Windows sees the new size in Disk Management (rescan disks).
- **XFS vs ext4:** use `xfs_growfs` for XFS root volumes; `resize2fs` only works on ext2/3/4.
- **Temp disk confusion:** the ephemeral temp disk (`D:` on Windows, `/mnt` on Linux) is **not** persistent — never store data there expecting it to survive deallocation.
- **Data disk online resize fails:** some VM sizes require a stop/deallocate; deallocate and retry.

## Prevention

- Set Azure Monitor alerts on **% Free Space** at 20% and 10% thresholds.
- Redirect application/IIS/SQL logs to a dedicated, right-sized data disk with log rotation.
- Enable log rotation (`logrotate` on Linux; scheduled cleanup on Windows).
- Right-size disks at deployment and review growth quarterly.
- Schedule `StartComponentCleanup` and temp cleanup as a recurring task.

**Tags:** azure, virtual machine, disk full, managed disk, resize, storage, powershell
