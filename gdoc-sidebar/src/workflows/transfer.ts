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
    // --- STEP 1: AUTHENTICATION ---
    const connection = getConnectionInfo();
    if (!connection || !connection.sessionToken) {
      return { success: false, message: "Not paired. Please connect to Lern-Studio first." };
    }
    const sessionToken = connection.sessionToken;

    // --- STEP 2: HARVESTING & TRANSFORMATION ---
    const docId = DocumentApp.getActiveDocument().getId();
    const allParas = gatherDocumentMap(docId);

    const cards: ApiCard[] = allParas
      .filter(p => p.cardMetadata !== null)
      .map(p => rawCardToApiCard(buildRawCard(allParas, p.index), docId));


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
function transportToLernStudio(cards: ApiCard[], dryRun: boolean, token: string): SyncReport {
  const url = `${CONFIG.API_BASE_URL}/integration/cards`;

  const payload = JSON.stringify({ dry_run: dryRun, cards });

  const response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: `Bearer ${token}` },
    payload,
    muteHttpExceptions: true
  });

  const status = response.getResponseCode();
  const body   = JSON.parse(response.getContentText());

  debugLog('transportToLernStudio', { status, cardCount: cards.length, dryRun, body });

  if (status !== 200) {
    throw new Error(body.error || `HTTP ${status}`);
  }

  return {
    inserted: body.inserted || [],
    updated:  body.updated  || []
  };
}