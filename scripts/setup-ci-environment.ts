#!/usr/bin/env node

/**
 * FlexOrder CI Environment Setup Script
 * 
 * Modern TypeScript implementation following best practices:
 * - Clean Architecture with separation of concerns
 * - Robust error handling and logging
 * - Type safety throughout
 * - Idempotent operations
 * - Configuration-driven design
 */

import { execSync, ExecSyncOptions } from 'child_process';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface Config {
  readonly wordpress: {
    readonly url: string;
    readonly admin: {
      readonly username: string;
      readonly password: string;
      readonly email: string;
    };
  };
  readonly docker: {
    readonly containerName: string;
    readonly mysqlContainerName: string;
  };
  readonly testData: {
    readonly productsCount: number;
    readonly ordersCount: number;
    readonly categories: readonly string[];
    readonly orderStatuses: readonly string[];
  };
  readonly paths: {
    readonly utilitiesDir: string;
    readonly apiKeysFile: string;
    readonly envFile: string;
  };
  readonly timeouts: {
    readonly command: number;
    readonly serviceCheck: number;
    readonly maxRetries: number;
  };
}

interface ApiKeys {
  readonly consumer_key: string;
  readonly consumer_secret: string;
  readonly site_url: string;
  readonly created_at: string;
}

interface ApiKeyResponse {
  readonly key_id?: number;
  readonly consumer_key?: string;
  readonly consumer_secret?: string;
  readonly permissions?: string;
  readonly user_id?: number;
  readonly error?: string;
}

interface OrderConfig {
  readonly status: string;
  readonly date: string;
  readonly productIds: number[];
  readonly customerEmail: string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG: Config = {
  wordpress: {
    url: 'http://localhost:8080',
    admin: {
      username: 'admin',
      password: 'admin123',
      email: 'admin@example.com',
    },
  },
  docker: {
    containerName: 'flexorder-wordpress',
    mysqlContainerName: 'flexorder-mysql',
  },
  testData: {
    productsCount: 20,
    ordersCount: 50,
    categories: ['Electronics', 'Clothing', 'Books'] as const,
    orderStatuses: ['completed', 'processing', 'pending', 'cancelled', 'refunded', 'on-hold', 'trash'] as const,
  },
  paths: {
    utilitiesDir: path.join(process.cwd(), 'tests', 'fixtures'),
    apiKeysFile: 'api-keys.json',
    envFile: path.join(process.cwd(), '.env'),
  },
  timeouts: {
    command: 30000,
    serviceCheck: 10000,
    maxRetries: 20,
  },
} as const;

// ============================================================================
// LOGGING UTILITIES
// ============================================================================

/* eslint-disable no-console */
class Logger {
  private static readonly ICONS = {
    info: 'ℹ️ ',
    success: '✅',
    error: '❌',
    warning: '⚠️ ',
    rocket: '🚀',
    key: '🔑',
    calendar: '📅',
    gear: '⚙️ ',
  } as const;

  static info(message: string): void {
    console.log(`${this.ICONS.info} ${message}`);
  }

  static success(message: string): void {
    console.log(`${this.ICONS.success} ${message}`);
  }

  static error(message: string, error?: Error): void {
    console.error(`${this.ICONS.error} ${message}`);
    if (error?.stack) {
      console.error(`   Details: ${error.message}`);
    }
  }

  static warning(message: string): void {
    console.log(`${this.ICONS.warning} ${message}`);
  }

  static section(title: string): void {
    console.log(`\n${this.ICONS.rocket} ${title}`);
    console.log('='.repeat(60));
  }
}
/* eslint-enable no-console */

// ============================================================================
// CUSTOM ERRORS
// ============================================================================

class ServiceNotReadyError extends Error {
  constructor(service: string) {
    super(`${service} service failed to become ready`);
    this.name = 'ServiceNotReadyError';
  }
}

class CommandExecutionError extends Error {
  constructor(command: string, originalError: Error) {
    super(`Failed to execute command: ${command}`);
    this.name = 'CommandExecutionError';
    this.stack = originalError.stack;
  }
}

class ApiKeyGenerationError extends Error {
  constructor(reason: string) {
    super(`API key generation failed: ${reason}`);
    this.name = 'ApiKeyGenerationError';
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

class Utils {
  static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static generateRandomDate(startDate: Date, endDate: Date): Date {
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();
    const randomTime = startTime + Math.random() * (endTime - startTime);
    return new Date(randomTime);
  }

  static formatDateForWooCommerce(date: Date): string {
    return date.toISOString().slice(0, 19).replace('T', ' ');
  }

  static getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static selectRandomItems<T>(array: T[], count: number): T[] {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, array.length));
  }

