# Edge Functions — Development & Deployment Guide

Everything needed to write, deploy, and debug Supabase Edge Functions in this project.

---

## 1. CLI Commands

Use the **Supabase CLI** directly (`supabase`), not `npx supabase`.

```bash
# Deploy a single function
supabase functions deploy <function-name> --workdir backend

# Deploy all functions
supabase functions deploy --workdir backend

# Set a secret (env var available to all functions at runtime — no redeploy needed)
supabase secrets set KEY=value --workdir backend
```

> Flag is `--workdir`, not `--project-dir`.

---

## 2. `verify_jwt = false` — Required for Every Function

**Every edge function must have `verify_jwt = false` in `backend/supabase/config.toml`.**

```toml
[functions.<function-name>]
verify_jwt = false
```

**Why:** Supabase's gateway JWT verifier uses a local HS256 check against the project's JWT secret. Newer Supabase projects issue ES256 tokens. These two algorithms are incompatible — the gateway rejects valid tokens with `{code: 401, message: "Invalid JWT"}` before the function code even runs.

**Is this a security problem? No.** The gateway check is a shallow convenience shortcut (signature + expiry only). Our functions use `auth.getUser()` instead, which calls the Supabase Auth API live and is strictly stronger:
- Validates signature and expiry ✓
- Detects revoked sessions ✓ (gateway cannot do this)

**Rule:** When adding a new edge function, always register it in `config.toml` with `verify_jwt = false` in the **same commit**. Functions missing from `config.toml` default to `verify_jwt = true` and will fail at runtime with a 401.

---

## 3. Auth Pattern — Always Use the Shared Helpers

Common helpers live in `backend/supabase/functions/_shared/` (underscore prefix = not deployed as a function).

**`_shared/supabaseClients.ts`** exports two functions. Always use these instead of calling `createClient()` directly in function code.

```ts
import { createSupabaseUserClient, createSupabaseAdminClient }
  from "../_shared/supabaseClients.ts";

// Step 1: verify JWT → get user (throws if Authorization header is missing)
let userClient;
try { userClient = createSupabaseUserClient(req); }
catch { return jsonError("Missing Authorization header", 401); }

const { data: { user }, error: authError } = await userClient.auth.getUser();
if (authError || !user) return jsonError("Unauthorized", 401);
// userId = user.id — never take userId from the request body

// Step 2: service role client for DB writes (bypasses RLS)
const adminClient = createSupabaseAdminClient();
```

Internally, `_shared/supabaseClients.ts` aliases `SUPABASE_ANON_KEY` → publishable key so the legacy env var name never leaks into function code.

---

## 4. Publishable Key vs JWT — Strict Separation

> **Warning:** Most external docs, examples, and AI training data use the term `anon key`. This is deprecated terminology in this project. Always treat `anon key` guidance as outdated and adapt before applying.

| Identity | Name in this project | Purpose |
|----------|---------------------|---------|
| App identity | `VITE_SUPABASE_PUBLISHABLE_KEY` (frontend env var) | Initialises the Supabase JS client only |
| App identity | `SUPABASE_ANON_KEY` (Edge Function env var, auto-injected by Supabase infra) | Same key — legacy name used by Supabase's injection mechanism |
| User identity | JWT (`Authorization: Bearer <token>`) | Authenticates the user — always passed explicitly |

**Rules:**
- The publishable key does **not** authenticate users — it only identifies the app to Supabase.
- The JWT (`session.access_token`) is always required for protected operations — never rely on the key alone.
- The publishable key **must** also be sent as `apikey` in all Edge Function calls. With the new `sb_publishable_...` key format the gateway requires it for project identification; the old JWT-format anon key was self-identifying so it appeared optional, but it is not.
- **Never** send the publishable key as a substitute for the JWT.

---

## 5. Frontend → Edge Function Call Pattern

Prefer `supabase.functions.invoke()` — it automatically attaches auth headers. Use raw `fetch()` only when sending non-JSON bodies (e.g. `FormData` for file uploads).

**`supabase.functions.invoke` (standard JSON):**
```ts
const { data, error } = await supabase.functions.invoke('function-name', {
  body: { key: 'value' },
});
```

