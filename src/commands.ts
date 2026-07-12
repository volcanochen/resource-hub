import * as vscode from 'vscode';
import { exec, spawn } from 'child_process';
import * as os from 'os';
import { ResourceEntry, ResourceType, DEFAULT_GROUP, TYPE_ICONS, TYPE_LABELS } from './types';
import { ResourceStorage } from './storage';
import { log } from './logger';

const PLACEHOLDER = '__group_placeholder__';

function isPlaceholder(e: ResourceEntry): boolean {
  return e.label === PLACEHOLDER && e.target === '';
}

function defaultLabel(target: string, type: ResourceType): string {
  if (type === 'web') {
    try {
      return new URL(target).hostname;
    } catch {
      return target;
    }
  }
  const parts = target.split(/[/\\]/).filter(Boolean);
  const last = parts[parts.length - 1] || target;
  if (type === 'command') {
    return last.replace(/\.(exe|bat|cmd|ps1|sh)$/i, '');
  }
  return last;
}

// ── Open ────────────────────────────────────────────────────────────────────

export async function openResource(entry: ResourceEntry): Promise<void> {
  log('openResource', entry);
  switch (entry.type) {
    case 'file':
      try {
        const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(entry.target));
        await vscode.window.showTextDocument(doc);
      } catch (e) {
        log('openTextDocument failed, opening externally', e);
        vscode.env.openExternal(vscode.Uri.file(entry.target));
      }
      break;
    case 'path':
      vscode.env.openExternal(vscode.Uri.file(entry.target));
      break;
    case 'web':
      vscode.env.openExternal(vscode.Uri.parse(entry.target));
      break;
    case 'command':
      runCommand(entry.target);
      break;
  }
}

function runCommand(target: string): void {
  log('runCommand', target);
  const isWin = os.platform() === 'win32';
  if (isWin) {
    const child = spawn(target, { shell: true, detached: true, stdio: 'ignore' });
    child.on('error', (err) => {
      log('runCommand error', err);
      vscode.window.showErrorMessage(`执行失败: ${err.message}`);
    });
    child.unref();
  } else {
    exec(`nohup ${target} &`, (err) => {
      if (err) {
        log('runCommand error', err);
        vscode.window.showErrorMessage(`执行失败: ${err.message}`);
      }
    });
  }
}

// ── Open in Terminal ────────────────────────────────────────────────────────

export async function openInTerminal(entry: ResourceEntry): Promise<void> {
  log('openInTerminal', entry);
  const terminal = vscode.window.createTerminal(entry.label);
  terminal.show();
  if (entry.type === 'command') {
    terminal.sendText(entry.target);
  } else if (entry.type === 'path') {
    const cdCmd = os.platform() === 'win32' ? `cd /d "${entry.target}"` : `cd "${entry.target}"`;
    terminal.sendText(cdCmd);
  }
}

// ── Add File (no prompts — auto label, auto Default group) ──────────────────

export async function addFile(storage: ResourceStorage, presetGroup?: string): Promise<void> {
  log('addFile start, presetGroup=', presetGroup);
  const defaultUri = vscode.workspace.workspaceFolders?.[0]?.uri
    ?? vscode.Uri.file(os.homedir());

  let uris: vscode.Uri[] | undefined;
  try {
    uris = await vscode.window.showOpenDialog({
      canSelectMany: false,
      canSelectFiles: true,
      canSelectFolders: false,
      openLabel: 'Select File',
      title: 'Add File',
      defaultUri,
    });
    log('showOpenDialog result=', uris);
  } catch (e) {
    log('showOpenDialog ERROR', e);
    vscode.window.showErrorMessage(`File dialog error: ${(e as Error).message}`);
    return;
  }
  if (!uris?.length) {
    return;
  }

  const filePath = uris[0].fsPath;
  const label = defaultLabel(filePath, 'file');
  const group = presetGroup ?? DEFAULT_GROUP;

  await storage.add({
    id: storage.generateId(),
    type: 'file',
    label,
    target: filePath,
    group,
  });
  log('addFile saved:', label, '->', group);
}

// ── Add File from Context (from file URI) ───────────────────────────────────

