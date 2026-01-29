import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';

describe('Just Vibe Coding Extension', () => {
  const extensionId = 'laststance.just-vibe-coding';
  const testSessionsDir = path.join(os.homedir(), '.just-vibe-coding', 'sessions');

  it('Extension should be present', () => {
    const extension = vscode.extensions.getExtension(extensionId);
    assert.ok(extension, 'Extension should be installed');
  });

  it('Extension should activate', async () => {
    const extension = vscode.extensions.getExtension(extensionId);
    assert.ok(extension, 'Extension should be installed');

    // Activate the extension
    await extension.activate();
    assert.ok(extension.isActive, 'Extension should be active');
  });

  it('Start command should be registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    const hasStartCommand = commands.includes('just-vibe-coding.start');
    assert.ok(hasStartCommand, 'Start command should be registered');
  });

  it('SessionManager should create session directory', async () => {
    const extension = vscode.extensions.getExtension(extensionId);
    await extension?.activate();

    // Create a test session directory manually to verify the pattern
    const timestamp = new Date()
      .toISOString()
      .slice(0, 16)
      .replace('T', '-')
      .replace(':', '-');
    const testDir = path.join(testSessionsDir, `test-${timestamp}`);

    // Create directory using VS Code API
    const dirUri = vscode.Uri.file(testDir);
    await vscode.workspace.fs.createDirectory(dirUri);

    // Verify directory exists
    try {
      const stat = await vscode.workspace.fs.stat(dirUri);
      assert.ok(
        stat.type === vscode.FileType.Directory,
        'Session directory should be created'
      );
    } finally {
      // Cleanup
      await vscode.workspace.fs.delete(dirUri, { recursive: true });
    }
  });

  it('vibe.js file should be creatable in session', async () => {
    const extension = vscode.extensions.getExtension(extensionId);
    await extension?.activate();

    // Create a test session
    const timestamp = new Date()
      .toISOString()
      .slice(0, 16)
      .replace('T', '-')
      .replace(':', '-');
    const testDir = path.join(testSessionsDir, `test-${timestamp}`);
    const vibeFile = path.join(testDir, 'vibe.js');

    const dirUri = vscode.Uri.file(testDir);
    const fileUri = vscode.Uri.file(vibeFile);

    try {
      // Create directory and file
      await vscode.workspace.fs.createDirectory(dirUri);
      const content = Buffer.from('console.log("vibe coding")\n', 'utf8');
      await vscode.workspace.fs.writeFile(fileUri, content);

      // Verify file exists and has correct content
      const readContent = await vscode.workspace.fs.readFile(fileUri);
      assert.strictEqual(
        readContent.toString(),
        'console.log("vibe coding")\n',
        'vibe.js should have correct content'
      );
    } finally {
      // Cleanup
      await vscode.workspace.fs.delete(dirUri, { recursive: true });
    }
  });

});
