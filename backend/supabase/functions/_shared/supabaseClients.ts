import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;

// Supabase automatically injects this env var as "SUPABASE_ANON_KEY" in Edge Functions,
// but it IS the publishable key — same value, legacy name.
// Never use this to authenticate users; use it only to initialise the Supabase client.
// User identity is always established via the JWT in the Authorization header.
const SUPABASE_PUBLISHABLE_KEY  = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

/**
 * Create a Supabase client scoped to the requesting user.
 * Forwards the Authorization header (JWT) so auth.getUser() resolves correctly.
 * Throws immediately if the Authorization header is missing.
 *
 * Usage:
 *   const userClient = createSupabaseUserClient(req);
 *   const { data: { user } } = await userClient.auth.getUser();
 */
export function createSupabaseUserClient(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw new Error("Missing Authorization header");

  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
}

/**
 * Create a Supabase client with the service role key.
 * Bypasses RLS — use only after the user has already been authenticated
 * and authorisation has been verified in application code.
 */
export function createSupabaseAdminClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}
