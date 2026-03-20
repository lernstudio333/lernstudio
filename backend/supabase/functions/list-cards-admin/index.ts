import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createSupabaseUserClient, createSupabaseAdminClient } from "../_shared/supabaseClients.ts";
import type { ListCardsAdminResponse } from "../../../../shared/features/learnings/adminTypes.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
};

const VALID_SORT_FIELDS = new Set([
  "program", "course", "lesson", "card", "cardType",
  "score", "lastVisited", "createdAt", "updatedAt",
]);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST")    return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  // ── Auth — admin only ────────────────────────────────────────
  let userClient;
  try { userClient = createSupabaseUserClient(req); }
  catch { return jsonError("Missing Authorization header", 401); }

  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return jsonError("Unauthorized", 401);

  // Fetch profile to confirm admin role
  const adminClient = createSupabaseAdminClient();
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) return jsonError("Could not load user profile", 500);
  if (profile.role !== "admin")  return jsonError("Forbidden — admin role required", 403);

  // ── Parse body ───────────────────────────────────────────────
  let body: Record<string, unknown> = {};
  try { body = await req.json(); }
  catch { /* empty body is fine — all params are optional */ }

  const programId = typeof body.programId === "string" ? body.programId : null;
  const courseId  = typeof body.courseId  === "string" ? body.courseId  : null;
  const lessonId  = typeof body.lessonId  === "string" ? body.lessonId  : null;
  const cardTypes = Array.isArray(body.cardTypes) && body.cardTypes.every(t => typeof t === "string")
    ? body.cardTypes as string[]
    : null;

  const rawSort  = typeof body.sortField === "string" && VALID_SORT_FIELDS.has(body.sortField)
    ? body.sortField : "program";
  const sortDir  = body.sortDir === "desc" ? "desc" : "asc";
  const page     = typeof body.page     === "number" && body.page     >= 1 ? Math.floor(body.page)     : 1;
  const pageSize = typeof body.pageSize === "number" && body.pageSize >= 1 ? Math.floor(body.pageSize) : 25;

  // ── Fetch count ──────────────────────────────────────────────
  const { data: countData, error: countError } = await adminClient.rpc(
    "admin_count_learnings",
    {
      p_program_id: programId,
      p_course_id:  courseId,
      p_lesson_id:  lessonId,
      p_card_types: cardTypes,
    },
  );

  if (countError) {
    console.error("admin_count_learnings error:", countError);
    return jsonError("Failed to count rows", 500);
  }

  const totalCount = Number(countData ?? 0);

  // ── Fetch page ───────────────────────────────────────────────
  const { data: rows, error: rowsError } = await adminClient.rpc(
    "admin_list_learnings",
    {
      p_program_id: programId,
      p_course_id:  courseId,
      p_lesson_id:  lessonId,
      p_card_types: cardTypes,
      p_sort_field: rawSort,
      p_sort_dir:   sortDir,
      p_page:       page,
      p_page_size:  pageSize,
    },
  );

  if (rowsError) {
    console.error("admin_list_learnings error:", rowsError);
    return jsonError("Failed to fetch rows", 500);
  }

  // ── Map snake_case → camelCase ───────────────────────────────
  // deno-lint-ignore no-explicit-any
  const mapped = (rows ?? []).map((r: any) => ({
    userId:       r.user_id,
    userName:     r.user_name,
    programId:    r.program_id,
    programTitle: r.program_title,
    programExtId: r.program_ext_id,
    courseId:     r.course_id,
    courseTitle:  r.course_title,
    courseExtId:  r.course_ext_id,
    lessonId:     r.lesson_id,
    lessonTitle:  r.lesson_title,
    lessonExtId:  r.lesson_ext_id,
    cardId:       r.card_id,
    cardExtId:    r.card_ext_id,
    cardType:     r.card_type,
    question:     r.question,
    answers:      r.answers,
    score:        r.score,
    lastVisited:  r.last_visited,
    isFavorite:   r.is_favorite,
    createdAt:    r.created_at,
    updatedAt:    r.updated_at,
  }));

  return json({ rows: mapped, totalCount, page, pageSize } satisfies ListCardsAdminResponse);
});

// ── Helpers ────────────────────────────────────────────────────

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}
