# POST /integration/pairing-codes

Generates a short-lived, one-time pairing code for a logged-in admin. The code is displayed in the **Connect Sources** modal and must be pasted into the external tool's sidebar to initiate a connection.

---

## Request

**Auth:** Supabase JWT (the admin must be logged in to the app). This endpoint is called by the app, not by external tools.

```http
POST /integration/pairing-codes
Authorization: Bearer <supabase_jwt>
Content-Type: application/json
```

Body: empty `{}` or omit entirely.

---

## Response `200`

```json
{
  "pairing_code": "842913",
  "expires_at": "2026-03-23T12:05:00.000Z"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `pairing_code` | `string` | 6-digit numeric code (zero-padded) |
| `expires_at` | `string` (ISO 8601) | Expiry timestamp — 5 minutes from request time |

---

## Errors

| Status | Meaning |
|--------|---------|
| `401` | Missing or invalid JWT |
| `403` | Authenticated user does not have the `admin` role |
| `500` | Database error creating the code |

---

## Notes

- The code is cryptographically random (`crypto.getRandomValues`).
- It is **single-use** — once exchanged via `/integration/sessions` it is marked `used` and cannot be reused.
- A new code is requested automatically each time the Connect Sources modal opens.
