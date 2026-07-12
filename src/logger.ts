import * as vscode from 'vscode';

let channel: vscode.OutputChannel | undefined;

export function initLogger(context: vscode.ExtensionContext): void {
  channel = vscode.window.createOutputChannel('Resource Hub');
  context.subscriptions.push(channel);
}

export function log(message: string, ...args: unknown[]): void {
  const ts = new Date().toISOString().slice(11, 23);
  const parts = args.map(a => {
    if (a instanceof Error) {
      return `${a.message}\n${a.stack ?? ''}`;
    }
    if (typeof a === 'object' && a !== null) {
      try {
        return JSON.stringify(a);
      } catch {
        return String(a);
      }
    }
    return String(a);
  });
  const line = `[${ts}] ${message}${parts.length ? ' ' + parts.join(' ') : ''}`;
  channel?.appendLine(line);
}

export function showOutput(): void {
  channel?.show(true);
}
