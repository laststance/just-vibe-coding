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
    () => startSession(sessionManager)
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

  // Find vibe file (vibe.js or vibe.ts)
  const vibeFile = await findVibeFile(workspacePath);
  if (!vibeFile) return;

  // Open vibe file in editor (in the first column)
  const doc = await vscode.workspace.openTextDocument(vibeFile);
  await vscode.window.showTextDocument(doc, vscode.ViewColumn.One);

  // Open reference pane if enabled
  await openReferencePane();

  // Show output panel
  outputManager.show();

  // Register save watcher for auto-execution
  const saveWatcher = vscode.workspace.onDidSaveTextDocument((savedDoc) => {
    if (savedDoc.uri.fsPath === vibeFile) {
      executor?.execute(vibeFile);
    }
  });
  context.subscriptions.push(saveWatcher);

  // Initial execution
  executor.execute(vibeFile);
}

/**
 * Finds the vibe file in the workspace (vibe.js or vibe.ts).
 */
async function findVibeFile(workspacePath: string): Promise<string | undefined> {
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
      return undefined;
    }
  }
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
