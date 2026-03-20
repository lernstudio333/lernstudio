import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { formatCsv, formatAnswerForCsv } from "../../../../shared/features/csv/csvFormatter.ts";
import type { CsvExportRow } from "../../../../shared/features/csv/columnDefs.ts";
import { createSupabaseUserClient, createSupabaseAdminClient } from "../_shared/supabaseClients.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST")    return new Response("Method not allowed", { status: 405, headers: corsHeaders });

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

  let body: { lessonId?: string; courseId?: string; programId?: string };
  try { body = await req.json(); }
  catch { return jsonError("Invalid JSON body", 400); }

  const { lessonId, courseId, programId } = body;
  if (!lessonId && !courseId && !programId) {
    return jsonError("At least one of lessonId, courseId, or programId must be provided", 400);
  }

  // Resolve lesson IDs
  let lessonIds: string[];
  if (lessonId) {
    lessonIds = [lessonId];
  } else if (courseId) {
    const { data, error } = await adminClient
      .from("lessons").select("id").eq("course_id", courseId).order("position");
    if (error) return jsonError("Failed to fetch lessons", 500);
    lessonIds = (data ?? []).map((l: { id: string }) => l.id);
  } else {
    const { data: courses, error: coursesError } = await adminClient
      .from("courses").select("id").eq("program_id", programId!).order("position");
    if (coursesError) return jsonError("Failed to fetch courses", 500);
    const courseIds = (courses ?? []).map((c: { id: string }) => c.id);
    if (courseIds.length === 0) {
      lessonIds = [];
    } else {
      const { data: lessons, error: lessonsError } = await adminClient
        .from("lessons").select("id").in("course_id", courseIds).order("position");
      if (lessonsError) return jsonError("Failed to fetch lessons", 500);
      lessonIds = (lessons ?? []).map((l: { id: string }) => l.id);
    }
  }

  if (lessonIds.length === 0) {
    return csvResponse(formatCsv([]), filenameFor(body));
  }

  // Fetch cards with nested hierarchy + answers + media
  // deno-lint-ignore no-explicit-any
  const { data: cards, error: cardsError } = await adminClient
    .from("cards")
    .select(`
      id, ext_id, card_type, question, tip,
      lessons(id, ext_id, courses(id, ext_id, programs(id, ext_id))),
      card_answers(answer_text, media_id, position, media(path))
    `)
    .in("lesson_id", lessonIds)
    .order("position");

  if (cardsError) return jsonError("Failed to fetch cards", 500);

  // deno-lint-ignore no-explicit-any
  const fullRows: CsvExportRow[] = (cards ?? []).map((card: any) => {
    const lesson  = card.lessons;
    const course  = lesson?.courses;
    const program = course?.programs;

    // deno-lint-ignore no-explicit-any
    const answers = ((card.card_answers ?? []) as any[])
      .slice()
      // deno-lint-ignore no-explicit-any
      .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0));

    // deno-lint-ignore no-explicit-any
    const textAnswers: string[] = answers
      .filter((a: any) => a.answer_text)
      .map((a: any) => a.answer_text as string);

    // deno-lint-ignore no-explicit-any
    const mediaFilenames: string[] = answers
      .filter((a: any) => a.media_id && a.media?.path)
      .map((a: any) => basename(a.media.path as string));

    return {
      id:           card.id        as string,
      extId:        (card.ext_id   as string | null) ?? "",
      programId:    program?.id    as string ?? "",
      courseId:     course?.id     as string ?? "",
      lessonId:     lesson?.id     as string ?? "",
      extProgramId: (program?.ext_id as string | null) ?? "",
      extCourseId:  (course?.ext_id  as string | null) ?? "",
      extLessonId:  (lesson?.ext_id  as string | null) ?? "",
      cardType:     card.card_type as string,
      question:     card.question  as string,
      answer:       formatAnswerForCsv(textAnswers),
      tip:          (card.tip as string | null) ?? "",
      media:        mediaFilenames.join(", "),
    };
  });

  return csvResponse(formatCsv(fullRows), filenameFor(body));
});

// ── Helpers ────────────────────────────────────────────────────

function basename(path: string): string {
  return path.split("/").pop() ?? path;
}

function filenameFor(ids: { lessonId?: string; courseId?: string; programId?: string }): string {
  if (ids.lessonId)  return `lesson-${ids.lessonId}.csv`;
  if (ids.courseId)  return `course-${ids.courseId}.csv`;
  return `program-${ids.programId}.csv`;
}

function csvResponse(csv: string, filename: string) {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      ...corsHeaders,
    },
  });
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}
