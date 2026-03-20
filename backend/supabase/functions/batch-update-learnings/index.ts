import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createSupabaseUserClient, createSupabaseAdminClient } from "../_shared/supabaseClients.ts";
import type {
  LearningUpdate,
  BatchLearningUpdateResponse,
  LearningUpdateError,
} from "../../../../shared/features/learnings/types.ts";

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
  let body: { updates?: unknown };
  try { body = await req.json(); }
  catch { return jsonError("Invalid JSON body", 400); }

  if (!Array.isArray(body.updates) || body.updates.length === 0) {
    return jsonError("'updates' must be a non-empty array", 400);
  }

  const errors: LearningUpdateError[] = [];
  const validUpdates: LearningUpdate[] = [];

  for (const raw of body.updates) {
    const u = raw as Record<string, unknown>;
    const cardId = typeof u.cardId === "string" ? u.cardId : null;

    if (!cardId) {
      errors.push({ cardId: String(u.cardId ?? "unknown"), reason: "Missing or invalid cardId (must be a UUID string)" });
      continue;
    }
    if (typeof u.score !== "number" || !Number.isInteger(u.score)) {
      errors.push({ cardId, reason: "Missing or invalid score (must be an integer)" });
      continue;
    }
    if (u.errorsByType !== undefined && (typeof u.errorsByType !== "object" || Array.isArray(u.errorsByType))) {
      errors.push({ cardId, reason: "errorsByType must be a plain object (Record<string, number>)" });
      continue;
    }

    validUpdates.push({
      cardId,
      score:        u.score as number,
      errorsByType: u.errorsByType as Record<string, number> | undefined,
      lastVisited:  typeof u.lastVisited  === "string" ? u.lastVisited  : undefined,
      // favoriteDate: null = unfavorite, string = favorite, undefined = leave unchanged
      favoriteDate: u.favoriteDate === null    ? null
                  : typeof u.favoriteDate === "string" ? u.favoriteDate
                  : undefined,
    });
  }

  if (validUpdates.length === 0) {
    return json({ updatedCount: 0, errors } satisfies BatchLearningUpdateResponse);
  }

  // ── Enrollment check ────────────────────────────────────────
  // Verify the user is a member of the course/program for each card.
  // Uses the adminClient + get_authorized_card_ids RPC because auth.uid()
  // is not available in service-role context.
  const adminClient = createSupabaseAdminClient();
  const cardIds     = validUpdates.map(u => u.cardId);

  const { data: authorizedRows, error: authzError } = await adminClient.rpc(
    "get_authorized_card_ids",
    { p_user_id: userId, p_card_ids: cardIds },
  );

  if (authzError) {
    console.error("Authorization check failed:", authzError);
    return jsonError("Authorization check failed", 500);
  }

  const authorizedSet = new Set<string>(
    (authorizedRows ?? []).map((r: { card_id: string }) => r.card_id),
  );

  const authorizedUpdates: LearningUpdate[] = [];
  for (const u of validUpdates) {
    if (authorizedSet.has(u.cardId)) {
      authorizedUpdates.push(u);
    } else {
      errors.push({ cardId: u.cardId, reason: "Not enrolled in the course or program for this card" });
    }
  }

  // ── Upsert ──────────────────────────────────────────────────
  // Individual upserts via Promise.allSettled — one card failing does not abort the batch.
  // favoriteDate is only included in the upsert payload when explicitly provided (null or
  // string), so omitting it preserves the existing value on UPDATE.
  let updatedCount = 0;

  const upsertResults = await Promise.allSettled(
    authorizedUpdates.map(async (u) => {
      // deno-lint-ignore no-explicit-any
      const row: Record<string, any> = {
        user_id:        userId,
        card_id:        u.cardId,
        score:          Math.max(0, u.score),
        errors_by_type: u.errorsByType ?? {},
        last_visited:   u.lastVisited ?? new Date().toISOString(),
        updated_at:     new Date().toISOString(),
      };

      if (u.favoriteDate !== undefined) row.favorite_date = u.favoriteDate;

      const { error } = await adminClient
        .from("user_cards_learnings")
        .upsert(row, { onConflict: "user_id,card_id" });

      if (error) throw new Error(error.message);
    }),
  );

  for (let i = 0; i < upsertResults.length; i++) {
    if (upsertResults[i].status === "fulfilled") {
      updatedCount++;
    } else {
      errors.push({
        cardId: authorizedUpdates[i].cardId,
        reason: "Failed to save learning data. Please try again.",
      });
    }
  }

  return json({ updatedCount, ...(errors.length > 0 && { errors }) } satisfies BatchLearningUpdateResponse);
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
