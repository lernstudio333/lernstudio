// src/system/main.ts

/**
 * Creates the custom menu in Google Docs
 */
function onOpen() {
  DocumentApp.getUi()
    .createMenu('Lern-Studio')
    .addItem('Open Curator', 'showSidebar')
    .addToUi();
}

/**
 * Renders the sidebar UI
 */
function showSidebar() {
  const html = HtmlService.createTemplateFromFile('ui/sidebar')
    .evaluate()
    .setTitle('Lern-Studio Curator')
    .setWidth(300);
  
  DocumentApp.getUi().showSidebar(html);
}
