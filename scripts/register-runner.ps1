# FlexOrder Self-Hosted Runner Registration Script
# Run this script as Administrator in PowerShell after setting up prerequisites

param(
    [Parameter(Mandatory=$true)]
    [string]$GitHubToken,
    
    [Parameter(Mandatory=$true)]
    [string]$GitHubOrg = "WPPOOL",
    
    [Parameter(Mandatory=$true)]
    [string]$GitHubRepo = "flexorder-ci-workflow",
    
    [string]$RunnerPath = "C:\actions-runner",
    [string]$RunnerName = "$env:COMPUTERNAME-flexorder",
    [string]$RunnerLabels = "self-hosted,Windows,X64,flexorder,ci",
    [string]$RunnerGroup = "default"
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

# Download GitHub Actions runner
function Download-GitHubRunner {
    Write-Log "Downloading GitHub Actions runner..."
    
    # Get the latest runner version
    $apiUrl = "https://api.github.com/repos/actions/runner/releases/latest"
    $headers = @{
        "Authorization" = "token $GitHubToken"
        "Accept" = "application/vnd.github+json"
        "User-Agent" = "FlexOrder-Runner-Setup"
    }
    
    try {
        $release = Invoke-RestMethod -Uri $apiUrl -Headers $headers
        $latestVersion = $release.tag_name.TrimStart('v')
        Write-Log "Latest runner version: $latestVersion" "INFO"
        
        # Find Windows x64 asset
        $asset = $release.assets | Where-Object { $_.name -like "*win-x64*" }
        if (!$asset) {
            throw "Windows x64 runner not found in latest release"
        }
        
        $downloadUrl = $asset.browser_download_url
        $fileName = $asset.name
        $downloadPath = Join-Path $RunnerPath $fileName
        
        Write-Log "Downloading from: $downloadUrl" "INFO"
        Invoke-WebRequest -Uri $downloadUrl -OutFile $downloadPath -Headers $headers
        Write-Log "Downloaded: $downloadPath" "SUCCESS"
        
        # Extract the runner
        Write-Log "Extracting runner files..." "INFO"
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        [System.IO.Compression.ZipFile]::ExtractToDirectory($downloadPath, $RunnerPath)
        
        # Remove the zip file
        Remove-Item $downloadPath -Force
        Write-Log "Runner extracted successfully" "SUCCESS"
        
        return $latestVersion
        
    } catch {
        Write-Log "Failed to download runner: $($_.Exception.Message)" "ERROR"
        throw
    }
}

# Get registration token from GitHub
function Get-RegistrationToken {
    Write-Log "Getting registration token from GitHub..." "INFO"
    
    $tokenUrl = "https://api.github.com/repos/$GitHubOrg/$GitHubRepo/actions/runners/registration-token"
    $headers = @{
        "Authorization" = "token $GitHubToken"
        "Accept" = "application/vnd.github+json"
        "User-Agent" = "FlexOrder-Runner-Setup"
    }
    
    try {
        $response = Invoke-RestMethod -Uri $tokenUrl -Method Post -Headers $headers
        Write-Log "Registration token obtained" "SUCCESS"
        return $response.token
    } catch {
        Write-Log "Failed to get registration token: $($_.Exception.Message)" "ERROR"
        Write-Log "Please ensure your GitHub token has 'repo' and 'admin:org' permissions" "ERROR"
        throw
    }
}

# Configure the runner
function Configure-Runner {
    param([string]$RegistrationToken, [string]$RunnerVersion)
    
    Write-Log "Configuring GitHub Actions runner..." "INFO"
    
    $repoUrl = "https://github.com/$GitHubOrg/$GitHubRepo"
    
    # Change to runner directory
    Push-Location $RunnerPath
    
    try {
        # Run configuration
        $configArgs = @(
            "--url", $repoUrl,
            "--token", $RegistrationToken,
            "--name", $RunnerName,
            "--labels", $RunnerLabels,
            "--runnergroup", $RunnerGroup,
            "--work", "_work",
            "--unattended",
            "--replace"
        )
        
        Write-Log "Running configuration with the following parameters:" "INFO"
        Write-Log "  Repository: $repoUrl" "INFO"
        Write-Log "  Runner Name: $RunnerName" "INFO"
        Write-Log "  Labels: $RunnerLabels" "INFO"
        Write-Log "  Group: $RunnerGroup" "INFO"
        
        & .\config.cmd @configArgs
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "Runner configured successfully" "SUCCESS"
        } else {
            throw "Runner configuration failed with exit code: $LASTEXITCODE"
        }
        
    } catch {
        Write-Log "Runner configuration failed: $($_.Exception.Message)" "ERROR"
        throw
    } finally {
        Pop-Location
    }
}

