# FlexOrder Self-Hosted Runner Windows Service Installation
# Run this script as Administrator in PowerShell after registering the runner

param(
    [string]$RunnerPath = "C:\actions-runner",
    [string]$ServiceName = "GitHubActionsRunner-FlexOrder",
    [string]$ServiceDisplayName = "GitHub Actions Runner - FlexOrder CI",
    [string]$ServiceDescription = "Self-hosted GitHub Actions runner for FlexOrder CI/CD pipeline",
    [string]$ServiceUser = "NT AUTHORITY\SYSTEM",
    [switch]$Force = $false
)

$ErrorActionPreference = "Stop"

# Logging function
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $color = switch ($Level) {
        "INFO" { "Green" }
        "WARN" { "Yellow" }
        "ERROR" { "Red" }
        "SUCCESS" { "Cyan" }
        default { "White" }
    }
    Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $color
}

# Check if running as Administrator
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Check if service exists
function Test-ServiceExists {
    param([string]$Name)
    return (Get-Service -Name $Name -ErrorAction SilentlyContinue) -ne $null
}

# Install the runner as a Windows service
function Install-RunnerService {
    Write-Log "Installing GitHub Actions Runner as Windows Service..." "INFO"
    
    Push-Location $RunnerPath
    
    try {
        # Check if service already exists
        if (Test-ServiceExists -Name $ServiceName) {
            if ($Force) {
                Write-Log "Service already exists. Removing existing service..." "WARN"
                Uninstall-RunnerService
            } else {
                Write-Log "Service '$ServiceName' already exists. Use -Force to reinstall." "ERROR"
                return
            }
        }
        
        # Install the service using the runner's built-in command
        Write-Log "Installing service: $ServiceDisplayName" "INFO"
        
        $installArgs = @(
            "--name", $ServiceName,
            "--displayname", $ServiceDisplayName,
            "--description", $ServiceDescription
        )
        
        & .\svc.sh install @installArgs
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "Service installed successfully" "SUCCESS"
        } else {
            throw "Service installation failed with exit code: $LASTEXITCODE"
        }
        
        # Configure service properties
        Configure-ServiceProperties
        
        # Create service monitoring script
        Create-ServiceMonitor
        
    } catch {
        Write-Log "Failed to install service: $($_.Exception.Message)" "ERROR"
        throw
    } finally {
        Pop-Location
    }
}

# Configure service properties
function Configure-ServiceProperties {
    Write-Log "Configuring service properties..." "INFO"
    
    try {
        # Set service to start automatically
        Set-Service -Name $ServiceName -StartupType Automatic
        Write-Log "Set startup type to Automatic" "SUCCESS"
        
        # Configure service recovery options
        $recoveryScript = @"
sc failure "$ServiceName" reset= 86400 actions= restart/30000/restart/30000/restart/30000
sc failureflag "$ServiceName" 1
"@
        
        Invoke-Expression $recoveryScript
        Write-Log "Configured service recovery options" "SUCCESS"
        
        # Set service description with additional details
        $extendedDescription = @"
$ServiceDescription

This service runs the GitHub Actions self-hosted runner for FlexOrder CI/CD workflows.
- Repository: WPPOOL/flexorder-ci-workflow
- Runner Path: $RunnerPath
- Auto-restart: Enabled
- Log Path: $RunnerPath\logs

For support, contact the FlexOrder development team.
"@
        
        Set-Service -Name $ServiceName -Description $extendedDescription
        Write-Log "Updated service description" "SUCCESS"
        
    } catch {
        Write-Log "Failed to configure service properties: $($_.Exception.Message)" "WARN"
    }
}

