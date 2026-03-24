import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createSupabaseAdminClient } from "../_shared/supabaseClients.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
};

// Called by an external source (e.g. Google Docs sidebar) — no user JWT.
// The pairing code is the caller's only proof of identity.
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST")    return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  let body: {
    pairing_code?: string;
    source_name?:  string;
    source_id?:    string;
    lesson_id?:    string;
  };
  try { body = await req.json(); }
  catch { return jsonError("Invalid JSON body", 400); }

  const { pairing_code, source_name, source_id, lesson_id } = body;

  if (!pairing_code) return jsonError("Missing required field: pairing_code", 400);
  if (!source_name)  return jsonError("Missing required field: source_name", 400);
  if (!lesson_id)    return jsonError("Missing required field: lesson_id", 400);

  const adminClient = createSupabaseAdminClient();

  // Validate pairing code: must exist, be unused, and not expired
  const { data: pc } = await adminClient
    .from("pairing_codes")
    .select("id, user_id, expires_at, used")
    .eq("code", pairing_code)
    .single();

  if (!pc)                                  return jsonError("Invalid pairing code", 401);
  if (pc.used)                              return jsonError("Pairing code already used", 401);
  if (new Date(pc.expires_at) < new Date()) return jsonError("Pairing code expired", 401);

  // Validate lesson exists
  const { data: lesson } = await adminClient
    .from("lessons")
    .select("id")
    .eq("id", lesson_id)
    .single();
  if (!lesson) return jsonError("Lesson not found", 404);

  // Consume the code before issuing a token (prevents replay even on concurrent requests)
  await adminClient.from("pairing_codes").update({ used: true }).eq("id", pc.id);

  // Generate a secure 64-char hex session token (32 random bytes)
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const token = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

  const expires_at = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  const doc_id     = source_id ?? "";

  // Upsert: if a connection already exists for this user + doc, replace it
  const { data: existing } = await adminClient
    .from("integrations")
    .select("id")
    .eq("user_id", pc.user_id)
    .eq("doc_id", doc_id)
    .maybeSingle();

  if (existing) {
    await adminClient.from("integrations").update({
      token,
      doc_name:  source_name,
      source_id: source_id ?? null,
      lesson_id,
      expires_at,
      last_sync: null,
    }).eq("id", existing.id);
  } else {
    const { error } = await adminClient.from("integrations").insert({
      token,
      user_id:   pc.user_id,
      doc_id,
      doc_name:  source_name,
      source_id: source_id ?? null,
      lesson_id,
      scope:     "import",
      expires_at,
    });
    if (error) return jsonError("Failed to create session", 500);
  }

  return json({
    session_token: token,
    source_name,
    source_id:     source_id ?? null,
    user_id:       pc.user_id,
    expires_at,
  });
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function jsonError(message: string, status: number) {
  return json({ error: message }, status);
}
