export type ResourceType = 'file' | 'path' | 'web' | 'command';

export interface ResourceEntry {
  id: string;
  type: ResourceType;
  label: string;
  target: string;
  group: string;
}

export const DEFAULT_GROUP = 'Default';

export const TYPE_ICONS: Record<ResourceType, string> = {
  file: 'file',
  path: 'folder',
  web: 'globe',
  command: 'terminal',
};

export const TYPE_LABELS: Record<ResourceType, string> = {
  file: 'File',
  path: 'Folder',
  web: 'Web Page',
  command: 'Command',
};
