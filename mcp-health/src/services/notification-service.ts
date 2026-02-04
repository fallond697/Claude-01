/**
 * Service for sending desktop notifications on status changes
 * @module services/notification-service
 */

import { exec } from 'node:child_process';
import { platform } from 'node:os';

import type { ServerHealthStatus, HealthCheckResult } from '../types/server-status.js';

/**
 * Tracks previous server states for change detection
 */
const previousStates = new Map<string, boolean>();

/**
 * Notification options
 */
export interface NotificationOptions {
  readonly enabled: boolean;
  readonly onlyOnFailure?: boolean;
}

/**
 * Checks for status changes and sends notifications
 * @param result - Current health check result
 * @param options - Notification options
 */
export function checkAndNotify(
  result: HealthCheckResult,
  options: NotificationOptions
): void {
  if (!options.enabled) {
    return;
  }

  for (const server of result.servers) {
    const previousState = previousStates.get(server.name);
    const currentState = server.isConnected;

    // Only notify on state changes (not first run)
    if (previousState !== undefined && previousState !== currentState) {
      const shouldNotify = options.onlyOnFailure
        ? !currentState  // Only notify when server goes down
        : true;          // Notify on any change

      if (shouldNotify) {
        sendNotification(server, previousState);
      }
    }

    previousStates.set(server.name, currentState);
  }
}

/**
 * Sends a desktop notification for a server status change
 */
function sendNotification(
  server: ServerHealthStatus,
  _wasConnected: boolean
): void {
  const title = server.isConnected
    ? `✓ MCP Server Recovered`
    : `✗ MCP Server Down`;

  const message = server.isConnected
    ? `${server.name} is now connected`
    : `${server.name} is offline${server.errorMessage ? `: ${server.errorMessage}` : ''}`;

  sendSystemNotification(title, message);
}

/**
 * Sends a system notification using platform-specific methods
 */
function sendSystemNotification(title: string, message: string): void {
  const os = platform();

  try {
    if (os === 'darwin') {
      // macOS
      const script = `display notification "${escapeQuotes(message)}" with title "${escapeQuotes(title)}"`;
      exec(`osascript -e '${script}'`);
    } else if (os === 'win32') {
      // Windows - use PowerShell toast notification
      const ps = `
        [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
        [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null
        $template = '<toast><visual><binding template="ToastText02"><text id="1">${escapeQuotes(title)}</text><text id="2">${escapeQuotes(message)}</text></binding></visual></toast>'
        $xml = New-Object Windows.Data.Xml.Dom.XmlDocument
        $xml.LoadXml($template)
        $toast = [Windows.UI.Notifications.ToastNotification]::new($xml)
        [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('MCP Health').Show($toast)
      `.replace(/\n/g, ' ');
      exec(`powershell -Command "${ps}"`);
    } else {
      // Linux - use notify-send
      exec(`notify-send "${escapeQuotes(title)}" "${escapeQuotes(message)}"`);
    }
  } catch {
    // Silently fail if notifications aren't available
  }
}

/**
 * Escapes quotes in strings for shell commands
 */
function escapeQuotes(str: string): string {
  return str.replace(/"/g, '\\"').replace(/'/g, "\\'");
}

/**
 * Clears the previous state cache (useful for testing)
 */
export function clearStateCache(): void {
  previousStates.clear();
}

/**
 * Gets the current state cache (useful for testing)
 */
export function getStateCache(): ReadonlyMap<string, boolean> {
  return previousStates;
}
