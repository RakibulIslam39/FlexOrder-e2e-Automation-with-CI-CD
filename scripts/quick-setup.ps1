# FlexOrder Self-Hosted Runner - Quick Setup Script
# Run this script as Administrator on your Windows PC
# This script automates the entire setup process in one go

param(
    [Parameter(Mandatory=$false)]
    [string]$GitHubToken = ""
)

$ErrorActionPreference = "Stop"

# Colors and formatting
function Write-Header {
    param([string]$Message)
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "  $Message" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan
}

function Write-Step {
    param([string]$Message)
    Write-Host "➜ $Message" -ForegroundColor Yellow
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Error-Message {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Blue
}

# Check if running as Administrator
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Main setup process
function Main {
    Write-Header "FlexOrder Self-Hosted Runner - Quick Setup"
    
    Write-Info "This script will set up your Windows PC as a GitHub Actions runner for FlexOrder CI/CD"
    Write-Info "Estimated time: 10-15 minutes (depending on download speeds)"
    Write-Host ""
    
    # Check administrator privileges
    if (!(Test-Administrator)) {
        Write-Error-Message "This script must be run as Administrator"
        Write-Info "Please right-click PowerShell and select 'Run as Administrator'"
        exit 1
    }
    
    Write-Success "Running as Administrator ✓"
    Write-Host ""
    
    # Get GitHub token if not provided
    if ([string]::IsNullOrEmpty($GitHubToken)) {
        Write-Header "GitHub Token Required"
        Write-Info "You need a GitHub Personal Access Token with the following permissions:"
        Write-Info "  • repo (Full control of private repositories)"
        Write-Info "  • workflow (Update GitHub Action workflows)"
        Write-Info "  • admin:org (Full control of organizations and teams)"
        Write-Host ""
        Write-Info "To create a token:"
        Write-Info "  1. Go to: https://github.com/settings/tokens/new"
        Write-Info "  2. Select the scopes mentioned above"
        Write-Info "  3. Click 'Generate token'"
        Write-Info "  4. Copy the token"
        Write-Host ""
        
        $GitHubToken = Read-Host "Enter your GitHub Personal Access Token"
        
        if ([string]::IsNullOrEmpty($GitHubToken)) {
            Write-Error-Message "GitHub token is required"
            exit 1
        }
    }
    
    # Confirm setup
    Write-Header "Setup Confirmation"
    Write-Info "Repository: WPPOOL/flexorder-ci-workflow"
    Write-Info "Runner Path: C:\actions-runner"
    Write-Info "Computer Name: $env:COMPUTERNAME"
    Write-Host ""
    
    $confirm = Read-Host "Continue with setup? (Y/N)"
    if ($confirm -ne "Y" -and $confirm -ne "y") {
        Write-Info "Setup cancelled by user"
        exit 0
    }
    
    try {
        # Step 1: Install Prerequisites
        Write-Header "Step 1/4: Installing Prerequisites"
        Write-Step "Installing Chocolatey, Node.js, Git, Docker, and other tools..."
        
        $scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
        & "$scriptPath\setup-prerequisites.ps1"
        
        if ($LASTEXITCODE -ne 0) {
            throw "Prerequisites installation failed"
        }
        
        Write-Success "Prerequisites installed successfully"
        Write-Host ""
        
        # Check if Docker was just installed
        $dockerJustInstalled = $false
        $dockerInstalled = Get-Command docker -ErrorAction SilentlyContinue
        if ($dockerInstalled) {
            try {
                docker info 2>&1 | Out-Null
                if ($LASTEXITCODE -ne 0) {
                    $dockerJustInstalled = $true
                }
            } catch {
                $dockerJustInstalled = $true
            }
        }
        
        if ($dockerJustInstalled) {
            Write-Info "Docker was just installed. You may need to:"
            Write-Info "  1. Restart your computer"
            Write-Info "  2. Start Docker Desktop manually"
            Write-Info "  3. Enable WSL2 if prompted"
            Write-Info "  4. Re-run this script after Docker is running"
            Write-Host ""
            
            $continueAnyway = Read-Host "Continue anyway? (Y/N)"
            if ($continueAnyway -ne "Y" -and $continueAnyway -ne "y") {
                Write-Info "Please restart and run this script again"
                exit 0
            }
        }
        
        # Step 2: Register Runner
        Write-Header "Step 2/4: Registering GitHub Actions Runner"
        Write-Step "Downloading and configuring the runner..."
        
        & "$scriptPath\register-runner.ps1" -GitHubToken $GitHubToken
        
        if ($LASTEXITCODE -ne 0) {
            throw "Runner registration failed"
        }
        
        Write-Success "Runner registered successfully"
        Write-Host ""
        
        # Step 3: Install as Service
        Write-Header "Step 3/4: Installing Runner as Windows Service"
        Write-Step "Configuring the runner to start automatically with Windows..."
        
        & "$scriptPath\manage-service.ps1" -InstallService
        
        if ($LASTEXITCODE -ne 0) {
            throw "Service installation failed"
        }
        
        Write-Success "Service installed successfully"
        Write-Host ""
        
        # Step 4: Start Service
        Write-Header "Step 4/4: Starting Runner Service"
        Write-Step "Starting the GitHub Actions runner..."
        
        & "$scriptPath\manage-service.ps1" -StartService
        
        if ($LASTEXITCODE -ne 0) {
            throw "Service start failed"
        }
        
        Write-Success "Service started successfully"
        Write-Host ""
        
        # Step 5: Install Playwright (if project exists)
        $projectPath = Split-Path -Parent $scriptPath
        if (Test-Path "$projectPath\package.json") {
            Write-Header "Bonus: Installing Playwright Browsers"
            Write-Step "Installing Playwright browsers for testing..."
            
            Push-Location $projectPath
            try {
                npm ci --prefer-offline --no-audit
                npx playwright install --with-deps chromium
                Write-Success "Playwright installed successfully"
            } catch {
                Write-Info "Playwright installation had some issues, but that's okay"
                Write-Info "You can install it manually later with: npx playwright install --with-deps chromium"
            } finally {
                Pop-Location
            }
            Write-Host ""
        }
        
        # Success summary
        Write-Header "🎉 Setup Complete!"
        Write-Host ""
        Write-Success "Your Windows PC is now a GitHub Actions runner!"
        Write-Host ""
        Write-Info "Runner Details:"
        Write-Info "  Name: $env:COMPUTERNAME-flexorder"
        Write-Info "  Path: C:\actions-runner"
        Write-Info "  Repository: https://github.com/WPPOOL/flexorder-ci-workflow"
        Write-Host ""
        Write-Info "Verify in GitHub:"
        Write-Info "  👉 https://github.com/WPPOOL/flexorder-ci-workflow/settings/actions/runners"
        Write-Info "  You should see your runner with a green 'Idle' status"
        Write-Host ""
        Write-Info "Next Steps:"
        Write-Info "  1. Verify the runner appears in GitHub (link above)"
        Write-Info "  2. Push code or trigger a workflow to test"
        Write-Info "  3. Monitor execution in the Actions tab"
        Write-Host ""
        Write-Info "Service Management Commands:"
        Write-Info "  Check status:  .\manage-service.ps1 -ServiceStatus"
        Write-Info "  Restart:       .\manage-service.ps1 -RestartService"
        Write-Info "  View logs:     .\manage-service.ps1 -ViewLogs"
        Write-Info "  Maintenance:   .\maintenance.ps1"
        Write-Host ""
        
        # Open GitHub in browser
        $openGitHub = Read-Host "Open GitHub runners page in browser? (Y/N)"
        if ($openGitHub -eq "Y" -or $openGitHub -eq "y") {
            Start-Process "https://github.com/WPPOOL/flexorder-ci-workflow/settings/actions/runners"
        }
        
        Write-Header "Setup Completed Successfully!"
        
    } catch {
        Write-Host ""
        Write-Header "⚠️  Setup Failed"
        Write-Error-Message "Error: $($_.Exception.Message)"
        Write-Host ""
        Write-Info "Troubleshooting:"
        Write-Info "  1. Check the error message above"
        Write-Info "  2. View logs: $env:TEMP\FlexOrder-Setup-Logs\"
        Write-Info "  3. Try running each step manually:"
        Write-Info "     - .\setup-prerequisites.ps1"
        Write-Info "     - .\register-runner.ps1 -GitHubToken 'YOUR_TOKEN'"
        Write-Info "     - .\manage-service.ps1 -InstallService"
        Write-Info "     - .\manage-service.ps1 -StartService"
        Write-Host ""
        exit 1
    }
}

# Show usage if help requested
if ($args -contains "-h" -or $args -contains "--help" -or $args -contains "/?") {
    Write-Host @"
FlexOrder Self-Hosted Runner - Quick Setup Script

USAGE:
    .\quick-setup.ps1 [-GitHubToken <token>]

PARAMETERS:
    -GitHubToken    Your GitHub Personal Access Token (optional - will prompt if not provided)

EXAMPLES:
    # Interactive setup (will prompt for token)
    .\quick-setup.ps1

    # Automated setup with token
    .\quick-setup.ps1 -GitHubToken "ghp_xxxxxxxxxxxxxxxxxxxx"

REQUIREMENTS:
    • Windows 10/11 (64-bit)
    • Administrator privileges
    • Internet connection
    • GitHub Personal Access Token with repo and admin:org permissions

WHAT THIS SCRIPT DOES:
    1. Installs prerequisites (Chocolatey, Node.js, Git, Docker, etc.)
    2. Downloads and configures GitHub Actions runner
    3. Installs runner as Windows service
    4. Starts the runner service
    5. Installs Playwright browsers

For more information, see: docs/self-hosted-runner-setup.md
"@
    exit 0
}

# Run the setup
Main

