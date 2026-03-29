/**
 * src/workflows/pairing.ts
 * WORKFLOW: Device & Lesson Pairing
 * ROLE: Handles the initial handshake between the Google Doc and the Lern-Studio API.
 *
 * --- CONTEXT ---
 * - Input: A 6-digit `pairing_code` from the Lern-Studio web app.
 * - Output: A `session_token` stored in UserProperties, granting this user permission
 *   to write to a specific Lesson from this Doc.
 *
 * --- STORAGE ---
 * Uses PropertiesService.getUserProperties() — stored per-user (not per-doc),
 * so the token is private to the authenticated user even on shared documents.
 * Stored as a single JSON blob under the key 'LS_CONNECTION'.
 */

const LS_CONNECTION_KEY = 'LS_CONNECTION';

interface LsConnection {
  sessionToken: string;
  lessonId: string;
  lessonName?: string;
  courseName?: string;
  programName?: string;
}

/**
 * MAIN ENTRY POINT: Initiates the connection.
 * Called when the user enters their 6-digit code in the Sidebar.
 *
 * @param pairingCode - The 6-digit string from the "Connect Sources" modal.
 * @param lessonId    - The target Lesson UUID.
 */
function runPairingWorkflow(pairingCode: string, lessonId: string) {
  try {
    const doc = DocumentApp.getActiveDocument();
    const docId = doc.getId();
    const docName = doc.getName();

    // --- STEP 1: VALIDATION ---
    if (!/^\d{6}$/.test(pairingCode)) {
      return { success: false, message: "Invalid pairing code. Please enter 6 digits." };
    }

    // --- STEP 2: HANDSHAKE ---
    const result: PairingResponse = exchangeCodeForToken(pairingCode, lessonId, docId, docName);

    if (!result.session_token) {
      return { success: false, message: result.error || "Pairing failed." };
    }

    // --- STEP 3: PERSISTENCE ---
    // Stored as a JSON blob so lesson metadata fields can be added later
    // without changing the storage key or adding extra properties.
    const connection: LsConnection = {
      sessionToken: result.session_token,
      lessonId
    };
    saveConnectionInfo(connection);

    // --- STEP 4: FEEDBACK ---
    return { success: true, message: "Successfully paired with Lern-Studio!" };

  } catch (e) {
    return logError("runPairingWorkflow", e);
  }
}

/**
 * Returns the stored connection, or null if not paired.
 */
function getConnectionInfo(): LsConnection | null {
  const raw = PropertiesService.getUserProperties().getProperty(LS_CONNECTION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LsConnection;
  } catch {
    return null;
  }
}

/**
 * Removes the stored connection (used by the "Switch Lesson" / disconnect button).
 */
function clearConnectionInfo(): void {
  PropertiesService.getUserProperties().deleteProperty(LS_CONNECTION_KEY);
}

/**
 * Persists the connection object as JSON in UserProperties.
 */
function saveConnectionInfo(connection: LsConnection): void {
  PropertiesService.getUserProperties().setProperty(LS_CONNECTION_KEY, JSON.stringify(connection));
}

/**
 * API LAYER: The Handshake Request
 * POSTs to /integration/sessions to exchange the pairing code for a session token.
 * No auth header required — the pairing code itself is the proof of identity.
 */
function exchangeCodeForToken(code: string, lessonId: string, docId: string, docName: string): PairingResponse {
  const url = `${CONFIG.API_BASE_URL}/integration/sessions`;

  const payload = JSON.stringify({
    pairing_code: code,
    source_name:  docName,
    source_id:    docId,
    lesson_id:    lessonId
  });

  const response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload,
    muteHttpExceptions: true
  });

  const status = response.getResponseCode();
  const body   = JSON.parse(response.getContentText());

  debugLog('exchangeCodeForToken', { status, body });

  if (status !== 200) {
    return { session_token: null, error: body.error || `HTTP ${status}` };
  }

  return { session_token: body.session_token };
}
