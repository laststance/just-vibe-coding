import * as path from 'path';
import Mocha from 'mocha';
import { glob } from 'glob';

/**
 * Runs the Mocha test suite.
 * Discovers all *.test.js files and executes them.
 */
export async function run(): Promise<void> {
  // Create the mocha test runner
  const mocha = new Mocha({
    ui: 'bdd',
    color: true,
    timeout: 60000, // 60s timeout for extension tests
  });

  const testsRoot = path.resolve(__dirname, '.');

  // Find all test files
  const files = await glob('**/**.test.js', { cwd: testsRoot });

  // Add files to the test suite
  for (const file of files) {
    mocha.addFile(path.resolve(testsRoot, file));
  }

  // Run the mocha test
  return new Promise<void>((resolve, reject) => {
    mocha.run((failures) => {
      if (failures > 0) {
        reject(new Error(`${failures} tests failed.`));
      } else {
        resolve();
      }
    });
  });
}
