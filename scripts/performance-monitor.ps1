# FlexOrder Performance Monitoring and Optimization Script
# Industry best practices for CI/CD performance monitoring

param(
    [string]$RunnerPath = "C:\actions-runner",
    [string]$ProjectPath = "B:\Automation\FlexOrder\flexorder-e2e-automation-ci",
    [switch]$GenerateReport = $true,
    [switch]$OptimizeSystem = $false,
    [switch]$MonitorWorkflow = $false
)

$ErrorActionPreference = "Continue"

# Enhanced logging with performance metrics
function Write-PerformanceLog {
    param([string]$Message, [string]$Level = "INFO", [hashtable]$Metrics = @{})
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss.fff"
    $logEntry = "[$timestamp] [$Level] $Message"
    
    if ($Metrics.Count -gt 0) {
        $metricsString = ($Metrics.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join " "
        $logEntry += " | Metrics: $metricsString"
    }
    
    $color = switch ($Level) {
        "INFO" { "Green" }
        "WARN" { "Yellow" }
        "ERROR" { "Red" }
        "SUCCESS" { "Cyan" }
        "PERF" { "Magenta" }
        default { "White" }
    }
    
    Write-Host $logEntry -ForegroundColor $color
    
    # Write to performance log
    $logFile = "$RunnerPath\logs\performance-$(Get-Date -Format 'yyyy-MM').log"
    if (!(Test-Path "$RunnerPath\logs")) {
        New-Item -ItemType Directory -Path "$RunnerPath\logs" -Force | Out-Null
    }
    Add-Content -Path $logFile -Value $logEntry
}

# Comprehensive system performance analysis
function Get-SystemPerformanceMetrics {
    Write-PerformanceLog "Collecting comprehensive system performance metrics..." "PERF"
    
    $metrics = @{}
    
    try {
        # CPU Metrics
        $cpuCounters = Get-Counter @(
            '\Processor(_Total)\% Processor Time',
            '\Processor(_Total)\% User Time',
            '\Processor(_Total)\% Privileged Time'
        ) -SampleInterval 1 -MaxSamples 5
        
        $avgCpuTotal = ($cpuCounters | Where-Object { $_.CounterSamples.Path -like "*% Processor Time" } | 
                       Select-Object -ExpandProperty CounterSamples | 
                       Measure-Object -Property CookedValue -Average).Average
        
        $metrics.CPU_Usage_Percent = [math]::Round($avgCpuTotal, 2)
        
        # Memory Metrics
        $memory = Get-CimInstance Win32_OperatingSystem
        $totalRAM = $memory.TotalVisibleMemorySize / 1KB
        $freeRAM = $memory.FreePhysicalMemory / 1KB
        $usedRAM = $totalRAM - $freeRAM
        
        $metrics.Memory_Total_GB = [math]::Round($totalRAM / 1GB, 2)
        $metrics.Memory_Used_GB = [math]::Round($usedRAM / 1GB, 2)
        $metrics.Memory_Free_GB = [math]::Round($freeRAM / 1GB, 2)
        $metrics.Memory_Usage_Percent = [math]::Round(($usedRAM / $totalRAM) * 100, 2)
        
        # Disk I/O Metrics
        $diskCounters = Get-Counter @(
            '\PhysicalDisk(_Total)\Disk Read Bytes/sec',
            '\PhysicalDisk(_Total)\Disk Write Bytes/sec',
            '\PhysicalDisk(_Total)\Current Disk Queue Length'
        ) -SampleInterval 1 -MaxSamples 3 -ErrorAction SilentlyContinue
        
        if ($diskCounters) {
            $avgDiskRead = ($diskCounters | Where-Object { $_.CounterSamples.Path -like "*Read Bytes/sec" } | 
                           Select-Object -ExpandProperty CounterSamples | 
                           Measure-Object -Property CookedValue -Average).Average
            
            $avgDiskWrite = ($diskCounters | Where-Object { $_.CounterSamples.Path -like "*Write Bytes/sec" } | 
                            Select-Object -ExpandProperty CounterSamples | 
                            Measure-Object -Property CookedValue -Average).Average
            
            $metrics.Disk_Read_MBps = [math]::Round($avgDiskRead / 1MB, 2)
            $metrics.Disk_Write_MBps = [math]::Round($avgDiskWrite / 1MB, 2)
        }
        
        # Network Metrics
        $networkCounters = Get-Counter @(
            '\Network Interface(*)\Bytes Total/sec'
        ) -SampleInterval 1 -MaxSamples 3 -ErrorAction SilentlyContinue
        
        if ($networkCounters) {
            $totalNetworkBytes = ($networkCounters.CounterSamples | 
                                 Where-Object { $_.InstanceName -notlike "*Loopback*" -and $_.InstanceName -notlike "*isatap*" } |
                                 Measure-Object -Property CookedValue -Sum).Sum
            
            $metrics.Network_Total_MBps = [math]::Round($totalNetworkBytes / 1MB, 2)
        }
        
        # Process-specific metrics for Runner and related processes
        $runnerProcesses = Get-Process -Name "Runner.Listener", "Runner.Worker", "node", "chrome", "docker" -ErrorAction SilentlyContinue
        
        if ($runnerProcesses) {
            $totalRunnerMemory = ($runnerProcesses | Measure-Object -Property WorkingSet64 -Sum).Sum
            $totalRunnerCpu = ($runnerProcesses | Measure-Object -Property CPU -Sum).Sum
            
            $metrics.Runner_Processes_Count = $runnerProcesses.Count
            $metrics.Runner_Memory_MB = [math]::Round($totalRunnerMemory / 1MB, 2)
            $metrics.Runner_CPU_Seconds = [math]::Round($totalRunnerCpu, 2)
        }
        
        # Docker metrics if available
        try {
            $dockerStats = docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" 2>$null
            if ($dockerStats -and $dockerStats.Count -gt 1) {
                $metrics.Docker_Containers_Running = $dockerStats.Count - 1  # Subtract header
            }
        } catch {
            # Docker not available
        }
        
        return $metrics
        
    } catch {
        Write-PerformanceLog "Failed to collect performance metrics: $($_.Exception.Message)" "ERROR"
        return @{ Status = "ERROR" }
    }
}

# Monitor Playwright test execution performance
function Monitor-PlaywrightPerformance {
    param([string]$TestResultsPath = "$ProjectPath\test-results")
    
    Write-PerformanceLog "Analyzing Playwright test performance..." "PERF"
    
    try {
        if (!(Test-Path $TestResultsPath)) {
            Write-PerformanceLog "Test results path not found: $TestResultsPath" "WARN"
            return @{}
        }
        
        $metrics = @{}
        
        # Check for results.json file
        $resultsFile = "$TestResultsPath\results.json"
        if (Test-Path $resultsFile) {
            $results = Get-Content $resultsFile | ConvertFrom-Json
            
            if ($results.suites) {
                $allTests = $results.suites | ForEach-Object { $_.specs } | ForEach-Object { $_.tests }
                
                $metrics.Total_Tests = $allTests.Count
                $metrics.Passed_Tests = ($allTests | Where-Object { $_.results[0].status -eq "passed" }).Count
                $metrics.Failed_Tests = ($allTests | Where-Object { $_.results[0].status -eq "failed" }).Count
                $metrics.Skipped_Tests = ($allTests | Where-Object { $_.results[0].status -eq "skipped" }).Count
                
                # Calculate timing metrics
                $testDurations = $allTests | ForEach-Object { $_.results[0].duration } | Where-Object { $_ -gt 0 }
                if ($testDurations) {
                    $metrics.Avg_Test_Duration_Ms = [math]::Round(($testDurations | Measure-Object -Average).Average, 2)
                    $metrics.Max_Test_Duration_Ms = ($testDurations | Measure-Object -Maximum).Maximum
                    $metrics.Min_Test_Duration_Ms = ($testDurations | Measure-Object -Minimum).Minimum
                    $metrics.Total_Test_Duration_Ms = ($testDurations | Measure-Object -Sum).Sum
                }
            }
        }
        
        # Check artifact sizes
        $screenshots = Get-ChildItem "$TestResultsPath\**\*.png" -Recurse -ErrorAction SilentlyContinue
        $videos = Get-ChildItem "$TestResultsPath\**\*.webm" -Recurse -ErrorAction SilentlyContinue
        $traces = Get-ChildItem "$TestResultsPath\**\*.zip" -Recurse -ErrorAction SilentlyContinue
        
        if ($screenshots) {
            $metrics.Screenshots_Count = $screenshots.Count
            $metrics.Screenshots_Size_MB = [math]::Round(($screenshots | Measure-Object -Property Length -Sum).Sum / 1MB, 2)
        }
        
        if ($videos) {
            $metrics.Videos_Count = $videos.Count
            $metrics.Videos_Size_MB = [math]::Round(($videos | Measure-Object -Property Length -Sum).Sum / 1MB, 2)
        }
        
        if ($traces) {
            $metrics.Traces_Count = $traces.Count
            $metrics.Traces_Size_MB = [math]::Round(($traces | Measure-Object -Property Length -Sum).Sum / 1MB, 2)
        }
        
        return $metrics
        
    } catch {
        Write-PerformanceLog "Failed to analyze Playwright performance: $($_.Exception.Message)" "ERROR"
        return @{}
    }
}

# Optimize system for better CI performance
function Optimize-SystemForCI {
    if (!$OptimizeSystem) {
        Write-PerformanceLog "System optimization skipped (use -OptimizeSystem to enable)" "INFO"
        return
    }
    
    Write-PerformanceLog "Optimizing system for CI performance..." "PERF"
    
    try {
        # Set high performance power plan
        $powerScheme = powercfg /getactivescheme
        if ($powerScheme -notlike "*High performance*") {
            Write-PerformanceLog "Setting high performance power plan..." "INFO"
            powercfg /setactive SCHEME_MIN
        }
        
        # Optimize virtual memory
        $pagefile = Get-CimInstance Win32_PageFileUsage
        $totalRAM = (Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB
        
        if ($pagefile.AllocatedBaseSize -lt ($totalRAM * 1.5)) {
            Write-PerformanceLog "Virtual memory may need optimization (current: $($pagefile.AllocatedBaseSize) MB)" "WARN"
        }
        
        # Clean temporary files
        $tempPaths = @(
            "$env:TEMP\*",
            "$env:LOCALAPPDATA\Temp\*",
            "$env:USERPROFILE\AppData\Local\Microsoft\Windows\Temporary Internet Files\*"
        )
        
        $cleanedSize = 0
        foreach ($tempPath in $tempPaths) {
            try {
                $files = Get-ChildItem -Path $tempPath -Recurse -Force -ErrorAction SilentlyContinue |
                        Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-1) }
                
                $size = ($files | Measure-Object -Property Length -Sum).Sum
                $files | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
                $cleanedSize += $size
            } catch {
                # Continue on error
            }
        }
        
        if ($cleanedSize -gt 0) {
            Write-PerformanceLog "Cleaned $([math]::Round($cleanedSize / 1MB, 2)) MB of temporary files" "SUCCESS"
        }
        
        # Optimize Windows services for CI
        $servicesToOptimize = @{
            "Windows Search" = "Manual"
            "Superfetch" = "Manual"
            "Themes" = "Manual"
        }
        
        foreach ($service in $servicesToOptimize.GetEnumerator()) {
            try {
                $svc = Get-Service -Name $service.Key -ErrorAction SilentlyContinue
                if ($svc -and $svc.StartType -eq "Automatic") {
                    Write-PerformanceLog "Optimizing service: $($service.Key)" "INFO"
                    Set-Service -Name $service.Key -StartupType $service.Value
                }
            } catch {
                Write-PerformanceLog "Failed to optimize service $($service.Key): $($_.Exception.Message)" "WARN"
            }
        }
        
        Write-PerformanceLog "System optimization completed" "SUCCESS"
        
    } catch {
        Write-PerformanceLog "System optimization failed: $($_.Exception.Message)" "ERROR"
    }
}

