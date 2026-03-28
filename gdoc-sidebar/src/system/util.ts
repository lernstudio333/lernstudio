// src/system/util.ts

/**
 * Centralized error handler. Logs to console and returns a safe response object
 * so the Sidebar always receives a well-formed result even on failure.
 *
 * @param context - Human-readable label (e.g. "Preview Workflow") for the log.
 * @param e - The caught error or unknown value.
 */
function logError(context: string, e: unknown): { success: false; error: string } {
  const message = e instanceof Error ? e.message : String(e);
  console.error(`[${context}] ${message}`);
  return { success: false, error: `${context}: ${message}` };
}

/**
 * Required by HtmlService.createTemplateFromFile() to include HTML partials.
 * Call from a scriptlet inside sidebar.html: <?!= include('ui/tab-card') ?>
 *
 * @param filename - Path relative to the script root (no extension needed).
 */
function include(filename: string): string {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
