# FlexOrder Self-Hosted Runner Maintenance and Monitoring Suite
# This script provides comprehensive maintenance tools for the GitHub Actions runner

param(
    [string]$RunnerPath = "C:\actions-runner",
    [string]$ServiceName = "GitHubActionsRunner-FlexOrder",
    [int]$LogRetentionDays = 7,
    [switch]$AutoCleanup = $true,
    [switch]$UpdateRunner = $false,
    [switch]$GenerateReport = $true
)

$ErrorActionPreference = "Continue"  # Continue on errors for maintenance tasks

# Logging function with file output
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    
    $color = switch ($Level) {
        "INFO" { "Green" }
        "WARN" { "Yellow" }
        "ERROR" { "Red" }
        "SUCCESS" { "Cyan" }
        default { "White" }
    }
    
    Write-Host $logEntry -ForegroundColor $color
    
    # Also write to maintenance log file
    $logFile = "$RunnerPath\logs\maintenance-$(Get-Date -Format 'yyyy-MM').log"
    if (!(Test-Path "$RunnerPath\logs")) {
        New-Item -ItemType Directory -Path "$RunnerPath\logs" -Force | Out-Null
    }
    Add-Content -Path $logFile -Value $logEntry
}

# Check system resources
function Test-SystemResources {
    Write-Log "Checking system resources..." "INFO"
    
    try {
        # CPU usage (improved calculation)
        $cpu = Get-Counter '\Processor(_Total)\% Processor Time' -SampleInterval 1 -MaxSamples 3 | 
               Select-Object -ExpandProperty CounterSamples | 
               Measure-Object -Property CookedValue -Average
        $cpuUsage = [math]::Round($cpu.Average, 2)
        
        # Memory usage (more accurate)
        $memory = Get-CimInstance Win32_OperatingSystem
        $totalRAM = [math]::Round($memory.TotalVisibleMemorySize / 1MB, 2)
        $freeRAM = [math]::Round($memory.FreePhysicalMemory / 1MB, 2)
        $usedRAM = $totalRAM - $freeRAM
        $memoryUsage = [math]::Round(($usedRAM / $totalRAM) * 100, 2)
        
        # Disk space (check all drives)
        $disks = Get-CimInstance Win32_LogicalDisk | Where-Object { $_.DriveType -eq 3 }
        $diskInfo = @()
        
        foreach ($disk in $disks) {
            $totalDisk = [math]::Round($disk.Size / 1GB, 2)
            $freeDisk = [math]::Round($disk.FreeSpace / 1GB, 2)
            $diskUsage = [math]::Round((($totalDisk - $freeDisk) / $totalDisk) * 100, 2)
            
            $diskInfo += @{
                Drive = $disk.DeviceID
                Total = $totalDisk
                Free = $freeDisk
                UsagePercent = $diskUsage
            }
        }
        
        # Network connectivity check
        $networkStatus = "Unknown"
        try {
            $githubReach = Test-NetConnection -ComputerName "github.com" -Port 443 -WarningAction SilentlyContinue
            $networkStatus = if ($githubReach.TcpTestSucceeded) { "Connected" } else { "Limited" }
        } catch {
            $networkStatus = "Offline"
        }
        
        Write-Log "System Resources:" "INFO"
        Write-Log "  CPU Usage: $cpuUsage%" "INFO"
        Write-Log "  Memory Usage: $memoryUsage% ($usedRAM GB / $totalRAM GB)" "INFO"
        foreach ($disk in $diskInfo) {
            Write-Log "  Disk $($disk.Drive) Usage: $($disk.UsagePercent)% ($($disk.Free) GB free / $($disk.Total) GB)" "INFO"
        }
        Write-Log "  Network: $networkStatus" "INFO"
        
        # Check for resource warnings
        if ($cpuUsage -gt 80) {
            Write-Log "WARNING: High CPU usage detected ($cpuUsage%)" "WARN"
        }
        if ($memoryUsage -gt 85) {
            Write-Log "WARNING: High memory usage detected ($memoryUsage%)" "WARN"
        }
        foreach ($disk in $diskInfo) {
            if ($disk.UsagePercent -gt 90) {
                Write-Log "WARNING: Low disk space detected on $($disk.Drive) ($($disk.UsagePercent)%)" "WARN"
            }
        }
        if ($networkStatus -ne "Connected") {
            Write-Log "WARNING: Network connectivity issues detected" "WARN"
        }
        
        return @{
            CPU = $cpuUsage
            Memory = $memoryUsage
            Disks = $diskInfo
            Network = $networkStatus
            Status = "OK"
        }
        
    } catch {
        Write-Log "Failed to check system resources: $($_.Exception.Message)" "ERROR"
        return @{ Status = "ERROR" }
    }
}

