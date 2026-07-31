/**
 * Verify Repository Dispatch Configuration
 * 
 * This script checks if the repository dispatch setup is correct
 * before deploying to plugin repositories.
 */

import * as fs from 'fs';
import * as path from 'path';
// @ts-ignore - js-yaml types not installed
import * as yaml from 'js-yaml';

interface WorkflowConfig {
  name: string;
  on: {
    push?: { branches: string[] };
    repository_dispatch?: { types: string[] };
  };
  jobs: Record<string, unknown>;
}

interface TriggerWorkflow {
  name: string;
  on: { push: { branches: string[] } };
  jobs: {
    'trigger-e2e': {
      steps: Array<{
        uses?: string;
        with?: {
          'event-type'?: string;
          repository?: string;
          token?: string;
          app_id?: string;
          private_key?: string;
          installation_retrieval_mode?: string;
          installation_retrieval_payload?: string;
          repositories?: string;
        };
      }>;
    };
  };
}

function checkFile(filePath: string): boolean {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    return false;
  }
  console.log(`✅ File exists: ${filePath}`);
  return true;
}

function verifyCIWorkflow(): boolean {
  console.log('\n🔍 Verifying CI Workflow Configuration...\n');

  const ciWorkflowPath = path.join(__dirname, '../.github/workflows/ci-workflow.yml');
  
  if (!checkFile(ciWorkflowPath)) {
    return false;
  }

  try {
    const content = fs.readFileSync(ciWorkflowPath, 'utf8');
    const workflow = yaml.load(content) as WorkflowConfig;

    // Check if repository_dispatch is configured
    if (!workflow.on.repository_dispatch) {
      console.error('❌ CI workflow missing repository_dispatch trigger');
      return false;
    }

    const eventTypes = workflow.on.repository_dispatch.types;
    if (!eventTypes || !Array.isArray(eventTypes)) {
      console.error('❌ CI workflow repository_dispatch has no event types');
      return false;
    }

    const expectedTypes = ['flexorder', 'flexorder-ultimate'];
    const hasAllTypes = expectedTypes.every(type => eventTypes.includes(type));

    if (!hasAllTypes) {
      console.error(`❌ CI workflow missing event types. Expected: ${expectedTypes.join(', ')}, Got: ${eventTypes.join(', ')}`);
      return false;
    }

    console.log(`✅ CI workflow configured with event types: ${eventTypes.join(', ')}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to parse CI workflow: ${error}`);
    return false;
  }
}