export async function addFileToContext(uri: vscode.Uri, storage: ResourceStorage): Promise<void> {
  log('addFileToContext:', uri.fsPath);
  
  const label = defaultLabel(uri.fsPath, 'file');
  const group = DEFAULT_GROUP;

  await storage.add({
    id: storage.generateId(),
    type: 'file',
    label,
    target: uri.fsPath,
    group,
  });
  log('addFileToContext saved:', label);
}

// ── Add Folder (no prompts) ─────────────────────────────────────────────────

export async function addPath(storage: ResourceStorage, presetGroup?: string): Promise<void> {
  log('addPath start, presetGroup=', presetGroup);
  const defaultUri = vscode.workspace.workspaceFolders?.[0]?.uri
    ?? vscode.Uri.file(os.homedir());

  let uris: vscode.Uri[] | undefined;
  try {
    uris = await vscode.window.showOpenDialog({
      canSelectMany: false,
      canSelectFiles: false,
      canSelectFolders: true,
      openLabel: 'Select Folder',
      title: 'Add Folder',
      defaultUri,
    });
    log('showOpenDialog result=', uris);
  } catch (e) {
    log('showOpenDialog ERROR', e);
    vscode.window.showErrorMessage(`Folder dialog error: ${(e as Error).message}`);
    return;
  }
  if (!uris?.length) {
    return;
  }

  const folderPath = uris[0].fsPath;
  const label = defaultLabel(folderPath, 'path');
  const group = presetGroup ?? DEFAULT_GROUP;

  await storage.add({
    id: storage.generateId(),
    type: 'path',
    label,
    target: folderPath,
    group,
  });
  log('addPath saved:', label, '->', group);
}

// ── Add Folder from Context (from folder URI) ───────────────────────────────

export async function addPathToContext(uri: vscode.Uri, storage: ResourceStorage): Promise<void> {
  log('addPathToContext:', uri.fsPath);
  
  const label = defaultLabel(uri.fsPath, 'path');
  const group = DEFAULT_GROUP;

  await storage.add({
    id: storage.generateId(),
    type: 'path',
    label,
    target: uri.fsPath,
    group,
  });
  log('addPathToContext saved:', label);
}

// ── Add Web Page (no label prompt) ──────────────────────────────────────────

export async function addWebPage(storage: ResourceStorage, presetGroup?: string): Promise<void> {
  log('addWebPage start, presetGroup=', presetGroup);
  const url = await vscode.window.showInputBox({
    prompt: 'Web page URL',
    placeHolder: 'https://example.com',
    validateInput: (v) => {
      if (!v) {
        return 'URL is required';
      }
      try {
        new URL(v);
        return undefined;
      } catch {
        return 'Invalid URL';
      }
    },
  });
  if (!url) {
    return;
  }

  const label = defaultLabel(url, 'web');
  const group = presetGroup ?? DEFAULT_GROUP;

  await storage.add({
    id: storage.generateId(),
    type: 'web',
    label,
    target: url,
    group,
  });
  log('addWebPage saved:', label, '->', group);
}

// ── Add Command (no label prompt) ───────────────────────────────────────────

export async function addCommand(storage: ResourceStorage, presetGroup?: string): Promise<void> {
  log('addCommand start, presetGroup=', presetGroup);
  const target = await vscode.window.showInputBox({
    prompt: 'Command or executable path',
    placeHolder: 'notepad.exe or "C:\\Program Files\\App\\app.exe" --flag',
  });
  if (!target) {
    return;
  }

  const label = defaultLabel(target, 'command');
  const group = presetGroup ?? DEFAULT_GROUP;

  await storage.add({
    id: storage.generateId(),
    type: 'command',
    label,
    target,
    group,
  });
  log('addCommand saved:', label, '->', group);
}

// ── Add Group ───────────────────────────────────────────────────────────────

export async function addGroup(storage: ResourceStorage): Promise<void> {
  log('addGroup start');
  const name = await vscode.window.showInputBox({
    prompt: 'New group name',
    placeHolder: 'e.g. Work, Tools, References...',
    validateInput: (v) => {
      if (!v || !v.trim()) {
        return 'Group name is required';
      }
      return undefined;
    },
  });
  if (!name) {
    return;
  }
  const trimmed = name.trim();
  const existing = storage.getGroups();
  if (existing.includes(trimmed)) {
    vscode.window.showWarningMessage(`Group "${trimmed}" already exists`);
    return;
  }
  await storage.add({
    id: storage.generateId(),
    type: 'file',
    label: PLACEHOLDER,
    target: '',
    group: trimmed,
  });
  log('addGroup created=', trimmed);
}