# Clean up old logs and temporary files
function Invoke-LogCleanup {
    Write-Log "Performing log cleanup..." "INFO"
    
    try {
        $cleanupCount = 0
        
        # Clean runner logs
        $logPaths = @(
            "$RunnerPath\_diag\*.log",
            "$RunnerPath\logs\*.log",
            "$RunnerPath\_work\_temp\*"
        )
        
        foreach ($logPath in $logPaths) {
            $oldFiles = Get-ChildItem -Path $logPath -ErrorAction SilentlyContinue | 
                        Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$LogRetentionDays) }
            
            foreach ($file in $oldFiles) {
                try {
                    Remove-Item $file.FullName -Force
                    $cleanupCount++
                    Write-Log "Removed old file: $($file.Name)" "INFO"
                } catch {
                    Write-Log "Failed to remove file: $($file.Name)" "WARN"
                }
            }
        }
        
        # Clean Windows temp files related to runner
        $tempPath = "$env:TEMP\*playwright*", "$env:TEMP\*npm*", "$env:TEMP\*node*"
        foreach ($temp in $tempPath) {
            $tempFiles = Get-ChildItem -Path $temp -ErrorAction SilentlyContinue | 
                         Where-Object { $_.LastWriteTime -lt (Get-Date).AddHours(-2) }
            
            foreach ($file in $tempFiles) {
                try {
                    Remove-Item $file.FullName -Recurse -Force
                    $cleanupCount++
                } catch {
                    # Silently continue for temp file cleanup
                }
            }
        }
        
        Write-Log "Log cleanup completed. Removed $cleanupCount files." "SUCCESS"
        
    } catch {
        Write-Log "Log cleanup failed: $($_.Exception.Message)" "ERROR"
    }
}

# Check runner service health
function Test-RunnerHealth {
    Write-Log "Checking runner service health..." "INFO"
    
    try {
        $healthReport = @{}
        
        # Check service status
        $service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
        if ($service) {
            $healthReport.ServiceStatus = $service.Status
            Write-Log "Service Status: $($service.Status)" "INFO"
            
            if ($service.Status -eq 'Running') {
                # Check runner processes
                $runnerProcesses = Get-Process -Name "Runner.Listener" -ErrorAction SilentlyContinue
                $healthReport.ProcessCount = $runnerProcesses.Count
                
                if ($runnerProcesses) {
                    Write-Log "Runner processes: $($runnerProcesses.Count)" "SUCCESS"
                    
                    # Check process health (memory, CPU)
                    $totalMemory = ($runnerProcesses | Measure-Object -Property WorkingSet64 -Sum).Sum / 1MB
                    $healthReport.MemoryUsage = [math]::Round($totalMemory, 2)
                    Write-Log "Runner memory usage: $([math]::Round($totalMemory, 2)) MB" "INFO"
                    
                } else {
                    Write-Log "No runner processes found!" "ERROR"
                    $healthReport.ProcessCount = 0
                }
            }
        } else {
            Write-Log "Service not found!" "ERROR"
            $healthReport.ServiceStatus = "NotFound"
        }
        
        # Check recent activity
        $logFiles = Get-ChildItem -Path "$RunnerPath\_diag\Runner_*.log" -ErrorAction SilentlyContinue | 
                   Sort-Object LastWriteTime -Descending | Select-Object -First 1
        
        if ($logFiles) {
            $lastActivity = $logFiles.LastWriteTime
            $healthReport.LastActivity = $lastActivity
            $timeSinceActivity = (Get-Date) - $lastActivity
            
            Write-Log "Last activity: $lastActivity ($([math]::Round($timeSinceActivity.TotalMinutes, 1)) minutes ago)" "INFO"
            
            if ($timeSinceActivity.TotalHours -gt 2) {
                Write-Log "WARNING: No recent activity detected" "WARN"
            }
        }
        
        return $healthReport
        
    } catch {
        Write-Log "Runner health check failed: $($_.Exception.Message)" "ERROR"
        return @{ Status = "ERROR" }
    }
}

