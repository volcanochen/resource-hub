import * as vscode from 'vscode';
import { ResourceEntry, ResourceType, DEFAULT_GROUP, TYPE_ICONS } from './types';
import { ResourceStorage } from './storage';
import { log } from './logger';
import { isPlaceholder } from './commands';

const ICON_MAP: Record<ResourceType, vscode.Uri> = {
  file: vscode.Uri.joinPath(vscode.Uri.file(__dirname), '..', 'resources', 'file.svg'),
  path: vscode.Uri.joinPath(vscode.Uri.file(__dirname), '..', 'resources', 'folder.svg'),
  web: vscode.Uri.joinPath(vscode.Uri.file(__dirname), '..', 'resources', 'globe.svg'),
  command: vscode.Uri.joinPath(vscode.Uri.file(__dirname), '..', 'resources', 'terminal.svg'),
};

const GROUP_ICON = vscode.Uri.joinPath(vscode.Uri.file(__dirname), '..', 'resources', 'folder.svg');

export class ResourceItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly isGroup: boolean,
    public readonly entry?: ResourceEntry,
  ) {
    super(label, collapsibleState);

    if (isGroup) {
      this.iconPath = GROUP_ICON;
      this.contextValue = 'group';
    } else if (entry) {
      this.iconPath = ICON_MAP[entry.type];
      // 所有类型都不显示 description，确保对齐一致
      this.description = undefined;
      this.tooltip = `${entry.type}: ${entry.target}`;
      this.command = {
        command: 'resourceHub.open',
        title: 'Open',
        arguments: [entry],
      };
      this.contextValue = `entry-${entry.type}`;
    } else {
      this.iconPath = new vscode.ThemeIcon('info');
      this.contextValue = 'empty-hint';
    }
  }
}

function shortenTarget(target: string, type: ResourceType): string {
  if (type === 'web') {
    try {
      const u = new URL(target);
      return u.host;
    } catch {
      return target;
    }
  }
  if (type === 'command') {
    return target.length > 40 ? target.slice(0, 37) + '...' : target;
  }
  const sep = target.includes('\\') ? '\\' : '/';
  const parts = target.split(sep).filter(Boolean);
  return parts.length > 2 ? '...' + sep + parts.slice(-2).join(sep) : target;
}

// MIME type for internal drag & drop
const MIME_TYPE = 'application/vnd.code.resource-hub.entry';

export class ResourceTreeProvider
  implements vscode.TreeDataProvider<ResourceItem>, vscode.TreeDragAndDropController<ResourceItem> {

  dropMimeTypes = [MIME_TYPE];
  dragMimeTypes = [MIME_TYPE];

  private _onDidChangeTreeData = new vscode.EventEmitter<ResourceItem | undefined | null>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  refresh(): void {
    log('treeProvider: refresh');
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: ResourceItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: ResourceItem): ResourceItem[] {
    if (!element) {
      const groups = this.storage.getGroups();
      log('treeProvider: getChildren root, groups=', groups);
      return groups.map(
        g => new ResourceItem(g, vscode.TreeItemCollapsibleState.Collapsed, true),
      );
    }
    if (element.isGroup) {
      const all = this.storage.getByGroup(element.label);
      const entries = all.filter(e => !isPlaceholder(e));
      log('treeProvider: getChildren group=', element.label, 'entries=', entries.length);
      
      // 检查是否有子文件夹（path 类型）
      const hasSubFolders = entries.some(e => e.type === 'path');
      
      if (entries.length === 0) {
        // 空组：显示占位项，但设为不可折叠
        const hint = new ResourceItem(
          '(empty — right-click to add)', 
          vscode.TreeItemCollapsibleState.None,
          false, 
          undefined
        );
        return [hint];
      } else if (!hasSubFolders) {
        // 只有叶子节点（file/web/command）：显示为不可折叠的列表，不渲染为文件夹
        const items = entries.map(
          e => new ResourceItem(e.label, vscode.TreeItemCollapsibleState.None, false, e),
        );
        return items;
      } else {
        // 有子文件夹（path）：正常渲染为可折叠组
        const items = entries.map(
          e => new ResourceItem(e.label, vscode.TreeItemCollapsibleState.None, false, e),
        );
        return items;
      }
    }
    return [];
  }

  // ── Drag & Drop ───────────────────────────────────────────────────────────

  handleDrag(source: ResourceItem[], dataTransfer: vscode.DataTransfer): void {
    const entries = source.filter(s => s.entry && !s.isGroup).map(s => s.entry!);
    if (entries.length > 0) {
      dataTransfer.set(MIME_TYPE, new vscode.DataTransferItem(entries));
      log('handleDrag:', entries.map(e => e.label));
    }
  }

  async handleDrop(target: ResourceItem | undefined, dataTransfer: vscode.DataTransfer): Promise<void> {
    const item = dataTransfer.get(MIME_TYPE);
    if (!item) {
      return;
    }
    const entries = item.value as ResourceEntry[];
    if (!entries || entries.length === 0) {
      return;
    }

    // Determine target group
    let targetGroup: string;
    if (!target) {
      targetGroup = DEFAULT_GROUP;
    } else if (target.isGroup) {
      targetGroup = target.label;
    } else if (target.entry) {
      // dropped onto an entry — use that entry's group
      targetGroup = target.entry.group;
    } else {
      targetGroup = DEFAULT_GROUP;
    }

    log('handleDrop: targetGroup=', targetGroup, 'entries=', entries.map(e => e.label));
    for (const entry of entries) {
      if (entry.group !== targetGroup) {
        await this.storage.update(entry.id, { group: targetGroup });
      }
    }
    this.refresh();
  }

  constructor(private storage: ResourceStorage) {}
}