# Generate comprehensive performance report
function New-PerformanceReport {
    if (!$GenerateReport) {
        return
    }
    
    Write-PerformanceLog "Generating comprehensive performance report..." "PERF"
    
    try {
        $reportData = @{
            Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            SystemMetrics = Get-SystemPerformanceMetrics
            PlaywrightMetrics = Monitor-PlaywrightPerformance
            Environment = @{
                ComputerName = $env:COMPUTERNAME
                OS = (Get-CimInstance Win32_OperatingSystem).Caption
                PowerPlan = (powercfg /getactivescheme).Split('(')[1].Split(')')[0]
                RunnerVersion = if (Test-Path "$RunnerPath\bin\Runner.Listener.exe") { 
                    (Get-Item "$RunnerPath\bin\Runner.Listener.exe").VersionInfo.ProductVersion 
                } else { "Unknown" }
                NodeVersion = if (Get-Command node -ErrorAction SilentlyContinue) { node --version } else { "Not installed" }
                DockerVersion = if (Get-Command docker -ErrorAction SilentlyContinue) { docker --version } else { "Not installed" }
            }
        }
        
        # Performance recommendations
        $recommendations = @()
        
        if ($reportData.SystemMetrics.CPU_Usage_Percent -gt 80) {
            $recommendations += "High CPU usage detected. Consider reducing parallel workers or optimizing tests."
        }
        
        if ($reportData.SystemMetrics.Memory_Usage_Percent -gt 85) {
            $recommendations += "High memory usage detected. Consider increasing system RAM or optimizing container resource limits."
        }
        
        if ($reportData.PlaywrightMetrics.Avg_Test_Duration_Ms -gt 30000) {
            $recommendations += "Tests are running slowly. Consider optimizing selectors, reducing wait times, or improving test stability."
        }
        
        if ($reportData.PlaywrightMetrics.Failed_Tests -gt 0) {
            $failureRate = ($reportData.PlaywrightMetrics.Failed_Tests / $reportData.PlaywrightMetrics.Total_Tests) * 100
            if ($failureRate -gt 10) {
                $recommendations += "High test failure rate ($failureRate%). Consider improving test stability and error handling."
            }
        }
        
        $reportData.Recommendations = $recommendations
        
        # Save detailed report
        $reportPath = "$RunnerPath\logs\performance-report-$(Get-Date -Format 'yyyy-MM-dd-HHmm').json"
        $reportData | ConvertTo-Json -Depth 4 | Set-Content -Path $reportPath
        
        # Generate summary
        Write-PerformanceLog "=== PERFORMANCE REPORT SUMMARY ===" "PERF"
        Write-PerformanceLog "Generated: $($reportData.Timestamp)" "INFO"
        Write-PerformanceLog "System: $($reportData.Environment.ComputerName) - $($reportData.Environment.OS)" "INFO"
        Write-PerformanceLog "CPU Usage: $($reportData.SystemMetrics.CPU_Usage_Percent)%" "INFO"
        Write-PerformanceLog "Memory Usage: $($reportData.SystemMetrics.Memory_Usage_Percent)% ($($reportData.SystemMetrics.Memory_Used_GB) GB / $($reportData.SystemMetrics.Memory_Total_GB) GB)" "INFO"
        
        if ($reportData.PlaywrightMetrics.Total_Tests -gt 0) {
            Write-PerformanceLog "Tests: $($reportData.PlaywrightMetrics.Total_Tests) total, $($reportData.PlaywrightMetrics.Passed_Tests) passed, $($reportData.PlaywrightMetrics.Failed_Tests) failed" "INFO"
            Write-PerformanceLog "Avg Test Duration: $($reportData.PlaywrightMetrics.Avg_Test_Duration_Ms) ms" "INFO"
        }
        
        if ($recommendations.Count -gt 0) {
            Write-PerformanceLog "Recommendations:" "WARN"
            foreach ($rec in $recommendations) {
                Write-PerformanceLog "  - $rec" "WARN"
            }
        } else {
            Write-PerformanceLog "✅ No performance issues detected" "SUCCESS"
        }
        
        Write-PerformanceLog "Full report saved: $reportPath" "SUCCESS"
        Write-PerformanceLog "=================================" "PERF"
        
    } catch {
        Write-PerformanceLog "Failed to generate performance report: $($_.Exception.Message)" "ERROR"
    }
}