# Create service monitoring script
function Create-ServiceMonitor {
    Write-Log "Creating service monitoring script..." "INFO"
    
    $monitorScript = @"
# FlexOrder Runner Service Monitor
# This script monitors the GitHub Actions runner service and restarts it if needed

param(
    [int]`$CheckIntervalSeconds = 300,  # 5 minutes
    [int]`$MaxRestartAttempts = 3,
    [switch]`$RunOnce = `$false
)

`$ServiceName = "$ServiceName"
`$LogPath = "$RunnerPath\logs\service-monitor.log"
`$RestartCount = 0

function Write-MonitorLog {
    param([string]`$Message)
    `$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    `$logEntry = "[`$timestamp] `$Message"
    Write-Host `$logEntry
    Add-Content -Path `$LogPath -Value `$logEntry
}

function Test-RunnerHealth {
    try {
        `$service = Get-Service -Name `$ServiceName -ErrorAction Stop
        
        if (`$service.Status -eq 'Running') {
            # Check if the runner process is actually working
            `$runnerProcesses = Get-Process -Name "Runner.Listener" -ErrorAction SilentlyContinue
            if (`$runnerProcesses) {
                Write-MonitorLog "Service health check: OK (Status: `$(`$service.Status), Processes: `$(`$runnerProcesses.Count))"
                return `$true
            } else {
                Write-MonitorLog "Service health check: FAILED (No runner processes found)"
                return `$false
            }
        } else {
            Write-MonitorLog "Service health check: FAILED (Status: `$(`$service.Status))"
            return `$false
        }
    } catch {
        Write-MonitorLog "Service health check: ERROR (`$(`$_.Exception.Message))"
        return `$false
    }
}