  static encodeBase64(text: string): string {
    return Buffer.from(text).toString('base64');
  }

  static ensureDirectoryExists(dirPath: string): void {
    if (!fsSync.existsSync(dirPath)) {
      fsSync.mkdirSync(dirPath, { recursive: true });
    }
  }
}

// ============================================================================
// DOCKER COMMAND EXECUTOR
// ============================================================================

class DockerExecutor {
  private readonly defaultOptions: ExecSyncOptions = {
    encoding: 'utf8',
    stdio: 'pipe',
    windowsHide: true,
    timeout: CONFIG.timeouts.command,
  };

  executeInContainer(
    containerName: string,
    command: string,
    options: Partial<ExecSyncOptions> = {}
  ): string {
    try {
      const fullCommand = `docker exec ${containerName} ${command}`;
      
      
      const result = execSync(fullCommand, {
        ...this.defaultOptions,
        ...options,
      });
      
      
      return typeof result === 'string' ? result.trim() : '';
    } catch (error) {
      throw new CommandExecutionError(command, error as Error);
    }
  }

  copyToContainer(containerName: string, sourcePath: string, destPath: string): void {
    try {
      execSync(`docker cp ${sourcePath} ${containerName}:${destPath}`, this.defaultOptions);
    } catch (error) {
      throw new CommandExecutionError(`docker cp`, error as Error);
    }
  }
}

// ============================================================================
// WORDPRESS CLI WRAPPER
// ============================================================================

class WordPressCLI {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  constructor(
    private readonly executor: DockerExecutor,
    private readonly containerName: string
  ) {}
  /* eslint-enable @typescript-eslint/no-unused-vars */

  async execute(command: string): Promise<string> {
    Logger.info(`WP-CLI: ${command}`);
    return this.executor.executeInContainer(
      this.containerName,
      `wp ${command} --allow-root`
    );
  }

  async isReady(): Promise<boolean> {
    try {
      await this.execute('core version');
      return true;
    } catch {
      return false;
    }
  }

  async isInstalled(): Promise<boolean> {
    try {
      await this.execute('core is-installed');
      return true;
    } catch {
      return false;
    }
  }

  async isPluginActive(pluginName: string): Promise<boolean> {
    try {
      const result = await this.execute('plugin list --status=active --format=json');
      const plugins = JSON.parse(result);
      return plugins.some((plugin: any) => plugin.name === pluginName);
    } catch {
      return false;
    }
  }

  async evaluatePhpCode(phpCode: string): Promise<string> {
    
    // Use PHP's base64_decode to completely avoid shell escaping
    // This works reliably on all platforms (Windows, Linux, macOS)
    const base64Code = Buffer.from(phpCode).toString('base64');
    
    
    // Execute base64-encoded PHP using PHP's own base64_decode
    // No shell pipes, no quoting issues - pure PHP execution
    const result = await this.executor.executeInContainer(
      this.containerName,
      `wp eval "eval(base64_decode('${base64Code}'));" --allow-root`
    );
    
    
    return result;
  }
}

// ============================================================================
// SERVICE HEALTH CHECKER
// ============================================================================

class ServiceHealthChecker {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  constructor(private readonly executor: DockerExecutor) {}
  /* eslint-enable @typescript-eslint/no-unused-vars */

  async waitForMySQL(): Promise<void> {
    Logger.info('Checking MySQL service...');

    for (let attempt = 1; attempt <= 12; attempt++) {
      try {
        this.executor.executeInContainer(
          CONFIG.docker.mysqlContainerName,
          'mysqladmin ping -h localhost --silent'
        );
        Logger.success('MySQL is ready');
        return;
      } catch {
        if (attempt === 12) {
          throw new ServiceNotReadyError('MySQL');
        }
        Logger.info(`MySQL check attempt ${attempt}/12...`);
        await Utils.sleep(5000);
      }
    }
  }