# Update runner to latest version
function Update-Runner {
    if (!$UpdateRunner) {
        Write-Log "Runner update skipped (use -UpdateRunner to enable)" "INFO"
        return
    }
    
    Write-Log "Checking for runner updates..." "INFO"
    
    try {
        # Get current version
        Push-Location $RunnerPath
        $currentVersion = "Unknown"
        
        if (Test-Path "bin\Runner.Listener.exe") {
            $currentVersion = (Get-Item "bin\Runner.Listener.exe").VersionInfo.ProductVersion
        }
        
        Write-Log "Current runner version: $currentVersion" "INFO"
        
        # Check latest version from GitHub API
        $apiUrl = "https://api.github.com/repos/actions/runner/releases/latest"
        $release = Invoke-RestMethod -Uri $apiUrl
        $latestVersion = $release.tag_name.TrimStart('v')
        
        Write-Log "Latest runner version: $latestVersion" "INFO"
        
        if ($currentVersion -ne $latestVersion) {
            Write-Log "Update available! Please run the registration script to update." "WARN"
            Write-Log "Manual update required to ensure proper configuration." "WARN"
        } else {
            Write-Log "Runner is up to date" "SUCCESS"
        }
        
        Pop-Location
        
    } catch {
        Write-Log "Failed to check for updates: $($_.Exception.Message)" "ERROR"
        if (Get-Location | Where-Object { $_.Path -eq $RunnerPath }) {
            Pop-Location
        }
    }
}

# Check Docker and containers health
function Test-DockerHealth {
    Write-Log "Checking Docker health..." "INFO"
    
    try {
        # Check Docker service
        $dockerService = Get-Service -Name "Docker Desktop Service" -ErrorAction SilentlyContinue
        if (!$dockerService) {
            $dockerService = Get-Service -Name "Docker" -ErrorAction SilentlyContinue
        }
        
        if ($dockerService) {
            Write-Log "Docker service status: $($dockerService.Status)" "INFO"
            
            if ($dockerService.Status -eq 'Running') {
                # Test Docker functionality
                try {
                    $dockerVersion = docker --version
                    Write-Log "Docker version: $dockerVersion" "SUCCESS"
                    
                    # Check running containers
                    $containers = docker ps --format "table {{.Names}}\t{{.Status}}" 2>$null
                    if ($containers) {
                        Write-Log "Running containers:" "INFO"
                        $containers -split "`n" | ForEach-Object {
                            Write-Log "  $_" "INFO"
                        }
                    } else {
                        Write-Log "No running containers" "INFO"
                    }
                    
                } catch {
                    Write-Log "Docker command failed: $($_.Exception.Message)" "ERROR"
                }
            }
        } else {
            Write-Log "Docker service not found" "WARN"
        }
        
    } catch {
        Write-Log "Docker health check failed: $($_.Exception.Message)" "ERROR"
    }
}

# Generate maintenance report
function New-MaintenanceReport {
    if (!$GenerateReport) {
        return
    }
    
    Write-Log "Generating maintenance report..." "INFO"
    
    try {
        $reportData = @{
            Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            SystemResources = Test-SystemResources
            RunnerHealth = Test-RunnerHealth
            MaintenanceActions = @()
        }
        
        # Add system info
        $computerInfo = Get-ComputerInfo
        $reportData.SystemInfo = @{
            ComputerName = $env:COMPUTERNAME
            OS = $computerInfo.WindowsProductName
            Version = $computerInfo.WindowsVersion
            TotalRAM = [math]::Round($computerInfo.TotalPhysicalMemory / 1GB, 2)
            Processor = $computerInfo.CsProcessors[0].Name
        }
        
        # Save report
        $reportPath = "$RunnerPath\logs\maintenance-report-$(Get-Date -Format 'yyyy-MM-dd-HHmm').json"
        $reportData | ConvertTo-Json -Depth 3 | Set-Content -Path $reportPath
        
        Write-Log "Maintenance report saved: $reportPath" "SUCCESS"
        
        # Create summary
        Write-Log "=== MAINTENANCE SUMMARY ===" "INFO"
        Write-Log "Computer: $($reportData.SystemInfo.ComputerName)" "INFO"
        Write-Log "OS: $($reportData.SystemInfo.OS)" "INFO"
        Write-Log "CPU: $($reportData.SystemResources.CPU)%" "INFO"
        Write-Log "Memory: $($reportData.SystemResources.Memory)%" "INFO"
        Write-Log "Disk: $($reportData.SystemResources.Disk)%" "INFO"
        Write-Log "Service: $($reportData.RunnerHealth.ServiceStatus)" "INFO"
        Write-Log "Processes: $($reportData.RunnerHealth.ProcessCount)" "INFO"
        Write-Log "=============================" "INFO"
        
    } catch {
        Write-Log "Failed to generate maintenance report: $($_.Exception.Message)" "ERROR"
    }
}

