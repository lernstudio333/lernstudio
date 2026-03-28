/**
 * src/workflows/pairing.ts
 * * WORKFLOW: Device & Lesson Pairing
 * ROLE: Handles the initial handshake between the Google Doc and the Lern-Studio API.
 * * --- CONTEXT ---
 * - Input: A 6-digit `pairing_code` from the Lern-Studio web app.
 * - Output: A `session_token` that grants this Doc permission to write to a specific Lesson.
 */

/**
 * MAIN ENTRY POINT: Initiates the connection.
 * Called when the user enters their 6-digit code in the Sidebar.
 * * @param pairingCode - The 6-digit string from the "Connect Sources" modal.
 * @param lessonId - The target Lesson UUID.
 */
function runPairingWorkflow(pairingCode: string, lessonId: string) {
  try {
    const doc = DocumentApp.getActiveDocument();
    const docId = doc.getId();
    const docName = doc.getName();


    // --- STEP 1: VALIDATION ---
    // Ensure the pairing code is the correct format (6 digits) before calling the API.
    
    if (!/^\d{6}$/.test(pairingCode)) {
      return { success: false, message: "Invalid pairing code. Please enter 6 digits." };
    }


    // --- STEP 2: HANDSHAKE (The "Exchange") ---
    // Exchange the pairing code for a persistent Session Token.
    
    const result: PairingResponse = exchangeCodeForToken(pairingCode, lessonId, docId, docName);


    // --- STEP 3: PERSISTENCE (The "Storage" Phase) ---
    // Save the Session Token securely in the Document's internal PropertiesService.
    // This ensures the user doesn't have to re-pair every time they open the Doc.
    
    if (result.session_token) {
      const props = PropertiesService.getDocumentProperties();
      props.setProperty('LS_SESSION_TOKEN', result.session_token);
      props.setProperty('LS_LESSON_ID', lessonId);
    }


    // --- STEP 4: FEEDBACK ---
    // Inform the UI if the connection was successful.
    
    return {
      success: !!result.session_token,
      message: result.session_token ? "Successfully paired with Lern-Studio!" : "Pairing failed."
    };


  } catch (e) {
    return logError("Pairing Workflow", e);
  }
}


/**
 * API LAYER: The Handshake Request
 * Wraps the UrlFetchApp logic for the /integration-sessions endpoint.
 */
function exchangeCodeForToken(code: string, lessonId: string, docId: string, docName: string) {
  // TODO: Implement the POST to /integration-sessions
  // payload: { pairing_code, source_name, source_id, lesson_id }
  
  return { session_token: null }; // Placeholder
}