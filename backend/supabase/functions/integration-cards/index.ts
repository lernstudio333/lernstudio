import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createSupabaseAdminClient } from "../_shared/supabaseClients.ts";
import { validateCardsRequest, diffCard, normalizeAnswers } from "../../../../shared/features/integration/index.ts";
import type { ExistingCardSnapshot, UpdateReportItem } from "../../../../shared/features/integration/index.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
};

// Called by external sources using a session token (not a Supabase JWT).
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST")    return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  // Auth: Bearer <session_token> — our own token, not a Supabase JWT
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return jsonError("Missing Authorization header", 401);
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  const adminClient = createSupabaseAdminClient();

  const { data: integration } = await adminClient
    .from("integrations")
    .select("id, user_id, doc_id, lesson_id, expires_at")
    .eq("token", token)
    .single();

  if (!integration) return jsonError("Invalid session token", 401);
  if (integration.expires_at && new Date(integration.expires_at) < new Date()) {
    return jsonError("Session token expired", 401);
  }

  // Validate request body using shared pure logic
  let rawBody: unknown;
  try { rawBody = await req.json(); }
  catch { return jsonError("Invalid JSON body", 400); }

  const validation = validateCardsRequest(rawBody);
  if (!validation.ok) return jsonError(validation.error, 400);

  const { dry_run = false, cards } = validation.data;

  const inserted: UpdateReportItem[] = [];
  const updated:  UpdateReportItem[] = [];

  // Lazily resolved when the first position-less insert is encountered
  let nextPosition: number | null = null;

  for (const card of cards) {
    // Look up existing card by ext_id
    const { data: existing } = await adminClient
      .from("cards")
      .select("id, card_type, question, tip, details, source, position, flags, card_answers(answer_text, position)")
      .eq("ext_id", card.extId)
      .maybeSingle();

    if (existing) {
      // Build snapshot for pure diff function
      const snapshot: ExistingCardSnapshot = {
        card_type: existing.card_type,
        question:  existing.question,
        tip:       existing.tip       ?? null,
        details:   existing.details   ?? null,
        source:    existing.source    ?? null,
        position:  existing.position,
        flags:     existing.flags     ?? null,
        answers:   (existing.card_answers as { answer_text: string | null; position: number }[])
          .sort((a, b) => a.position - b.position)
          .map((a) => a.answer_text ?? ""),
      };

      const changes = diffCard(card, snapshot);

      if (changes.length > 0) {
        updated.push({ external_id: card.extId, action: "update", changes });

        if (!dry_run) {
          const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
          if (changes.includes("card_type")) patch.card_type = card.cardType;
          if (changes.includes("question"))  patch.question  = card.question;
          if (changes.includes("tip"))       patch.tip       = card.tip       ?? null;
          if (changes.includes("details"))   patch.details   = card.details   ?? null;
          if (changes.includes("source"))    patch.source    = card.source    ?? null;
          if (changes.includes("position"))  patch.position  = card.position;
          if (changes.includes("flags"))     patch.flags     = (card.flags ?? []).join(',');

          await adminClient.from("cards").update(patch).eq("id", existing.id);

          if (changes.includes("answer")) {
            await adminClient.from("card_answers").delete().eq("card_id", existing.id);
            const rows = normalizeAnswers(card.answer).map((a, i) => ({
              card_id:     existing.id,
              answer_text: a,
              position:    i,
            }));
            if (rows.length > 0) await adminClient.from("card_answers").insert(rows);
          }
        }
      }
    } else {
      // New card — requires a target lesson on the integration
      if (!dry_run && !integration.lesson_id) {
        return jsonError(
          "Cannot insert new cards: the target lesson no longer exists. Re-pair this integration with a valid lesson.",
          409,
        );
      }
      inserted.push({ external_id: card.extId, action: "insert" });

      if (!dry_run && integration.lesson_id) {
        // Resolve position: use explicit value, or append after current max
        let position = card.position;
        if (position === undefined) {
          if (nextPosition === null) {
            const { data: tail } = await adminClient
              .from("cards")
              .select("position")
              .eq("lesson_id", integration.lesson_id)
              .order("position", { ascending: false })
              .limit(1);
            nextPosition = (tail?.[0]?.position ?? -1) + 1;
          }
          position = nextPosition!++;
        }

        const { data: newCard, error: insertError } = await adminClient
          .from("cards")
          .insert({
            ext_id:    card.extId,
            lesson_id: integration.lesson_id,
            card_type: card.cardType  ?? "SINGLE_CARD",
            question:  card.question,
            tip:       card.tip       ?? null,
            details:   card.details   ?? null,
            source:    card.source    ?? null,
            flags:     (card.flags    ?? []).join(','),
            position,
          })
          .select("id")
          .single();

        if (insertError) return jsonError(`Failed to insert card "${card.extId}": ${insertError.message}`, 500);

        if (newCard) {
          const rows = normalizeAnswers(card.answer).map((a, i) => ({
            card_id:     newCard.id,
            answer_text: a,
            position:    i,
          }));
          if (rows.length > 0) await adminClient.from("card_answers").insert(rows);
        }
      }
    }
  }

  // Update last_sync on a real (non-dry-run) commit
  if (!dry_run && (inserted.length > 0 || updated.length > 0)) {
    await adminClient
      .from("integrations")
      .update({ last_sync: new Date().toISOString() })
      .eq("id", integration.id);
  }

  return json({ inserted, updated });
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