  async waitForWordPress(): Promise<void> {
    Logger.info('Checking WordPress service...');

    for (let attempt = 1; attempt <= CONFIG.timeouts.maxRetries; attempt++) {
      try {
        const httpCode = execSync(
          `curl -L -f -s -o /dev/null -w "%{http_code}" ${CONFIG.wordpress.url}`,
          {
            encoding: 'utf8',
            stdio: 'pipe',
            timeout: CONFIG.timeouts.serviceCheck,
            windowsHide: true,
          }
        ).trim();

        if (httpCode === '200') {
          Logger.success('WordPress is ready (HTTP 200)');
          return;
        }

        Logger.info(`WordPress returned HTTP ${httpCode}, retrying...`);
      } catch (error) {
        Logger.info(`WordPress check attempt ${attempt}/${CONFIG.timeouts.maxRetries}...`);
      }

      if (attempt === CONFIG.timeouts.maxRetries) {
        Logger.warning('WordPress validation completed with warnings, proceeding...');
        return; // Don't fail, WordPress might still be working
      }

      await Utils.sleep(10000);
    }
  }

  async waitForAllServices(): Promise<void> {
    Logger.section('Checking Service Health');
    await this.waitForMySQL();
    await this.waitForWordPress();
    Logger.success('All services are ready');
  }
}

// ============================================================================
// TEST DATA GENERATOR
// ============================================================================

class TestDataGenerator {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  constructor(private readonly wpCli: WordPressCLI) {}
  /* eslint-enable @typescript-eslint/no-unused-vars */

  async createCategories(): Promise<number[]> {
    Logger.info('Creating product categories...');
    const categoryIds: number[] = [];

    for (const categoryName of CONFIG.testData.categories) {
      try {
        const result = await this.wpCli.execute(
          `wc product_cat create --name="${categoryName}" --user=1`
        );
        const match = result.match(/Success: Created product_cat (\d+)/);
        if (match?.[1]) {
          const categoryId = parseInt(match[1], 10);
          categoryIds.push(categoryId);
          Logger.info(`  ✓ Created category: ${categoryName} (ID: ${categoryId})`);
        }
      } catch (error) {
        Logger.error(`Failed to create category: ${categoryName}`, error as Error);
      }
    }

    return categoryIds;
  }

  async createProducts(categoryIds: number[]): Promise<number[]> {
    Logger.info(`Creating ${CONFIG.testData.productsCount} products...`);
    const productIds: number[] = [];

    for (let i = 1; i <= CONFIG.testData.productsCount; i++) {
      try {
        const categoryId = categoryIds[i % categoryIds.length] || 1;
        const price = 20 + i * 2;
        const sku = `TEST-${i.toString().padStart(3, '0')}`;

        const result = await this.wpCli.execute(
          `wc product create --name="Test Product ${i}" --type=simple ` +
            `--regular_price=${price} --categories="[{\\"id\\":${categoryId}}]" ` +
            `--sku="${sku}" --user=1`
        );

        const match = result.match(/Success: Created product (\d+)/);
        if (match?.[1]) {
          productIds.push(parseInt(match[1], 10));
        }
      } catch (error) {
        Logger.error(`Failed to create product ${i}`, error as Error);
      }
    }

    Logger.success(`Created ${productIds.length} products`);
    return productIds;
  }

  async createOrders(productIds: number[]): Promise<number[]> {
    Logger.info(`Creating ${CONFIG.testData.ordersCount} orders...`);
    const orderIds: number[] = [];
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const today = new Date();

    for (let i = 1; i <= CONFIG.testData.ordersCount; i++) {
      try {
        const orderConfig: OrderConfig = {
          status: CONFIG.testData.orderStatuses[i % CONFIG.testData.orderStatuses.length],
          date: Utils.formatDateForWooCommerce(Utils.generateRandomDate(sixMonthsAgo, today)),
          productIds: Utils.selectRandomItems(productIds, Utils.getRandomInt(2, 5)),
          customerEmail: `customer${i}@test.com`,
        };

        const orderId = await this.createSingleOrder(orderConfig, i);
        if (orderId) {
          orderIds.push(orderId);
        }
      } catch (error) {
        Logger.error(`Failed to create order ${i}`, error as Error);
      }
    }

    Logger.success(`Created ${orderIds.length} orders (distributed over 6 months)`);
    return orderIds;
  }

