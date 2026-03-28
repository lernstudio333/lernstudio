/**
 * HEADLESS TESTER: Verifies the API without relying on the UI.
 * Run this from the Apps Script Editor.
 */
function test_isDocsApiEnabled_Headless() {
  console.log("--- 🕵️ Lern-Studio: API Diagnostic (Headless) ---");

  // 1. Check if the Service is defined in the project
  if (typeof Docs === 'undefined') {
    console.error("❌ FAIL: 'Docs' service is not enabled in the 'Services' menu.");
    console.info("ACTION: Click [+] next to Services -> Select 'Google Docs API' -> Click 'Add'.");
    return;
  }
  console.log("✅ Project Check: 'Docs' service is defined.");

  // 2. Check Document Access
  try {
    const activeDoc = DocumentApp.getActiveDocument();
    if (!activeDoc) {
      console.warn("⚠️ WARNING: No active document found. Are you running this from a standalone script?");
      return;
    }

    const docId = activeDoc.getId();
    console.log(`🔗 Target Document ID: ${docId}`);

    // 3. Attempt a minimal REST API call
    const response = Docs.Documents.get(docId, { fields: 'title' });
    
    console.log("✅ REST API Check: Successfully fetched document title!");
    console.log(`📑 Document Title: "${response.title}"`);
    console.log("--- 🏁 DIAGNOSTIC COMPLETE: READY TO HARVEST ---");

  } catch (e) {
    console.error("❌ FAIL: REST API call failed.");
    console.error("Error Message: " + e.message);
    
    if (e.message.includes("403") || e.message.includes("not enabled")) {
      console.info("ACTION: Ensure the Google Docs API is enabled in the Google Cloud Console or your script's appsscript.json.");
    }
  }
}