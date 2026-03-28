/**
 * src/workflows/transfer.ts
 * * WORKFLOW: Full Document Synchronization (Dry-Run & Commit)
 * ROLE: Orchestrates the "Big Red Button" using the Supabase/Lern-Studio API.
 */

/**
 * MAIN ENTRY POINT: Run the Sync.
 * This function is designed to be called twice:
 * 1. Once with isDryRun = true (to show the Preview Dialog)
 * 2. Once with isDryRun = false (after the user clicks "Confirm")
 */
function runTransferWorkflow(isDryRun: boolean = true) {
  try {
    // --- STEP 1: AUTHENTICATION (The "Permission" Phase) ---
    // Pull the persistent token saved during the Pairing workflow.
    
    const props = PropertiesService.getDocumentProperties();
    const sessionToken = props.getProperty('LS_SESSION_TOKEN');
    
    if (!sessionToken) {
      return { success: false, message: "Not paired. Please connect to Lern-Studio first." };
    }


    // --- STEP 2: HARVESTING & TRANSFORMATION (The "Sensor" Phase) ---
    // Read the document and build the CARDS array exactly like your sample.
    
    const docId = DocumentApp.getActiveDocument().getId();
    const allRows = gatherDocumentMap(docId);
    
    // Transform rows into the CARDS structure from your sample
    const cards: RawCard[] = allRows
      .filter(row => row.cardMetadata !== null)
      .map(row => buildRawCard(allRows, row.index));


    // --- STEP 3: TRANSPORT (The "Network" Phase) ---
    // This implements the `submitCards(dryRun)` logic from your sample.
    
    const report: SyncReport = transportToLernStudio(cards, isDryRun, sessionToken);


    // --- STEP 4: ANALYSIS (The "Analyse the report" Phase) ---
    // Instead of console.log, we return the counts to the Sidebar.
    
    const analysis = {
      insertedCount: report.inserted.length,
      updatedCount: report.updated.length,
      nothingToDo: report.inserted.length === 0 && report.updated.length === 0
    };


    // --- STEP 5: FEEDBACK (The "Decision" Phase) ---
    // We return the full report so the Sidebar can show:
    // "Insert Card X", "Update Card Y (changed: answer, tip)"
    
    return {
      success: true,
      isDryRun: isDryRun,
      analysis: analysis,
      report: report 
    };


  } catch (e) {
    return logError("Transfer Workflow", e);
  }
}


/**
 * HELPER: Posts cards and returns the parsed report.
 * This is the TypeScript version of your `submitCards(dryRun)` helper.
 */
function transportToLernStudio(cards: RawCard[], dryRun: boolean, token: string): SyncReport {
  // TODO: Implement UrlFetchApp.fetch()
  // - Headers: { Authorization: 'Bearer ' + token }
  // - Payload: { dry_run: dryRun, cards: cards }
  // - Endpoint: /integration-cards
  
  return { inserted: [], updated: [] }; // Placeholder
}