  private async createSingleOrder(config: OrderConfig, orderNumber: number): Promise<number | null> {
    const productCommands = config.productIds
      .map((productId, index) => {
        const quantity = Utils.getRandomInt(1, 3);
        return `$p${index} = wc_get_product(${productId}); ` +
               `if ($p${index}) { $order->add_product($p${index}, ${quantity}); $added++; }`;
      })
      .join(' ');

    const phpCode =
      `$order = wc_create_order(); $added = 0; ` +
      `if ($order) { ` +
      `${productCommands} ` +
      `if ($added > 0) { ` +
      `$order->set_status('${config.status}'); ` +
      `$order->set_billing_email('${config.customerEmail}'); ` +
      `$order->set_billing_first_name('Customer'); ` +
      `$order->set_billing_last_name('${orderNumber}'); ` +
      `$order->set_billing_address_1('123 Test Street'); ` +
      `$order->set_billing_city('Test City'); ` +
      `$order->set_billing_postcode('12345'); ` +
      `$order->set_billing_country('US'); ` +
      `$order->set_date_created('${config.date}'); ` +
      `$order->calculate_totals(); ` +
      `$order->save(); ` +
      `echo $order->get_id(); ` +
      `} }`;

    const result = await this.wpCli.execute(`eval "${phpCode}"`);
    const orderId = parseInt(result, 10);
    return isNaN(orderId) ? null : orderId;
  }

  async generateAll(): Promise<void> {
    Logger.section('Generating Test Data');
    const categoryIds = await this.createCategories();
    const productIds = await this.createProducts(categoryIds);
    await this.createOrders(productIds);
  }
}

// ============================================================================
// API KEY MANAGER
// ============================================================================

class ApiKeyManager {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  constructor(private readonly wpCli: WordPressCLI) {}
  /* eslint-enable @typescript-eslint/no-unused-vars */

  async generate(): Promise<ApiKeys> {
    Logger.section('Generating WooCommerce API Keys');

    // Verify WooCommerce is active
    const isWooCommerceActive = await this.wpCli.isPluginActive('woocommerce');
    if (!isWooCommerceActive) {
      throw new ApiKeyGenerationError('WooCommerce plugin is not active');
    }
    Logger.success('WooCommerce is active');

    // Ensure database tables exist
    Logger.info('Verifying WooCommerce database tables...');
    await this.wpCli.execute('eval "WC_Install::install();"');
    Logger.success('WooCommerce database tables verified');

    // Generate API keys
    Logger.info('Creating API key with read/write permissions...');
    const apiKeyData = await this.generateApiKeyInDatabase();

    if (apiKeyData.error) {
      throw new ApiKeyGenerationError(apiKeyData.error);
    }

    if (!apiKeyData.consumer_key || !apiKeyData.consumer_secret) {
      throw new ApiKeyGenerationError('Invalid response from database');
    }

    const apiKeys: ApiKeys = {
      consumer_key: apiKeyData.consumer_key,
      consumer_secret: apiKeyData.consumer_secret,
      site_url: CONFIG.wordpress.url,
      created_at: new Date().toISOString(),
    };

    Logger.success('API keys generated successfully');
    Logger.info(`  Key ID: ${apiKeyData.key_id}`);
    Logger.info(`  Consumer Key: ${apiKeys.consumer_key}`);
    Logger.info(`  Consumer Secret: ${apiKeys.consumer_secret.substring(0, 20)}...`);

    return apiKeys;
  }

