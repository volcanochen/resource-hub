import * as vscode from 'vscode';
import { ResourceTreeProvider, ResourceItem } from './treeProvider';
import { ResourceStorage } from './storage';
import { initLogger, log, showOutput } from './logger';
import { DEFAULT_GROUP } from './types';
import {
  openResource,
  openInTerminal,
  addFile,
  addPath,
  addWebPage,
  addCommand,
  addGroup,
  renameGroup,
  deleteResource,
  renameResource,
  editResource,
  moveToGroup,
  copyTarget,
  searchAndOpen,
  addFileToContext,
  addPathToContext,
  addSelectionAsFile,
} from './commands';

const PLACEHOLDER = '__group_placeholder__';

export function activate(context: vscode.ExtensionContext): void {
  initLogger(context);
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log('Resource Hub activating');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const storage = new ResourceStorage(context);
  log('storage initialized, groups=', storage.getGroups());

  // Ensure Default group exists on first run
  ensureDefaultGroup(storage);

  const treeProvider = new ResourceTreeProvider(storage);

  // Register TreeView with drag & drop
  const treeView = vscode.window.createTreeView('resource-hub-view', {
    treeDataProvider: treeProvider,
    showCollapseAll: true,
    dragAndDropController: treeProvider,
    canSelectMany: true,
  });

  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log('TreeView created successfully!');
  log('TreeView ID: resource-hub-view');
  log('Current entries:', storage.getAll().length);
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  context.subscriptions.push(
    treeView,

    // ── Menu Registration Debug ─────────────────────────────────────────────
    vscode.commands.registerCommand('resourceHub.debugMenus', () => {
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      log('DEBUG: Checking menu registration...');
      log('Total subscriptions:', context.subscriptions.length);
      const allSubs = context.subscriptions;
      allSubs.forEach((sub, idx) => {
        if (typeof sub === 'object' && sub !== null && 'id' in sub) {
          log(`  [${idx}] ${sub.id}`);
        } else {
          log(`  [${idx}] <anonymous>`);
        }
      });
    }),

    // Open
    vscode.commands.registerCommand('resourceHub.open', (entry) => {
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      log('command: open, entry=', entry?.label);
      if (entry) {
        openResource(entry);
      }
    }),

    // Add (top-level → Default group, no prompts)
    vscode.commands.registerCommand('resourceHub.addFile', async () => {
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      log('command: addFile');
      await addFile(storage);
      treeProvider.refresh();
    }),
    vscode.commands.registerCommand('resourceHub.addPath', async () => {
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      log('command: addPath');
      await addPath(storage);
      treeProvider.refresh();
    }),
    vscode.commands.registerCommand('resourceHub.addWebPage', async () => {
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      log('command: addWebPage');
      await addWebPage(storage);
      treeProvider.refresh();
    }),
    vscode.commands.registerCommand('resourceHub.addCommand', async () => {
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      log('command: addCommand');
      await addCommand(storage);
      treeProvider.refresh();
    }),
    vscode.commands.registerCommand('resourceHub.addGroup', async () => {
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      log('command: addGroup');
      await addGroup(storage);
      treeProvider.refresh();
    }),

    // Add to specific group (right-click on a group)
    vscode.commands.registerCommand('resourceHub.addFileToGroup', async (item: ResourceItem) => {
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      log('command: addFileToGroup, group=', item?.label);
      if (item?.label) {
        await addFile(storage, item.label);
        treeProvider.refresh();
      }
    }),
    vscode.commands.registerCommand('resourceHub.addPathToGroup', async (item: ResourceItem) => {
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      log('command: addPathToGroup, group=', item?.label);
      if (item?.label) {
        await addPath(storage, item.label);
        treeProvider.refresh();
      }
    }),
    vscode.commands.registerCommand('resourceHub.addWebPageToGroup', async (item: ResourceItem) => {
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      log('command: addWebPageToGroup, group=', item?.label);
      if (item?.label) {
        await addWebPage(storage, item.label);
        treeProvider.refresh();
      }
    }),
    vscode.commands.registerCommand('resourceHub.addCommandToGroup', async (item: ResourceItem) => {
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      log('command: addCommandToGroup, group=', item?.label);
      if (item?.label) {
        await addCommand(storage, item.label);
        treeProvider.refresh();
      }
    }),

    // Rename group
    vscode.commands.registerCommand('resourceHub.renameGroup', async (item: ResourceItem) => {
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      log('command: renameGroup, group=', item?.label);
      if (item?.label) {
        await renameGroup(item.label, storage);
        treeProvider.refresh();
      }
    }),

    // Edit resource (rename + edit target)
    vscode.commands.registerCommand('resourceHub.rename', async (item: ResourceItem) => {
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      log('command: rename, item=', item?.label);
      if (item.entry) {
        await renameResource(item.entry, storage);
        treeProvider.refresh();
      }
    }),
    vscode.commands.registerCommand('resourceHub.editResource', async (item: ResourceItem) => {
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      log('command: editResource, item=', item?.label);
      if (item.entry) {
        await editResource(item.entry, storage);
        treeProvider.refresh();
      }
    }),
    vscode.commands.registerCommand('resourceHub.moveToGroup', async (item: ResourceItem) => {
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      log('command: moveToGroup, item=', item?.label);
      if (item.entry) {
        await moveToGroup(item.entry, storage);
        treeProvider.refresh();
      }
    }),

    // Delete
    vscode.commands.registerCommand('resourceHub.delete', async (item: ResourceItem) => {
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      log('command: delete, item=', { label: item?.label, isGroup: item?.isGroup });
      await deleteResource(item, storage);
      treeProvider.refresh();
    }),

    // Utility
    vscode.commands.registerCommand('resourceHub.openInTerminal', async (item: ResourceItem) => {
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      log('command: openInTerminal, item=', item?.label);
      if (item.entry) {
        await openInTerminal(item.entry);
      }
    }),
    vscode.commands.registerCommand('resourceHub.copyTarget', async (item: ResourceItem) => {
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      log('command: copyTarget, item=', item?.label);
      if (item.entry) {
        await copyTarget(item.entry);
      }
    }),
    vscode.commands.registerCommand('resourceHub.refresh', () => {
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      log('command: refresh');
      treeProvider.refresh();
    }),
    vscode.commands.registerCommand('resourceHub.searchAndOpen', async () => {
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      log('command: searchAndOpen');
      await searchAndOpen(storage);
    }),

    // Add from context (right-click on file/folder in explorer or editor)
    vscode.commands.registerCommand('resourceHub.addFileToContext', async (uri) => {
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      log('command: addFileToContext, uri=', uri?.fsPath);
      await addFileToContext(uri as vscode.Uri, storage);
      treeProvider.refresh();
    }),
    vscode.commands.registerCommand('resourceHub.addPathToContext', async (uri) => {
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      log('command: addPathToContext, uri=', uri?.fsPath);
      await addPathToContext(uri as vscode.Uri, storage);
      treeProvider.refresh();
    }),

    vscode.commands.registerCommand('resourceHub.showLog', () => {
      showOutput();
    }),

    // Add selection as file (from editor)
    vscode.commands.registerCommand('resourceHub.addSelectionAsFile', async () => {
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      log('command: addSelectionAsFile');
      await addSelectionAsFile(storage);
      treeProvider.refresh();
    }),
  );

  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log('All commands registered successfully!');
  log('Total subscriptions:', context.subscriptions.length);
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  log('Resource Hub activated');
}

async function ensureDefaultGroup(storage: ResourceStorage): Promise<void> {
  const groups = storage.getGroups();
  if (!groups.includes(DEFAULT_GROUP)) {
    log('Creating Default group');
    await storage.add({
      id: storage.generateId(),
      type: 'file',
      label: PLACEHOLDER,
      target: '',
      group: DEFAULT_GROUP,
    });
  }
}

export function deactivate(): void {
  log('Resource Hub deactivating');
}