# Restart runner service if needed
function Restart-RunnerIfNeeded {
    Write-Log "Checking if runner restart is needed..." "INFO"
    
    try {
        $service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
        
        if (!$service) {
            Write-Log "Service not found - cannot restart" "ERROR"
            return
        }
        
        if ($service.Status -ne 'Running') {
            Write-Log "Service is not running - attempting to start..." "WARN"
            Start-Service -Name $ServiceName
            Start-Sleep -Seconds 10
            
            $service = Get-Service -Name $ServiceName
            if ($service.Status -eq 'Running') {
                Write-Log "Service started successfully" "SUCCESS"
            } else {
                Write-Log "Failed to start service" "ERROR"
            }
            return
        }
        
        # Check if processes are healthy
        $runnerProcesses = Get-Process -Name "Runner.Listener" -ErrorAction SilentlyContinue
        if (!$runnerProcesses) {
            Write-Log "No runner processes found - restarting service..." "WARN"
            Restart-Service -Name $ServiceName
            Start-Sleep -Seconds 15
            
            $newProcesses = Get-Process -Name "Runner.Listener" -ErrorAction SilentlyContinue
            if ($newProcesses) {
                Write-Log "Service restarted successfully" "SUCCESS"
            } else {
                Write-Log "Service restart failed - manual intervention needed" "ERROR"
            }
        } else {
            Write-Log "Runner processes are healthy - no restart needed" "SUCCESS"
        }
        
    } catch {
        Write-Log "Failed to check/restart runner: $($_.Exception.Message)" "ERROR"
    }
}

# Main maintenance function
function Invoke-MaintenanceTasks {
    Write-Log "Starting FlexOrder Runner Maintenance..." "INFO"
    Write-Log "Runner Path: $RunnerPath" "INFO"
    Write-Log "Service Name: $ServiceName" "INFO"
    
    try {
        # System health check
        Test-SystemResources | Out-Null
        
        # Runner health check
        Test-RunnerHealth | Out-Null
        
        # Docker health check
        Test-DockerHealth
        
        # Cleanup tasks
        if ($AutoCleanup) {
            Invoke-LogCleanup
        }
        
        # Check for updates
        Update-Runner
        
        # Restart if needed
        Restart-RunnerIfNeeded
        
        # Generate report
        New-MaintenanceReport
        
        Write-Log "Maintenance tasks completed successfully" "SUCCESS"
        
    } catch {
        Write-Log "Maintenance tasks failed: $($_.Exception.Message)" "ERROR"
    }
}

# Create scheduled task for automatic maintenance
function New-MaintenanceScheduledTask {
    Write-Log "Creating scheduled maintenance task..." "INFO"
    
    try {
        $taskName = "FlexOrder-Runner-Maintenance"
        $scriptPath = $PSCommandPath
        
        # Remove existing task
        Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
        
        # Create new task - runs daily at 2 AM
        $action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-ExecutionPolicy Bypass -File `"$scriptPath`" -AutoCleanup -GenerateReport"
        $trigger = New-ScheduledTaskTrigger -Daily -At "2:00AM"
        $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
        $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
        
        Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description "Daily maintenance for FlexOrder GitHub Actions Runner"
        
        Write-Log "Maintenance scheduled task created: $taskName" "SUCCESS"
        Write-Log "Task will run daily at 2:00 AM" "INFO"
        
    } catch {
        Write-Log "Failed to create scheduled maintenance task: $($_.Exception.Message)" "ERROR"
    }
}

# Show usage
if ($args -contains "-help" -or $args -contains "--help" -or $args -contains "/?") {
    Write-Host @"
FlexOrder Self-Hosted Runner Maintenance Script

Usage:
    .\maintenance.ps1 [options]

Options:
    -RunnerPath          Runner installation path (default: C:\actions-runner)
    -ServiceName         Service name (default: GitHubActionsRunner-FlexOrder)
    -LogRetentionDays    Log retention period (default: 7 days)
    -AutoCleanup         Enable automatic cleanup (default: true)
    -UpdateRunner        Check for runner updates (default: false)
    -GenerateReport      Generate maintenance report (default: true)

Special Commands:
    .\maintenance.ps1 -CreateScheduledTask    Create scheduled maintenance task

Examples:
    .\maintenance.ps1                         # Run basic maintenance
    .\maintenance.ps1 -UpdateRunner          # Include update check
    .\maintenance.ps1 -CreateScheduledTask   # Setup automated maintenance

This script performs:
    - System resource monitoring
    - Runner service health checks
    - Log cleanup and maintenance
    - Docker health verification
    - Automatic service restart if needed
    - Maintenance reporting
"@
    exit 0
}

# Handle special commands
if ($args -contains "-CreateScheduledTask") {
    New-MaintenanceScheduledTask
    exit 0
}

# Run main maintenance
Invoke-MaintenanceTasks