import { spawn, ChildProcess } from 'child_process';
import { dirname } from 'path';
import { OutputManager } from './outputManager';

/**
 * Executes vibe.js files using Node.js.
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

    // Spawn Node.js process
    this.currentProcess = spawn('node', [filePath], {
      cwd: dirname(filePath),
      shell: true,
    });

    // Stream stdout
    this.currentProcess.stdout?.on('data', (data: Buffer) => {
      this.outputManager.append(data.toString());
    });

    // Stream stderr (errors go to output, no popups)
    this.currentProcess.stderr?.on('data', (data: Buffer) => {
      this.outputManager.append(data.toString());
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
