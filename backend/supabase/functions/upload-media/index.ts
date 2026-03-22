import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createSupabaseUserClient, createSupabaseAdminClient } from "../_shared/supabaseClients.ts";

const MEDIA_BUCKET = Deno.env.get("MEDIA_BUCKET") ?? "media";

const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function jsonError(message: string, status = 400) {
  return json({ error: message }, status);
}

/** Returns a non-colliding filename: "foo.png" → "foo(1).png" → "foo(2).png" */
function deduplicateName(name: string, existing: Set<string>): string {
  if (!existing.has(name)) return name;
  const dot  = name.lastIndexOf(".");
  const base = dot >= 0 ? name.slice(0, dot) : name;
  const ext  = dot >= 0 ? name.slice(dot)    : "";
  let i = 1;
  while (existing.has(`${base}(${i})${ext}`)) i++;
  return `${base}(${i})${ext}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST")    return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  // Auth
  let userClient;
  try { userClient = createSupabaseUserClient(req); }
  catch { return jsonError("Missing Authorization header", 401); }

  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return jsonError("Unauthorized", 401);

  const adminClient = createSupabaseAdminClient();
  const { data: profile } = await adminClient
    .from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "editor"].includes(profile.role ?? "")) {
    return jsonError("Forbidden", 403);
  }

  // Parse multipart form data
  let formData: FormData;
  try { formData = await req.formData(); }
  catch { return jsonError("Expected multipart/form-data", 400); }

  const files = formData.getAll("files") as File[];
  if (files.length === 0) return jsonError("No files provided", 400);

  // Load all existing paths once so deduplication is accurate for the whole batch
  const { data: existingMedia } = await adminClient.from("media").select("path");
  const existingPaths = new Set<string>(
    (existingMedia ?? []).map((m: { path: string }) => m.path),
  );

  const uploaded: unknown[] = [];
  const errors:   { file: string; error: string }[] = [];

  for (const file of files) {
    const path  = deduplicateName(file.name, existingPaths);
    existingPaths.add(path);  // reserve name so siblings in the same batch don't collide

    const bytes = await file.arrayBuffer();
    const { error: uploadErr } = await adminClient.storage
      .from(MEDIA_BUCKET)
      .upload(path, bytes, { contentType: file.type });

    if (uploadErr) { errors.push({ file: file.name, error: uploadErr.message }); continue; }

    const { data: inserted, error: dbErr } = await adminClient
      .from("media")
      .insert({
        bucket:     MEDIA_BUCKET,
        path,
        media_type: file.type.startsWith("video/") ? "video" : "image",
      })
      .select()
      .single();

    if (dbErr) { errors.push({ file: file.name, error: dbErr.message }); continue; }

    uploaded.push(inserted);
  }

  return json({ uploaded, errors });
});
