import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import { OutputManager } from './outputManager';

/**
 * Executes vibe.ts/vibe.js files using Node.js.
 * Uses Node 22+ native TypeScript execution with --experimental-strip-types.
 */
export class Executor {
  private currentProcess: ChildProcess | null = null;

  constructor(private outputManager: OutputManager) {}

  /**
   * Executes a vibe file and streams output to the output channel.
   */
  execute(filePath: string): void {
    // Kill previous process if running
    this.kill();

    // Clear output before new execution
    this.outputManager.clear();

    const fileName = path.basename(filePath);
    const isTypeScript = filePath.endsWith('.ts');

    // Build command args
    const args = isTypeScript
      ? ['--experimental-strip-types', filePath]
      : [filePath];

    // Spawn Node.js process
    this.currentProcess = spawn('node', args, {
      cwd: path.dirname(filePath),
      shell: true,
    });

    // Stream stdout
    this.currentProcess.stdout?.on('data', (data: Buffer) => {
      this.outputManager.append(data.toString());
    });

    // Stream stderr (errors go to output, no popups)
    this.currentProcess.stderr?.on('data', (data: Buffer) => {
      const message = data.toString();
      // Check for Node version error
      if (message.includes('--experimental-strip-types')) {
        this.outputManager.append(
          '[error] Node 22+ required for TypeScript execution\n'
        );
      } else {
        this.outputManager.append(message);
      }
    });

    // Handle process exit
    this.currentProcess.on('close', () => {
      this.currentProcess = null;
    });

    // Handle spawn errors silently
    this.currentProcess.on('error', (error) => {
      this.outputManager.append(`[error] ${error.message}\n`);
      this.currentProcess = null;
    });
  }

  /**
   * Kills the currently running process if any.
   */
  kill(): void {
    if (this.currentProcess) {
      this.currentProcess.kill();
      this.currentProcess = null;
    }
  }
}
