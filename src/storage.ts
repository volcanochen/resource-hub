import * as vscode from 'vscode';
import { ResourceEntry, DEFAULT_GROUP } from './types';

const STORAGE_KEY = 'resourceHub.entries';

export class ResourceStorage {
  constructor(private ctx: vscode.ExtensionContext) {}

  getAll(): ResourceEntry[] {
    return this.ctx.globalState.get<ResourceEntry[]>(STORAGE_KEY, []);
  }

  async add(entry: ResourceEntry): Promise<void> {
    const all = this.getAll();
    all.push(entry);
    await this.ctx.globalState.update(STORAGE_KEY, all);
  }

  async update(id: string, patch: Partial<Omit<ResourceEntry, 'id'>>): Promise<void> {
    const all = this.getAll();
    const idx = all.findIndex(e => e.id === id);
    if (idx >= 0) {
      all[idx] = { ...all[idx], ...patch };
      await this.ctx.globalState.update(STORAGE_KEY, all);
    }
  }

  async remove(id: string): Promise<void> {
    const all = this.getAll().filter(e => e.id !== id);
    await this.ctx.globalState.update(STORAGE_KEY, all);
  }

  async removeGroup(groupName: string): Promise<void> {
    const all = this.getAll().filter(e => e.group !== groupName);
    await this.ctx.globalState.update(STORAGE_KEY, all);
  }

  getGroups(): string[] {
    const entries = this.getAll();
    const groups = new Set(entries.map(e => e.group || DEFAULT_GROUP));
    return [...groups].sort();
  }

  getByGroup(group: string): ResourceEntry[] {
    return this.getAll().filter(e => (e.group || DEFAULT_GROUP) === group);
  }

  generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }
}
