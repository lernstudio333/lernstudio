import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Papa from "npm:papaparse@5";
import { validateCsv } from "../../../../shared/features/csv/CsvValidator.ts";
import type { CsvImportContext, CsvMappedCard } from "../../../../shared/features/csv/csvImportTypes.ts";
import { createSupabaseUserClient, createSupabaseAdminClient } from "../_shared/supabaseClients.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
};

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

  // Parse form data
  let formData: FormData;
  try { formData = await req.formData(); }
  catch {
    return json({ status: "error", imported: 0, updated: 0, ignored: 0,
      file_errors: [{ type: "parse_error", message: "Failed to parse form data" }] });
  }

  const file            = formData.get("file") as File | null;
  const lesson_id       = (formData.get("lesson_id")        as string | null)?.trim();
  const course_id       = (formData.get("course_id")        as string | null)?.trim();
  const program_id      = (formData.get("program_id")       as string | null)?.trim();
  const ignoreParentIds = formData.get("ignore_parent_ids") === "true";
  const updateByExtId   = formData.get("update_by_ext_id")  === "true";

  if (!file || !lesson_id || !course_id || !program_id) {
    return json({ status: "error", imported: 0, updated: 0, ignored: 0,
      file_errors: [{ type: "missing_field", message: "Missing required fields: file, lesson_id, course_id, program_id" }] });
  }

  // Verify lesson → course → program hierarchy
  const { data: lesson } = await adminClient
    .from("lessons").select("id, course_id").eq("id", lesson_id).single();
  if (!lesson || lesson.course_id !== course_id) {
    return json({ status: "error", imported: 0, updated: 0, ignored: 0,
      file_errors: [{ type: "invalid_hierarchy", message: "Lesson does not belong to the specified course" }] });
  }
  const { data: course } = await adminClient
    .from("courses").select("id, program_id").eq("id", course_id).single();
  if (!course || course.program_id !== program_id) {
    return json({ status: "error", imported: 0, updated: 0, ignored: 0,
      file_errors: [{ type: "invalid_hierarchy", message: "Course does not belong to the specified program" }] });
  }

  // Parse CSV
  const csvText = await file.text();
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  // Validate (backend is source of truth)
  const context: CsvImportContext = { lessonId: lesson_id, courseId: course_id, programId: program_id, ignoreParentIds };
  const validation = validateCsv(parsed.meta.fields ?? [], parsed.data, context);

  // File-level errors block the import entirely
  if (validation.fileErrors.length > 0) {
    return json({
      status: "error",
      imported: 0,
      updated: 0,
      ignored: 0,
      file_errors: validation.fileErrors.map(e => ({
        type:    e.errorType.key,
        column:  e.column,
        message: e.message,
      })),
    });
  }

  // Mismatch requires user confirmation
  if (validation.requiresConfirmation) {
    return json({
      status:           "requires_confirmation",
      imported:         0,
      updated:          0,
      ignored:          0,
      mismatch_details: validation.mismatchDetails,
    });
  }

  // Row errors: report but continue with valid rows
  const ignored = validation.rowErrors.length;

  // Determine starting position for new cards
  const { data: existingCards } = await adminClient
    .from("cards").select("position").eq("lesson_id", lesson_id)
    .order("position", { ascending: false }).limit(1);
  let nextPosition = (existingCards?.[0]?.position ?? -1) + 1;

  let imported = 0;
  let updated  = 0;
  let skipped  = 0;

  for (const card of validation.validRows) {
    // Check for media files (BE-only validation)
    const mediaErrors = await resolveMedia(adminClient, card.mediaFilenames);
    if (mediaErrors.length > 0) {
      validation.rowErrors.push({
        row:      0,
        cardId:   card.id ?? card.extId ?? "",
        question: card.question,
        errors:   mediaErrors.map(filename => ({
          fieldName:  "Media",
          fieldValue: filename,
          errorType:  { key: "MEDIA_NOT_FOUND", label: "Media file not found in storage", toString: () => "MEDIA_NOT_FOUND", toJSON: () => "MEDIA_NOT_FOUND" },
        })),
      });
      continue;
    }

    // Resolve the card ID: explicit UUID > ext_id lookup
    let resolvedId: string | null = card.id ?? null;

    if (!resolvedId && card.extId) {
      const { data: existing } = await adminClient
        .from("cards").select("id").eq("ext_id", card.extId).eq("lesson_id", lesson_id).maybeSingle();
      if (existing) resolvedId = existing.id;
    }

    // Without the "Update existing cards" checkbox, skip any row that matches an existing card
    if (resolvedId && !updateByExtId) {
      skipped++;
      continue;
    }

    if (resolvedId) {
      // Update existing card
      const { error: updateError } = await adminClient
        .from("cards")
        .update({ question: card.question, card_type: card.cardType, tip: card.tip ?? null, updated_at: new Date().toISOString() })
        .eq("id", resolvedId);

      if (updateError) {
        validation.rowErrors.push({ row: 0, cardId: resolvedId, question: card.question,
          errors: [{ fieldName: "card", fieldValue: "", errorType: { key: "INVALID_DATA", label: updateError.message, toString: () => "INVALID_DATA", toJSON: () => "INVALID_DATA" } }] });
        continue;
      }

      // Replace answers
      await adminClient.from("card_answers").delete().eq("card_id", resolvedId);
      await insertAnswers(adminClient, resolvedId, card);
      updated++;
    } else {
      // Insert new card
      const { data: newCard, error: insertError } = await adminClient
        .from("cards")
        .insert({ lesson_id, ext_id: card.extId ?? null, question: card.question, card_type: card.cardType, tip: card.tip ?? null, position: nextPosition++ })
        .select("id").single();

      if (insertError || !newCard) {
        validation.rowErrors.push({ row: 0, cardId: card.extId ?? "", question: card.question,
          errors: [{ fieldName: "card", fieldValue: "", errorType: { key: "INVALID_DATA", label: insertError?.message ?? "Insert failed", toString: () => "INVALID_DATA", toJSON: () => "INVALID_DATA" } }] });
        continue;
      }

      await insertAnswers(adminClient, newCard.id, card);
      imported++;
    }
  }

  const totalErrors = validation.rowErrors.length;
  const status =
    imported === 0 && updated === 0 && totalErrors > 0 && skipped === 0 ? "error" :
    totalErrors > 0 ? "partial_success" :
    "success";

  return json({
    status,
    imported,
    updated,
    skipped,
    errors: totalErrors,
    row_errors: validation.rowErrors.map(e => ({
      row:      e.row,
      card_id:  e.cardId,
      question: e.question,
      errors:   e.errors.map(fe => ({ field: fe.fieldName, message: fe.errorType.label })),
    })),
  });
});