// ── Rename Group ────────────────────────────────────────────────────────────

export async function renameGroup(oldName: string, storage: ResourceStorage): Promise<void> {
  log('renameGroup:', oldName);
  const newName = await vscode.window.showInputBox({
    prompt: 'New group name',
    value: oldName,
    validateInput: (v) => {
      if (!v || !v.trim()) {
        return 'Group name is required';
      }
      if (v.trim() !== oldName && storage.getGroups().includes(v.trim())) {
        return 'Group name already exists';
      }
      return undefined;
    },
  });
  if (!newName || newName.trim() === oldName) {
    return;
  }
  const entries = storage.getByGroup(oldName);
  for (const e of entries) {
    await storage.update(e.id, { group: newName.trim() });
  }
  log('renameGroup done:', oldName, '->', newName.trim());
}

// ── Rename Resource ─────────────────────────────────────────────────────────

export async function renameResource(entry: ResourceEntry, storage: ResourceStorage): Promise<void> {
  log('renameResource:', entry.label);
  const newLabel = await vscode.window.showInputBox({
    prompt: 'New display name',
    value: entry.label,
  });
  if (newLabel && newLabel !== entry.label) {
    await storage.update(entry.id, { label: newLabel });
  }
}

// ── Edit Resource Details (by type) ─────────────────────────────────────────

export async function editResource(entry: ResourceEntry, storage: ResourceStorage): Promise<void> {
  log('editResource:', entry);
  const field = await vscode.window.showQuickPick(
    [
      { label: 'Name', value: 'label', description: entry.label },
      { label: 'Target', value: 'target', description: entry.target },
      ...(entry.type === 'command' ? [{ label: 'Open in Terminal', value: 'terminal' }] : []),
    ],
    { placeHolder: `Edit ${TYPE_LABELS[entry.type]}: ${entry.label}` },
  );
  if (!field) {
    return;
  }

  if (field.value === 'terminal') {
    await openInTerminal(entry);
    return;
  }

  const newValue = await vscode.window.showInputBox({
    prompt: `New ${field.label}`,
    value: field.value === 'label' ? entry.label : entry.target,
  });
  if (!newValue || newValue === (field.value === 'label' ? entry.label : entry.target)) {
    return;
  }

  if (field.value === 'label') {
    await storage.update(entry.id, { label: newValue });
  } else {
    await storage.update(entry.id, { target: newValue });
  }
  log('editResource updated:', field.value, '=', newValue);
}

// ── Move to Group ───────────────────────────────────────────────────────────

export async function moveToGroup(entry: ResourceEntry, storage: ResourceStorage): Promise<void> {
  const groups = storage.getGroups().filter(g => g !== entry.group);
  const options: vscode.QuickPickItem[] = [
    ...groups.map(g => ({ label: g })),
    { label: '$(plus) New Group...', alwaysShow: true },
  ];

  const picked = await vscode.window.showQuickPick(options, {
    placeHolder: `Move "${entry.label}" to...`,
  });
  if (!picked) {
    return;
  }

  let target: string;
  if (picked.label === '$(plus) New Group...') {
    const newName = await vscode.window.showInputBox({ prompt: 'New group name' });
    if (!newName) {
      return;
    }
    target = newName.trim();
  } else {
    target = picked.label;
  }

  await storage.update(entry.id, { group: target });
  log('moveToGroup:', entry.label, '->', target);
}

// ── Delete ──────────────────────────────────────────────────────────────────

export async function deleteResource(item: { isGroup: boolean; label: string; entry?: ResourceEntry }, storage: ResourceStorage): Promise<void> {
  log('deleteResource', { isGroup: item.isGroup, label: item.label });
  if (item.isGroup) {
    const count = storage.getByGroup(item.label).length;
    const confirm = await vscode.window.showWarningMessage(
      `Delete group "${item.label}" and ${count} item(s)?`,
      { modal: true },
      'Delete',
    );
    if (confirm !== 'Delete') {
      return;
    }
    await storage.removeGroup(item.label);
  } else if (item.entry) {
    await storage.remove(item.entry.id);
  }
}

