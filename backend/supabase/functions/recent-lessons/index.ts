import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createSupabaseUserClient, createSupabaseAdminClient } from "../_shared/supabaseClients.ts";
import { THRESHOLD_NEW_VS_REPEAT } from "../../../../shared/core/constants.ts";
import type { RecentLesson, FetchRecentLessonsResponse } from "../../../../shared/features/programs/types.ts";

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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST")    return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  // ── Auth ────────────────────────────────────────────────────
  let userClient;
  try { userClient = createSupabaseUserClient(req); }
  catch { return jsonError("Missing Authorization header", 401); }

  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return jsonError("Unauthorized", 401);

  const userId      = user.id;
  const adminClient = createSupabaseAdminClient();

  // ── Determine accessible program IDs ────────────────────────
  const { data: profile } = await adminClient
    .from("profiles").select("role").eq("id", userId).single();

  const isAdmin = profile?.role === "admin";

  let accessibleProgramIds: string[];

  if (isAdmin) {
    const { data: allPrograms } = await adminClient.from("programs").select("id");
    accessibleProgramIds = (allPrograms ?? []).map((p: { id: string }) => p.id);
  } else {
    const { data: pm } = await adminClient
      .from("program_memberships").select("program_id").eq("user_id", userId);

    const { data: cm } = await adminClient
      .from("course_memberships")
      .select("courses!inner(program_id)")
      .eq("user_id", userId);

    const direct  = (pm ?? []).map((r: { program_id: string }) => r.program_id);
    const indirect = (cm ?? []).flatMap((r: { courses: { program_id: string } | null }) =>
      r.courses ? [r.courses.program_id] : [],
    );
    accessibleProgramIds = [...new Set([...direct, ...indirect])];
  }

  if (accessibleProgramIds.length === 0) {
    return json({ lessons: [] } satisfies FetchRecentLessonsResponse);
  }

  // ── Fetch courses and lessons for accessible programs ────────
  const { data: courses } = await adminClient
    .from("courses").select("id, title, program_id")
    .in("program_id", accessibleProgramIds);

  if (!courses || courses.length === 0) {
    return json({ lessons: [] } satisfies FetchRecentLessonsResponse);
  }

  const courseIds  = courses.map((c: { id: string }) => c.id);
  const courseById = Object.fromEntries(
    courses.map((c: { id: string; title: string; program_id: string }) => [c.id, c]),
  );

  const { data: lessons } = await adminClient
    .from("lessons").select("id, title, course_id")
    .in("course_id", courseIds);

  if (!lessons || lessons.length === 0) {
    return json({ lessons: [] } satisfies FetchRecentLessonsResponse);
  }

  const lessonIds  = lessons.map((l: { id: string }) => l.id);
  const lessonById = Object.fromEntries(
    lessons.map((l: { id: string; title: string; course_id: string }) => [l.id, l]),
  );

  // ── Fetch programs for title lookup ──────────────────────────
  const { data: programs } = await adminClient
    .from("programs").select("id, title")
    .in("id", accessibleProgramIds);

  const programById = Object.fromEntries(
    (programs ?? []).map((p: { id: string; title: string }) => [p.id, p]),
  );

  // ── Fetch cards in those lessons (id + lesson_id only) ───────
  const { data: cards } = await adminClient
    .from("cards").select("id, lesson_id")
    .in("lesson_id", lessonIds);

  if (!cards || cards.length === 0) {
    return json({ lessons: [] } satisfies FetchRecentLessonsResponse);
  }

  const cardIds       = cards.map((c: { id: string }) => c.id);
  const cardToLesson  = Object.fromEntries(
    cards.map((c: { id: string; lesson_id: string }) => [c.id, c.lesson_id]),
  );

  // ── Fetch learnings for this user (only visited cards) ───────
  const { data: learnings } = await adminClient
    .from("user_cards_learnings")
    .select("card_id, score, last_visited")
    .eq("user_id", userId)
    .in("card_id", cardIds)
    .not("last_visited", "is", null);

  if (!learnings || learnings.length === 0) {
    return json({ lessons: [] } satisfies FetchRecentLessonsResponse);
  }

  // ── Aggregate per lesson ─────────────────────────────────────
  type LessonAgg = { lastVisited: string; hasNewCards: boolean };
  const lessonAgg = new Map<string, LessonAgg>();

  for (const l of learnings as { card_id: string; score: number; last_visited: string }[]) {
    const lessonId = cardToLesson[l.card_id];
    if (!lessonId) continue;

    const existing = lessonAgg.get(lessonId);
    if (!existing) {
      lessonAgg.set(lessonId, {
        lastVisited: l.last_visited,
        hasNewCards: l.score < THRESHOLD_NEW_VS_REPEAT,
      });
    } else {
      if (l.last_visited > existing.lastVisited) existing.lastVisited = l.last_visited;
      if (l.score < THRESHOLD_NEW_VS_REPEAT)      existing.hasNewCards = true;
    }
  }

  // ── Sort by lastVisited desc, take top 3 ─────────────────────
  const sorted = Array.from(lessonAgg.entries())
    .sort(([, a], [, b]) => b.lastVisited.localeCompare(a.lastVisited))
    .slice(0, 3);

  const result: RecentLesson[] = sorted.map(([lessonId, agg]) => {
    const lesson  = lessonById[lessonId];
    const course  = courseById[lesson.course_id];
    const program = programById[course.program_id];
    return {
      lessonId,
      lessonTitle:  lesson.title,
      courseId:     course.id,
      courseTitle:  course.title,
      programId:    program.id,
      programTitle: program.title,
      lastVisited:  agg.lastVisited,
      studyMode:    agg.hasNewCards ? "NEW" : "REPEAT",
    };
  });

  return json({ lessons: result } satisfies FetchRecentLessonsResponse);
});
