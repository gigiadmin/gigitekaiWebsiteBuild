import 'dotenv/config';
import mysql from 'mysql2/promise';

const articles = [
  // ===== WINDOWS (WIN-001 to WIN-014) =====
  {
    code: 'WIN-001',
    title: 'Entra ID / Intune Device Sync and Policy Compliance Failure',
    category: 'Windows',
    subcategory: 'Device Management',
    audience: 'admin',
    difficulty: 'advanced',
    severity: 'high',
    tags: 'windows,intune,entra-id,mdm,compliance,device-management',
    estimatedResolutionTime: '30-45 min',
    symptoms: 'Device out of compliance blockages on conditional access policies; configuration profiles, security baselines, or application deployments fail to sync or report status back to the Intune portal.',
    cause: 'Stale local MDM enrollment tokens, corruption within the local enrollment device registry keys, or out-of-sync machine identity certificates inside the local machine store.',
    steps: [
      'Open Command Prompt as Administrator and run `dsregcmd /status` to verify `AzureAdJoined` is set to YES.',
      'Force an immediate Intune policy evaluation cycle: Get-ScheduledTask -TaskName "PushLaunch" -TaskPath "\\Microsoft\\Windows\\EnterpriseManagement\\*" | Start-ScheduledTask',
      'If enrollment states are corrupted, navigate to Registry Editor: HKLM\\SOFTWARE\\Microsoft\\Enrollments. Identify and delete the GUID subkey linked to the Intune enrollment.',
      'Force a silent re-enrollment: C:\\Windows\\system32\\deviceenroller.exe /c /mobiledeviceenrollment'
    ]
  },
  {
    code: 'WIN-002',
    title: 'User Profile Service Failed the Sign-In (Local Profile Corruption)',
    category: 'Windows',
    subcategory: 'User Profiles',
    audience: 'admin',
    difficulty: 'intermediate',
    severity: 'high',
    tags: 'windows,profile,corruption,ntuser,registry,sign-in',
    estimatedResolutionTime: '20-30 min',
    symptoms: 'User experiences an extended "Preparing Windows" phase during login and drops into a default Windows desktop environment showing: "You have been signed in with a temporary profile."',
    cause: 'The NTUSER.DAT file within the user profile directory is write-locked by a persistent background agent, or the profile\'s SID tracking link inside the registry is flagged with a .bak extension.',
    steps: [
      'Reboot the workstation and log in using a separate local or domain administrator account.',
      'Launch Registry Editor (regedit) and navigate to: HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\ProfileList',
      'Identify the specific SID folder ending with .bak and match it against the duplicate folder without the extension.',
      'Rename the key without .bak by appending .old to its name.',
      'Remove the .bak string extension from the remaining key so it becomes the active target path.',
      'Double-click the State DWORD value in the corrected key, set its value data to 0, and set RefCount to 0. Reboot the machine.'
    ]
  },
  {
    code: 'WIN-003',
    title: 'BitLocker Recovery Loop After Motherboard Firmware/BIOS Update',
    category: 'Windows',
    subcategory: 'Security & Encryption',
    audience: 'admin',
    difficulty: 'advanced',
    severity: 'critical',
    tags: 'windows,bitlocker,tpm,bios,firmware,recovery,encryption',
    estimatedResolutionTime: '20-30 min',
    symptoms: 'System boots directly into a blue BitLocker Recovery screen prompting for a 48-digit key on every single power cycle, failing to load the standard Windows login interface.',
    cause: 'A recent motherboard UEFI/BIOS firmware modification or configuration change cleared or shifted the Platform Configuration Registers (PCR) validation hashes, triggering a TPM trust mismatch.',
    steps: [
      'Input the user\'s explicit 48-digit recovery key retrieved from the Entra ID / Microsoft 365 Admin Portal to complete the system boot.',
      'Once inside the desktop workspace, open PowerShell as an Administrator.',
      'Suspend BitLocker drive monitoring temporarily: Suspend-BitLocker -MountPoint "C:" -RebootCount 1',
      'Restart the workstation. The machine will bypass the BitLocker prompt and automatically seal the new hardware baseline hashes directly to the local TPM chip.'
    ]
  },
  {
    code: 'WIN-004',
    title: 'VPN Split-Tunneling DNS Resolution Failure for Internal Resources',
    category: 'Windows',
    subcategory: 'Network & VPN',
    audience: 'admin',
    difficulty: 'intermediate',
    severity: 'high',
    tags: 'windows,vpn,dns,split-tunneling,network,routing',
    estimatedResolutionTime: '15-20 min',
    symptoms: 'User establishes an active connection to the corporate VPN. They can ping internal target assets using direct IP addresses, but connection attempts via server hostnames or FQDNs fail.',
    cause: 'The local NIC routing metric is set lower than the virtual network adapter created by the VPN software, forcing corporate internal DNS queries out into the public internet gateway.',
    steps: [
      'Establish an active session over the corporate VPN client.',
      'Open PowerShell as an Administrator and execute: Get-NetAdapter | Get-NetIPInterface -AddressFamily IPv4',
      'Note the specific InterfaceIndex assigned to the virtual VPN network adapter interface.',
      'Decrease its routing metric value to 1: Set-NetIPInterface -InterfaceIndex [Insert_Index_Number] -InterfaceMetric 1',
      'Clear the local name resolver cache: ipconfig /flushdns'
    ]
  },
  {
    code: 'WIN-005',
    title: 'Print Spooler Service (spoolsv.exe) Crashes Repeatedly',
    category: 'Windows',
    subcategory: 'Printing',
    audience: 'admin',
    difficulty: 'intermediate',
    severity: 'medium',
    tags: 'windows,print,spooler,printer,driver,crash',
    estimatedResolutionTime: '15-25 min',
    symptoms: 'Printers missing from the control panel; active print tasks vanish instantly, and applications throw system errors stating: "The Print Spooler service is not running."',
    cause: 'A corrupted, poorly written Type 3 third-party printer driver has written bad data configurations directly into shared print memory allocations, crashing the spoolsv.exe execution thread.',
    steps: [
      'Open Run (Win + R), type services.msc, locate the Print Spooler item, and click Stop.',
      'Open File Explorer and purge the temporary print holding directory: C:\\Windows\\System32\\spool\\PRINTERS',
      'Delete all files inside this folder, then return to the Services console and click Start.',
      'Open Run, type printui /s /t2, select the offending printer driver package, click Remove, choose "Remove driver and driver package," and deploy native Type 4 drivers instead.'
    ]
  },
  {
    code: 'WIN-006',
    title: 'Blue Screen of Death (BSOD) via CRITICAL_PROCESS_DIED Bugcheck',
    category: 'Windows',
    subcategory: 'System Crashes',
    audience: 'admin',
    difficulty: 'advanced',
    severity: 'critical',
    tags: 'windows,bsod,crash,critical-process,kernel,memory',
    estimatedResolutionTime: '30-60 min',
    symptoms: 'Workstation crashes abruptly, displaying a blue diagnostic screen with error bugcheck code 0x000000EF or text string CRITICAL_PROCESS_DIED.',
    cause: 'A critical Windows kernel process (such as csrss.exe, smss.exe, or wininit.exe) terminated unexpectedly due to internal memory corruption, deep storage sector damage, or faulty driver components.',
    steps: [
      'Boot the endpoint into Safe Mode with Command Prompt access.',
      'Run the integrated System File Checker utility: sfc /scannow',
      'Execute a deep sector storage checking and repair subroutine: chkdsk C: /f /r /x',
      'Use WinDbg tool configurations to evaluate memory dump logging assets if the crash repeats after standard component repair checks.'
    ]
  },
  {
    code: 'WIN-007',
    title: 'System File Corruption and Component Store Mismatch (DISM / SFC)',
    category: 'Windows',
    subcategory: 'System Repair',
    audience: 'admin',
    difficulty: 'intermediate',
    severity: 'high',
    tags: 'windows,dism,sfc,corruption,component-store,winsxs',
    estimatedResolutionTime: '30-45 min',
    symptoms: 'Native administrative applications crash on launch, operating system windows display glitchy behavior, and Windows Update deployments fail continuously with various hex error codes.',
    cause: 'Bit rot, un-graceful power disruptions, or bad installation tasks have corrupted the base operating system side-by-side (WinSxS) component directory store.',
    steps: [
      'Open Command Prompt with Elevated Administrator access privileges.',
      'Scan the current online operating system tracking image for structural mismatches: DISM /Online /Cleanup-Image /ScanHealth',
      'Rebuild and patch the system image folder paths directly from cloud deployment repositories: DISM /Online /Cleanup-Image /RestoreHealth',
      'Run the primary system verification utility tool: sfc /scannow'
    ]
  },
  {
    code: 'WIN-008',
    title: 'Credential Manager Token Corruption Causing Active Directory Lockout Loops',
    category: 'Windows',
    subcategory: 'Authentication',
    audience: 'admin',
    difficulty: 'intermediate',
    severity: 'high',
    tags: 'windows,active-directory,lockout,credential-manager,authentication,token',
    estimatedResolutionTime: '15-20 min',
    symptoms: 'A corporate user account encounters repeated Active Directory lockouts within minutes of an administrator unlocking it, even though the user has not typed their password incorrectly.',
    cause: 'Stale or corrupt authentication credentials are saved inside the local Windows Credential vault. Background services continue to auto-fire the expired keys.',
    steps: [
      'Disconnect the workstation from all local networks.',
      'Launch the Run tool, type control.exe keymgr, and press Enter to launch Credential Manager.',
      'Under Windows Credentials, systematically clear out all saved passwords linked to enterprise mail configurations, active directory accounts, and strings matching MicrosoftOffice16_Data:ADAL: or msteams_Data.',
      'Reconnect network cables, unlock the user account via administrative tools, and have the employee log back in to generate clean modern auth tokens.'
    ]
  },
  {
    code: 'WIN-009',
    title: 'Audio Endpoint Switching Failure on Thunderbolt Docking Stations',
    category: 'Windows',
    subcategory: 'Audio & Peripherals',
    audience: 'admin',
    difficulty: 'intermediate',
    severity: 'medium',
    tags: 'windows,audio,thunderbolt,docking-station,sound,driver',
    estimatedResolutionTime: '10-15 min',
    symptoms: 'Connecting a laptop to an enterprise Thunderbolt docking station successfully handles video outputs and network connections, but system sound output continues to route through the laptop\'s internal speakers.',
    cause: 'Intel Smart Sound Technology (SST) bus power management hooks freeze up when allocating dynamic hardware endpoints across high-speed PCIe audio paths on the dock bus.',
    steps: [
      'Disconnect the physical Thunderbolt dock type-C connector cable from the laptop.',
      'Open Device Manager and expand the Sound, video and game controllers section tree.',
      'Locate the specific driver mapped to the docking station hardware (e.g., Realtek USB Audio), right-click it, and select Uninstall Device.',
      'Check the box to delete the driver files if prompted and click Uninstall.',
      'Restart the workstation, reconnect the dock cable link, and let Plug-and-Play (PNP) reload a clean, un-cached driver configuration.'
    ]
  },
  {
    code: 'WIN-010',
    title: 'Win32 API Local File Path Length Limitation Exceeding 260 Characters',
    category: 'Windows',
    subcategory: 'File System',
    audience: 'admin',
    difficulty: 'beginner',
    severity: 'medium',
    tags: 'windows,file-path,max-path,sharepoint,onedrive,registry',
    estimatedResolutionTime: '5-10 min',
    symptoms: 'User receives an error popup stating: "The file path is too long" or "Destination Path Too Long" when attempting to move, copy, or create folders within deeply nested SharePoint synced directories.',
    cause: 'Legacy MAX_PATH character limits within the standard Win32 file execution subsystem restrict active paths to a hard ceiling of 260 characters.',
    steps: [
      'Launch the Registry Editor application tool as an Administrator.',
      'Navigate directly to: HKLM\\SYSTEM\\CurrentControlSet\\Control\\FileSystem',
      'Locate the DWORD value configuration parameter named LongPathsEnabled.',
      'If missing, create a new DWORD (32-bit) Value named exactly LongPathsEnabled.',
      'Double-click the entry, modify its value data from 0 to 1, close Registry Editor, and restart the workstation.'
    ]
  },
  {
    code: 'WIN-011',
    title: 'Windows Update Error 0x80070002 Package Installation Loop',
    category: 'Windows',
    subcategory: 'Windows Update',
    audience: 'admin',
    difficulty: 'intermediate',
    severity: 'high',
    tags: 'windows,windows-update,error,0x80070002,update-loop,software-distribution',
    estimatedResolutionTime: '20-30 min',
    symptoms: 'Operating system update tasks reach near completion, stop, fail with explicit error code 0x80070002, and roll back all changes in an endless loop on every machine boot cycle.',
    cause: 'Missing, corrupt, or truncated update transaction database metadata logs within the local update tracking directories.',
    steps: [
      'Open Command Prompt with Elevated Administrator privileges.',
      'Stop the core background update orchestration threads: net stop wuauserv && net stop bits && net stop cryptsvc',
      'Open File Explorer, navigate to C:\\Windows, and rename the folder SoftwareDistribution to SoftwareDistribution.old.',
      'Navigate to C:\\Windows\\System32\\catroot2 and rename that folder to catroot2.old.',
      'Return to the Command Prompt window and restart the update engines: net start wuauserv && net start bits && net start cryptsvc'
    ]
  },
  {
    code: 'WIN-012',
    title: '802.1X Wi-Fi WPA3-Enterprise RADIUS Authentication Failure',
    category: 'Windows',
    subcategory: 'Network & Wi-Fi',
    audience: 'admin',
    difficulty: 'advanced',
    severity: 'high',
    tags: 'windows,wifi,802.1x,wpa3,radius,authentication,certificate',
    estimatedResolutionTime: '20-30 min',
    symptoms: 'Workstation detects the corporate secure Wi-Fi SSID network path but fails to join. It prompts endlessly for credentials or displays the absolute error screen: "Can\'t connect to this network."',
    cause: 'EAP configuration type mismatches, or the endpoint lacks trust for the internal Active Directory Certificate Services (ADCS) Root CA certificate utilized by the RADIUS server.',
    steps: [
      'Open Control Panel > Network and Sharing Center > Set up a new connection or network > Manually connect to a wireless network.',
      'Input the exact corporate Network name (SSID), change Security type to WPA3-Enterprise (or WPA2), and click Next.',
      'Click Change connection settings to open the network profile configuration panel, then select the Security tab.',
      'Ensure network authentication is mapped to Microsoft: Protected EAP (PEAP) and click Settings.',
      'Check Verify the server\'s identity by validating the certificate and check the explicit box next to your company\'s Root CA under the Trusted Root Certification Authorities list. Click Apply.'
    ]
  },
  {
    code: 'WIN-013',
    title: 'Hanging Remote Desktop (RDP) Sessions on Abrupt Network Disconnect',
    category: 'Windows',
    subcategory: 'Remote Access',
    audience: 'admin',
    difficulty: 'intermediate',
    severity: 'medium',
    tags: 'windows,rdp,remote-desktop,session,network,disconnect',
    estimatedResolutionTime: '10-15 min',
    symptoms: 'User disconnects from an active Remote Desktop session due to a network drop. When trying to reconnect, they receive the error: "The remote session was disconnected because another user connected," or the client hangs indefinitely at a blank screen.',
    cause: 'The target host OS failed to register a proper TCP connection teardown when the network dropped, leaving the original terminal session active but orphaned.',
    steps: [
      'Launch PowerShell from an administrator machine on the same corporate subnet.',
      'Establish a remote administrative connection link to the target host computer: Enter-PSSession -ComputerName [Target_Workstation_Name]',
      'Query the host\'s active user sessions to identify the hung session ID: query session',
      'Force a logoff execution routine for that specific orphaned ID: logoff [Insert_Session_ID_Number]'
    ]
  },
  {
    code: 'WIN-014',
    title: 'App Scaling Blurriness and Artifacting on Mixed-DPI Multi-Monitor Setups',
    category: 'Windows',
    subcategory: 'Display & Monitors',
    audience: 'admin',
    difficulty: 'beginner',
    severity: 'low',
    tags: 'windows,dpi,scaling,monitor,display,blurry,multi-monitor',
    estimatedResolutionTime: '5-10 min',
    symptoms: 'Application windows or interface text appear blurry, pixelated, or display layout bugs when dragged from a high-resolution laptop screen (e.g., 4K) to a lower-resolution external monitor (e.g., 1080p).',
    cause: 'Legacy applications using older Graphics Device Interface (GDI) font scaling patterns cannot adjust to dynamic DPI scaling factor adjustments across active displays.',
    steps: [
      'Right-click the shortcut or primary executable file link for the problematic application and select Properties.',
      'Select the Compatibility tab layout panel, then click Change high DPI settings.',
      'Under High DPI scaling override, check Override high DPI scaling behavior.',
      'Change the Scaling performed by: dropdown selector option from Application to System (Enhanced). Click Apply and restart the application.'
    ]
  },
  // ===== macOS (MAC-015 to MAC-028) =====
  {
    code: 'MAC-015',
    title: 'FileVault Encryption Progress Stuck or Suspended Indefinitely',
    category: 'macOS',
    subcategory: 'Security & Encryption',
    audience: 'admin',
    difficulty: 'intermediate',
    severity: 'high',
    tags: 'macos,filevault,encryption,apfs,disk,security',
    estimatedResolutionTime: '20-30 min',
    symptoms: 'Inside System Settings > Privacy & Security > FileVault, the status bar displays "Encryption Paused" or "Estimating time remaining..." indefinitely. The process does not advance even when connected to external AC power.',
    cause: 'Bad allocation maps or corrupt metadata sectors on the APFS core storage volume are blocking the background disk encryption engine.',
    steps: [
      'Launch the Terminal application tool and run: fdesetup status',
      'Force a complete disk verification scan and patch structural issues: sudo diskutil repairVolume /',
      'If the process remains frozen after a system reboot, use administrative privileges to disable the stuck cryptographic task wrapper entirely: sudo fdesetup disable',
      'Restart the Mac, verify the status reads "FileVault is Off," and re-enable FileVault through System Settings.'
    ]
  },
  {
    code: 'MAC-016',
    title: 'Local Keychain Access Local Items Password Prompt Sync Loop',
    category: 'macOS',
    subcategory: 'Authentication',
    audience: 'admin',
    difficulty: 'beginner',
    severity: 'medium',
    tags: 'macos,keychain,password,authentication,login,sync',
    estimatedResolutionTime: '5-10 min',
    symptoms: 'User is bombarded with endless, repeating popup windows asking for the "Local Items" or "login" keychain password. Entering their current corporate login password dismisses the box for a few seconds before it reappears.',
    cause: 'The password for the local login keychain did not update during a password change because the update occurred outside the native macOS environment (e.g., via a web browser self-service identity portal).',
    steps: [
      'Click on the desktop background to select Finder, then click Go in the top menu bar, and choose Go to Folder.',
      'Input the exact library subdirectory target path and hit Enter: ~/Library/Keychains/',
      'Locate the specific folder inside this directory that is named with a long alphanumeric GUID string (e.g., A8B2C3D4-E5F6...).',
      'Move this folder to the Trash bin and immediately restart the Mac.',
      'Upon logging back in, the macOS security engine will automatically build a fresh local secure keychain store that matches the user\'s current password.'
    ]
  },
  {
    code: 'MAC-017',
    title: 'MDM / Jamf Pro Automated Device Enrollment Profile Installation Failure',
    category: 'macOS',
    subcategory: 'Device Management',
    audience: 'admin',
    difficulty: 'advanced',
    severity: 'high',
    tags: 'macos,mdm,jamf,enrollment,dep,apple,ntp,time-sync',
    estimatedResolutionTime: '15-20 min',
    symptoms: 'During the initial out-of-box Setup Assistant configuration, the Mac skips the corporate "Remote Management" screen completely, or fails with an explicit error message stating: "The cloud configuration cannot be downloaded."',
    cause: 'The Mac\'s system clock has drifted by more than 5 minutes from standard NTP servers, breaking the secure SSL handshake validation with Apple\'s Device Enrollment Program (DEP) servers.',
    steps: [
      'Boot or reset the device back to the initial Setup Assistant interface screen.',
      'Press Utilities in the top application menu bar option link and launch Terminal.',
      'Force the device\'s internal system clock configuration to synchronize with Apple\'s master time arrays: sudo ntpdate -u time.apple.com',
      'Force a manual verification call to the cloud deployment profiles endpoint: sudo profiles renew -type enrollment'
    ]
  },
  {
    code: 'MAC-018',
    title: 'TCC Privacy Settings (Accessibility / Screen Recording) Local Reset Loop',
    category: 'macOS',
    subcategory: 'Privacy & Security',
    audience: 'admin',
    difficulty: 'intermediate',
    severity: 'medium',
    tags: 'macos,tcc,privacy,accessibility,screen-recording,permissions',
    estimatedResolutionTime: '10-15 min',
    symptoms: 'Toggling security permissions (such as allowing a screen sharing tool access to Screen Recording or Accessibility) in System Settings doesn\'t save. The slider button reverts to Off as soon as the settings pane is closed.',
    cause: 'The local Transparency, Consent, and Control (TCC.db) system tracking database has entered a write-locked state or has a mismatched schema configuration.',
    steps: [
      'Open System Settings > Privacy & Security > Full Disk Access. Ensure Terminal is enabled in the authorized applications list.',
      'Launch the Terminal application.',
      'Force a complete structural reset of the permission records for the problematic sub-service: tccutil reset Accessibility',
      'To target screen recording permission issues specifically, run: tccutil reset ScreenCapture',
      'Close System Settings, restart the targeted application, and toggle the permission slider to On.'
    ]
  },
  {
    code: 'MAC-019',
    title: 'Transparency, Consent, and Control (TCC) Local Database Corruption',
    category: 'macOS',
    subcategory: 'Privacy & Security',
    audience: 'admin',
    difficulty: 'advanced',
    severity: 'critical',
    tags: 'macos,tcc,database,corruption,sip,system-integrity,permissions',
    estimatedResolutionTime: '20-30 min',
    symptoms: 'Complete system-wide inability to modify or save any application permission profiles across macOS. System Settings panes freeze or crash when accessing security properties.',
    cause: 'Severe permissions corruption or structural breakdown within the root system security database files located at /Library/Application Support/com.apple.TCC/TCC.db.',
    steps: [
      'Click the Apple icon, select Restart, and hold down Cmd + R to boot the Mac into macOS Recovery Mode.',
      'Open Utilities from the menu bar and select Terminal.',
      'Turn off System Integrity Protection (SIP) to unlock modifications to core system folders: csrutil disable',
      'Restart the Mac normally. Open Terminal and delete the corrupted database file structure entirely: sudo rm /Library/Application\\ Support/com.apple.TCC/TCC.db',
      'Reboot the Mac back into Recovery Mode (Cmd + R), open Terminal, and re-engage system security protections: csrutil enable. Restart the Mac normally.'
    ]
  },
  {
    code: 'MAC-020',
    title: 'Spotlight Index Corruption Causing Local Metadata Search Failure',
    category: 'macOS',
    subcategory: 'Search & Indexing',
    audience: 'admin',
    difficulty: 'beginner',
    severity: 'medium',
    tags: 'macos,spotlight,search,index,metadata,mdutil,outlook',
    estimatedResolutionTime: '10-20 min',
    symptoms: 'Searching for files using Finder or Spotlight returns zero results, even when searching for exact file titles. Outlook for Mac search functionality is completely broken, failing to display recent email records.',
    cause: 'Broken database indexes or corrupted metadata catalog schema structures on the primary APFS boot storage volume.',
    steps: [
      'Launch the Terminal application tool.',
      'Turn off the background metadata indexing tasks globally: sudo mdutil -i off /',
      'Purge the existing corrupted structural search index folder catalog tree completely: sudo rm -rf /.Spotlight-V100',
      'Turn the background metadata indexing tasks back on and force a re-scan: sudo mdutil -i on / && sudo mdutil -E /'
    ]
  },
  {
    code: 'MAC-021',
    title: 'Time Machine Backup Interruption and Failure to Enterprise SMB NAS',
    category: 'macOS',
    subcategory: 'Backup & Recovery',
    audience: 'admin',
    difficulty: 'intermediate',
    severity: 'high',
    tags: 'macos,time-machine,backup,nas,smb,network,sparsebundle',
    estimatedResolutionTime: '20-30 min',
    symptoms: 'Network backup routines to a shared corporate NAS fail repeatedly. System notifications display error messages stating: "The backup disk image could not be created," or "Time Machine could not back up because the network volume disconnected."',
    cause: 'Extended network latency spikes or file write-locking issues are causing concurrency conflicts on the target .sparsebundle file asset tree over the SMB pipeline.',
    steps: [
      'Open Terminal and use the extended attributes clear command to purge locked flags on the network backup location: xattr -cl /Volumes/[Insert_Backup_Disk_Name] && sudo chflags -R nouchg /Volumes/[Insert_Backup_Disk_Name]',
      'Verify connection performance requirements by modifying the default system SMB network parameters. Create or edit /etc/nsmb.conf and append: [default] signing_required=no dirstatcache=no',
      'Force a clean mapping to the destination path using the Time Machine utility tool: sudo tmutil setdestination smb://user@server.domain/share'
    ]
  },
  {
    code: 'MAC-022',
    title: 'Microsoft AutoUpdate (MAU) Background Daemon Hanging or Failing to Launch',
    category: 'macOS',
    subcategory: 'Software Updates',
    audience: 'admin',
    difficulty: 'intermediate',
    severity: 'medium',
    tags: 'macos,microsoft,autoupdate,mau,daemon,plist,office',
    estimatedResolutionTime: '10-15 min',
    symptoms: 'Microsoft 365 applications (Word, Excel, Outlook) show outdated version numbers. Clicking "Check for Updates" inside an app does nothing, or logs an absolute application error stating that the updater utility cannot run.',
    cause: 'The underlying macOS launch daemon property list configuration file (.plist) has encountered execution path issues or file permission corruption.',
    steps: [
      'Open Terminal and clear out stale, corrupted background daemon property configurations: sudo rm -f /Library/LaunchDaemons/com.microsoft.autoupdate.helper.plist && sudo rm -f /Library/LaunchAgents/com.microsoft.update.agent.plist',
      'Purge application tracking configurations from the local user cache directory path: rm -rf ~/Library/Caches/com.microsoft.autoupdate.fba',
      'Re-register the baseline helper tools using the integrated application components: sudo /Library/Application\\ Support/Microsoft/MAU2.0/Microsoft\\ AutoUpdate.app/Contents/MacOS/msupdate --install'
    ]
  },
  {
    code: 'MAC-023',
    title: 'Rosetta 2 Translation Environment Errors on Apple Silicon (M-Series) Chips',
    category: 'macOS',
    subcategory: 'Apple Silicon',
    audience: 'admin',
    difficulty: 'beginner',
    severity: 'high',
    tags: 'macos,rosetta,apple-silicon,m1,m2,intel,compatibility,crash',
    estimatedResolutionTime: '5-10 min',
    symptoms: 'Legacy Intel-compiled corporate software, system helper tools, or older VPN client applications crash instantly upon launch when executed on newer Apple Silicon (M1/M2/M3) Mac endpoints.',
    cause: 'Missing, corrupted, or incomplete Rosetta 2 machine code translation binaries following a major macOS upgrade sequence.',
    steps: [
      'Ensure the Mac has an active, unfiltered link to the public internet gateway. Open Terminal.',
      'Force a clean, manual installation of the Apple translation environment package wrapper: softwareupdate --install-rosetta --agree-to-license',
      'If the installer returns an error stating the package is already present but apps are still crashing, force an engine update lookup: sudo launchctl kickstart -k system/com.apple.oahd'
    ]
  },
  {
    code: 'MAC-024',
    title: 'Wi-Fi Packet Dropping Caused by AWDL / AirDrop Wireless Interference',
    category: 'macOS',
    subcategory: 'Network & Wi-Fi',
    audience: 'admin',
    difficulty: 'intermediate',
    severity: 'medium',
    tags: 'macos,wifi,awdl,airdrop,interference,network,latency',
    estimatedResolutionTime: '5-10 min',
    symptoms: 'The user experiences sudden network latency spikes, audio distortion during video calls, or dropped network connections while connected to the company\'s enterprise 5GHz Wi-Fi network infrastructure.',
    cause: 'Apple Wireless Direct Link (AWDL) repeatedly scans channels to support proximity services like AirDrop and Sidecar, creating interference on single-radio Wi-Fi cards.',
    steps: [
      'Launch Terminal. Check the active status profile configurations of the virtual AWDL wireless network interface by running: ifconfig awdl0',
      'Temporarily shut down the AWDL interface during high-priority video calls or presentation events: sudo ifconfig awdl0 down',
      'Once your meetings wrap up, restore native file sharing and AirDrop capabilities by turning the interface back up: sudo ifconfig awdl0 up'
    ]
  },
  {
    code: 'MAC-025',
    title: 'Finder UI Unresponsiveness When Mounting High-Latency Local SMB Shares',
    category: 'macOS',
    subcategory: 'File Sharing',
    audience: 'admin',
    difficulty: 'beginner',
    severity: 'medium',
    tags: 'macos,finder,smb,network,ds-store,performance,file-share',
    estimatedResolutionTime: '5-10 min',
    symptoms: 'Finder hangs, displaying a spinning beachball cursor for up to a minute whenever a user attempts to open, browse, or view directories on an internally hosted corporate SMB file server.',
    cause: 'Finder defaults to reading hidden local directory properties files (.DS_Store) and generating icon previews for all files over the network link, saturating network traffic.',
    steps: [
      'Open Terminal. Configure the macOS global system rules parameters to completely block .DS_Store file creation and tracking behaviors on all network-mounted file shares: defaults write com.apple.desktopservices DSDontWriteNetworkStores -bool true',
      'Block Finder from auto-generating visual icon file previews over network storage connections: defaults write com.apple.finder ShowPreviewPane -bool false',
      'Force an absolute system refresh of the Finder application wrapper to apply the configuration modifications: killall Finder'
    ]
  },
  {
    code: 'MAC-026',
    title: 'Bluetooth Audio Profile Stuck in Low-Quality Hands-Free Profile (HFP) Mode',
    category: 'macOS',
    subcategory: 'Audio & Bluetooth',
    audience: 'admin',
    difficulty: 'beginner',
    severity: 'low',
    tags: 'macos,bluetooth,audio,hfp,a2dp,headset,teams,jabra,poly',
    estimatedResolutionTime: '5 min',
    symptoms: 'Corporate wireless headsets (e.g., Jabra, Poly, AirPods) deliver heavily compressed, metallic, and low-fidelity audio output. The user experiences bad sound quality as soon as they join a web conference application.',
    cause: 'macOS automatically forces a Bluetooth audio device down from the high-bandwidth Advanced Audio Distribution Profile (A2DP) stereo stream to the low-bandwidth Hands-Free Profile (HFP) SCO codec whenever an application requests activation of the device\'s built-in microphone channel.',
    steps: [
      'Open System Settings > Sound and click the Input tab layout panel.',
      'Change the active audio input device selector away from the Bluetooth headset, choosing Macbook Microphone instead.',
      'This immediately drops the active microphone channel call on the Bluetooth bus, freeing up wireless bandwidth and forcing the output profile to switch back to high-fidelity A2DP stereo mode.',
      'Open the communication app (e.g., Teams) and verify that its internal audio configuration matches this split layout: Input mapped to the internal computer microphone, and Output mapped to the high-quality headset profile.'
    ]
  },
  {
    code: 'MAC-027',
    title: 'System Extensions Blocked by Core OS Gatekeeper Security Policies',
    category: 'macOS',
    subcategory: 'Security & Extensions',
    audience: 'admin',
    difficulty: 'beginner',
    severity: 'high',
    tags: 'macos,gatekeeper,system-extension,crowdstrike,defender,vpn,security',
    estimatedResolutionTime: '5-10 min',
    symptoms: 'Endpoint security agents (e.g., CrowdStrike Falcon, Defender for Endpoint) or corporate VPN software install successfully but remain non-functional. The application displays a warning banner stating: "System Extension Blocked."',
    cause: 'macOS Gatekeeper security mechanics enforce strict user consent frameworks, requiring explicit administrative authorization before a third-party app can bind low-level system extensions or network kernel layers.',
    steps: [
      'Open System Settings > Privacy & Security and scroll down past the application tracking grid to the Security section header.',
      'Locate the text notification reading: "System software from application \'[Vendor_Name]\' was blocked from loading." Click the Allow button next to it.',
      'Enter local administrative credentials to clear the initial Gatekeeper block.',
      'If the prompt fails to show or save, open Terminal and query the blocked extensions via command line: systemextensionsctl list'
    ]
  },
  {
    code: 'MAC-028',
    title: 'Enterprise Kerberos Single Sign-On (SSO) Extension Token Expiration',
    category: 'macOS',
    subcategory: 'Authentication',
    audience: 'admin',
    difficulty: 'intermediate',
    severity: 'high',
    tags: 'macos,kerberos,sso,active-directory,token,vpn,authentication',
    estimatedResolutionTime: '10-15 min',
    symptoms: 'Internal corporate network file shares disconnect unexpectedly, local printers drop jobs, and the user is continuously prompted with old Active Directory style authentication panels while browsing local corporate web targets.',
    cause: 'The underlying Apple Kerberos SSO Extension token has expired or failed its routine update background checks because line-of-sight to the local on-premises domain controller was broken without active VPN routing.',
    steps: [
      'Establish a verified, stable connection link to the corporate core network infrastructure using an approved VPN client configuration.',
      'Open the Terminal utility application wrapper.',
      'Force an immediate token refresh and re-authentication against the corporate Kerberos infrastructure: app-sso -r',
      'Review the status of the local Kerberos credential ticketing tracking schema cache by executing: klist'
    ]
  },
  // ===== EMAIL (EML-029 to EML-042) =====
  {
    code: 'EML-029',
    title: 'Offline Outlook Data File (.ost) Integrity Mismatch and Corruption',
    category: 'Email',
    subcategory: 'Outlook Desktop',
    audience: 'admin',
    difficulty: 'beginner',
    severity: 'high',
    tags: 'outlook,email,ost,corruption,exchange,offline,data-file',
    estimatedResolutionTime: '10-20 min',
    symptoms: 'The Microsoft Outlook desktop application fails to launch, hanging on the "Processing" splash screen, or throws an error prompt reading: "Cannot start Microsoft Outlook. Cannot open the Outlook window. The set of folders cannot be opened."',
    cause: 'Unexpected operating system power cut-offs, storage faults, or excessive write actions have damaged the transactional structure of the local cached Exchange binary storage database file (.ost).',
    steps: [
      'Shut down all background Microsoft 365 core engine applications completely via Windows Task Manager.',
      'Open the Run dialog tool (Win + R), paste this exact local directory path, and click OK: %localappdata%\\Microsoft\\Outlook',
      'Identify the specific file matching your corporate email address suffix that ends with the .ost file extension.',
      'Right-click the file, select Rename, and append .old to the file extension (e.g., user@company.com.ost.old).',
      'Restart the Microsoft Outlook desktop client application. The platform will discover the missing data architecture link and automatically initialize a clean background database generation routine to pull current server mailbox profiles directly from the Exchange Online cloud cluster.'
    ]
  },
  {
    code: 'EML-030',
    title: 'Exchange Online Automapping Delay and Shared Mailbox Out-of-Sync Lag',
    category: 'Email',
    subcategory: 'Shared Mailboxes',
    audience: 'admin',
    difficulty: 'beginner',
    severity: 'medium',
    tags: 'outlook,email,shared-mailbox,automapping,exchange,delegate,sync',
    estimatedResolutionTime: '5-10 min',
    symptoms: 'An employee is granted full-access delegate permissions to an organizational shared mailbox via the M365 Admin Portal. However, the shared mailbox folder fails to map or display within their desktop Outlook folder tree view layout even after 24 hours.',
    cause: 'Replication delays within Azure Active Directory / Entra ID tenant sync engines, or local client profile caching configurations blocking the receipt of automated Autodiscover XML provisioning updates.',
    steps: [
      'Launch the Outlook desktop app client platform. Navigate to File > Account Settings > Account Settings.',
      'Select the primary corporate mailbox account entry line and click Change. Click More Settings to open the advanced Microsoft Exchange profile options.',
      'Select the Advanced configuration layout tab page and click the Add... button located next to the mailbox display list box.',
      'Input the exact primary SMTP email address linked to the shared organizational mailbox and select OK.',
      'Click Apply, click OK, and complete the configuration change wizard steps. The shared mailbox asset framework will map immediately down into the client folder directory column.'
    ]
  },
  {
    code: 'EML-031',
    title: 'Cached Exchange Mode Conflict Causing Shared Calendar Sync Divergence',
    category: 'Email',
    subcategory: 'Calendar',
    audience: 'admin',
    difficulty: 'beginner',
    severity: 'medium',
    tags: 'outlook,email,calendar,shared,sync,cached-exchange-mode,owa',
    estimatedResolutionTime: '5-10 min',
    symptoms: 'Calendar appointment updates, modifications, or meeting room bookings processed by team colleagues via Outlook Web App (OWA) or mobile clients fail to display or align inside the user\'s local Outlook desktop calendar grid view.',
    cause: 'Corrupted indexing links or caching bugs within the local client\'s optimization database layers when handling shared multi-user calendar event streams.',
    steps: [
      'Within the Outlook desktop window, go to File > Account Settings > Account Settings.',
      'Select your primary account line item, click Change, and then choose More Settings.',
      'Click into the Advanced configuration properties sub-tab.',
      'Locate the option labeled Turn on shared calendar improvements under the Cached Exchange Mode Settings subheader. Uncheck the checkbox to turn this optimization model off.',
      'Click Apply, click OK, and complete the change wizard steps. Restart Outlook.',
      'Navigate back into the same menu panel, re-check the Turn on shared calendar improvements checkbox to re-initialize a clean database sync engine configuration, and restart Outlook one final time.'
    ]
  },
  {
    code: 'EML-032',
    title: 'AutoDiscover XML Routing Failure and Loop to Legacy On-Premises Tenants',
    category: 'Email',
    subcategory: 'Autodiscover',
    audience: 'admin',
    difficulty: 'advanced',
    severity: 'high',
    tags: 'outlook,email,autodiscover,dns,registry,exchange,migration,on-premises',
    estimatedResolutionTime: '15-20 min',
    symptoms: 'Outlook desktop displays continuous certificate error warning prompts or switches to an "Disconnected" status indicator. The client attempts to connect to old on-premises server infrastructure paths rather than cloud endpoints following a cloud migration.',
    cause: 'Stale DNS record components or hidden legacy local registry hooks left behind by ancient installation architectures are forcing the local Autodiscover routing framework to prioritize local pathways over Microsoft 365 cloud routing.',
    steps: [
      'Open the Registry Editor utility tool as an Administrator. Navigate directly to: HKCU\\Software\\Microsoft\\Office\\16.0\\Outlook\\AutoDiscover',
      'Right-click an empty space in the right-hand dashboard layout panel grid and select New > DWORD (32-bit) Value. Name it exactly: ExcludeHttpsRootDomain and set its Value Data parameter to 1.',
      'Create three additional DWORD (32-bit) parameters inside this same directory path, setting the value data for each to 1: ExcludeHttpsLookup, ExcludeSrvRecord, ExcludeLastKnownGoodUrl',
      'Close Registry Editor, open a command terminal window, run ipconfig /flushdns to clear local name resolution lookup errors, and launch Outlook.'
    ]
  },
  {
    code: 'EML-033',
    title: 'Maximum Outlook PST/OST File Size Registry Limit Reached (50GB Cap)',
    category: 'Email',
    subcategory: 'Storage & Quota',
    audience: 'admin',
    difficulty: 'intermediate',
    severity: 'high',
    tags: 'outlook,email,pst,ost,file-size,quota,registry,storage',
    estimatedResolutionTime: '10-15 min',
    symptoms: 'Outlook stops downloading new mail items. The user receives an error popup banner reading: "The file path [Path_To_OST] has reached its maximum size limit" or logs a delivery failure indicating local storage is full.',
    cause: 'The default built-in configuration settings for Microsoft Office limit the maximum size of unicode offline data stores (.ost and .pst) to a strict 50GB cap boundary.',
    steps: [
      'Launch the Registry Editor application tool. Navigate downward into the policy directory tree configuration path: HKCU\\Software\\Policies\\Microsoft\\Office\\16.0\\Outlook\\PST',
      'If the final PST folder subkey is missing, right-click the Outlook key, select New > Key, and name it exactly PST.',
      'Right-click inside the PST folder panel space and create a new DWORD (32-bit) Value named exactly: MaxLargeFileSize. Double-click it, set the base selection radial button to Decimal, and input value data: 102400 (this scales the file cap limit to 100GB safely).',
      'Create a second DWORD (32-bit) Value named exactly: WarnLargeFileSize. Set the base selection to Decimal and input value data: 97280 (this sets a warning threshold at 95GB).',
      'Close Registry Editor and restart the Outlook desktop client app.'
    ]
  },
  {
    code: 'EML-034',
    title: 'Outlook Desktop Client Stuck Launching in Safe Mode Processing Loop',
    category: 'Email',
    subcategory: 'Outlook Desktop',
    audience: 'admin',
    difficulty: 'beginner',
    severity: 'high',
    tags: 'outlook,email,safe-mode,add-in,com,crash,plugin',
    estimatedResolutionTime: '10-15 min',
    symptoms: 'The application crashes instantly on loading unless the user manual runs outlook.exe /safe. When launched normally, it hangs permanently at the initial add-in tracking line indicator text, freezing user access.',
    cause: 'A corrupt or incompatible third-party Component Object Model (COM) add-in (e.g., outdated videoconferencing plug-ins or tracking tools) is throwing unhandled exceptions inside the application thread space.',
    steps: [
      'Launch the application in its diagnostic safe state via the Run tool: outlook.exe /safe',
      'Click File > Options > Add-ins from the primary menu selections.',
      'Locate the Manage: drop-down menu selector at the bottom layout edge of the options screen panel, set it to COM Add-ins, and click Go...',
      'Uncheck all listed third-party add-in checkboxes (prioritizing non-Microsoft integrations like Adobe PDF or old conferencing tools). Click OK.',
      'Close the application down completely. Relaunch Outlook normally. If it boots successfully, isolate the problematic plugin asset by re-enabling them one by one.'
    ]
  },
  {
    code: 'EML-035',
    title: 'Modern Authentication (OAuth2) Token Prompts Looping Indefinitely',
    category: 'Email',
    subcategory: 'Authentication',
    audience: 'admin',
    difficulty: 'advanced',
    severity: 'high',
    tags: 'outlook,email,oauth2,modern-auth,token,wam,tpm,authentication',
    estimatedResolutionTime: '15-20 min',
    symptoms: 'Outlook displays a "Need Password" warning alert text in the lower configuration border. Clicking it causes a Microsoft 365 login screen window to flash into view for a split second before vanishing, returning the user to the same error prompt loop.',
    cause: 'Stale or corrupted token keys inside the local Windows Web Account Manager (WAM) data framework folders or hardware token binding tracking mismatches inside the local Trusted Platform Module (TPM).',
    steps: [
      'Close all Microsoft Office application windows. Open the Windows Settings app and go to Accounts > Access work or school. Locate the corporate account listing link and select Disconnect.',
      'Open Control Panel and select Credential Manager > Windows Credentials. Remove all entries containing strings matching MicrosoftOffice16_Data:ADAL: or generic corporate access tokens.',
      'Launch PowerShell as an Administrator and execute this package registration command script to repair the local identity authentication provider plugin wrapper: Add-AppxPackage -Register "$env:windir\\SystemApps\\Microsoft.AAD.BrokerPlugin_cw5n1h2txyewy\\AppxManifest.xml" -DisableDevelopmentMode -ForceApplicationShutdown',
      'Reboot the workstation, open Outlook, and authenticate into the newly initialized interactive Entra ID multi-factor authentication panel.'
    ]
  },
  {
    code: 'EML-036',
    title: 'Exchange Online Delegate Access Permission Propagation Interruption',
    category: 'Email',
    subcategory: 'Permissions',
    audience: 'admin',
    difficulty: 'intermediate',
    severity: 'high',
    tags: 'outlook,email,delegate,permissions,exchange,send-as,acl',
    estimatedResolutionTime: '10-15 min',
    symptoms: 'Executive assistants or delegates receive an immediate Non-Delivery Report (NDR) bounce-back message stating: "You do not have permission to send on behalf of this user" when attempting to send emails out from a client\'s mailbox.',
    cause: 'Access control lists (ACL) changes made via graphical user interfaces have dropped or hung up during replication loops across internal global Active Directory tenant cluster nodes.',
    steps: [
      'Launch administrative connection terminals to Exchange Online via PowerShell.',
      'Purge the stale, stuck permission linkages explicitly: Remove-MailboxPermission -Identity "executive@company.com" -User "assistant@company.com" -AccessRights FullAccess',
      'Re-apply clean, explicit access rules parameters: Add-MailboxPermission -Identity "executive@company.com" -User "assistant@company.com" -AccessRights FullAccess -InheritanceType All',
      'Clear and re-verify the SendAs parameters explicitly: Add-RecipientPermission -Identity "executive@company.com" -Trustee "assistant@company.com" -AccessRights SendAs -Confirm:$false'
    ]
  },
  {
    code: 'EML-037',
    title: 'Mailbox Quota Allocation Limit Reached NDR Bounce-Back Warnings',
    category: 'Email',
    subcategory: 'Storage & Quota',
    audience: 'admin',
    difficulty: 'beginner',
    severity: 'high',
    tags: 'outlook,email,quota,mailbox,archive,exchange,ndr,storage',
    estimatedResolutionTime: '10-15 min',
    symptoms: 'Senders attempting to email an employee receive an immediate delivery failure notification reading: 5.2.2 Mailbox Full or 5.1.1 Housing quota exceeded. The user can no longer send outbound messages or receive incoming data assets.',
    cause: 'Total storage volume usage on the user\'s Exchange online account has breached the hardcoded boundary limits of their assigned corporate license (e.g., 50GB cap for Microsoft 365 Business Standard or E3 profiles).',
    steps: [
      'Connect to Exchange Online administrative PowerShell.',
      'Turn on the cloud-based auto-expanding Online Archiving storage mechanism for the affected user account asset: Enable-Mailbox "user@company.com" -Archive',
      'Force an immediate execution run of the Managed Folder Assistant engine to scan the primary mailbox and move old items into the newly created online archive space: Start-ManagedFolderAssistant -Identity "user@company.com"',
      'Instruct the employee to navigate to their Deleted Items directory folder inside Outlook, right-click, select Empty Folder, and confirm deletion.'
    ]
  },
  {
    code: 'EML-038',
    title: 'Focused Inbox Algorithm Misclassifying Automated System Alerts',
    category: 'Email',
    subcategory: 'Mail Flow',
    audience: 'admin',
    difficulty: 'intermediate',
    severity: 'medium',
    tags: 'outlook,email,focused-inbox,mail-flow,rules,alerts,classification',
    estimatedResolutionTime: '10-15 min',
    symptoms: 'High-priority internal alerts, ticketing updates, or server monitoring telemetry emails are automatically dropped into the "Other" processing tab view inside Outlook, causing engineers to miss critical events.',
    cause: 'The tenant\'s background machine learning sorting engine has misclassified the email based on automated delivery footprint heuristics.',
    steps: [
      'Instruct the user to navigate to their Other processing tab column section grid, right-click the misclassified message item, and select Move > Always Move to Focused Inbox.',
      'To apply a global fix across the entire organization, an administrator can create an Exchange Mail Flow rule. Open the Exchange Admin Center and navigate to Mail Flow > Rules.',
      'Click Add a rule and name it "Focused Inbox Override for Alerts". Set the condition to: If the sender\'s address matches domain/source.',
      'Set the action to: Modify the message properties > Set a message header. Set the header name string exactly to: X-MS-Exchange-Organization-BypassFocusedInbox and set the target value configuration parameter to true. Click Save.'
    ]
  },
  {
    code: 'EML-039',
    title: 'Winmail.dat Transport Neutral Encapsulation Format (TNEF) Attachment Issue',
    category: 'Email',
    subcategory: 'Attachments',
    audience: 'admin',
    difficulty: 'beginner',
    severity: 'medium',
    tags: 'outlook,email,winmail,tnef,attachment,format,external,smtp',
    estimatedResolutionTime: '5-10 min',
    symptoms: 'External non-Outlook business clients (e.g., vendors running Mac Mail or Gmail) complain that attachments sent by your corporate users show up as an unopenable file named winmail.dat instead of real PDFs or Office files.',
    cause: 'The local Outlook client sent rich-text formatted layouts using Microsoft-proprietary Transport Neutral Encapsulation Format (TNEF) structures over public SMTP pipelines that do not support Microsoft data packaging.',
    steps: [
      'Inside the user\'s Outlook desktop window workspace, navigate to File > Options > Mail.',
      'Locate the Compose messages section header block and ensure the Compose messages in this format: drop-down is set strictly to HTML or Plain Text.',
      'Scroll down further to the Message format options sub-section block.',
      'Find the configuration line reading: When sending messages in Rich Text format to Internet recipients: and change its drop-down value choice selection away from "Send using Outlook Rich Text format" to Convert to HTML format. Click OK to save.'
    ]
  },
  {
    code: 'EML-040',
    title: 'S/MIME Encryption Private Key/Certificate Expiration or Mismatch',
    category: 'Email',
    subcategory: 'Security & Encryption',
    audience: 'admin',
    difficulty: 'advanced',
    severity: 'high',
    tags: 'outlook,email,smime,encryption,certificate,pki,digital-id',
    estimatedResolutionTime: '20-30 min',
    symptoms: 'When attempting to view a cryptographically secured email asset, Outlook displays an absolute block notification stating: "Your digital ID name cannot be found by the underlying security system" or "An error occurred decrypting this message."',
    cause: 'The personal digital identity certificate or asymmetric cryptographic key pair stored within the endpoint workstation\'s local root certificate container has expired, or lacks the private key piece linked to the public certificate hash.',
    steps: [
      'Open the Run tool dialog, input certmgr.msc, and hit Enter to launch the local Windows certificate store interface console.',
      'Navigate downward into Personal > Certificates. Locate your active corporate identity security certificate and double-click it.',
      'Verify that the date parameters are currently valid and check for a small key emblem icon caption reading: "You have a private key that corresponds to this certificate."',
      'If missing or expired, request a fresh digital enrollment from the corporate PKI system. Import the current .pfx file backup containing both key sets.',
      'Inside Outlook, navigate to File > Options > Trust Center > Trust Center Settings > Email Security. Click Settings under Encrypted email and explicitly map the signing and encryption paths to the newly imported certificate.'
    ]
  },
  {
    code: 'EML-041',
    title: 'Client-Side vs Server-Side Mailbox Rules Processing Order Conflict',
    category: 'Email',
    subcategory: 'Mail Rules',
    audience: 'admin',
    difficulty: 'beginner',
    severity: 'medium',
    tags: 'outlook,email,rules,client-side,server-side,owa,mobile,automation',
    estimatedResolutionTime: '5-10 min',
    symptoms: 'Sorting and sorting automation rules function perfectly while the user\'s Outlook desktop software is running on their machine, but fail to execute when the user is away from their desk using OWA on a mobile device.',
    cause: 'The specific rule utilizes logical tracking parameters that require local application processing power to function (e.g., "move to folder on this computer only" or "play a custom sound path rule link").',
    steps: [
      'Click into Rules > Manage Rules & Alerts from the primary home application workspace panel inside Outlook.',
      'Review the rule summary list box grid. Identify any rules explicitly appended with text strings indicating: (Client-only).',
      'Select the problematic rule and click Change Rule > Edit Rule Settings.',
      'Step through the condition checkboxes and remove actions that depend on local file systems or paths.',
      'Ensure the destination folder target maps cleanly to a cloud-hosted folder structural branch within the core Exchange server database hierarchy rather than a local archive file path. Click Finish to save the configuration.'
    ]
  },
  {
    code: 'EML-042',
    title: 'Windows Search Indexing Broken in Outlook Desktop Client Interfaces',
    category: 'Email',
    subcategory: 'Search & Indexing',
    audience: 'admin',
    difficulty: 'intermediate',
    severity: 'medium',
    tags: 'outlook,email,search,indexing,windows-search,ost,registry',
    estimatedResolutionTime: '15-20 min',
    symptoms: 'Entering keywords into the Outlook search bar yields a "No matches found" result or a warning message stating: "Search indexing is paused" or "We\'re having trouble displaying search results right now."',
    cause: 'The system\'s Windows Search indexing service catalog has become corrupted, desynchronized, or detached from Outlook\'s active .ost database file locations.',
    steps: [
      'Open the Windows Control Panel, change the view setting to Large Icons, and click Indexing Options. Click the Advanced configuration properties button.',
      'Under the Troubleshooting section header block grid, click the Rebuild button. Confirm the warning popup prompt by selecting OK to clear and rewrite the system search catalog.',
      'If the issue remains after rebuilding, force a registry override to shift search processing away from Windows Search and over to Outlook\'s built-in search parser. Open Registry Editor and navigate to: HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\Windows Search',
      'Create a new DWORD (32-bit) Value named exactly PreventIndexingOutlook and set its Value Data string parameter to 1. Restart the computer workspace.'
    ]
  },
  // ===== TEAMS (TMS-043 to TMS-056) =====
  {
    code: 'TMS-043',
    title: 'Hardware Access Sandbox Permissions Blocking Camera and Microphone',
    category: 'Teams',
    subcategory: 'Audio & Video',
    audience: 'admin',
    difficulty: 'beginner',
    severity: 'high',
    tags: 'teams,camera,microphone,permissions,privacy,windows,macos',
    estimatedResolutionTime: '5-10 min',
    symptoms: 'User joins an enterprise Teams video call but finds the video camera and microphone toggle switch controls are greyed out or inactive. The application displays an alert bar reading: "We couldn\'t find a camera."',
    cause: 'The host operating system privacy sandbox security layers are denying the Microsoft Teams application execution package access to local hardware channels.',
    steps: [
      'On Windows systems: Open the Windows Settings app and navigate to Privacy & security > Camera. Ensure the master switch for Camera access is set to On, and verify Microsoft Teams is toggled to Allowed. Repeat under the Microphone settings.',
      'On macOS systems: Open System Settings > Privacy & Security > Camera. Toggle the slider switch next to Microsoft Teams to Allowed. Repeat under Microphone and Screen Recording.',
      'Exit Teams completely by right-clicking its icon in the system dock or taskbar tray, selecting Quit, and relaunching the software to apply the updated hardware access tokens.'
    ]
  },
  {
    code: 'TMS-044',
    title: 'Bluetooth Headset Peripheral Hardware Mute State Out of Sync with Teams UI',
    category: 'Teams',
    subcategory: 'Audio & Peripherals',
    audience: 'admin',
    difficulty: 'beginner',
    severity: 'medium',
    tags: 'teams,bluetooth,headset,mute,hid,jabra,poly,sync',
    estimatedResolutionTime: '5-10 min',
    symptoms: 'A user activates the physical mute button on their Bluetooth headset. The headset voice states "Mute On," but the Microsoft Teams user interface call screen continues to show the microphone icon as unmuted.',
    cause: 'Failure within the synchronized Human Interface Device (HID) peripheral channel links over older Bluetooth stack connections, breaking mutual call control state synchronization.',
    steps: [
      'Click into the triple dot options icon (...) next to your profile photo inside Teams and choose Settings > Devices.',
      'Under Audio devices, select the specific enterprise headset by its explicit hardware name, rather than generic options like "System Default."',
      'Scroll to the configuration parameter labeled Sync device buttons or App-controlled mute configurations and toggle the setting Off and back On to clear the HID handshake link.',
      'If the option remains broken, connect the headset to its proprietary enterprise USB wireless dongle link wrapper (e.g., Link 380 adapter) rather than pairing it via the native onboard laptop Bluetooth adapter.'
    ]
  },
  {
    code: 'TMS-045',
    title: 'Microsoft Teams WebView2 Core Subprocess Memory Leak and High CPU Usage',
    category: 'Teams',
    subcategory: 'Performance',
    audience: 'admin',
    difficulty: 'intermediate',
    severity: 'high',
    tags: 'teams,webview2,memory-leak,cpu,performance,cache,gpu',
    estimatedResolutionTime: '10-15 min',
    symptoms: 'Workstation cooling fans spin up to maximum speeds, system performance slows down, and Windows Task Manager displays dozens of individual Microsoft Teams and WebView2 background execution processes using massive amounts of RAM and CPU cycles.',
    cause: 'Memory management leaks within the Chromium-based WebView2 application shell framework, often triggered by rendering loops inside the hardware graphics acceleration subsystem.',
    steps: [
      'In the Microsoft Teams application window dashboard interface, click the settings options dots (...) and open Settings > General.',
      'Locate the configuration settings line checkbox labeled Disable GPU hardware acceleration. Check this box to turn off hardware acceleration rendering pipelines.',
      'Exit Teams completely by right-clicking the application icon in the taskbar tray and selecting Quit.',
      'Launch the Run dialog box (Win + R), paste this local cache folder cleanup path, and click OK: %localappdata%\\Packages\\MSTeams_8wekyb3d8bbwe\\LocalCache\\Microsoft\\MSTeams',
      'Select all folders and file entries within this target directory path and permanently delete them. Relaunch Teams.'
    ]
  },
  {
    code: 'TMS-046',
    title: 'Blank/Black Screen Video Output Stream During Desktop Screen-Sharing Sessions',
    category: 'Teams',
    subcategory: 'Screen Sharing',
    audience: 'admin',
    difficulty: 'intermediate',
    severity: 'high',
    tags: 'teams,screen-sharing,black-screen,hdcp,display,driver,monitor',
    estimatedResolutionTime: '5-10 min',
    symptoms: 'A presenter attempts to share their full desktop monitor space during a meeting. Audience members state they can only see a solid black box layout window or a spinning loading loop circle.',
    cause: 'The desktop composition graphics sub-layer fails to capture and transmit display frame overlays due to display topology errors, multi-monitor configuration issues, or HDCP video driver enforcement bugs.',
    steps: [
      'While actively presenting, click Stop Sharing, wait 5 seconds, and then click Share content again.',
      'Instead of choosing the option to share your full multi-monitor Screen, select the specific Window tab option to force the graphics pipeline to stream the application window directly.',
      'Force an immediate refresh of the operating system graphics driver processing system by executing this keyboard shortcut: Win + Ctrl + Shift + B.',
      'If presenting from a docked laptop connected to external monitors, disconnect the secondary monitors and use the primary integrated screen to isolate driver bugs.'
    ]
  },
  {
    code: 'TMS-047',
    title: 'Cross-Tenant Switching Identity Verification and Guest Access Loop',
    category: 'Teams',
    subcategory: 'Authentication',
    audience: 'admin',
    difficulty: 'intermediate',
    severity: 'high',
    tags: 'teams,cross-tenant,guest-access,mfa,token,aadsts50020,authentication',
    estimatedResolutionTime: '10-15 min',
    symptoms: 'When an employee attempts to switch over from their home corporate Teams view to an external vendor\'s partner guest tenant channel, they are caught in an endless loop of identity loading prompts or see error message AADSTS50020.',
    cause: 'Stale multi-factor authentication (MFA) validation cookies or token keys are cached in the local application web container shell, causing token mismatches across corporate boundaries.',
    steps: [
      'Click your profile avatar inside Teams and select Sign Out. Close the application completely.',
      'Clear cached web browser cookies linked to the Teams platform shell web targets. Open the Run box tool, navigate to %appdata%\\Microsoft\\Teams, and clear out any cached files inside the IndexedDB and Local Storage folders.',
      'Instead of using the generic tenant switching menu options inside the app, launch a specific direct-tenant targeting URL structure in your web browser to force clean routing: https://teams.microsoft.com/l/v2/?tenantId=[Insert_Target_External_Tenant_GUID_Here]',
      'Complete the multi-factor validation checks on this clean channel to renew cross-tenant guest access permissions.'
    ]
  },
  {
    code: 'TMS-048',
    title: 'Presence Status Engine Stuck on "In a Meeting" or "Out of Office"',
    category: 'Teams',
    subcategory: 'Presence & Status',
    audience: 'admin',
    difficulty: 'beginner',
    severity: 'low',
    tags: 'teams,presence,status,calendar,exchange,free-busy,sync',
    estimatedResolutionTime: '5-10 min',
    symptoms: 'The user\'s presence status indicator remains locked on an inaccurate status (e.g., showing red "In a meeting" or yellow "Away") long after meetings end or they return to actively typing at their desk.',
    cause: 'Synchronization failures between the Teams presence signaling engine and the upstream Exchange Online free/busy calendar database loop thread hooks.',
    steps: [
      'Click into your profile user avatar circle picture located at the upper border edge layout of the Teams application screen.',
      'Select the currently active status string option line and click the button labeled Reset Status.',
      'If the status remains stuck, open your Microsoft Outlook calendar dashboard interface.',
      'Create a short, manual 2-minute appointment entry block scheduled for the current time. Set its Show As: property field selector value strictly to Free.',
      'Save and close the appointment block. This forces the Exchange Online calendar server to broadcast a fresh free/busy scheduling metric update across the tenant, clearing the stuck Teams presence state.'
    ]
  },
  {
    code: 'TMS-049',
    title: 'OS Notification Daemon Disconnection Causing Delayed or Muted Activity Alerts',
    category: 'Teams',
    subcategory: 'Notifications',
    audience: 'admin',
    difficulty: 'beginner',
    severity: 'medium',
    tags: 'teams,notifications,alerts,focus-assist,do-not-disturb,sound,banner',
    estimatedResolutionTime: '5 min',
    symptoms: 'Direct chat messages and activity channel mentions arrive completely silently. No toast banner alert popups show up on screen, and no sound alerts play, causing users to miss high-priority communications.',
    cause: 'The background application alerting engine has lost its connection loop hooks with the operating system\'s native alert tracking engines (such as Focus Assist on Windows or Do Not Disturb on macOS).',
    steps: [
      'Click the triple dots options icon (...) in Teams and select Settings > Notifications.',
      'Locate the configuration setting option labeled Notification style.',
      'Change the drop-down selection away from Windows / Mac Native to Teams built-in. This shifts alert rendering handling inside the standalone application workspace shell, completely bypassing the operating system\'s alert tracking engines.',
      'Ensure that the options for Play sound for incoming calls and notifications is checked to On.'
    ]
  },
  {
    code: 'TMS-050',
    title: 'Town Hall / Live Event Video Production Bandwidth Drops via Local ISP Outages',
    category: 'Teams',
    subcategory: 'Live Events',
    audience: 'admin',
    difficulty: 'advanced',
    severity: 'critical',
    tags: 'teams,live-event,town-hall,bandwidth,qos,isp,network,streaming',
    estimatedResolutionTime: '5-15 min',
    symptoms: 'During a high-visibility corporate Town Hall broadcast or live stream presentation event, the presenter\'s video feed drops frames, stuttering audio occurs, or they experience sudden total disconnection from the broadcast layout engine.',
    cause: 'Quality of Service (QoS) bottlenecks, local network saturation, or upstream routing drops on the primary ISP connection path.',
    steps: [
      'Immediately connect the production presentation workstation to an alternative network path, such as an enterprise cellular mobile hotspot or a secondary wired fallback line. Teams media engines can dynamically reroute paths mid-stream without dropping the call session.',
      'Inside Teams meeting panel settings, click More > Device settings. Scroll down and toggle Media optimization configurations or change resolution parameters downwards from 1080p to 720p to lower necessary upload bitrates.',
      'Ensure network administrators have configured proper network traffic prioritization rules. Implement DSCP markings with Urgent Express Forwarding classifications targeted directly at Microsoft\'s global IP address ranges (EF / Hex 0x2e).'
    ]
  },
  {
    code: 'TMS-051',
    title: 'Application Local Cache Corruption (Transition Paths from Classic to New Teams)',
    category: 'Teams',
    subcategory: 'Cache & Performance',
    audience: 'admin',
    difficulty: 'intermediate',
    severity: 'high',
    tags: 'teams,cache,corruption,migration,classic-teams,new-teams,appx',
    estimatedResolutionTime: '10-15 min',
    symptoms: 'New Teams client hangs on authentication handshakes, displays out-of-sync roster channels, crashes on profile switching, or shows deep path exception errors following migration from Classic Teams.',
    cause: 'Stale application fragments, locked local state databases, or corrupt token schemas inside the %localappdata%\\Packages\\MSTeams_8wekyb3d8bbwe application container.',
    steps: [
      'Terminate all active MSTeams execution processes via script.',
      'Execute this unified cleanup routine via administrative PowerShell to purge user-profile caching silos: $TeamsPath = "$env:LOCALAPPDATA\\Packages\\MSTeams_8wekyb3d8bbwe"; if (Test-Path $TeamsPath) { Remove-Item -Path "$TeamsPath\\LocalCache\\Microsoft\\MSTeams\\*" -Recurse -Force -ErrorAction SilentlyContinue }',
      'Reset the core AppX package infrastructure constraints cleanly: Get-AppxPackage -Name "MSTeams" -AllUsers | Reset-AppxPackage',
      'Relaunch the application shell to pull fresh token sets from the Entra ID authorization gateway.'
    ]
  },
  {
    code: 'TMS-052',
    title: 'SIP Signaling/VoIP Call Drops During Local Network Roaming (Wi-Fi to Ethernet)',
    category: 'Teams',
    subcategory: 'Voice & Calls',
    audience: 'admin',
    difficulty: 'advanced',
    severity: 'high',
    tags: 'teams,voip,sip,call-drop,network-roaming,wifi,ethernet,udp',
    estimatedResolutionTime: '15-20 min',
    symptoms: 'Real-time audio or video presentation streams disconnect instantly with an unhandled network error when an endpoint physically connects to or disconnects from a wired Thunderbolt docking station cable mid-call.',
    cause: 'Operating system adapter interface metrics fail to transition active UDP socket handles gracefully, dropping real-time Session Initiation Protocol (SIP) signaling paths.',
    steps: [
      'Configure unified client interface metrics via Group Policy or Intune Proactive Remediations to give wired links absolute priority over wireless channels.',
      'Push an administrative script to enforce consistent interface metrics: Get-NetAdapter | Where-Object {$_.PhysicalMediaType -eq \'802.3\'} | Set-NetIPInterface -InterfaceMetric 5; Get-NetAdapter | Where-Object {$_.PhysicalMediaType -eq \'Native802.11\'} | Set-NetIPInterface -InterfaceMetric 25',
      'Ensure network firewalls are configured to keep session state tracking open for corporate UDP media ranges (3478-3481) for at least 30 seconds during path shifts.'
    ]
  },
  {
    code: 'TMS-053',
    title: 'Asynchronous Thread Chat Message Synchronization and Rendering Lag',
    category: 'Teams',
    subcategory: 'Messaging',
    audience: 'admin',
    difficulty: 'intermediate',
    severity: 'medium',
    tags: 'teams,chat,sync,lag,time-drift,ntp,message-order',
    estimatedResolutionTime: '10-15 min',
    symptoms: 'Message items display out of chronological order, typing indicators loop permanently, and sent items display a grey status icon for several minutes before failing to deliver.',
    cause: 'Time-drift variations greater than 500 milliseconds between the client endpoint clock and the atomic time clocks used by Microsoft\'s cloud routing layers.',
    steps: [
      'Enforce strict Active Directory Domain Controller time synchronization across endpoints via GPO.',
      'Configure the local Windows Time service (w32time) to use high-accuracy NTP tracking configurations: w32tm /config /manualpeerlist:"time.windows.com,0x9" /syncfromflags:manual /reliable:yes /update && net stop w32time && net start w32time && w32tm /resync /force',
      'Verify the client\'s current time offset against public strata servers using w32tm /query /status.'
    ]
  },
  {
    code: 'TMS-054',
    title: 'Background Blur / Virtual Avatar Media Pipeline Hardware Acceleration Crash',
    category: 'Teams',
    subcategory: 'Video & Camera',
    audience: 'admin',
    difficulty: 'intermediate',
    severity: 'high',
    tags: 'teams,background-blur,virtual-background,gpu,hardware-acceleration,avx2,crash',
    estimatedResolutionTime: '10-15 min',
    symptoms: 'Activating video streams or turning on background optimization filters causes the camera preview frame to freeze, flash green, or crash the main Teams application thread entirely.',
    cause: 'Integrated Intel/AMD graphics processing units utilizing legacy driver builds that crash when handling advanced AVX2 vector execution loops required by real-time AI background segmentation models.',
    steps: [
      'Package and deploy current OEM graphics driver configurations via Intune or SCCM.',
      'If the hardware cannot support real-time background processing loads, inject a global policy override into the client app preferences by modifying the local configuration file: {"disableGpuHardwareAcceleration":true}',
      'Force this setting value change across endpoints to shift AI image processing tasks away from unstable GPU pipelines.'
    ]
  },
  {
    code: 'TMS-055',
    title: 'PowerPoint Live Mode UI Freezes and Presentation Slide Stalls on Client End',
    category: 'Teams',
    subcategory: 'Presentations',
    audience: 'admin',
    difficulty: 'advanced',
    severity: 'high',
    tags: 'teams,powerpoint-live,presentation,proxy,ssl-inspection,websocket,freeze',
    estimatedResolutionTime: '15-20 min',
    symptoms: 'Presenter advances presentation slides smoothly on their screen, but audience members stay stuck on previous slides or experience frozen user interface layouts.',
    cause: 'Corporate SSL/TLS deep packet inspection proxies are intercepting and breaking the real-time WebSocket communication tracks utilized by PowerPoint Live to sync data states.',
    steps: [
      'Update corporate proxy configuration rules and edge firewall architectures to enforce absolute SSL inspection bypass rules for all core Microsoft 365 video and data traffic endpoints.',
      'Explicitly whitelist these specific real-time telemetry endpoints from deep packet inspection: *.events.data.microsoft.com, *.vortex.data.microsoft.com, *.teams.microsoft.com',
      'Ensure TCP ports 80/443 bypass proxy filtering to allow uninterrupted WebSocket connections.'
    ]
  },
  {
    code: 'TMS-056',
    title: 'Dial-Pad Disappearance in Client for Enterprise Voice / PSTN Licensed Users',
    category: 'Teams',
    subcategory: 'Voice & Calls',
    audience: 'admin',
    difficulty: 'advanced',
    severity: 'high',
    tags: 'teams,dial-pad,enterprise-voice,pstn,licensing,routing-policy,powershell',
    estimatedResolutionTime: '15-20 min',
    symptoms: 'The numeric dial-pad layout option is completely missing from the Calls tab interface, preventing users with explicit voice licensing options from placing external phone calls.',
    cause: 'Provisioning lag or profile sync mismatches within the tenant\'s online routing policies, or the EnterpriseVoiceEnabled flag is set to false on the user object.',
    steps: [
      'Open the Microsoft 365 Teams Admin PowerShell module and evaluate the user\'s explicit voice routing properties: Get-CsOnlineUser -Identity "user@company.com" | Select EnterpriseVoiceEnabled, VoiceRoutingPolicy, TenantDialPlan',
      'If the enterprise voice parameter flag returns false, force apply the correct voice configuration via script: Set-CsOnlineUser -Identity "user@company.com" -EnterpriseVoiceEnabled $true -HostedVoiceMail $true',
      'Force an immediate synchronization check against the global dial plan tables by re-granting the voice routing policy tracking links: Grant-CsOnlineVoiceRoutingPolicy -Identity "user@company.com" -PolicyName "Global-EnterpriseVoice"'
    ]
  },
  // ===== ONEDRIVE (ODV-057 to ODV-070) =====
  {
    code: 'ODV-057',
    title: 'Local Sync Engine Stuck Indefinitely Statusing "Processing changes"',
    category: 'OneDrive',
    subcategory: 'Sync Issues',
    audience: 'admin',
    difficulty: 'beginner',
    severity: 'high',
    tags: 'onedrive,sync,processing-changes,temp-file,reset,cloud-storage',
    estimatedResolutionTime: '10-15 min',
    symptoms: 'The system tray cloud icon animates endlessly, system memory usage spikes, and newly saved or modified files remain queued without uploading to cloud folders.',
    cause: 'A hidden temporary application or system tracking file (e.g., owner files prefixed with ~$) has entered a write-locked state, trapping the sync engine in a file scanning verification loop.',
    steps: [
      'Identify the problematic file path by querying the OneDrive local client tracking diagnostic logs.',
      'If the logs show the engine is trapped on an orphaned temporary file, execute a shell script to purge hidden temporary owner files across your organization\'s synced paths: del /F /S /Q /A:H "C:\\Users\\%username%\\OneDrive - Corporate\\~$*"',
      'Force a complete, non-destructive re-indexing sweep across the synchronization storage maps: %localappdata%\\Microsoft\\OneDrive\\onedrive.exe /reset'
    ]
  },
  {
    code: 'ODV-058',
    title: 'Local Conflict Resolution Forks During Multi-User Real-Time Co-Authoring',
    category: 'OneDrive',
    subcategory: 'Co-Authoring',
    audience: 'admin',
    difficulty: 'intermediate',
    severity: 'medium',
    tags: 'onedrive,conflict,co-authoring,duplicate,excel,word,sync',
    estimatedResolutionTime: '10-15 min',
    symptoms: 'Shared Word or Excel files duplicate themselves inside the sync directory, appending the local computer hostname to the filename (e.g., Budget_Plan-DESKTOP-01.xlsx).',
    cause: 'Mismatches between the Office Document Cache handler and the core OneDrive client engine when managing file state forks during a brief network connection drop.',
    steps: [
      'Deploy uniform OneDrive client configuration rules using the official administrative template ADMX files via Intune or Group Policy.',
      'Configure the setting policy Coauthor and share Office desktop apps to Enabled.',
      'Ensure the underlying companion registry keys are pushed to force synchronization tasks over to the main OneDrive client, preventing conflicting duplicate file forks: HKCU\\SOFTWARE\\Policies\\Microsoft\\OneDrive\\EnableCoauth = DWORD:1'
    ]
  },
  {
    code: 'ODV-059',
    title: 'Invalid ASCII Characters or Trailing Whitespace Spaces in Filenames',
    category: 'OneDrive',
    subcategory: 'File Naming',
    audience: 'admin',
    difficulty: 'intermediate',
    severity: 'medium',
    tags: 'onedrive,filename,characters,sharepoint,sync-error,ascii,whitespace',
    estimatedResolutionTime: '15-20 min',
    symptoms: 'The synchronization client generates continuous error flags, logging status descriptions like: "This file contains characters that aren\'t allowed" or "The path name contains trailing spaces."',
    cause: 'File or folder names contain restricted ASCII characters (", *, :, <, >, ?, /, \\, |) or trailing whitespaces that break compliance with SharePoint cloud storage rules.',
    steps: [
      'Run an automated remediation script across user profile directories to clean up and rename files with illegal characters or trailing whitespaces before migration: Get-ChildItem -Path "C:\\Users\\$env:username\\OneDrive - Corporate" -Recurse | Where-Object {$_.Name -match \'[\\\"\\*\\:\\<\\>\\?\\/\\\\\\|]|\\s+$\'} | ForEach-Object { $NewName = $_.Name -replace \'[\\\"\\*\\:\\<\\>\\?\\/\\\\\\|]\', \'_\' -replace \'\\s+$\', \'\'; Rename-Item -Path $_.FullName -NewName $NewName -Force }'
    ]
  },
  {
    code: 'ODV-060',
    title: 'OneDrive Files-on-Demand Local Hydration Blocked (NTFS Error 0x80070185)',
    category: 'OneDrive',
    subcategory: 'Files on Demand',
    audience: 'admin',
    difficulty: 'advanced',
    severity: 'high',
    tags: 'onedrive,files-on-demand,ntfs,0x80070185,cldflt,hydration,reparse-point',
    estimatedResolutionTime: '15-20 min',
    symptoms: 'Clicking a cloud-only file throws error code 0x80070185: "The cloud operation was unsuccessful." The file system filter driver fails to complete local file hydration requests.',
    cause: 'Severe metadata corruption within the local NTFS reparse point matrix, or a failure within the underlying file system filter driver (cldflt.sys).',
    steps: [
      'Open an elevated Command Prompt and clear out corrupt or hung attributes on the target directory path: attrib -r -s -h /s /d "C:\\Users\\%username%\\OneDrive - Corporate\\*.*"',
      'Re-register and balance the altitude priority values of the cloud file system filter driver: [HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Services\\CldFlt\\Instances\\CldFlt Instance] "Altitude"="180450"',
      'Force restart the driver subsystem via terminal: sc stop cldflt && sc start cldflt'
    ]
  },
  {
    code: 'ODV-061',
    title: 'Personal Tenant Storage Allocation Quota Threshold Reached',
    category: 'OneDrive',
    subcategory: 'Storage & Quota',
    audience: 'admin',
    difficulty: 'beginner',
    severity: 'high',
    tags: 'onedrive,storage,quota,sharepoint,admin,5tb,license',
    estimatedResolutionTime: '5-10 min',
    symptoms: 'Data synchronization tasks freeze across all corporate endpoints; user profiles display a warning block notification: "OneDrive storage is full. Uploads are paused."',
    cause: 'Total file consumption has breached the hard ceiling limits assigned to the user profile via corporate licensing profiles.',
    steps: [
      'Open the SharePoint Online Management Shell tool as a Global Admin.',
      'Increase the individual user\'s OneDrive cloud storage allocation space directly up to the 5TB licensing ceiling: Set-SPOSite -Identity "https://company-my.sharepoint.com/personal/user_company_com" -StorageQuota 5242880 -StorageQuotaWarningLevel 4928300',
      'Run an on-demand validation query via PowerShell to confirm that the updated storage quotas have successfully propagated across the tenant.'
    ]
  },
  {
    code: 'ODV-062',
    title: 'OneDrive Known Folder Move (KFM) Folder Redirection GPO / Intune Policy Block',
    category: 'OneDrive',
    subcategory: 'Known Folder Move',
    audience: 'admin',
    difficulty: 'advanced',
    severity: 'medium',
    tags: 'onedrive,kfm,known-folder-move,gpo,intune,folder-redirection,desktop,documents',
    estimatedResolutionTime: '15-20 min',
    symptoms: 'Attempts to enable folder redirection backups for Desktop, Documents, or Pictures fail with an error stating that organizational policies prevent folder protection.',
    cause: 'A registry path conflict caused by old Active Directory Group Policy Objects (GPOs) that are actively trying to route folder redirection paths to local file servers.',
    steps: [
      'Set legacy folder redirection Active Directory GPOs to "Disabled," and select the option to return data back to local user profile directories upon policy removal.',
      'Deploy an Intune Device Configuration profile utilizing the Settings Catalog to enforce Known Folder Move commands.',
      'Enforce the configuration parameter keys: Silently move Windows known folders to OneDrive, and add your explicit corporate tenant ID string to the policy payload to automate deployment.'
    ]
  },
  {
    code: 'ODV-063',
    title: 'Continuous Sync Cycles Triggered by Hidden OS Temporary System Files',
    category: 'OneDrive',
    subcategory: 'Sync Issues',
    audience: 'admin',
    difficulty: 'intermediate',
    severity: 'medium',
    tags: 'onedrive,sync,temp-files,developer,cache,node-modules,exclusion,bandwidth',
    estimatedResolutionTime: '10-15 min',
    symptoms: 'High local network bandwidth saturation combined with constant file scanning logs as the sync engine continuously syncs hidden application log files or local developer build caches.',
    cause: 'Third-party developer tools or active application logging engines are writing high-frequency file modifications directly inside synchronized directory structures.',
    steps: [
      'Open the OneDrive Admin portal or leverage Intune administrative configuration templates.',
      'Enable the policy parameter setting Exclude specific files from being synced.',
      'Input explicit file extension string rules and naming match patterns (e.g., .tmp, .log, node_modules, .git) to block the sync engine from tracking high-frequency developer cache files.'
    ]
  },
  {
    code: 'ODV-064',
    title: 'Anonymous Shared Link Expiration Policy Enforcement Overrides and Mismatches',
    category: 'OneDrive',
    subcategory: 'Sharing & Permissions',
    audience: 'admin',
    difficulty: 'intermediate',
    severity: 'medium',
    tags: 'onedrive,sharepoint,sharing-link,expiration,policy,external,vendor',
    estimatedResolutionTime: '10-15 min',
    symptoms: 'Sharing links sent to external vendors expire prematurely or fail validation checks earlier than the custom expiration dates selected by employees.',
    cause: 'Stricter tenant-level conditional sharing rules enforced at the organizational level are overriding user-selected link lifetimes.',
    steps: [
      'Connect to the SharePoint Online Admin Center.',
      'Navigate to Policies > Sharing, expand the advanced link properties panel, and set consistent values for maximum link lifetimes.',
      'To enforce compliance configurations uniformly via script, run: Set-SPOTenant -RequireAnonymousLinksExpireInDays 30 to set a 30-day maximum expiration policy across the tenant.'
    ]
  }
];