# Create runner configuration file
function Create-RunnerConfig {
    Write-Log "Creating runner configuration file..." "INFO"
    
    $configContent = @"
# FlexOrder Self-Hosted Runner Configuration
# Generated on $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

[Runner]
Name=$RunnerName
Labels=$RunnerLabels
Group=$RunnerGroup
Path=$RunnerPath
Repository=$GitHubOrg/$GitHubRepo

[Environment]
NODE_ENV=test
CI=true
RUNNER_ENVIRONMENT=self-hosted
FLEXORDER_RUNNER=true

[Performance]
# Optimize for FlexOrder CI workloads
MaxConcurrentJobs=1
WorkspaceCleanup=true
TempCleanup=true

[Logging]
LogLevel=Info
LogRetentionDays=7
LogPath=$RunnerPath\logs

[Maintenance]
AutoUpdate=true
HealthCheckInterval=300
RestartOnError=true
"@

    $configPath = "$RunnerPath\flexorder-runner.config"
    Set-Content -Path $configPath -Value $configContent
    Write-Log "Runner configuration saved to: $configPath" "SUCCESS"
}

# Create startup script
function Create-StartupScript {
    Write-Log "Creating runner startup script..." "INFO"
    
    $startupScript = @"
@echo off
REM FlexOrder Self-Hosted Runner Startup Script
REM This script starts the GitHub Actions runner

echo Starting FlexOrder GitHub Actions Runner...
echo Timestamp: %DATE% %TIME%

REM Change to runner directory
cd /d "$RunnerPath"

REM Set environment variables
set NODE_ENV=test
set CI=true
set RUNNER_ENVIRONMENT=self-hosted
set FLEXORDER_RUNNER=true

REM Start the runner
echo Starting runner: $RunnerName
.\run.cmd

echo Runner stopped at %DATE% %TIME%
pause
"@

    $startupPath = "$RunnerPath\start-runner.cmd"
    Set-Content -Path $startupPath -Value $startupScript
    Write-Log "Startup script created: $startupPath" "SUCCESS"
}

# Test runner installation
function Test-RunnerInstallation {
    Write-Log "Testing runner installation..." "INFO"
    
    Push-Location $RunnerPath
    
    try {
        # Test if runner executable exists
        if (!(Test-Path ".\config.cmd")) {
            throw "Runner configuration executable not found"
        }
        
        if (!(Test-Path ".\run.cmd")) {
            throw "Runner execution file not found"
        }
        
        if (!(Test-Path ".\.runner")) {
            throw "Runner configuration file not found"
        }
        
        Write-Log "Runner installation test passed" "SUCCESS"
        
    } catch {
        Write-Log "Runner installation test failed: $($_.Exception.Message)" "ERROR"
        throw
    } finally {
        Pop-Location
    }
}

