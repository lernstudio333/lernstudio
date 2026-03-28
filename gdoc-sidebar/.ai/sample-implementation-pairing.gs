const ENDPOINT_BASE = 'https://xmhwvmzpbomgkeavjerk.supabase.co/functions/v1';

const PAIRING_CODE = '234754'; // 6-digit code from "Connect Sources" modal
const LESSON_ID = "289a9c0f-2536-4943-9665-b6bdca2794e7"

const SESSION_TOKEN = '19cfd74e27b8a655e6ddba181347d7f38d72fd36c15a836b5bbecdb606d89c72'; // from integration-sessions response

const CARDS = [
  {
    extId:    'test-card-3',
    cardType: 'SINGLE_CARD',
    question: 'What is the capital of Germany?',
    answer:   'Berlin',
    tip:      'Think Western Europe'
  },
  {
    extId:    'test-card-4',
    cardType: 'MULTI_CARD',
    question: 'Name three secondary colours.',
    answer:   ['Red', 'Blue', 'Yellow'],
    // position: 35
  }
];

// ── Main entry point ──────────────────────────────────────────────────────────

function sendCards() {

  // 1. Dry run — preview what would change
  console.log('--- DRY RUN ---');
  const report = submitCards(true);
  if (!report) return;

  // 2. Analyse the report
  console.log('Inserts : ' + report.inserted.length);
  console.log('Updates : ' + report.updated.length);

  report.inserted.forEach(function(item) {
    console.log('  + INSERT  ' + item.external_id);
  });
  report.updated.forEach(function(item) {
    console.log('  ~ UPDATE  ' + item.external_id + '  changed: ' + item.changes.join(', '));
  });

  if (report.inserted.length === 0 && report.updated.length === 0) {
    console.log('Nothing to do — all cards are up to date.');
    return;
  }

  // 3. If there are updates, ask user before committing
  if (report.updated.length > 0) {
    // ASK USER FOR CONFIRMATION HERE
    // e.g.: var ok = ui.alert('Update ' + report.updated.length + ' existing card(s)?',
    //                          ui.ButtonSet.OK_CANCEL);
    // if (ok !== ui.Button.OK) { console.log('Cancelled.'); return; }
  }

  // 4. Commit — send the real data
  console.log('--- COMMIT ---');
  submitCards(false);
}

// ── Helper — posts cards and returns the parsed report (or null on error) ─────

function submitCards(dryRun) {
  const payload = {
    dry_run: dryRun,
    cards:   CARDS
  };

  const options = {
    method:             'post',
    contentType:        'application/json',
    headers:            { Authorization: 'Bearer ' + SESSION_TOKEN },
    payload:            JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(ENDPOINT_BASE + '/integration-cards', options);
  const status   = response.getResponseCode();
  const data     = JSON.parse(response.getContentText());

  if (status !== 200) {
    console.log('❌ Error ' + status + ': ' + (data.error || response.getContentText()));
    return null;
  }

  console.log('Status: ' + status);
  console.log('Response: ' + JSON.stringify(data, null, 2));
  return data;
}

// ── Pairing ───────────────────────────────────────────────────────────────────

function exchangePairingCode() {
  const payload = {
    pairing_code: PAIRING_CODE,
    source_name:  'Test Google Doc',
    source_id:    SpreadsheetApp.getActiveSpreadsheet().getId(),
    lesson_id:    LESSON_ID
  };

  const options = {
    method:             'post',
    contentType:        'application/json',
    payload:            JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(ENDPOINT_BASE + '/integration-sessions', options);
  const data     = JSON.parse(response.getContentText());

  console.log('Status: ' + response.getResponseCode());
  console.log('Response: ' + JSON.stringify(data, null, 2));

  if (data.session_token) {
    console.log('✅ Session token: ' + data.session_token);
    console.log('Paste this into SESSION_TOKEN.');
  } else {
    console.log('❌ Failed: ' + (data.error || 'unknown error'));
  }
}