function verifyTriggerWorkflow(workflowPath: string, expectedEventType: string, pluginName: string): boolean {
  console.log(`\n🔍 Verifying ${pluginName} Trigger Workflow...\n`);

  if (!checkFile(workflowPath)) {
    return false;
  }

  try {
    const content = fs.readFileSync(workflowPath, 'utf8');
    const workflow = yaml.load(content) as TriggerWorkflow;

    // Check push trigger branches
    const branches = workflow.on.push.branches;
    const hasMain = branches && branches.includes('main');
    const hasDev = branches && (branches.includes('dev') || branches.includes('develop'));
    
    if (!hasMain || !hasDev) {
      console.error(`❌ Trigger workflow should have branches including 'main' and 'dev'/'develop'. Got: ${branches?.join(', ')}`);
      return false;
    }
    console.log(`✅ Configured for branches: ${branches.join(', ')}`);

    // Check repository-dispatch action
    const steps = workflow.jobs['trigger-e2e'].steps;
    const dispatchStep = steps.find(step => step.uses?.includes('repository-dispatch'));

    if (!dispatchStep) {
      console.error('❌ Missing repository-dispatch action');
      return false;
    }

    console.log(`✅ Uses: ${dispatchStep.uses}`);

    // Check event type
    const eventType = dispatchStep.with?.['event-type'];
    if (eventType !== expectedEventType) {
      console.error(`❌ Wrong event type. Expected: ${expectedEventType}, Got: ${eventType}`);
      return false;
    }
    console.log(`✅ Event type: ${eventType}`);

    // Check target repository
    const targetRepo = dispatchStep.with?.repository;
    if (targetRepo !== 'WPPOOL/flexorder-ci-workflow') {
      console.error(`❌ Wrong target repository. Expected: WPPOOL/flexorder-ci-workflow, Got: ${targetRepo}`);
      return false;
    }
    console.log(`✅ Target repository: ${targetRepo}`);

    // Check token (GitHub App or PAT)
    const token = dispatchStep.with?.token;
    if (!token) {
      console.error('❌ Missing token configuration');
      return false;
    }
    
    if (token.includes('app-token.outputs.token')) {
      console.log(`✅ Token configured: GitHub App (steps.app-token.outputs.token)`);
      
      // Verify app-token generation step exists
      const appTokenStep = steps.find(step => step.uses?.includes('github-app-token'));
      if (!appTokenStep) {
        console.error('❌ Missing github-app-token generation step');
        return false;
      }
      console.log(`✅ GitHub App token generation step found`);
      
      // Check APP_ID and APP_PRIVATE_KEY
      const appId = appTokenStep.with?.app_id;
      const privateKey = appTokenStep.with?.private_key;
      
      if (!appId?.includes('APP_ID') || !privateKey?.includes('APP_PRIVATE_KEY')) {
        console.error('❌ Missing APP_ID or APP_PRIVATE_KEY configuration');
        return false;
      }
      console.log(`✅ GitHub App credentials: secrets.APP_ID + secrets.APP_PRIVATE_KEY`);
      
    } else if (token.includes('CI_TRIGGER_TOKEN')) {
      console.log(`✅ Token configured: Personal Access Token (secrets.CI_TRIGGER_TOKEN)`);
    } else {
      console.error('❌ Unknown token configuration');
      return false;
    }

    return true;
  } catch (error) {
    console.error(`❌ Failed to parse trigger workflow: ${error}`);
    return false;
  }
}

function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔧 Repository Dispatch Configuration Verification');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  let allPassed = true;

  // Verify CI workflow
  allPassed = verifyCIWorkflow() && allPassed;

  // Verify FlexOrder trigger workflow
  const flexorderTrigger = path.join(__dirname, '../.github/flexorder_workflow/flexorder.yml');
  allPassed = verifyTriggerWorkflow(flexorderTrigger, 'flexorder', 'FlexOrder Free') && allPassed;

  // Verify FlexOrder Ultimate trigger workflow
  const flexorderUltimateTrigger = path.join(__dirname, '../.github/flexorder_workflow/flexorder-ultimate.yml');
  allPassed = verifyTriggerWorkflow(flexorderUltimateTrigger, 'flexorder-ultimate', 'FlexOrder Ultimate') && allPassed;

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (allPassed) {
    console.log('✅ All checks passed! Configuration is ready for deployment.');
    console.log('\n📋 Next Steps (GitHub App Approach - Recommended):');
    console.log('1. Configure GitHub App permissions:');
    console.log('   - Go to GitHub App settings');
    console.log('   - Set Actions permission to "Read and write"');
    console.log('   - Ensure app is installed on all three repositories');
    console.log('2. Add APP_ID and APP_PRIVATE_KEY secrets to plugin repositories:');
    console.log('   - flexorder/settings/secrets/actions');
    console.log('   - flexorder-ultimate/settings/secrets/actions');
    console.log('3. Copy trigger workflows to respective plugin repositories:');
    console.log('   - flexorder.yml → flexorder/.github/workflows/trigger-e2e.yml');
    console.log('   - flexorder-ultimate.yml → flexorder-ultimate/.github/workflows/trigger-e2e.yml');
    console.log('4. Test by pushing to main or develop branch in either plugin repository');
    console.log('\n📖 For detailed instructions, see:');
    console.log('   - GITHUB_APP_DISPATCH_SETUP.md (GitHub App approach)');
    console.log('   - REPOSITORY_DISPATCH_SETUP.md (PAT approach - alternative)');
    process.exit(0);
  } else {
    console.log('❌ Some checks failed. Please fix the issues above.');
    process.exit(1);
  }
}

main();