# Validate GitHub token permissions
function Test-GitHubToken {
    Write-Log "Validating GitHub token permissions..." "INFO"
    
    $headers = @{
        "Authorization" = "token $GitHubToken"
        "Accept" = "application/vnd.github+json"
        "User-Agent" = "FlexOrder-Runner-Setup"
    }
    
    try {
        # Test repository access
        $repoUrl = "https://api.github.com/repos/$GitHubOrg/$GitHubRepo"
        $repoInfo = Invoke-RestMethod -Uri $repoUrl -Headers $headers
        Write-Log "Repository access: OK" "SUCCESS"
        
        # Test runner registration endpoint
        $runnersUrl = "https://api.github.com/repos/$GitHubOrg/$GitHubRepo/actions/runners"
        $runnersInfo = Invoke-RestMethod -Uri $runnersUrl -Headers $headers
        Write-Log "Runners API access: OK" "SUCCESS"
        
        Write-Log "GitHub token validation passed" "SUCCESS"
        
    } catch {
        Write-Log "GitHub token validation failed: $($_.Exception.Message)" "ERROR"
        Write-Log "Please ensure your token has the following permissions:" "ERROR"
        Write-Log "  - repo (Full control of private repositories)" "ERROR"
        Write-Log "  - admin:org (Full control of organizations and teams)" "ERROR"
        throw
    }
}

# Main execution
function Main {
    Write-Log "Starting FlexOrder Self-Hosted Runner Registration" "INFO"
    Write-Log "Repository: $GitHubOrg/$GitHubRepo" "INFO"
    Write-Log "Runner Name: $RunnerName" "INFO"
    Write-Log "Runner Path: $RunnerPath" "INFO"
    
    if (!(Test-Administrator)) {
        Write-Log "This script must be run as Administrator. Please restart PowerShell as Administrator." "ERROR"
        exit 1
    }
    
    if (!(Test-Path $RunnerPath)) {
        Write-Log "Runner path does not exist: $RunnerPath" "ERROR"
        Write-Log "Please run the prerequisites setup script first." "ERROR"
        exit 1
    }
    
    try {
        # Validate inputs
        Test-GitHubToken
        
        # Download and extract runner
        $runnerVersion = Download-GitHubRunner
        
        # Get registration token
        $registrationToken = Get-RegistrationToken
        
        # Configure the runner
        Configure-Runner -RegistrationToken $registrationToken -RunnerVersion $runnerVersion
        
        # Create configuration and startup files
        Create-RunnerConfig
        Create-StartupScript
        
        # Test installation
        Test-RunnerInstallation
        
        Write-Log "Runner registration completed successfully!" "SUCCESS"
        Write-Log "Next steps:" "INFO"
        Write-Log "1. Install the runner as a Windows service using the service installation script" "INFO"
        Write-Log "2. Start the service to begin processing GitHub Actions workflows" "INFO"
        Write-Log "3. Monitor the runner status in your GitHub repository settings" "INFO"
        
        # Show runner status
        Write-Log "Runner Details:" "INFO"
        Write-Log "  Name: $RunnerName" "INFO"
        Write-Log "  Labels: $RunnerLabels" "INFO"
        Write-Log "  Path: $RunnerPath" "INFO"
        Write-Log "  Repository: https://github.com/$GitHubOrg/$GitHubRepo" "INFO"
        
    } catch {
        Write-Log "Runner registration failed: $($_.Exception.Message)" "ERROR"
        exit 1
    }
}

# Show usage if no token provided
if ([string]::IsNullOrEmpty($GitHubToken)) {
    Write-Host @"
FlexOrder Self-Hosted Runner Registration Script

Usage:
    .\register-runner.ps1 -GitHubToken <token> [options]

Required Parameters:
    -GitHubToken    GitHub Personal Access Token with repo and admin:org permissions

Optional Parameters:
    -GitHubOrg      GitHub organization (default: WPPOOL)
    -GitHubRepo     GitHub repository (default: flexorder-ci-workflow)
    -RunnerPath     Runner installation path (default: C:\actions-runner)
    -RunnerName     Runner name (default: COMPUTERNAME-flexorder)
    -RunnerLabels   Runner labels (default: self-hosted,Windows,X64,flexorder,ci)
    -RunnerGroup    Runner group (default: default)

Example:
    .\register-runner.ps1 -GitHubToken "ghp_xxxxxxxxxxxxxxxxxxxx"

To generate a GitHub token:
1. Go to GitHub.com -> Settings -> Developer settings -> Personal access tokens
2. Create a new token with the following permissions:
   - repo (Full control of private repositories)
   - admin:org (Full control of organizations and teams)
3. Copy the token and use it with this script
"@
    exit 1
}

# Run the registration
Main