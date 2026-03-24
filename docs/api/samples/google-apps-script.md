# Sample — Google Apps Script

These snippets can be pasted directly into a Google Apps Script project (Tools → Script editor) to test the integration API or as a starting point for a real sidebar.

---

## Setup

Paste these constants at the top of your script file, outside any function. Fill in `PAIRING_CODE` fresh each time (it expires in 5 minutes), and `SESSION_TOKEN` once after running `exchangePairingCode()`.

```javascript
const ENDPOINT_BASE  = 'https://xmhwvmzpbomgkeavjerk.supabase.co/functions/v1';
const PAIRING_CODE   = 'PASTE_CODE_HERE';               // 6-digit code from "Connect Sources" modal
const LESSON_ID      = 'PASTE_LESSON_UUID_HERE';        // copy from admin Content page → lesson row → copy icon
const SESSION_TOKEN  = 'PASTE_YOUR_SESSION_TOKEN_HERE'; // from exchangePairingCode()
```

---

## Cards payload

Define your cards once as a top-level constant. `extId` must be stable and unique per card within your document — it is used to match cards on subsequent syncs.

If `position` is omitted, the card is appended after the current highest position in the target lesson. Cards without a position are inserted in array order.

```javascript
const CARDS = [
  {
    extId:    'doc-123#card-1',
    cardType: 'SINGLE_CARD',
    question: 'What is the capital of France?',
    answer:   'Paris',
    tip:      'Think Western Europe',
    position: 0             // explicit position
  },
  {
    extId:    'doc-123#card-2',
    cardType: 'MULTI_CARD',
    question: 'Name three primary colours.',
    answer:   ['Red', 'Blue', 'Yellow'],
    // position omitted — appended after current max
  }
];
```

---

## Step 1 — Exchange a pairing code for a session token

Run this **once** after copying a fresh pairing code from the Connect Sources modal. The session token printed to the log is valid for 1 year — save it in `SESSION_TOKEN`.

```javascript
function exchangePairingCode() {
  const payload = {
    pairing_code: PAIRING_CODE,
    source_name:  DocumentApp.getActiveDocument().getName(), // Google Doc title
    source_id:    DocumentApp.getActiveDocument().getId(),  // stable Google Doc file ID
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
```

---

## Step 2 — Sync cards (dry run → confirm → commit)

`sendCards()` follows the recommended client flow:
1. Preview changes with `dry_run: true`
2. Log the update report (inserts and updates)
3. Prompt for confirmation before overwriting existing cards
4. Commit with `dry_run: false`

```javascript
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

  // 3. Ask for confirmation before overwriting existing cards
  if (report.updated.length > 0) {
    // ASK USER FOR CONFIRMATION HERE
    // var ui = SpreadsheetApp.getUi();
    // var ok = ui.alert(
    //   'Confirm update',
    //   'This will update ' + report.updated.length + ' existing card(s). Continue?',
    //   ui.ButtonSet.OK_CANCEL
    // );
    // if (ok !== ui.Button.OK) { console.log('Cancelled.'); return; }
  }

  // 4. Commit — send the real data
  console.log('--- COMMIT ---');
  submitCards(false);
}

// Helper — posts cards and returns the parsed report (or null on error)
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
```

---

## Notes

- The `/v1` prefix is **required** in the URL when using `UrlFetchApp.fetch` directly. It is added automatically by `supabase.functions.invoke()` in the frontend.
- `DocumentApp.getActiveDocument().getId()` returns the Google Doc file ID. For Google Sheets use `SpreadsheetApp.getActiveSpreadsheet().getId()`.
- `extId` should be a stable slug derived from your document structure, e.g. `doc-123#card-1`. Changing it will cause the card to be treated as new on the next sync.
- Re-pairing the same document (same `source_id`) with a different `lesson_id` replaces the existing connection without creating a duplicate.
