import * as vscode from 'vscode';
import { SessionManager } from '../services/sessionManager';

/**
 * Handles the "Vibe Coding: Start" command.
 * Creates a new session and opens sessions folder in a new VS Code window.
 * All past sessions are visible in the explorer.
 */
export async function startSession(
  sessionManager: SessionManager,
  context: vscode.ExtensionContext
): Promise<void> {
  try {
    // Create session directory and vibe.js file
    const { baseDir, vibeFile } = await sessionManager.createSession();

    // Store the vibe file path for the new window to open
    await context.globalState.update('pendingVibeFile', vibeFile);

    // Open sessions folder in a new VS Code window
    const uri = vscode.Uri.file(baseDir);
    await vscode.commands.executeCommand('vscode.openFolder', uri, {
      forceNewWindow: true,
    });
  } catch (error) {
    // Silent fail - no notifications per PRD philosophy
    // Errors only logged to console for debugging
    console.error('[just-vibe-coding]', error);
  }
}
