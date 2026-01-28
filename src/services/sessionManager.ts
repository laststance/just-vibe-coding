import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';

/**
 * Manages vibe coding sessions.
 * Creates session directories and files at ~/.just-vibe-coding/sessions/
 */
export class SessionManager {
  private readonly baseDir: string;

  constructor() {
    this.baseDir = path.join(os.homedir(), '.just-vibe-coding', 'sessions');
  }

  /**
   * Creates a new vibe coding session.
   * @returns Path to the created session directory
   */
  async createSession(): Promise<string> {
    const timestamp = this.getTimestamp();
    const sessionDir = path.join(this.baseDir, timestamp);
    const filePath = path.join(sessionDir, 'vibe.js');

    // Create session directory
    const dirUri = vscode.Uri.file(sessionDir);
    await vscode.workspace.fs.createDirectory(dirUri);

    // Create vibe.js with initial content
    const fileUri = vscode.Uri.file(filePath);
    const content = Buffer.from('console.log("vibe coding")\n', 'utf8');
    await vscode.workspace.fs.writeFile(fileUri, content);

    return sessionDir;
  }

  /**
   * Checks if a workspace path is a vibe coding session.
   */
  isVibeSession(workspacePath: string): boolean {
    return workspacePath.includes('.just-vibe-coding') && workspacePath.includes('sessions');
  }

  /**
   * Generates a timestamp string for session directory naming.
   * Format: YYYY-MM-DD-HH-MM
   */
  private getTimestamp(): string {
    const now = new Date();
    const pad = (n: number): string => n.toString().padStart(2, '0');
    return [
      now.getFullYear(),
      pad(now.getMonth() + 1),
      pad(now.getDate()),
      pad(now.getHours()),
      pad(now.getMinutes()),
    ].join('-');
  }
}