async function buildContent(art) {
  const stepsText = art.steps.map((s, i) => `${i + 1}. ${s}`).join('\n');
  return `## ${art.title}\n\n**Category:** ${art.category}${art.subcategory ? ` > ${art.subcategory}` : ''}\n**Article Code:** ${art.code}\n**Audience:** ${art.audience}\n**Difficulty:** ${art.difficulty}\n**Est. Resolution Time:** ${art.estimatedResolutionTime}\n\n### Symptoms\n${art.symptoms}\n\n### Root Cause\n${art.cause}\n\n### Resolution Steps\n${stepsText}`;
}

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  console.log(`Preparing to insert ${articles.length} tech/admin KB articles...`);
  
  let inserted = 0;
  let skipped = 0;
  
  for (const art of articles) {
    const content = await buildContent(art);
    
    // Check if article already exists by articleCode
    const [existing] = await conn.execute(
      'SELECT id FROM kbArticles WHERE articleCode = ?',
      [art.code]
    );
    
    if (existing.length > 0) {
      // Update existing article
      await conn.execute(
        `UPDATE kbArticles SET 
          title = ?, category = ?, subcategory = ?, content = ?, 
          tags = ?, audience = ?, difficulty = ?, estimatedResolutionTime = ?,
          ariaEnabled = 1, updatedAt = NOW()
         WHERE articleCode = ?`,
        [art.title, art.category, art.subcategory || null, content,
         art.tags, art.audience, art.difficulty, art.estimatedResolutionTime, art.code]
      );
      skipped++;
    } else {
      // Insert new article
      await conn.execute(
        `INSERT INTO kbArticles 
          (title, category, subcategory, content, tags, audience, difficulty, 
           estimatedResolutionTime, ariaEnabled, articleCode, isPublished, viewCount, ratingCount, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 1, 0, 0, NOW(), NOW())`,
        [art.title, art.category, art.subcategory || null, content,
         art.tags, art.audience, art.difficulty, art.estimatedResolutionTime, art.code]
      );
      inserted++;
    }
  }
  
  const [countResult] = await conn.execute('SELECT COUNT(*) as total FROM kbArticles WHERE isPublished = 1');
  
  console.log(`✅ Done! Inserted: ${inserted}, Updated: ${skipped}, Total: ${articles.length}`);
  console.log(`Total published KB articles in database: ${countResult[0].total}`);
  
  await conn.end();
}

main().catch(console.error);
