import * as vscode from 'vscode';
import * as path from 'path';
import { startSession } from './commands/startSession';
import { SessionManager } from './services/sessionManager';
import { Executor } from './services/executor';
import { OutputManager } from './services/outputManager';
import { StatusBar } from './ui/statusBar';

let executor: Executor | undefined;
let outputManager: OutputManager | undefined;
let statusBar: StatusBar | undefined;

/**
 * Extension activation entry point.
 * - Registers the "Vibe Coding: Start" command
 * - If activated in a vibe session, sets up auto-execution on save
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const sessionManager = new SessionManager();

  // Register the start command
  const startCommand = vscode.commands.registerCommand(
    'just-vibe-coding.start',
    () => startSession(sessionManager, context)
  );
  context.subscriptions.push(startCommand);

  // Check if we're in a vibe session
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders?.length) return;

  const workspacePath = workspaceFolders[0].uri.fsPath;
  if (!sessionManager.isVibeSession(workspacePath)) return;

  // === VIBE SESSION SETUP ===
  await setupVibeSession(context, workspacePath);
}

/**
 * Sets up the vibe coding environment when opened in a vibe session directory.
 */
async function setupVibeSession(
  context: vscode.ExtensionContext,
  workspacePath: string
): Promise<void> {
  // Initialize services
  outputManager = new OutputManager();
  executor = new Executor(outputManager);
  statusBar = new StatusBar();

  context.subscriptions.push(
    { dispose: () => outputManager?.dispose() },
    { dispose: () => executor?.kill() },
    { dispose: () => statusBar?.dispose() }
  );

  // Find vibe file: check pending file first, then search workspace
  let vibeFile = await findVibeFile(context, workspacePath);
  if (!vibeFile) return;

  // Open vibe file in editor (in the first column)
  const doc = await vscode.workspace.openTextDocument(vibeFile);
  await vscode.window.showTextDocument(doc, vscode.ViewColumn.One);

  // Open reference pane if enabled
  await openReferencePane();

  // Show output panel
  outputManager.show();

  // Register save watcher for auto-execution (any vibe.js/vibe.ts in session folders)
  const saveWatcher = vscode.workspace.onDidSaveTextDocument((savedDoc) => {
    const savedPath = savedDoc.uri.fsPath;
    if (isVibeFile(savedPath)) {
      vibeFile = savedPath; // Update current vibe file
      executor?.execute(savedPath);
    }
  });
  context.subscriptions.push(saveWatcher);

  // Initial execution
  executor.execute(vibeFile);
}

/**
 * Checks if a file path is a vibe file (vibe.js or vibe.ts in a session folder).
 */
function isVibeFile(filePath: string): boolean {
  const fileName = path.basename(filePath);
  return (
    (fileName === 'vibe.js' || fileName === 'vibe.ts') &&
    filePath.includes('.just-vibe-coding') &&
    filePath.includes('sessions')
  );
}

/**
 * Finds the vibe file to open.
 * Priority:
 * 1. Pending vibe file from globalState (newly created session)
 * 2. Direct vibe.js/vibe.ts in workspace root (single session folder)
 * 3. Latest session's vibe file (sessions parent folder)
 */
async function findVibeFile(
  context: vscode.ExtensionContext,
  workspacePath: string
): Promise<string | undefined> {
  // Check for pending vibe file from "Start" command
  const pendingFile = context.globalState.get<string>('pendingVibeFile');
  if (pendingFile) {
    await context.globalState.update('pendingVibeFile', undefined); // Clear it
    try {
      await vscode.workspace.fs.stat(vscode.Uri.file(pendingFile));
      return pendingFile;
    } catch {
      // File doesn't exist, continue to other methods
    }
  }

  // Check for vibe file directly in workspace (single session folder)
  const jsFile = path.join(workspacePath, 'vibe.js');
  const tsFile = path.join(workspacePath, 'vibe.ts');

  try {
    await vscode.workspace.fs.stat(vscode.Uri.file(jsFile));
    return jsFile;
  } catch {
    try {
      await vscode.workspace.fs.stat(vscode.Uri.file(tsFile));
      return tsFile;
    } catch {
      // Not a single session folder, try finding latest session
    }
  }

  // Find latest session in sessions folder
  return findLatestSessionVibeFile(workspacePath);
}

/**
 * Finds the vibe file from the most recent session folder.
 * Session folders are named YYYY-MM-DD-HH-MM, so sorting alphabetically gives chronological order.
 */
async function findLatestSessionVibeFile(
  sessionsPath: string
): Promise<string | undefined> {
  try {
    const entries = await vscode.workspace.fs.readDirectory(
      vscode.Uri.file(sessionsPath)
    );

    // Filter directories and sort descending (newest first)
    const sessionDirs = entries
      .filter(([, type]) => type === vscode.FileType.Directory)
      .map(([name]) => name)
      .sort()
      .reverse();

    // Find first session with a vibe file
    for (const dir of sessionDirs) {
      const jsFile = path.join(sessionsPath, dir, 'vibe.js');
      const tsFile = path.join(sessionsPath, dir, 'vibe.ts');

      try {
        await vscode.workspace.fs.stat(vscode.Uri.file(jsFile));
        return jsFile;
      } catch {
        try {
          await vscode.workspace.fs.stat(vscode.Uri.file(tsFile));
          return tsFile;
        } catch {
          continue;
        }
      }
    }
  } catch {
    // Directory read failed
  }

  return undefined;
}

/**
 * Opens reference documentation in external browser if enabled in settings.
 * @returns void
 */
async function openReferencePane(): Promise<void> {
  const config = vscode.workspace.getConfiguration('just-vibe-coding');
  const openReference = config.get<boolean>('openReferencePane', true);
  const referenceUrl = config.get<string>(
    'referenceUrl',
    'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects#standard_objects_by_category'
  );

  if (!openReference) return;

  try {
    // Open in external browser (most reliable approach)
    await vscode.env.openExternal(vscode.Uri.parse(referenceUrl));
  } catch (error) {
    // Fail silently per product philosophy
    console.error('Failed to open reference:', error);
  }
}

/**
 * Extension deactivation cleanup.
 */
export function deactivate(): void {
  executor?.kill();
  outputManager?.dispose();
  statusBar?.dispose();
}
