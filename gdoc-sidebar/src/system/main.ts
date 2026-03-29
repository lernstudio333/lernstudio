// src/system/main.ts

/**
 * Creates the custom menu in Google Docs
 */
function onOpen() {
  DocumentApp.getUi()
    .createMenu('Lern-Studio')
    .addItem('Open Curator', 'showSidebar')
    .addSeparator()
    .addItem('Debug: Log Document Map', 'debugLogDocumentMap')
    .addToUi();
}

/**
 * Debug helper: logs the full document map to the Apps Script console.
 * Run via Lern-Studio menu → "Debug: Log Document Map".
 * Results appear in the Apps Script editor under Executions or View → Logs.
 */
function debugLogDocumentMap() {
  const doc = DocumentApp.getActiveDocument();
  const rows = gatherDocumentMap(doc.getId());
  const cardParas = rows.filter(r => r.cardMetadata !== null);

  Logger.log('=== FULL DOCUMENT MAP (%s rows) ===', rows.length);
  rows.forEach(p => {
    const type = p.level >= 0 ? 'LIST_ITEM(L' + p.level + ')' : 'PARAGRAPH';
    const card = p.cardMetadata ? ' ← CARD:' + p.cardMetadata.typeKey : '';
    Logger.log('[idx=%s] %s "%s"%s', p.index, type, p.text, card);
  });

  Logger.log('=== CARD ROWS ONLY (%s cards) ===', cardParas.length);
  cardParas.forEach(r => {
    Logger.log('idx=%s type=%s text="%s"', r.index, r.cardMetadata!.typeKey, r.text);
  });

  DocumentApp.getUi().alert('Document map logged: ' + rows.length + ' rows, ' + cardParas.length + ' cards. Check Apps Script Logs.');
}

/**
 * Returns the stored connection info for the transfer tab UI.
 * Called on sidebar load to decide whether to show pairing or connected state.
 */
function getConnectionStatus() {
  return getConnectionInfo();
}

/**
 * Clears the stored connection (disconnect / switch lesson).
 */
function disconnectLesson() {
  clearConnectionInfo();
}

/**
 * Renders the sidebar UI
 */
function showSidebar() {
  const html = HtmlService.createTemplateFromFile('ui_sidebar')
    .evaluate()
    .setTitle('Lern-Studio Curator')
    .setWidth(300);
  
  DocumentApp.getUi().showSidebar(html);
}