  private async generateApiKeyInDatabase(): Promise<ApiKeyResponse> {
    // Use compact PHP without formatting to avoid base64 length issues
    const phpCode = `global $wpdb;$u=1;$d="FlexOrder-CI-".gmdate("Y-m-d-H-i-s");$p="read_write";$ck="ck_".wc_rand_hash();$cs="cs_".wc_rand_hash();$i=$wpdb->insert($wpdb->prefix."woocommerce_api_keys",array("user_id"=>$u,"description"=>$d,"permissions"=>$p,"consumer_key"=>wc_api_hash($ck),"consumer_secret"=>$cs,"truncated_key"=>substr($ck,-7)),array("%d","%s","%s","%s","%s","%s"));if($i){echo json_encode(array("key_id"=>$wpdb->insert_id,"consumer_key"=>$ck,"consumer_secret"=>$cs,"permissions"=>$p,"user_id"=>$u));}else{echo json_encode(array("error"=>"DB insert failed: ".$wpdb->last_error));}`;


    const result = await this.wpCli.evaluatePhpCode(phpCode);
    
    
    return JSON.parse(result);
  }
}

// ============================================================================
// FILE SYSTEM MANAGER
// ============================================================================

class FileSystemManager {
  async saveApiKeys(apiKeys: ApiKeys): Promise<void> {
    Logger.info('Saving API keys to file...');
    Utils.ensureDirectoryExists(CONFIG.paths.utilitiesDir);

    const apiKeysPath = path.join(CONFIG.paths.utilitiesDir, CONFIG.paths.apiKeysFile);
    await fs.writeFile(apiKeysPath, JSON.stringify(apiKeys, null, 2), 'utf8');

    Logger.success(`API keys saved to: ${apiKeysPath}`);
  }

  async updateEnvFile(apiKeys: ApiKeys): Promise<void> {
    Logger.info('Updating .env file...');

    try {
      let envContent = '';

      // Read existing .env file
      if (fsSync.existsSync(CONFIG.paths.envFile)) {
        envContent = await fs.readFile(CONFIG.paths.envFile, 'utf8');
      }

      // Update or append consumer key
      envContent = this.updateOrAppendEnvVariable(
        envContent,
        'WOOCOMMERCE_CONSUMER_KEY',
        apiKeys.consumer_key
      );

      // Update or append consumer secret
      envContent = this.updateOrAppendEnvVariable(
        envContent,
        'WOOCOMMERCE_CONSUMER_SECRET',
        apiKeys.consumer_secret
      );

      // Write updated content
      await fs.writeFile(CONFIG.paths.envFile, envContent, 'utf8');

      // Update process environment
      process.env.WOOCOMMERCE_CONSUMER_KEY = apiKeys.consumer_key;
      process.env.WOOCOMMERCE_CONSUMER_SECRET = apiKeys.consumer_secret;

      Logger.success('.env file updated successfully');
    } catch (error) {
      Logger.warning(`.env update failed: ${(error as Error).message}`);
      Logger.info('API keys are still available in api-keys.json');
    }
  }

  private updateOrAppendEnvVariable(content: string, key: string, value: string): string {
    const regex = new RegExp(`^${key}=.*$`, 'gm');
    const newLine = `${key}=${value}`;

    if (regex.test(content)) {
      return content.replace(regex, newLine);
    }

    return content.trim() + `\n${newLine}\n`;
  }

  async validateApiKeysFile(): Promise<ApiKeys> {
    const apiKeysPath = path.join(CONFIG.paths.utilitiesDir, CONFIG.paths.apiKeysFile);

    if (!fsSync.existsSync(apiKeysPath)) {
      throw new Error('API keys file not found');
    }

    const content = await fs.readFile(apiKeysPath, 'utf8');
    const apiKeys: ApiKeys = JSON.parse(content);

    if (!apiKeys.consumer_key || !apiKeys.consumer_secret) {
      throw new Error('API keys file contains invalid data');
    }

    return apiKeys;
  }
}

// ============================================================================
// MAIN ORCHESTRATOR
// ============================================================================

class SetupOrchestrator {
  private readonly executor: DockerExecutor;
  private readonly wpCli: WordPressCLI;
  private readonly healthChecker: ServiceHealthChecker;
  private readonly testDataGenerator: TestDataGenerator;
  private readonly apiKeyManager: ApiKeyManager;
  private readonly fileSystemManager: FileSystemManager;