// ── Helpers ────────────────────────────────────────────────────

// deno-lint-ignore no-explicit-any
async function insertAnswers(adminClient: any, cardId: string, card: CsvMappedCard) {
  if (card.mediaFilenames.length > 0) {
    // Look up media IDs by filename
    const { data: mediaRows } = await adminClient
      .from("media").select("id, path").in("path", card.mediaFilenames.map(f => `%${f}`));
    const mediaByFilename = new Map(
      // deno-lint-ignore no-explicit-any
      (mediaRows ?? []).map((m: any) => [m.path.split("/").pop(), m.id])
    );
    const answers = card.mediaFilenames.map((filename, idx) => ({
      card_id:    cardId,
      media_id:   mediaByFilename.get(filename) ?? null,
      is_correct: true,
      position:   idx,
    }));
    if (answers.length > 0) await adminClient.from("card_answers").insert(answers);
  } else if (card.textAnswers.length > 0) {
    const answers = card.textAnswers.map((text, idx) => ({
      card_id:     cardId,
      answer_text: text,
      is_correct:  true,
      position:    idx,
    }));
    await adminClient.from("card_answers").insert(answers);
  }
}

// deno-lint-ignore no-explicit-any
async function resolveMedia(adminClient: any, filenames: string[]): Promise<string[]> {
  if (filenames.length === 0) return [];
  // Check each filename exists in the media table
  const notFound: string[] = [];
  for (const filename of filenames) {
    const { data } = await adminClient
      .from("media").select("id").ilike("path", `%${filename}`).limit(1);
    if (!data || data.length === 0) notFound.push(filename);
  }
  return notFound;
}

function json(data: unknown) {
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}
