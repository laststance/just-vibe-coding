import * as vscode from 'vscode';

/**
 * Manages the status bar item showing "~ vibe coding ~".
 */
export class StatusBar {
  private item: vscode.StatusBarItem;

  constructor() {
    this.item = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.item.text = '~ vibe coding ~';
    this.item.show();
  }

  /**
   * Updates the status bar text.
   */
  setText(text: string): void {
    this.item.text = text;
  }

  /**
   * Shows the status bar item.
   */
  show(): void {
    this.item.show();
  }

  /**
   * Hides the status bar item.
   */
  hide(): void {
    this.item.hide();
  }

  /**
   * Disposes the status bar item.
   */
  dispose(): void {
    this.item.dispose();
  }
}
