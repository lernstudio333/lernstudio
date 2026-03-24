import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createSupabaseUserClient, createSupabaseAdminClient } from "../_shared/supabaseClients.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST")    return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  // Auth: requires a logged-in admin
  let userClient;
  try { userClient = createSupabaseUserClient(req); }
  catch { return jsonError("Missing Authorization header", 401); }

  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return jsonError("Unauthorized", 401);

  const adminClient = createSupabaseAdminClient();
  const { data: profile } = await adminClient
    .from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") return jsonError("Forbidden", 403);

  // Generate a cryptographically random 6-digit code
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  const code = String(buf[0] % 1000000).padStart(6, "0");

  const expires_at = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  const { error } = await adminClient.from("pairing_codes").insert({
    code,
    user_id:    user.id,
    expires_at,
    used:       false,
  });
  if (error) return jsonError("Failed to create pairing code", 500);

  return json({ pairing_code: code, expires_at });
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
