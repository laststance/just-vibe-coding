import * as path from 'path';
import { runTests } from '@vscode/test-electron';

/**
 * Main entry point for running VS Code extension tests.
 * Downloads VS Code, installs the extension, and runs the test suite.
 */
async function main(): Promise<void> {
  try {
    // The folder containing the Extension Manifest package.json
    const extensionDevelopmentPath = path.resolve(__dirname, '../../');

    // The path to the test runner script
    const extensionTestsPath = path.resolve(__dirname, './suite/index');

    // Download VS Code, unzip it, and run the integration tests
    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: [
        '--disable-extensions', // Disable other extensions for isolation
      ],
    });
  } catch (err) {
    console.error('Failed to run tests:', err);
    process.exit(1);
  }
}

main();
