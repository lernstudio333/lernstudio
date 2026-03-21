import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createSupabaseUserClient, createSupabaseAdminClient } from "../_shared/supabaseClients.ts";
import type { FetchProgramsResponse, ProgramWithCourses } from "../../../../shared/features/programs/types.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST")    return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  // ── Auth ────────────────────────────────────────────────────
  let userClient;
  try { userClient = createSupabaseUserClient(req); }
  catch { return jsonError("Missing Authorization header", 401); }

  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return jsonError("Unauthorized", 401);

  const userId = user.id;
  const adminClient = createSupabaseAdminClient();

  // ── Determine accessible program IDs ────────────────────────
  // Admins see all programs; others see only programs they are
  // enrolled in (directly via program_memberships, or indirectly
  // via course_memberships → courses → program).
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  const isAdmin = profile?.role === "admin";

  let programIds: string[];

  if (isAdmin) {
    const { data: allPrograms } = await adminClient.from("programs").select("id");
    programIds = (allPrograms ?? []).map((p: { id: string }) => p.id);
  } else {
    // Direct program memberships
    const { data: pm } = await adminClient
      .from("program_memberships")
      .select("program_id")
      .eq("user_id", userId);

    // Course memberships → resolve to program IDs
    const { data: cm } = await adminClient
      .from("course_memberships")
      .select("course_id")
      .eq("user_id", userId);

    const courseIds = (cm ?? []).map((m: { course_id: string }) => m.course_id);
    let fromCourses: string[] = [];

    if (courseIds.length > 0) {
      const { data: courseRows } = await adminClient
        .from("courses")
        .select("program_id")
        .in("id", courseIds);
      fromCourses = (courseRows ?? [])
        .map((c: { program_id: string | null }) => c.program_id)
        .filter((id): id is string => id != null);
    }

    programIds = [
      ...new Set([
        ...(pm ?? []).map((m: { program_id: string }) => m.program_id),
        ...fromCourses,
      ]),
    ];
  }

  if (programIds.length === 0) {
    return json({ programs: [] } satisfies FetchProgramsResponse);
  }

  // ── Fetch programs ───────────────────────────────────────────
  const { data: programRows, error: programsError } = await adminClient
    .from("programs")
    .select("id, title, teaser_image, teaser_text, position")
    .in("id", programIds)
    .order("position");

  if (programsError) return jsonError("Failed to fetch programs", 500);

  // ── Resolve teaser images → public storage URLs ──────────────
  const mediaIds = (programRows ?? [])
    .map((p: { teaser_image: string | null }) => p.teaser_image)
    .filter((id): id is string => id != null);

  const teaserUrlById = new Map<string, string>();

  if (mediaIds.length > 0) {
    const { data: mediaRows } = await adminClient
      .from("media")
      .select("id, bucket, path")
      .in("id", mediaIds);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    for (const m of mediaRows ?? []) {
      if (m.bucket && m.path) {
        teaserUrlById.set(
          m.id,
          `${supabaseUrl}/storage/v1/object/public/${m.bucket}/${m.path}`,
        );
      }
    }
  }

  // ── Fetch courses ────────────────────────────────────────────
  const { data: courseRows, error: coursesError } = await adminClient
    .from("courses")
    .select("id, program_id, title, position")
    .in("program_id", programIds)
    .order("position");

  if (coursesError) return jsonError("Failed to fetch courses", 500);

  const courseIds2 = (courseRows ?? []).map((c: { id: string }) => c.id);

  if (courseIds2.length === 0) {
    return json({ programs: buildNested(programRows ?? [], [], [], new Map(), teaserUrlById) } satisfies FetchProgramsResponse);
  }

  // ── Fetch lessons ────────────────────────────────────────────
  const { data: lessonRows, error: lessonsError } = await adminClient
    .from("lessons")
    .select("id, course_id, title, position")
    .in("course_id", courseIds2)
    .order("position");

  if (lessonsError) return jsonError("Failed to fetch lessons", 500);

  // ── Compute lastVisited per lesson for this user ─────────────
  // user_cards_learnings is per-card; we aggregate MAX(last_visited)
  // per lesson by joining through the cards table in JS.
  const lessonIds = (lessonRows ?? []).map((l: { id: string }) => l.id);
  const lessonLastVisited = new Map<string, string>();

  if (lessonIds.length > 0) {
    const { data: cardRows } = await adminClient
      .from("cards")
      .select("id, lesson_id")
      .in("lesson_id", lessonIds);

    const cardIds = (cardRows ?? []).map((c: { id: string }) => c.id);

    if (cardIds.length > 0) {
      const { data: learnings } = await adminClient
        .from("user_cards_learnings")
        .select("card_id, last_visited")
        .eq("user_id", userId)
        .in("card_id", cardIds)
        .not("last_visited", "is", null);

      const cardToLesson = new Map(
        (cardRows ?? []).map((c: { id: string; lesson_id: string }) => [c.id, c.lesson_id]),
      );

      for (const l of learnings ?? []) {
        const lid = cardToLesson.get(l.card_id);
        if (lid && l.last_visited) {
          const existing = lessonLastVisited.get(lid);
          if (!existing || l.last_visited > existing) {
            lessonLastVisited.set(lid, l.last_visited);
          }
        }
      }
    }
  }

  // ── Build and return nested structure ────────────────────────
  return json({
    programs: buildNested(
      programRows ?? [],
      courseRows  ?? [],
      lessonRows  ?? [],
      lessonLastVisited,
      teaserUrlById,
    ),
  } satisfies FetchProgramsResponse);
});

// ── Helpers ─────────────────────────────────────────────────────

// deno-lint-ignore no-explicit-any
function buildNested(
  programs: any[],
  courses:  any[],
  lessons:  any[],
  lessonLastVisited: Map<string, string>,
  teaserUrlById:     Map<string, string>,
): ProgramWithCourses[] {
  const lessonsByCourse = new Map<string, any[]>();
  for (const l of lessons) {
    const arr = lessonsByCourse.get(l.course_id) ?? [];
    arr.push(l);
    lessonsByCourse.set(l.course_id, arr);
  }

  const coursesByProgram = new Map<string, any[]>();
  for (const c of courses) {
    const arr = coursesByProgram.get(c.program_id) ?? [];
    arr.push(c);
    coursesByProgram.set(c.program_id, arr);
  }

  return programs.map((p) => ({
    id:          p.id,
    title:       p.title,
    teaserImage: p.teaser_image ? (teaserUrlById.get(p.teaser_image) ?? null) : null,
    teaserText:  p.teaser_text  ?? null,
    courses: (coursesByProgram.get(p.id) ?? []).map((c) => ({
      id:    c.id,
      title: c.title,
      lessons: (lessonsByCourse.get(c.id) ?? []).map((l) => ({
        id:          l.id,
        title:       l.title,
        lastVisited: lessonLastVisited.get(l.id) ?? null,
      })),
    })),
  }));
}

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