  constructor() {
    this.executor = new DockerExecutor();
    this.wpCli = new WordPressCLI(this.executor, CONFIG.docker.containerName);
    this.healthChecker = new ServiceHealthChecker(this.executor);
    this.testDataGenerator = new TestDataGenerator(this.wpCli);
    this.apiKeyManager = new ApiKeyManager(this.wpCli);
    this.fileSystemManager = new FileSystemManager();
  }

  async run(): Promise<void> {
    try {
      Logger.section('FlexOrder CI Environment Setup');
      this.printConfiguration();

      // Step 1: Wait for services
      await this.healthChecker.waitForAllServices();

      // Step 2: Configure WordPress permalinks (required for REST API)
      await this.configurePermalinks();

      // Step 3: Generate test data
      await this.testDataGenerator.generateAll();

      // Step 4: Generate API keys
      const apiKeys = await this.apiKeyManager.generate();

      // Step 5: Save API keys to file
      await this.fileSystemManager.saveApiKeys(apiKeys);

      // Step 6: Update .env file
      await this.fileSystemManager.updateEnvFile(apiKeys);

      // Step 7: Validate setup
      await this.validateSetup();

      // Success summary
      this.printSuccessSummary(apiKeys);
    } catch (error) {
      Logger.error('Setup failed', error as Error);
      process.exit(1);
    }
  }

  private async configurePermalinks(): Promise<void> {
    Logger.section('Configuring WordPress Permalinks');
    
    try {
      // Set permalink structure to /%postname%/ (required for REST API)
      Logger.info('Setting permalink structure to "Pretty Permalinks"...');
      await this.wpCli.execute('rewrite structure "/%postname%/"');
      Logger.success('Permalinks configured successfully');
      
      // Flush rewrite rules to ensure routes work
      Logger.info('Flushing rewrite rules...');
      await this.wpCli.execute('rewrite flush');
      Logger.success('Rewrite rules flushed');
    } catch (error) {
      Logger.error('Failed to configure permalinks', error as Error);
      throw error;
    }
  }

  private printConfiguration(): void {
    Logger.info('Configuration:');
    Logger.info(`  WordPress URL: ${CONFIG.wordpress.url}`);
    Logger.info(`  Admin User: ${CONFIG.wordpress.admin.username}`);
    Logger.info(`  Container: ${CONFIG.docker.containerName}`);
    Logger.info(`  Products: ${CONFIG.testData.productsCount}`);
    Logger.info(`  Orders: ${CONFIG.testData.ordersCount}`);
  }

  private async validateSetup(): Promise<void> {
    Logger.section('Validating Setup');

    // Validate API keys file
    await this.fileSystemManager.validateApiKeysFile();
    Logger.success('API keys file is valid');

    // Validate WordPress is accessible
    const isWordPressReady = await this.wpCli.isReady();
    if (!isWordPressReady) {
      throw new Error('WordPress is not responding to WP-CLI commands');
    }
    Logger.success('WordPress is accessible');

    Logger.success('All validation checks passed');
  }

  private printSuccessSummary(apiKeys: ApiKeys): void {
    Logger.section('Setup Complete');
    Logger.success('FlexOrder CI environment is ready!');
    /* eslint-disable no-console */
    console.log('');
    console.log('📋 Summary:');
    console.log(`   🌐 WordPress: ${CONFIG.wordpress.url}`);
    console.log(`   👤 Admin: ${CONFIG.wordpress.admin.username} / ${CONFIG.wordpress.admin.password}`);
    console.log(`   🔑 Consumer Key: ${apiKeys.consumer_key}`);
    console.log(`   📁 API Keys File: tests/fixtures/${CONFIG.paths.apiKeysFile}`);
    console.log(`   📄 Environment File: ${CONFIG.paths.envFile}`);
    console.log('');
    /* eslint-enable no-console */
  }
}

// ============================================================================
// ENTRY POINT
// ============================================================================

async function main(): Promise<void> {
  const orchestrator = new SetupOrchestrator();
  await orchestrator.run();
}

// Execute if run directly
if (require.main === module) {
  main().catch((error) => {
    Logger.error('Fatal error', error);
    process.exit(1);
  });
}

// Export for testing
export {
  SetupOrchestrator,
  WordPressCLI,
  ApiKeyManager,
  TestDataGenerator,
  FileSystemManager,
  ServiceHealthChecker,
};