// ── Add Selection as File (from editor) ────────────────────────────────────

export async function addSelectionAsFile(storage: ResourceStorage): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage('No active text editor');
    return;
  }

  const selection = editor.selection;
  const selectedText = editor.document.getText(selection);
  
  if (!selectedText || selectedText.trim() === '') {
    vscode.window.showWarningMessage('Please select some text first.');
    return;
  }

  const tempDir = vscode.Uri.joinPath(
    vscode.workspace?.workspaceFolders?.[0]?.uri ?? vscode.Uri.file(os.homedir()),
    '.vscode',
    'resource-hub-temp'
  );

  await vscode.workspace.fs.createDirectory(tempDir);

  // Determine extension based on active document language
  let ext: string;
  if (editor.document.languageId === 'plaintext' || !editor.document.languageId) {
    ext = 'txt';
  } else {
    const extensions: Record<string, string> = {
      javascript: 'js', typescript: 'ts', json: 'json', xml: 'xml',
      html: 'html', css: 'css', python: 'py', java: 'java', csharp: 'cs',
      go: 'go', rust: 'rs', php: 'php', swift: 'swift', kotlin: 'kt',
      sql: 'sql', markdown: 'md', yaml: 'yml', toml: 'toml'
    };
    ext = extensions[editor.document.languageId] || 'txt';
  }

  // Find next available number by scanning both storage and filesystem
  const usedNumbers = new Set<number>();

  // Check storage entries
  const allEntries = storage.getAll();
  for (const e of allEntries) {
    const m = e.label.match(/^selection_(\d+)\./);
    if (m) { usedNumbers.add(parseInt(m[1], 10)); }
  }

  // Check filesystem
  try {
    const tempFiles = await vscode.workspace.fs.readDirectory(tempDir);
    for (const [name] of tempFiles) {
      const m = name.match(/^selection_(\d+)\./);
      if (m) { usedNumbers.add(parseInt(m[1], 10)); }
    }
  } catch { /* dir may be empty */ }

  let seq = 1;
  while (usedNumbers.has(seq)) { seq++; }

  const label = `selection_${String(seq).padStart(4, '0')}.${ext}`;
  const fileUri = vscode.Uri.joinPath(tempDir, label);

  // Actually write the file to disk
  const encoder = new TextEncoder();
  await vscode.workspace.fs.writeFile(fileUri, encoder.encode(selectedText));

  await storage.add({
    id: storage.generateId(),
    type: 'file',
    label,
    target: fileUri.fsPath,
    group: DEFAULT_GROUP,
  });

  log('addSelectionAsFile saved:', label, '->', fileUri.fsPath);
}

// ── Copy Target ─────────────────────────────────────────────────────────────

export async function copyTarget(entry: ResourceEntry): Promise<void> {
  await vscode.env.clipboard.writeText(entry.target);
  vscode.window.showInformationMessage(`Copied: ${entry.target}`);
}

// ── Search and Open ─────────────────────────────────────────────────────────

export async function searchAndOpen(storage: ResourceStorage): Promise<void> {
  const entries = storage.getAll().filter(e => !isPlaceholder(e));
  if (entries.length === 0) {
    vscode.window.showInformationMessage('No resources added yet.');
    return;
  }

  const items: vscode.QuickPickItem[] = entries.map(e => ({
    label: `$(${TYPE_ICONS[e.type]})  ${e.label}`,
    description: e.target,
    detail: `[${TYPE_LABELS[e.type]}] ${e.group || DEFAULT_GROUP}`,
  }));

  const picked = await vscode.window.showQuickPick(items, {
    placeHolder: 'Search resources by name...',
    matchOnDescription: true,
    matchOnDetail: true,
  });

  if (picked) {
    const idx = items.indexOf(picked);
    if (idx >= 0) {
      await openResource(entries[idx]);
    }
  }
}

// ── Drag & Drop: move entry to a different group ────────────────────────────

export async function moveEntryToGroup(entryId: string, groupName: string, storage: ResourceStorage): Promise<void> {
  log('moveEntryToGroup:', entryId, '->', groupName);
  await storage.update(entryId, { group: groupName });
}

export { isPlaceholder, DEFAULT_GROUP };
