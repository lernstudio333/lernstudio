# POST /integration/cards

Pushes card data from an external source into Lernstudio. Supports **dry-run mode** to preview inserts and updates before committing.

---

## Request

**Auth:** Session token obtained from `/integration/sessions`.

```http
POST /integration/cards
Authorization: Bearer <session_token>
Content-Type: application/json
```

```json
{
  "dry_run": true,
  "cards": [
    {
      "extId": "doc-123#card-1",
      "cardType": "SINGLE_CARD",
      "question": "What is the capital of France?",
      "answer": "Paris",
      "tip": "Think Western Europe",
      "position": 0
    },
    {
      "extId": "doc-123#card-2",
      "cardType": "MULTI_CARD",
      "question": "Name three primary colours.",
      "answer": ["Red", "Blue", "Yellow"],
      "position": 1
    }
  ]
}
```

### Request fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `dry_run` | `boolean` | No | If `true`, compute and return the update report without writing to the database. Default: `false`. |
| `cards` | `CardPayload[]` | Yes | Array of cards to insert or update. Must not be empty. |

### CardPayload

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `extId` | `string` | Yes | Unique identifier for the card within the source document. Used to match against existing cards. |
| `question` | `string` | Yes | The question text. |
| `cardType` | `string` | No | One of `SINGLE_CARD`, `MULTI_CARD`, `SYNONYM`, `GAP`, `IMAGES`. Defaults to `SINGLE_CARD` on insert. |
| `answer` | `string \| string[]` | No | Single string for `SINGLE_CARD`/`GAP`; array for `MULTI_CARD`/`SYNONYM`. |
| `tip` | `string` | No | Optional hint shown to the learner. |
| `details` | `string` | No | Extended explanation shown after answering. |
| `source` | `string` | No | Source attribution (e.g. document title, chapter). |
| `position` | `integer` | No | Display order within the lesson. If omitted on insert, the card is appended after the current maximum position. |

---

## Response `200`

The response shape is **identical** for both dry-run and committed requests.

```json
{
  "inserted": [
    { "external_id": "doc-123#card-3", "action": "insert" }
  ],
  "updated": [
    { "external_id": "doc-123#card-1", "action": "update", "changes": ["question", "answer"] }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `inserted` | `UpdateReportItem[]` | Cards that were (or would be) newly created |
| `updated` | `UpdateReportItem[]` | Cards that were (or would be) modified, with the changed field names |

Cards with no changes are omitted from the report entirely.

### UpdateReportItem

| Field | Type | Description |
|-------|------|-------------|
| `external_id` | `string` | The `extId` from the request |
| `action` | `"insert" \| "update"` | What happened (or would happen) |
| `changes` | `string[]` | Field names that differ — present on `update`, absent on `insert` |

---

## Behaviour

### Matching
Cards are matched by `extId` against the `ext_id` column in the `cards` table. If a match is found the card is a candidate for update; otherwise it is a candidate for insert.

### Updates
Only fields **explicitly provided** in the payload are compared. Omitted fields are never patched. The `changes` array lists every field that actually differs.

### Inserts
New cards require the integration to have a valid `lesson_id`. If the target lesson has been deleted since pairing, the endpoint returns a `409` error with a message prompting you to re-pair with a valid lesson. In `dry_run` mode, new cards are always reported regardless.

### Position on insert
If `position` is omitted, the card receives `max(position) + 1` from the target lesson. Multiple positionless cards in one request are assigned consecutive positions.

### `last_sync`
On a successful non-dry-run commit the integration record's `last_sync` timestamp is updated.

---

## Errors

| Status | Meaning |
|--------|---------|
| `400` | Invalid JSON, missing required fields, or invalid field values |
| `401` | Missing, invalid, or expired session token |
| `409` | New cards present but target lesson has been deleted — re-pair the integration |
