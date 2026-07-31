# FlexOrder Self-Hosted Runner Setup - Prerequisites Installation
# Run this script as Administrator in PowerShell

param(
    [string]$RunnerPath = "C:\actions-runner",
    [string]$NodeVersion = "18.20.4",
    [string]$GitVersion = "2.42.0",
    [switch]$SkipDocker = $false,
    [switch]$Force = $false
)

# Set execution policy and error handling
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
$ErrorActionPreference = "Stop"

# Enhanced logging with file output and performance metrics
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
    
    # Also write to setup log file
    $logDir = "$env:TEMP\FlexOrder-Setup-Logs"
    if (!(Test-Path $logDir)) {
        New-Item -ItemType Directory -Path $logDir -Force | Out-Null
    }
    $logFile = "$logDir\setup-$(Get-Date -Format 'yyyy-MM-dd').log"
    Add-Content -Path $logFile -Value $logEntry
}

# Check if running as Administrator
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Create directory structure
function Initialize-Directories {
    Write-Log "Creating directory structure..."
    
    $directories = @(
        $RunnerPath,
        "$RunnerPath\logs",
        "$RunnerPath\scripts",
        "$RunnerPath\workspace",
        "C:\FlexOrder-CI"
    )
    
    foreach ($dir in $directories) {
        if (!(Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-Log "Created directory: $dir" "SUCCESS"
        } else {
            Write-Log "Directory already exists: $dir" "INFO"
        }
    }
}

# Install Chocolatey package manager
function Install-Chocolatey {
    Write-Log "Checking Chocolatey installation..."
    
    if (!(Get-Command choco -ErrorAction SilentlyContinue)) {
        Write-Log "Installing Chocolatey..."
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        
        # Refresh environment variables
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        
        Write-Log "Chocolatey installed successfully" "SUCCESS"
    } else {
        Write-Log "Chocolatey is already installed" "INFO"
    }
}

# Install Node.js
function Install-NodeJS {
    Write-Log "Checking Node.js installation..."
    
    $nodeInstalled = Get-Command node -ErrorAction SilentlyContinue
    if (!$nodeInstalled -or $Force) {
        Write-Log "Installing Node.js $NodeVersion..."
        choco install nodejs --version=$NodeVersion -y --force
        
        # Refresh PATH
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        
        Write-Log "Node.js installed successfully" "SUCCESS"
    } else {
        $nodeVersion = node --version
        Write-Log "Node.js is already installed: $nodeVersion" "INFO"
    }
    
    # Install global npm packages
    Write-Log "Installing global npm packages..."
    npm install -g npm@latest
    npm install -g cross-env
    npm install -g typescript
    npm install -g ts-node
    
    Write-Log "Global npm packages installed" "SUCCESS"
}

# Install Git
function Install-Git {
    Write-Log "Checking Git installation..."
    
    $gitInstalled = Get-Command git -ErrorAction SilentlyContinue
    if (!$gitInstalled -or $Force) {
        Write-Log "Installing Git..."
        choco install git -y --force
        
        # Refresh PATH
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        
        Write-Log "Git installed successfully" "SUCCESS"
    } else {
        $gitVersion = git --version
        Write-Log "Git is already installed: $gitVersion" "INFO"
    }
}

# Install Docker Desktop (optional)
function Install-Docker {
    if ($SkipDocker) {
        Write-Log "Skipping Docker installation as requested" "WARN"
        return
    }
    
    Write-Log "Checking Docker installation..."
    
    $dockerInstalled = Get-Command docker -ErrorAction SilentlyContinue
    if (!$dockerInstalled -or $Force) {
        Write-Log "Installing Docker Desktop..."
        
        # Download Docker Desktop installer
        $dockerUrl = "https://desktop.docker.com/win/stable/Docker%20Desktop%20Installer.exe"
        $dockerInstaller = "$env:TEMP\DockerDesktopInstaller.exe"
        
        Write-Log "Downloading Docker Desktop installer..."
        Invoke-WebRequest -Uri $dockerUrl -OutFile $dockerInstaller
        
        Write-Log "Installing Docker Desktop (this may take a few minutes)..."
        Start-Process -FilePath $dockerInstaller -ArgumentList "install --quiet --accept-license" -Wait
        
        Remove-Item $dockerInstaller -Force
        
        Write-Log "Docker Desktop installed. Please restart your computer and enable WSL2 if prompted." "SUCCESS"
        Write-Log "After restart, run: docker --version to verify installation" "INFO"
    } else {
        $dockerVersion = docker --version
        Write-Log "Docker is already installed: $dockerVersion" "INFO"
    }
}

# Install additional tools
function Install-AdditionalTools {
    Write-Log "Installing additional development tools..."
    
    $tools = @(
        "curl",
        "jq",
        "7zip",
        "powershell-core"
    )
    
    foreach ($tool in $tools) {
        Write-Log "Installing $tool..."
        choco install $tool -y --ignore-checksums
    }
    
    Write-Log "Additional tools installed" "SUCCESS"
}

# Configure Windows Defender exclusions
function Configure-WindowsDefender {
    Write-Log "Configuring Windows Defender exclusions for better performance..."
    
    $exclusions = @(
        $RunnerPath,
        "C:\FlexOrder-CI",
        "C:\Users\$env:USERNAME\.npm",
        "C:\Users\$env:USERNAME\AppData\Local\Temp"
    )
    
    foreach ($exclusion in $exclusions) {
        try {
            Add-MpPreference -ExclusionPath $exclusion
            Write-Log "Added Windows Defender exclusion: $exclusion" "SUCCESS"
        } catch {
            Write-Log "Failed to add exclusion for: $exclusion" "WARN"
        }
    }
}

# Install .NET Framework (required for GitHub Actions runner)
function Install-DotNetFramework {
    Write-Log "Checking .NET Framework installation..."
    
    # Check if .NET Framework 4.6.2 or higher is installed
    $dotNetVersion = Get-ItemProperty "HKLM:SOFTWARE\Microsoft\NET Framework Setup\NDP\v4\Full\" -Name Release -ErrorAction SilentlyContinue
    
    if (!$dotNetVersion -or $dotNetVersion.Release -lt 394802) {
        Write-Log "Installing .NET Framework 4.8..."
        choco install dotnetfx -y
        Write-Log ".NET Framework installed" "SUCCESS"
    } else {
        Write-Log ".NET Framework is already installed" "INFO"
    }
}

# Create environment configuration
function Create-EnvironmentConfig {
    Write-Log "Creating environment configuration..."
    
    $configContent = @"
# FlexOrder CI Self-Hosted Runner Environment Configuration
# Generated on $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

# Runner Configuration
RUNNER_PATH=$RunnerPath
RUNNER_WORKSPACE=$RunnerPath\workspace
RUNNER_LOGS=$RunnerPath\logs

# Node.js Configuration
NODE_VERSION=$NodeVersion
NPM_CONFIG_CACHE=C:\npm-cache

# Git Configuration
GIT_TERMINAL_PROMPT=0
GIT_ASKPASS=echo

# Performance Optimizations
FORCE_COLOR=1
CI=true
NODE_ENV=test

# FlexOrder Specific
FLEXORDER_CI_ENV=self-hosted
FLEXORDER_RUNNER_TYPE=windows

# Docker Configuration (if installed)
COMPOSE_DOCKER_CLI_BUILD=1
DOCKER_BUILDKIT=1
"@

    $configPath = "$RunnerPath\environment.config"
    Set-Content -Path $configPath -Value $configContent
    Write-Log "Environment configuration saved to: $configPath" "SUCCESS"
}

# Validate installation
function Test-Installation {
    Write-Log "Validating installation..."
    
    $tests = @{
        "Node.js" = { node --version }
        "npm" = { npm --version }
        "Git" = { git --version }
        "PowerShell Core" = { pwsh --version }
        "curl" = { curl --version }
    }
    
    if (!$SkipDocker) {
        $tests["Docker"] = { docker --version }
    }
    
    $allPassed = $true
    foreach ($test in $tests.GetEnumerator()) {
        try {
            $result = & $test.Value
            Write-Log "$($test.Key): OK" "SUCCESS"
        } catch {
            Write-Log "$($test.Key): FAILED" "ERROR"
            $allPassed = $false
        }
    }
    
    if ($allPassed) {
        Write-Log "All prerequisites installed successfully!" "SUCCESS"
    } else {
        Write-Log "Some prerequisites failed to install. Please check the errors above." "ERROR"
        exit 1
    }
}

# Main execution
function Main {
    Write-Log "Starting FlexOrder Self-Hosted Runner Prerequisites Setup" "INFO"
    Write-Log "Target runner path: $RunnerPath" "INFO"
    Write-Log "Node.js version: $NodeVersion" "INFO"
    
    if (!(Test-Administrator)) {
        Write-Log "This script must be run as Administrator. Please restart PowerShell as Administrator." "ERROR"
        exit 1
    }
    
    try {
        Initialize-Directories
        Install-Chocolatey
        Install-DotNetFramework
        Install-NodeJS
        Install-Git
        Install-AdditionalTools
        
        if (!$SkipDocker) {
            Install-Docker
        }
        
        Configure-WindowsDefender
        Create-EnvironmentConfig
        Test-Installation
        
        Write-Log "Prerequisites setup completed successfully!" "SUCCESS"
        Write-Log "Next steps:" "INFO"
        Write-Log "1. If Docker was installed, restart your computer" "INFO"
        Write-Log "2. Run the runner registration script" "INFO"
        Write-Log "3. Install the runner as a Windows service" "INFO"
        
    } catch {
        Write-Log "Setup failed: $($_.Exception.Message)" "ERROR"
        exit 1
    }
}

# Run the setup
Main