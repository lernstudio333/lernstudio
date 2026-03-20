import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createSupabaseUserClient, createSupabaseAdminClient } from "../_shared/supabaseClients.ts";
import { selectStudyCards } from "../../../../shared/features/study/selectionAlgorithm.ts";
import {
  NUMBER_CARDS_PER_SESSION,
  NUMBER_DISTRACTOR_CARDS,
} from "../../../../shared/core/constants.ts";
import type {
  FetchStudyCardsRequest,
  FetchStudyCardsResponse,
  StudyCard,
  StudyCardWithLearning,
  LearningSnapshot,
} from "../../../../shared/features/study/types.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
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

  // ── Parse & validate body ───────────────────────────────────
  let body: Partial<FetchStudyCardsRequest>;
  try { body = await req.json(); }
  catch { return jsonError("Invalid JSON body", 400); }

  const { lessonId, quizMode, favoriteOnly = false } = body;

  if (!lessonId || typeof lessonId !== "string") {
    return jsonError("'lessonId' is required", 400);
  }
  if (!quizMode || !["NEW", "REPEAT", "LIST"].includes(quizMode)) {
    return jsonError("'quizMode' must be one of: NEW, REPEAT, LIST", 400);
  }

  const studyCardCount     = (typeof body.studyCardCount     === "number" && body.studyCardCount     > 0) ? body.studyCardCount     : NUMBER_CARDS_PER_SESSION;
  const distractorCardCount = (typeof body.distractorCardCount === "number" && body.distractorCardCount > 0) ? body.distractorCardCount : NUMBER_DISTRACTOR_CARDS;

  const adminClient = createSupabaseAdminClient();

  // ── Verify user can access this lesson ──────────────────────
  const { data: lessonRow } = await adminClient
    .from("lessons").select("id, course_id").eq("id", lessonId).single();
  if (!lessonRow) return jsonError("Lesson not found", 404);

  const { data: courseRow } = await adminClient
    .from("courses").select("id, program_id").eq("id", lessonRow.course_id).single();
  if (!courseRow) return jsonError("Course not found", 404);

  const { data: courseMembership } = await adminClient
    .from("course_memberships")
    .select("user_id").eq("course_id", courseRow.id).eq("user_id", userId).maybeSingle();

  const { data: programMembership } = await adminClient
    .from("program_memberships")
    .select("user_id").eq("program_id", courseRow.program_id).eq("user_id", userId).maybeSingle();

  const { data: profile } = await adminClient
    .from("profiles").select("role").eq("id", userId).single();

  const isAdmin  = profile?.role === "admin";
  const hasAccess = isAdmin || courseMembership != null || programMembership != null;
  if (!hasAccess) return jsonError("Not enrolled in this lesson", 403);

  // ── Fetch lesson cards + user learning data ─────────────────
  // deno-lint-ignore no-explicit-any
  const { data: rawCards, error: cardsError } = await adminClient
    .from("cards")
    .select("id, card_type, question, tip, position, card_answers(answer_text, media_id, position, is_correct)")
    .eq("lesson_id", lessonId)
    .order("position");

  if (cardsError) return jsonError("Failed to fetch cards", 500);
  if (!rawCards || rawCards.length === 0) {
    return json({ studyCards: [], distractorCards: [] } satisfies FetchStudyCardsResponse);
  }

  const lessonCardIds = rawCards.map((c: { id: string }) => c.id);

  const { data: learningRows } = await adminClient
    .from("user_cards_learnings")
    .select("card_id, score, errors_by_type, last_visited, favorite_date")
    .eq("user_id", userId)
    .in("card_id", lessonCardIds);

  // deno-lint-ignore no-explicit-any
  const learningByCardId = new Map<string, any>(
    (learningRows ?? []).map((l: { card_id: string }) => [l.card_id, l]),
  );

  // deno-lint-ignore no-explicit-any
  const lessonCards: StudyCardWithLearning[] = rawCards.map((card: any) => {
    const lr = learningByCardId.get(card.id);
    const learning: LearningSnapshot = lr
      ? { score: lr.score, errorsByType: lr.errors_by_type ?? {}, lastVisited: lr.last_visited, favoriteDate: lr.favorite_date }
      : null;

    return {
      id:       card.id,
      cardType: card.card_type,
      question: card.question,
      tip:      card.tip ?? null,
      position: card.position,
      // deno-lint-ignore no-explicit-any
      answers:  (card.card_answers ?? []).map((a: any) => ({
        answerText: a.answer_text ?? null,
        mediaId:    a.media_id   ?? null,
        position:   a.position   ?? 0,
        isCorrect:  a.is_correct ?? true,
      })),
      learning,
    };
  });

  // ── Run selection algorithm ─────────────────────────────────
  const studyCards = selectStudyCards(lessonCards, quizMode, favoriteOnly, studyCardCount);

  // ── Distractor cards (NEW and REPEAT only) ──────────────────
  let distractorCards: StudyCard[] = [];

  if (quizMode !== "LIST") {
    const studyCardIdSet = new Set(studyCards.map(c => c.id));

    // Step 1: candidates from same lesson (exclude study cards)
    const lessonDistractors: StudyCard[] = lessonCards
      .filter(c => !studyCardIdSet.has(c.id))
      .map(({ learning: _learning, ...card }) => card);

    if (lessonDistractors.length >= distractorCardCount) {
      // Enough from this lesson — shuffle and slice
      distractorCards = shuffled(lessonDistractors).slice(0, distractorCardCount);
    } else {
      // Step 2: expand to sister lessons in the same course
      const { data: siblingCards, error: siblingError } = await adminClient
        .from("cards")
        .select("id, card_type, question, tip, position, card_answers(answer_text, media_id, position, is_correct)")
        .neq("lesson_id", lessonId)
        .in(
          "lesson_id",
          // Fetch all lesson IDs in the same course
          (await adminClient
            .from("lessons").select("id").eq("course_id", lessonRow.course_id)
          ).data?.map((l: { id: string }) => l.id) ?? [],
        )
        .limit(distractorCardCount - lessonDistractors.length);

      if (!siblingError && siblingCards) {
        // deno-lint-ignore no-explicit-any
        const siblingDistractors: StudyCard[] = siblingCards.map((card: any) => ({
          id:       card.id,
          cardType: card.card_type,
          question: card.question,
          tip:      card.tip ?? null,
          position: card.position,
          // deno-lint-ignore no-explicit-any
          answers:  (card.card_answers ?? []).map((a: any) => ({
            answerText: a.answer_text ?? null,
            mediaId:    a.media_id   ?? null,
            position:   a.position   ?? 0,
            isCorrect:  a.is_correct ?? true,
          })),
        }));

        distractorCards = shuffled([...lessonDistractors, ...siblingDistractors]).slice(0, distractorCardCount);
      } else {
        distractorCards = shuffled(lessonDistractors);
      }
    }
  }

  return json({ studyCards, distractorCards } satisfies FetchStudyCardsResponse);
});

// ── Helpers ────────────────────────────────────────────────────

/** Fisher-Yates shuffle — returns a new array. */
function shuffled<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
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
