# POST /integration/sessions

Exchanges a valid pairing code for a long-lived session token. Called by the **external tool** (e.g. Google Docs sidebar) after the admin pastes in their pairing code.

---

## Request

**Auth:** None — the pairing code in the body is the caller's proof of identity.

```http
POST /integration/sessions
Content-Type: application/json
```

```json
{
  "pairing_code": "842913",
  "source_name": "My Flashcard Doc",
  "source_id": "1aBcD23EfGhIjKlMnOpQrStUvWxYz",
  "lesson_id": "uuid-of-target-lesson"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `pairing_code` | `string` | Yes | 6-digit code from the Connect Sources modal |
| `source_name` | `string` | Yes | Human-readable name for the connected document |
| `source_id` | `string` | Yes | Stable unique ID of the source document (e.g. Google Doc file ID). Used to deduplicate connections — re-pairing with the same `source_id` replaces the existing connection. |
| `lesson_id` | `string` (UUID) | Yes | Internal UUID of the target lesson. Cards pushed via `/integration/cards` will be inserted into this lesson. Use the **Copy ID** button on the lesson in the admin Content page to get the UUID. |

---

## Response `200`

```json
{
  "session_token": "a3f9...64 hex chars...b2c1",
  "source_name": "My Flashcard Doc",
  "source_id": "1aBcD23EfGhIjKlMnOpQrStUvWxYz",
  "user_id": "uuid-of-admin-who-generated-the-pairing-code",
  "expires_at": "2027-03-23T12:00:00.000Z"
}
```

**Store the `session_token` securely** — it is not retrievable after this response.

---

## Errors

| Status | Meaning |
|--------|---------|
| `400` | Missing required fields |
| `401` | Code not found, already used, or expired |
| `404` | `lesson_id` does not match any lesson |
| `500` | Database error |

---

## Notes

- The pairing code is marked `used` immediately before the token is issued, preventing replay attacks.
- If a connection already exists for the same `source_id` and admin, it is **replaced** (token, lesson, and doc name updated). This allows re-pairing a doc with a different target lesson without accumulating stale records.
- Session tokens are valid for **1 year** in the current iteration. Future versions may support token rotation.
- The `user_id` in the response is the admin who originally generated the pairing code — not the caller.
