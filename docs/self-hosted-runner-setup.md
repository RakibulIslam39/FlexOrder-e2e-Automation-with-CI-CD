# FlexOrder Self-Hosted GitHub Actions Runner Setup Guide

This comprehensive guide will help you set up a self-hosted GitHub Actions runner on your Windows PC to replace GitHub-hosted runners and eliminate billing issues.

## 📋 Prerequisites

### System Requirements
- **Operating System**: Windows 10/11 (64-bit)
- **Processor**: Intel i3-8100 CPU or equivalent
- **Memory**: 8GB RAM minimum
- **Storage**: 50GB free disk space
- **Network**: Stable internet connection
- **Administrator Access**: Required for service installation

### Required Software
- PowerShell 5.1 or later (built into Windows)
- Git for Windows
- Internet access for downloading components

## 🚀 Quick Start (5-Minute Setup)

Follow these steps in order to get your self-hosted runner operational:

**Choose Your Setup Method:**
- **Option A**: Automated setup using our PowerShell scripts (Recommended)
- **Option B**: Manual setup using GitHub's commands (Advanced users)

---

### Method A: Automated Setup (Recommended)

### Step 1: Download Setup Scripts

Clone or download the repository to your Windows PC:

```powershell
# Option 1: Using Git
git clone https://github.com/WPPOOL/flexorder-ci-workflow.git
cd flexorder-ci-workflow

# Option 2: Download ZIP and extract
# Then navigate to the extracted folder in PowerShell
```

### Step 2: Run Prerequisites Installation

**Open PowerShell as Administrator** and run:

```powershell
# Navigate to scripts folder
cd scripts

# Set execution policy (if needed)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Run prerequisites installation
.\setup-prerequisites.ps1
```

This script will automatically install:
- Chocolatey package manager
- Node.js and npm
- Docker Desktop
- Git (if not present)
- Playwright browsers
- Configure Windows Defender exclusions

**Reboot your PC** when the script completes to ensure all installations are properly configured.

### Step 3: Register the Runner

After reboot, open PowerShell as Administrator again:

```powershell
# Navigate back to scripts folder
cd path\to\flexorder-ci-workflow\scripts

# Option 1: Use our automated script (Recommended)
.\register-runner.ps1 -GitHubToken "YOUR_GITHUB_TOKEN_HERE" -Repository "WPPOOL/flexorder-ci-workflow"

# Option 2: Manual GitHub commands (if you prefer)
# Create actions-runner folder
mkdir C:\actions-runner; cd C:\actions-runner

# Download the latest runner package
Invoke-WebRequest -Uri https://github.com/actions/runner/releases/download/v2.328.0/actions-runner-win-x64-2.328.0.zip -OutFile actions-runner-win-x64-2.328.0.zip

# Optional: Validate the hash
if((Get-FileHash -Path actions-runner-win-x64-2.328.0.zip -Algorithm SHA256).Hash.ToUpper() -ne 'a73ae192b8b2b782e1d90c08923030930b0b96ed394fe56413a073cc6f694877'.ToUpper()){ throw 'Computed checksum did not match' }

# Extract the installer
Add-Type -AssemblyName System.IO.Compression.FileSystem ; [System.IO.Compression.ZipFile]::ExtractToDirectory("$PWD/actions-runner-win-x64-2.328.0.zip", "$PWD")

# Create the runner and start the configuration experience
./config.cmd --url https://github.com/WPPOOL/flexorder-ci-workflow --token YOUR_REGISTRATION_TOKEN
```

**⚠️ Important**: If using manual commands, you'll need to get a fresh registration token from:
Repository → Settings → Actions → Runners → New self-hosted runner

### Step 4: Install as Windows Service

```powershell
# Install and start the service
.\manage-service.ps1 -InstallService

# Verify service is running
.\manage-service.ps1 -ServiceStatus
```

### Step 5: Verify Setup

```powershell
# Run health check
.\maintenance.ps1

# Check service status
Get-Service -Name "GitHubActionsRunner-FlexOrder"
```

---

### Method B: Manual Setup (GitHub's Official Commands)

If you prefer to follow GitHub's exact commands:

### Step 1: Install Prerequisites Manually

```powershell
# Install Chocolatey
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install Node.js, Docker, Git
choco install nodejs docker-desktop git -y

# Install Playwright
npm install -g playwright
npx playwright install
```

### Step 2: Download and Configure Runner