function Restart-RunnerService {
    Write-MonitorLog "Attempting to restart service (Attempt `$(`$RestartCount + 1)/`$MaxRestartAttempts)"
    
    try {
        Stop-Service -Name `$ServiceName -Force -ErrorAction Stop
        Start-Sleep -Seconds 10
        Start-Service -Name `$ServiceName -ErrorAction Stop
        
        Start-Sleep -Seconds 30  # Wait for service to fully start
        
        if (Test-RunnerHealth) {
            Write-MonitorLog "Service restarted successfully"
            `$script:RestartCount = 0
            return `$true
        } else {
            Write-MonitorLog "Service restart failed - health check still failing"
            return `$false
        }
    } catch {
        Write-MonitorLog "Service restart error: `$(`$_.Exception.Message)"
        return `$false
    }
}

# Main monitoring loop
Write-MonitorLog "FlexOrder Runner Service Monitor started"
Write-MonitorLog "Service: `$ServiceName"
Write-MonitorLog "Check interval: `$CheckIntervalSeconds seconds"
Write-MonitorLog "Max restart attempts: `$MaxRestartAttempts"

do {
    if (!(Test-RunnerHealth)) {
        if (`$RestartCount -lt `$MaxRestartAttempts) {
            `$RestartCount++
            if (!(Restart-RunnerService)) {
                Write-MonitorLog "Failed to restart service. Will retry on next check."
            }
        } else {
            Write-MonitorLog "Maximum restart attempts reached. Manual intervention required."
            Write-MonitorLog "Please check the service logs and restart manually if needed."
            `$RestartCount = 0  # Reset counter for next cycle
        }
    } else {
        `$RestartCount = 0  # Reset counter on successful health check
    }
    
    if (!`$RunOnce) {
        Start-Sleep -Seconds `$CheckIntervalSeconds
    }
    
} while (!`$RunOnce)

Write-MonitorLog "FlexOrder Runner Service Monitor stopped"
"@

    $monitorPath = "$RunnerPath\scripts\monitor-service.ps1"
    New-Item -ItemType Directory -Path "$RunnerPath\scripts" -Force | Out-Null
    Set-Content -Path $monitorPath -Value $monitorScript
    Write-Log "Service monitor script created: $monitorPath" "SUCCESS"
}

# Uninstall the runner service
function Uninstall-RunnerService {
    Write-Log "Uninstalling GitHub Actions Runner service..." "INFO"
    
    Push-Location $RunnerPath
    
    try {
        if (Test-ServiceExists -Name $ServiceName) {
            # Stop the service first
            Write-Log "Stopping service: $ServiceName" "INFO"
            Stop-Service -Name $ServiceName -Force -ErrorAction SilentlyContinue
            
            # Uninstall the service
            & .\svc.sh uninstall
            
            if ($LASTEXITCODE -eq 0) {
                Write-Log "Service uninstalled successfully" "SUCCESS"
            } else {
                Write-Log "Service uninstallation completed with warnings" "WARN"
            }
        } else {
            Write-Log "Service '$ServiceName' does not exist" "INFO"
        }
        
    } catch {
        Write-Log "Failed to uninstall service: $($_.Exception.Message)" "ERROR"
        throw
    } finally {
        Pop-Location
    }
}

# Start the runner service
function Start-RunnerService {
    Write-Log "Starting GitHub Actions Runner service..." "INFO"
    
    try {
        Start-Service -Name $ServiceName
        
        # Wait a moment and check status
        Start-Sleep -Seconds 10
        $service = Get-Service -Name $ServiceName
        
        if ($service.Status -eq 'Running') {
            Write-Log "Service started successfully" "SUCCESS"
            Write-Log "Service Status: $($service.Status)" "INFO"
            
            # Check runner processes
            Start-Sleep -Seconds 20
            $runnerProcesses = Get-Process -Name "Runner.Listener" -ErrorAction SilentlyContinue
            if ($runnerProcesses) {
                Write-Log "Runner processes detected: $($runnerProcesses.Count)" "SUCCESS"
            } else {
                Write-Log "Warning: No runner processes detected yet. This may be normal during startup." "WARN"
            }
        } else {
            Write-Log "Service failed to start. Status: $($service.Status)" "ERROR"
        }
        
    } catch {
        Write-Log "Failed to start service: $($_.Exception.Message)" "ERROR"
        throw
    }
}

# Stop the runner service
function Stop-RunnerService {
    Write-Log "Stopping GitHub Actions Runner service..." "INFO"
    
    try {
        Stop-Service -Name $ServiceName -Force
        Write-Log "Service stopped successfully" "SUCCESS"
        
    } catch {
        Write-Log "Failed to stop service: $($_.Exception.Message)" "ERROR"
        throw
    }
}

# Get service status
function Get-RunnerServiceStatus {
    Write-Log "GitHub Actions Runner Service Status:" "INFO"
    
    try {
        if (Test-ServiceExists -Name $ServiceName) {
            $service = Get-Service -Name $ServiceName
            Write-Log "Service Name: $($service.Name)" "INFO"
            Write-Log "Display Name: $($service.DisplayName)" "INFO"
            Write-Log "Status: $($service.Status)" "INFO"
            Write-Log "Start Type: $($service.StartType)" "INFO"
            
            # Check runner processes
            $runnerProcesses = Get-Process -Name "Runner.Listener" -ErrorAction SilentlyContinue
            if ($runnerProcesses) {
                Write-Log "Runner Processes: $($runnerProcesses.Count)" "SUCCESS"
                foreach ($process in $runnerProcesses) {
                    Write-Log "  PID: $($process.Id), CPU: $($process.CPU), Memory: $([math]::Round($process.WorkingSet64/1MB, 2)) MB" "INFO"
                }
            } else {
                Write-Log "Runner Processes: None" "WARN"
            }
            
            # Check recent logs
            $logPath = "$RunnerPath\_diag\Runner_*.log"
            $recentLogs = Get-ChildItem -Path $logPath -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
            if ($recentLogs) {
                Write-Log "Latest Log: $($recentLogs.Name) (Modified: $($recentLogs.LastWriteTime))" "INFO"
            }
            
        } else {
            Write-Log "Service '$ServiceName' is not installed" "ERROR"
        }
        
    } catch {
        Write-Log "Failed to get service status: $($_.Exception.Message)" "ERROR"
    }
}

# Create scheduled task for monitoring
function Create-MonitoringTask {
    Write-Log "Creating scheduled task for service monitoring..." "INFO"
    
    try {
        $taskName = "FlexOrder-Runner-Monitor"
        $scriptPath = "$RunnerPath\scripts\monitor-service.ps1"
        
        # Remove existing task if it exists
        Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
        
        # Create new task
        $action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-ExecutionPolicy Bypass -File `"$scriptPath`""
        $trigger = New-ScheduledTaskTrigger -AtStartup
        $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RunOnlyIfNetworkAvailable
        $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
        
        Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description "Monitor FlexOrder GitHub Actions Runner service health"
        
        Write-Log "Monitoring scheduled task created: $taskName" "SUCCESS"
        
    } catch {
        Write-Log "Failed to create monitoring task: $($_.Exception.Message)" "WARN"
    }
}

# Main execution
function Main {
    param([string]$Action = "install")
    
    Write-Log "FlexOrder Self-Hosted Runner Service Management" "INFO"
    Write-Log "Action: $Action" "INFO"
    Write-Log "Service Name: $ServiceName" "INFO"
    Write-Log "Runner Path: $RunnerPath" "INFO"
    
    if (!(Test-Administrator)) {
        Write-Log "This script must be run as Administrator. Please restart PowerShell as Administrator." "ERROR"
        exit 1
    }
    
    if (!(Test-Path $RunnerPath)) {
        Write-Log "Runner path does not exist: $RunnerPath" "ERROR"
        Write-Log "Please run the prerequisites setup and runner registration scripts first." "ERROR"
        exit 1
    }
    
    if (!(Test-Path "$RunnerPath\.runner")) {
        Write-Log "Runner is not configured. Please run the runner registration script first." "ERROR"
        exit 1
    }
    
    try {
        switch ($Action.ToLower()) {
            "install" {
                Install-RunnerService
                Create-MonitoringTask
                Start-RunnerService
                Get-RunnerServiceStatus
            }
            "uninstall" {
                Stop-RunnerService
                Uninstall-RunnerService
                Unregister-ScheduledTask -TaskName "FlexOrder-Runner-Monitor" -Confirm:$false -ErrorAction SilentlyContinue
            }
            "start" {
                Start-RunnerService
                Get-RunnerServiceStatus
            }
            "stop" {
                Stop-RunnerService
            }
            "restart" {
                Stop-RunnerService
                Start-Sleep -Seconds 5
                Start-RunnerService
                Get-RunnerServiceStatus
            }
            "status" {
                Get-RunnerServiceStatus
            }
            default {
                Write-Log "Invalid action: $Action" "ERROR"
                Write-Log "Valid actions: install, uninstall, start, stop, restart, status" "ERROR"
                exit 1
            }
        }
        
        Write-Log "Service management completed successfully" "SUCCESS"
        
    } catch {
        Write-Log "Service management failed: $($_.Exception.Message)" "ERROR"
        exit 1
    }
}

# Show usage if called without parameters or with help
if ($args -contains "-help" -or $args -contains "--help" -or $args -contains "/?" -or $args.Count -eq 0) {
    Write-Host @"
FlexOrder Self-Hosted Runner Windows Service Management

Usage:
    .\manage-service.ps1 [action] [options]

Actions:
    install     Install and start the runner service (default)
    uninstall   Stop and uninstall the runner service
    start       Start the runner service
    stop        Stop the runner service
    restart     Restart the runner service
    status      Show current service status

Options:
    -RunnerPath         Runner installation path (default: C:\actions-runner)
    -ServiceName        Windows service name (default: GitHubActionsRunner-FlexOrder)
    -ServiceDisplayName Service display name
    -Force              Force reinstallation if service exists

Examples:
    .\manage-service.ps1 install
    .\manage-service.ps1 start
    .\manage-service.ps1 status
    .\manage-service.ps1 uninstall

Notes:
    - This script must be run as Administrator
    - The runner must be registered before installing the service
    - The service will automatically restart on failure
    - Logs are stored in the runner directory
"@
    exit 0
}

# Run with the first argument as action
$action = if ($args.Count -gt 0) { $args[0] } else { "install" }
Main -Action $action