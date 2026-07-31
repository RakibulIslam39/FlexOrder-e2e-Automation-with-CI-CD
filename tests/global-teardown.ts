import { FullConfig } from '@playwright/test';
import { existsSync, unlinkSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { isCI } from '../src/config/environment';

async function globalTeardown(_config: FullConfig) {
  console.log('🧹 Starting Global Teardown for FlexOrder E2E Tests');
  
  try {
    // Clean up temporary files
    const tempFiles = [
      'tests/utilities/temp-upload-key.json',
      'tests/utilities/downloaded_key.json',
      'tests/fixtures/.auth/temp-session.json'
    ];
    
    let cleanedCount = 0;
    for (const file of tempFiles) {
      const filePath = join(process.cwd(), file);
      if (existsSync(filePath)) {
        try {
          unlinkSync(filePath);
          cleanedCount++;
          console.log(`🗑️ Cleaned up temporary file: ${file}`);
        } catch (error) {
          console.warn(`⚠️ Failed to clean up file ${file}:`, (error as Error).message);
        }
      }
    }
    
    if (cleanedCount === 0) {
      console.log('✨ No temporary files to clean up');
    }

    // Generate test summary and results info
    const testResultsPath = join(process.cwd(), 'test-results');
    const reportPath = join(process.cwd(), 'playwright-report');
    const flakyTestsPath = join(process.cwd(), 'flaky-tests');
    
    // Check for test results
    if (existsSync(testResultsPath)) {
      console.log('📊 Test results saved to:', testResultsPath);
      
      // Check for JUnit XML results
      const junitPath = join(testResultsPath, 'e2e-junit-results.xml');
      if (existsSync(junitPath)) {
        console.log('📋 JUnit XML results available for CI reporting');
      }
      
      // Check for JSON results
      const jsonPath = join(testResultsPath, 'results.json');
      if (existsSync(jsonPath)) {
        console.log('📈 JSON results available for analysis');
        
        // Try to read and summarize results
        try {
          const results = JSON.parse(readFileSync(jsonPath, 'utf8'));
          if (results.stats) {
            console.log(`Tests Summary: ${results.stats.expected || 0} passed, ${results.stats.unexpected || 0} failed, ${results.stats.flaky || 0} flaky`);
          }
        } catch (error) {
          console.log('📄 JSON results file exists but could not be parsed');
        }
      }
    }

    // Check for HTML report
    if (existsSync(reportPath)) {
      console.log('🌐 HTML test report saved to:', reportPath);
      
      // Check if index.html exists
      const indexPath = join(reportPath, 'index.html');
      if (existsSync(indexPath)) {
        if (isCI) {
          console.log('📎 HTML report will be available as CI artifact');
        } else {
          console.log('🔗 View report locally at: file://' + indexPath);
        }
      }
    }

    // Check for flaky tests
    if (existsSync(flakyTestsPath)) {
      try {
        const flakyFiles = require('fs').readdirSync(flakyTestsPath).filter((f: string) => f.endsWith('.json'));
        if (flakyFiles.length > 0) {
          console.log(`⚡ Found ${flakyFiles.length} flaky test(s) - check flaky-tests/ directory`);
          
          // Log flaky test names for quick reference
          flakyFiles.slice(0, 3).forEach((file: string) => {
            const testName = file.replace('.json', '');
            console.log(`  - ${testName}`);
          });
          
          if (flakyFiles.length > 3) {
            console.log(`  ... and ${flakyFiles.length - 3} more`);
          }
        } else {
          console.log('✅ No flaky tests detected');
        }
      } catch (error) {
        console.log('📁 Flaky tests directory exists but could not be read');
      }
    }

    // Environment-specific cleanup and reporting
    if (isCI) {
      console.log('🤖 CI Environment Cleanup:');
      console.log('  ✅ Artifacts preserved for GitHub Actions');
      console.log('  ✅ Reports available for download');
      console.log('  ✅ Test results formatted for CI integration');
      
      // Create a simple summary file for CI
      const summaryPath = join(process.cwd(), 'test-results', 'test-summary.txt');
      try {
        const timestamp = new Date().toISOString();
        const summary = [
          `FlexOrder E2E Test Run Summary`,
          `Timestamp: ${timestamp}`,
          `Environment: CI (GitHub Actions)`,
          `Results Directory: ${testResultsPath}`,
          `Report Directory: ${reportPath}`,
          `Flaky Tests Directory: ${flakyTestsPath}`,
          ''
        ].join('\n');
        
        writeFileSync(summaryPath, summary);
        console.log('📝 Test summary written for CI');
      } catch (error) {
        console.warn('⚠️ Could not write test summary:', (error as Error).message);
      }
      
    } else {
      console.log('💻 Local Environment Cleanup:');
      console.log('  ✅ Reports available for local viewing');
      console.log('  ✅ Temporary files cleaned up');
      console.log('  💡 Use "npm run test:report" to view HTML results');
    }

    // Final status
    console.log('✅ Global Teardown completed successfully');

  } catch (error) {
    console.error('❌ Error during global teardown:', error);
    // Don't throw error in teardown to avoid masking test failures
    console.log('⚠️ Teardown completed with warnings');
  }
  
  console.log('🏁 Global Teardown finished');
}

export default globalTeardown;