```powershell
# Create a folder under the drive root (GitHub recommendation)
mkdir C:\actions-runner; cd C:\actions-runner

# Download the latest runner package
Invoke-WebRequest -Uri https://github.com/actions/runner/releases/download/v2.328.0/actions-runner-win-x64-2.328.0.zip -OutFile actions-runner-win-x64-2.328.0.zip

# Optional: Validate the hash
if((Get-FileHash -Path actions-runner-win-x64-2.328.0.zip -Algorithm SHA256).Hash.ToUpper() -ne 'a73ae192b8b2b782e1d90c08923030930b0b96ed394fe56413a073cc6f694877'.ToUpper()){ throw 'Computed checksum did not match' }

# Extract the installer
Add-Type -AssemblyName System.IO.Compression.FileSystem ; [System.IO.Compression.ZipFile]::ExtractToDirectory("$PWD/actions-runner-win-x64-2.328.0.zip", "$PWD")

# Configure the runner (get token from GitHub → Repository → Settings → Actions → Runners → New self-hosted runner)
./config.cmd --url https://github.com/WPPOOL/flexorder-ci-workflow --token YOUR_REGISTRATION_TOKEN

# Install as service
./svc.cmd install

# Start the service
./svc.cmd start
```

### Step 3: Verify Manual Setup

```powershell
# Check service status
Get-Service -Name "actions.runner.WPPOOL-flexorder-ci-workflow.*"

# Test runner
./run.cmd --once
```

---

## 🔧 Detailed Setup Instructions

### GitHub Repository Setup

1. **Generate Personal Access Token** (for automated script):
   - Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Click "Generate new token (classic)"
   - Select scopes: `repo`, `workflow`, `admin:org` (if organization)
   - Copy the token - you'll need it for registration

2. **Get Registration Token** (for manual setup):
   - Go to Repository → Settings → Actions → Runners
   - Click "New self-hosted runner"
   - Select "Windows" and "x64"
   - Copy the registration token from the configure section

3. **Repository Configuration**:
   - Ensure you have admin access to the repository
   - The runner will appear in: Repository → Settings → Actions → Runners
   - If using GitHub App tokens for private repositories, ensure the app has access to:
     - `flexorder` (main plugin repository)
     - `flexorder-ultimate` (pro plugin repository)  
     - `flexorder-ci-workflow` (this CI repository)

### Prerequisites Installation Details

The `setup-prerequisites.ps1` script performs these actions:

```powershell
# What the script does:
# 1. Installs Chocolatey package manager
# 2. Installs Node.js 18+ and npm
# 3. Installs Docker Desktop
# 4. Installs Git if missing
# 5. Installs Playwright browsers globally
# 6. Configures Windows Defender exclusions
# 7. Sets up environment variables
# 8. Verifies all installations

# Manual installation commands (if script fails):
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

choco install nodejs docker-desktop git -y
npm install -g playwright
npx playwright install
```

### Runner Registration Details

The `register-runner.ps1` script:

```powershell
# Parameters:
# -GitHubToken: Your GitHub personal access token
# -Repository: Repository name (format: owner/repo-name)
# -RunnerName: Custom runner name (optional)
# -Labels: Additional labels (optional)

# Example usage:
.\register-runner.ps1 -GitHubToken "ghp_xxxxxxxxxxxx" -Repository "WPPOOL/flexorder-ci-workflow" -RunnerName "FlexOrder-Windows-PC" -Labels @("windows", "docker", "playwright")

# The script will:
# 1. Download latest GitHub Actions runner
# 2. Get registration token from GitHub API
# 3. Configure the runner
# 4. Test the configuration
# 5. Prepare for service installation
```

### Service Management Details

The `manage-service.ps1` script provides complete service lifecycle management:

```powershell
# Install service
.\manage-service.ps1 -InstallService

# Start service
.\manage-service.ps1 -StartService

# Stop service
.\manage-service.ps1 -StopService

# Restart service
.\manage-service.ps1 -RestartService

# Uninstall service
.\manage-service.ps1 -UninstallService

# Check service status
.\manage-service.ps1 -ServiceStatus

# View service logs
.\manage-service.ps1 -ViewLogs

# Monitor service (continuous)
.\manage-service.ps1 -MonitorService
```

## 🔍 Maintenance and Monitoring

### Regular Maintenance

Run weekly maintenance:

```powershell
# Basic maintenance
.\maintenance.ps1

# Include update check
.\maintenance.ps1 -UpdateRunner

# Custom log retention
.\maintenance.ps1 -LogRetentionDays 14
```

### Automated Maintenance

Set up automated daily maintenance:

```powershell
# Create scheduled task for daily 2 AM maintenance
.\maintenance.ps1 -CreateScheduledTask
```

### Health Monitoring

Check runner health anytime:

```powershell
# Quick health check
.\maintenance.ps1 -GenerateReport

# View system resources
Get-Process -Name "Runner.Listener" | Select-Object ProcessName, CPU, WorkingSet64
Get-Service -Name "GitHubActionsRunner-FlexOrder"

# Check disk space
Get-WmiObject -Class Win32_LogicalDisk | Where-Object {$_.DriveType -eq 3} | Select-Object DeviceID, @{Name="Size(GB)";Expression={[math]::Round($_.Size/1GB,2)}}, @{Name="FreeSpace(GB)";Expression={[math]::Round($_.FreeSpace/1GB,2)}}
```

## 🐛 Troubleshooting

### Common Issues and Solutions

#### 1. Service Won't Start
```powershell
# Check service status
Get-Service -Name "GitHubActionsRunner-FlexOrder"

# Check service logs
Get-EventLog -LogName Application -Source "GitHubActionsRunner-FlexOrder" -Newest 10

# Reinstall service
.\manage-service.ps1 -UninstallService
.\manage-service.ps1 -InstallService
```

#### 2. Docker Issues
```powershell
# Restart Docker
Restart-Service -Name "Docker Desktop Service"

# Test Docker
docker run hello-world

# Check Docker logs
docker system events
```

#### 3. Node.js/NPM Issues
```powershell
# Check Node.js installation
node --version
npm --version

# Reinstall if needed
choco uninstall nodejs -y
choco install nodejs -y
```

#### 4. Playwright Issues
```powershell
# Reinstall Playwright browsers
npx playwright install --force

# Check Playwright installation
npx playwright --version
npx playwright install-deps
```

#### 5. Runner Registration Issues
```powershell
# Check GitHub token permissions
# Token needs: repo, workflow, admin:org (for org repos)

# Remove and re-register runner
cd C:\actions-runner
.\config.cmd remove --token YOUR_REMOVAL_TOKEN
.\register-runner.ps1 -GitHubToken "YOUR_TOKEN" -Repository "WPPOOL/flexorder-ci-workflow"
```

### Log File Locations

Important log files for troubleshooting:

```
C:\actions-runner\_diag\Runner_*.log          # Runner execution logs
C:\actions-runner\logs\maintenance-*.log      # Maintenance script logs
C:\actions-runner\_work\_temp\                # Temporary workflow files
Windows Event Logs → Application             # Service-related logs
```

### Performance Monitoring

Monitor runner performance:

```powershell
# Resource usage
Get-Process -Name "Runner.Listener" | Format-Table ProcessName, CPU, @{Name="Memory(MB)";Expression={[math]::Round($_.WorkingSet64/1MB,2)}}

# Network connectivity
Test-NetConnection github.com -Port 443
Test-NetConnection api.github.com -Port 443

# Disk I/O
Get-Counter "\PhysicalDisk(_Total)\Disk Read Bytes/sec", "\PhysicalDisk(_Total)\Disk Write Bytes/sec"
```

## 📊 CI Workflow Configuration

Your CI workflow has been updated to work with the self-hosted runner:

### Using Your Self-Hosted Runner

In your workflow YAML files, use:
```yaml
# Use this YAML in your workflow file for each job
runs-on: self-hosted
```

This is already configured in your `.github/workflows/ci-workflow.yml` file.

### Key Changes Made

1. **Runner Target**: Changed from `ubuntu-latest` to `self-hosted`
2. **Shell**: Updated to use PowerShell (`shell: pwsh`)
3. **Environment Variables**: Using Windows format (`$env:VARIABLE`)
4. **Path Separators**: Using Windows path format
5. **Conditional Logic**: Added Windows-specific conditions

### Workflow Features

- ✅ WordPress Docker container setup
- ✅ Node.js and dependency installation
- ✅ Playwright browser setup
- ✅ E2E test execution
- ✅ Artifact collection and upload
- ✅ Flaky test reporting
- ✅ Google Sheets integration

## 🔒 Security Considerations

### Firewall Configuration

The setup scripts configure Windows Defender exclusions for:
- `C:\actions-runner\` folder
- Node.js processes
- Docker processes
- Playwright browsers

### Network Security

- Runner communicates outbound to GitHub on port 443 (HTTPS)
- Docker may require additional port access for WordPress container
- No inbound connections required

### Access Control

- Service runs under LOCAL SYSTEM account
- Runner files have restricted access permissions
- GitHub token is stored securely in runner configuration

## 📈 Performance Optimization

### System Optimization

```powershell
# Disable Windows Search indexing for runner folder
Add-MpPreference -ExclusionPath "C:\actions-runner"

