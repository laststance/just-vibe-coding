import * as vscode from 'vscode';
import { spawn, ChildProcess } from 'child_process';
import { dirname } from 'path';
import { OutputManager } from './outputManager';

/**
 * Executes vibe files (vibe.js or vibe.py) using the appropriate runtime.
 */
export class Executor {
  private currentProcess: ChildProcess | null = null;

  constructor(private outputManager: OutputManager) {}

  /**
   * Sets the running state context for UI updates.
   * @param running - Whether a process is currently running
   */
  private setRunningState(running: boolean): void {
    vscode.commands.executeCommand('setContext', 'just-vibe-coding.isRunning', running);
  }

  /**
   * Executes a vibe file and streams output to the output channel.
   * @param filePath - Path to vibe.js or vibe.py
   */
  execute(filePath: string): void {
    // Kill previous process if running
    this.kill();

    // Clear output before new execution
    this.outputManager.clear();

    // Select runtime based on file extension
    const isPython = filePath.endsWith('.py');
    const command = isPython ? 'python3' : 'node';

    // Spawn process
    this.currentProcess = spawn(command, [filePath], {
      cwd: dirname(filePath),
      shell: true,
    });

    // Update running state
    this.setRunningState(true);

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
      this.setRunningState(false);
    });

    // Handle spawn errors silently
    this.currentProcess.on('error', (error) => {
      this.outputManager.append(`[error] ${error.message}\n`);
      this.currentProcess = null;
      this.setRunningState(false);
    });
  }

  /**
   * Kills the currently running process if any.
   */
  kill(): void {
    if (this.currentProcess) {
      this.currentProcess.kill();
      this.currentProcess = null;
      this.setRunningState(false);
    }
  }
}
