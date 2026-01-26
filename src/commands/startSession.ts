import * as vscode from 'vscode';
import { SessionManager } from '../services/sessionManager';

/**
 * Handles the "Vibe Coding: Start" command.
 * Creates a new session and opens it in a new VS Code window.
 */
export async function startSession(sessionManager: SessionManager): Promise<void> {
  try {
    // Create session directory and vibe.ts file
    const sessionPath = await sessionManager.createSession();

    // Open in a new VS Code window
    const uri = vscode.Uri.file(sessionPath);
    await vscode.commands.executeCommand('vscode.openFolder', uri, {
      forceNewWindow: true,
    });
  } catch (error) {
    // Silent fail - no notifications per PRD philosophy
    // Errors only logged to console for debugging
    console.error('[vibe-coding]', error);
  }
}