# Set high performance power plan
powercfg /setactive SCHEME_MIN

# Increase virtual memory if needed
# System Properties → Advanced → Performance → Settings → Advanced → Virtual Memory
```

### Runner Optimization

- Use SSD storage for runner installation
- Ensure adequate RAM (8GB minimum, 16GB recommended)
- Regular maintenance to prevent log buildup
- Monitor resource usage during workflow execution

## 📞 Support and Updates

### Getting Help

1. **Check Logs**: Review runner and maintenance logs first
2. **Run Diagnostics**: Use the maintenance script for health checks
3. **Community Support**: GitHub Actions documentation and community forums
4. **Repository Issues**: Create issues in the repository for project-specific problems

### Keeping Updated

```powershell
# Check for runner updates
.\maintenance.ps1 -UpdateRunner

# Update Node.js and dependencies
choco upgrade nodejs
npm update -g

# Update Docker
choco upgrade docker-desktop

# Update repository code
git pull origin main
```

## 🎯 Success Verification

After completing the setup, verify everything works:

### 1. Service Verification
```powershell
Get-Service -Name "GitHubActionsRunner-FlexOrder"
# Should show "Running" status
```

### 2. GitHub UI Verification
- Go to Repository → Settings → Actions → Runners
- Your runner should appear as "Idle" with a green dot

### 3. Test Workflow Execution
- Push a small change or manually trigger a workflow
- Monitor execution in Actions tab
- Verify workflow completes successfully

### 4. Performance Check
```powershell
.\maintenance.ps1 -GenerateReport
# Should show healthy system resources and runner status
```

## 🔄 Backup and Recovery

### Backup Important Files

```powershell
# Create backup folder
$backupPath = "C:\FlexOrder-Runner-Backup-$(Get-Date -Format 'yyyy-MM-dd')"
New-Item -ItemType Directory -Path $backupPath

# Backup runner configuration
Copy-Item "C:\actions-runner\.credentials*" $backupPath -Force
Copy-Item "C:\actions-runner\.runner" $backupPath -Force
Copy-Item "C:\actions-runner\runsvc.cmd" $backupPath -Force

# Backup scripts
Copy-Item "scripts\*" "$backupPath\scripts\" -Recurse -Force

Write-Host "Backup created at: $backupPath"
```

### Recovery Process

If you need to restore the runner:

```powershell
# 1. Stop and uninstall current service
.\manage-service.ps1 -UninstallService

# 2. Remove runner registration
cd C:\actions-runner
.\config.cmd remove --token YOUR_REMOVAL_TOKEN

# 3. Restore from backup
Copy-Item "$backupPath\*" "C:\actions-runner\" -Recurse -Force

# 4. Reinstall service
.\manage-service.ps1 -InstallService
```

---

## 🎉 Congratulations!

Your FlexOrder self-hosted GitHub Actions runner is now fully operational! This setup will:

- ✅ Eliminate GitHub Actions billing costs
- ✅ Provide dedicated resources for your CI/CD pipeline
- ✅ Ensure consistent performance and reliability
- ✅ Give you full control over the execution environment

The runner will automatically:
- Start with Windows
- Execute your CI workflows
- Maintain itself through scheduled tasks
- Report health status and issues

You can now push code changes and watch your workflows execute on your own hardware instead of GitHub's servers.

## 🔀 Setup Method Comparison

| Feature | Method A (Automated) | Method B (Manual) |
|---------|---------------------|-------------------|
| **Ease of Use** | ⭐⭐⭐⭐⭐ One-click scripts | ⭐⭐⭐ Multiple manual steps |
| **Error Handling** | ⭐⭐⭐⭐⭐ Built-in retry logic | ⭐⭐ Manual troubleshooting |
| **Maintenance** | ⭐⭐⭐⭐⭐ Automated monitoring | ⭐⭐ Manual monitoring |
| **Updates** | ⭐⭐⭐⭐⭐ Automated update checks | ⭐⭐ Manual version management |
| **Service Management** | ⭐⭐⭐⭐⭐ GUI-friendly scripts | ⭐⭐⭐ Command-line tools |
| **Learning Curve** | ⭐⭐⭐⭐⭐ Beginner-friendly | ⭐⭐ Requires PowerShell knowledge |

**Recommendation**: Use **Method A (Automated)** unless you have specific requirements for manual control.

---