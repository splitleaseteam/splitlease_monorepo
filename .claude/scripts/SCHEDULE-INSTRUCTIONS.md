# Scheduling Bulk Pricing List Fix for 4 AM EST

**Target Time:** January 30, 2026 at 4:00 AM EST

---

## Option 1: Task Scheduler GUI (Recommended)

1. Press `Win + R`, type `taskschd.msc`, press Enter
2. Click **Create Basic Task** in the right panel
3. Configure:
   - **Name:** `SplitLease-BulkPricingListFix`
   - **Description:** `Bulk fix for pricing_list records - 15M token budget`
   - **Trigger:** One time, at `1/30/2026 4:00:00 AM`
   - **Action:** Start a program
   - **Program:** `C:\Users\Split Lease\bulk-pricing-fix.bat`
4. Check **Open Properties dialog** before finishing
5. In Properties:
   - Check **Run with highest privileges**
   - Check **Run whether user is logged on or not** (optional)
   - Set **Configure for:** Windows 10

---

## Option 2: PowerShell (Run as Administrator)

Open PowerShell as Administrator and run:

```powershell
$Action = New-ScheduledTaskAction -Execute 'C:\Users\Split Lease\bulk-pricing-fix.bat'
$Trigger = New-ScheduledTaskTrigger -Once -At '2026-01-30 04:00:00'
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -WakeToRun
$Principal = New-ScheduledTaskPrincipal -UserId "$env:USERNAME" -LogonType Interactive -RunLevel Highest
Register-ScheduledTask -TaskName 'SplitLease-BulkPricingListFix' -Action $Action -Trigger $Trigger -Settings $Settings -Principal $Principal -Force
```

**IMPORTANT:** The `-WakeToRun` flag ensures the computer wakes from sleep to run the task.

---

## Option 3: schtasks Command (Run as Administrator)

Open Command Prompt as Administrator and run:

```cmd
schtasks /create /tn "SplitLease-BulkPricingListFix" /tr "C:\Users\Split Lease\bulk-pricing-fix.bat" /sc once /st 04:00 /sd 01/30/2026 /rl HIGHEST /f
```

---

## Verify Scheduled Task

After creating, verify with:

```powershell
Get-ScheduledTask -TaskName "SplitLease-BulkPricingListFix" | Format-List *
```

Or in Task Scheduler GUI, look for `SplitLease-BulkPricingListFix` in the task list.

---

## Files Created

| File | Purpose |
|------|---------|
| `C:\Users\Split Lease\bulk-pricing-fix.bat` | Launcher batch file |
| `.claude\scripts\bulk-pricing-fix-runner.ps1` | Main PowerShell script |
| `.claude\plans\New\20260129231500-bulk-pricing-list-execution-prompt.md` | Full prompt with instructions |

---

## Expected Execution

1. **4:00 AM EST** - Task starts
2. **4:01 AM** - Claude Code launches with 15M token budget
3. **4:05 AM** - Phase 1: Discovery (~500K tokens)
4. **4:15 AM - 6:00 AM** - Phase 2: Batch Processing (~12M tokens)
5. **6:00 AM - 6:30 AM** - Phase 3: Validation (~1.5M tokens)
6. **6:30 AM - 7:00 AM** - Phase 4: Reporting (~500K tokens)

---

## Manual Run (Testing)

To test the setup manually:

```cmd
cd "C:\Users\Split Lease\My Drive\!Agent Context and Tools\SL3\Split Lease"
.\.claude\scripts\bulk-pricing-fix-runner.ps1
```

---

## Logs Location

After execution, check logs at:
- `C:\Users\Split Lease\My Drive\!Agent Context and Tools\SL3\Split Lease\.claude\logs\`
