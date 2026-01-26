import * as vscode from 'vscode';

/**
 * Manages the output channel for vibe coding console output.
 */
export class OutputManager {
  private outputChannel: vscode.OutputChannel;

  constructor() {
    this.outputChannel = vscode.window.createOutputChannel('vibe');
  }

  /**
   * Appends text to the output channel.
   */
  append(text: string): void {
    this.outputChannel.append(text);
  }

  /**
   * Appends a line to the output channel.
   */
  appendLine(text: string): void {
    this.outputChannel.appendLine(text);
  }

  /**
   * Clears the output channel.
   */
  clear(): void {
    this.outputChannel.clear();
  }

  /**
   * Shows the output channel.
   * @param preserveFocus If true, the editor keeps focus (default: true)
   */
  show(preserveFocus = true): void {
    this.outputChannel.show(preserveFocus);
  }

  /**
   * Hides the output channel.
   */
  hide(): void {
    this.outputChannel.hide();
  }

  /**
   * Disposes the output channel.
   */
  dispose(): void {
    this.outputChannel.dispose();
  }
}