# Real-time workflow monitoring
function Start-WorkflowMonitoring {
    if (!$MonitorWorkflow) {
        return
    }
    
    Write-PerformanceLog "Starting real-time workflow monitoring..." "PERF"
    
    try {
        $monitoringDuration = 300  # 5 minutes
        $sampleInterval = 5        # 5 seconds
        $samples = $monitoringDuration / $sampleInterval
        
        for ($i = 1; $i -le $samples; $i++) {
            $metrics = Get-SystemPerformanceMetrics
            
            Write-PerformanceLog "Sample $i/$samples" "PERF" $metrics
            
            # Alert on high resource usage
            if ($metrics.CPU_Usage_Percent -gt 90) {
                Write-PerformanceLog "ALERT: Critical CPU usage: $($metrics.CPU_Usage_Percent)%" "ERROR"
            }
            
            if ($metrics.Memory_Usage_Percent -gt 95) {
                Write-PerformanceLog "ALERT: Critical memory usage: $($metrics.Memory_Usage_Percent)%" "ERROR"
            }
            
            Start-Sleep -Seconds $sampleInterval
        }
        
        Write-PerformanceLog "Workflow monitoring completed" "SUCCESS"
        
    } catch {
        Write-PerformanceLog "Workflow monitoring failed: $($_.Exception.Message)" "ERROR"
    }
}

# Main execution
Write-PerformanceLog "Starting FlexOrder Performance Analysis..." "PERF"

# Run optimizations
Optimize-SystemForCI

# Start monitoring if requested
Start-WorkflowMonitoring

# Generate performance report
New-PerformanceReport

Write-PerformanceLog "Performance analysis completed" "SUCCESS"