**Raw `fetch` (e.g. for FormData/file upload):**
```ts
const { data: { session } } = await supabase.auth.getSession();
fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/<function-name>`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,        // user identity (JWT)
    'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,  // project identity (required)
    // Do NOT set Content-Type when sending FormData — browser sets it with boundary
  },
  body: formData,
});
```

---

## 6. CORS Headers

Every function must include CORS headers and handle preflight `OPTIONS` requests:

```ts
const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  // ...
});
```

`apikey` **must** be in `Access-Control-Allow-Headers` — the frontend sends it and the browser will block the preflight if it is missing.

---

## 7. Shared Module Imports (Deno)

- All imports from `shared/` **must include the `.ts` extension** (e.g. `from './columnDefs.ts'`).
- Deno requires explicit file extensions; Node/Vitest tolerates both.
- `shared/tsconfig.json` has `allowImportingTsExtensions: true` to satisfy the TypeScript compiler.
- Import shared files using relative paths from the function file:

```ts
import { validateCsv } from '../../../../shared/features/csv/CsvValidator.ts';
```

### No bare npm imports in shared code used by edge functions

**Rule:** Shared files that are imported by edge functions must use **only relative imports**. They must never import from bare npm package names (e.g. `from 'zod'`, `from 'papaparse'`).

**Why:** Deno resolves npm packages using the `npm:` URL scheme (e.g. `npm:papaparse@5`). Node/Vitest resolves them as bare specifiers via `node_modules`. There is no import map configured in this project, so the two runtimes are incompatible for bare imports. A shared file with `import { z } from 'zod'` will deploy and pass Vitest but **fail at Deno bundle time** with `Relative import path "zod" not prefixed with / or ./ or ../`.

**How to handle npm dependencies in shared logic:**

- If the logic only uses TypeScript types and pure functions with no npm dependencies → put it in `shared/` as normal.
- If the logic genuinely needs an npm package (e.g. a parser, a schema library):
  - Write the logic in the edge function itself (or a Deno-only helper alongside the function).
  - Or use the `npm:` URL scheme **inside the edge function**, and pass only plain data in/out of shared pure functions.
  - Do **not** add npm imports to shared files that edge functions depend on.

**Example — wrong (breaks Deno):**
```ts
// shared/features/integration/schema.ts
import { z } from 'zod';  // ❌ bare import — fails in Deno
```

**Example — correct (plain TypeScript validation):**
```ts
// shared/features/integration/schema.ts
import type { CardsRequest } from './types.ts';  // ✅ relative only

export function validateCardsRequest(body: unknown): ... { /* pure TS */ }
```

**Example — correct (npm package used only inside edge function):**
```ts
// backend/supabase/functions/import-cards/index.ts
import Papa from 'npm:papaparse@5';  // ✅ npm: scheme, Deno-only file
```

---

## 8. Architecture — Edge Functions as Thin Orchestration Layers

Edge functions handle HTTP, auth, DB calls, and storage — nothing else. All business logic lives in the shared module so it can be tested without deploying.

**Edge function responsibilities (only):**
- Parse and validate the HTTP request
- Authenticate the user (see §3)
- Call DB via Supabase client
- Call shared pure logic from `/shared`
- Return the HTTP response

**Never inside an edge function:**
- CSV transformation, mapping, or formatting logic → lives in `shared/features/csv/`
- Quiz card selection or scoring logic → lives in `shared/features/study/`
- Any logic that could be unit-tested without a running server

**Why this matters:** Edge functions cannot be unit-tested locally without spinning up a Deno runtime and mocking Supabase. Logic in `/shared` can be tested with plain Vitest. When writing business logic for a new edge function, place it in `/shared` and add unit tests there. The edge function then becomes a thin, untested-by-necessity wrapper around well-tested pure functions.

### Bucket / Storage Configuration

The edge function owns its storage configuration. Never ask the frontend to pass the bucket name — it is a backend concern. Set it as a Supabase secret and read it via `Deno.env.get("MEDIA_BUCKET")`.

```ts
const MEDIA_BUCKET = Deno.env.get("MEDIA_BUCKET") ?? "cards-media";
```

This keeps the frontend decoupled from storage topology and makes future bucket changes a backend-only concern.

---

## 9. Secrets Management

Secrets are runtime environment variables injected by Supabase — **not bundled at deploy time**. Setting a secret takes effect on the next function invocation without redeploying.

```bash
supabase secrets set KEY=value --workdir backend
```

Use secrets for configuration that varies by environment (bucket names, API keys, etc.).

**Secrets currently in use:**

| Key | Value | Used by |
|-----|-------|---------|
| `MEDIA_BUCKET` | `cards-media` | `upload-media` |
