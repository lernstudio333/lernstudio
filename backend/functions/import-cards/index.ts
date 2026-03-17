import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import Papa from "npm:papaparse@5";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const VALID_CARD_TYPES = ["SC", "MC", "SYN", "GAP", "IMG-SC", "IMG-MC"];

// Tokens that are qualifiers/suffixes in the legacy mode string, not mode names.
// e.g. "MULTIAW-AUTO" → strip "AUTO" → token is "MULTIAW"
const QUALIFIER_TOKENS = new Set(["AUTO", "AUTO_BW", "BW"]);

// Lookup table: legacy CSV mode token → DB card_modes.mode enum value.
// TODO: extend this table in the next step once full token analysis is done.
const MODE_LOOKUP: Record<string, string> = {
  MULTIAW: "MULTIPLEANSWERS",
  MULTIPLECARDS: "MULTIPLECARDS",
  MULTIPLECARDS_BW: "MULTIPLECARDS_BW",
  SHOW: "SHOW",
  SORTPARTS: "SORTPARTS",
  SORTPARTS_BW: "SORTPARTS_BW",
  SELFASSES: "SELFASSES",
  SELFASSES_BW: "SELFASSES_BW",
  TYPE: "TYPE",
  TYPE_BW: "TYPE_BW",
  ALIKES: "ALIKES",
  MULTIPLEANSWERS: "MULTIPLEANSWERS",
};

interface ParsedModes {
  mapped: string[];
  unknown: string[];
}

function parseModes(modeString: string): ParsedModes {
  const tokens = modeString.split("-").filter((t) => !QUALIFIER_TOKENS.has(t));
  const mapped: string[] = [];
  const unknown: string[] = [];
  for (const token of tokens) {
    const dbMode = MODE_LOOKUP[token];
    if (dbMode) {
      if (!mapped.includes(dbMode)) mapped.push(dbMode);
    } else {
      unknown.push(token);
    }
  }
  return { mapped, unknown };
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  // Verify user JWT
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return jsonError("Missing Authorization header", 401);

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return jsonError("Unauthorized", 401);

  // Check admin or editor role
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || !["admin", "editor"].includes(profile.role ?? "")) {
    return jsonError("Forbidden", 403);
  }

  // Parse multipart form data
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return json({ status: "error", imported: 0, file_errors: [{ type: "parse_error", message: "Failed to parse form data" }] });
  }

  const file = formData.get("file") as File | null;
  const lesson_id = (formData.get("lesson_id") as string | null)?.trim();
  const course_id = (formData.get("course_id") as string | null)?.trim();
  const program_id = (formData.get("program_id") as string | null)?.trim();

  if (!file || !lesson_id || !course_id || !program_id) {
    return json({
      status: "error",
      imported: 0,
      file_errors: [{ type: "missing_field", message: "Missing required fields: file, lesson_id, course_id, program_id" }],
    });
  }

  // Validate hierarchy: lesson → course → program
  const { data: lesson } = await adminClient
    .from("lessons")
    .select("id, course_id")
    .eq("id", lesson_id)
    .single();
  if (!lesson || lesson.course_id !== course_id) {
    return json({
      status: "error",
      imported: 0,
      file_errors: [{ type: "invalid_hierarchy", message: "Lesson does not belong to the specified course" }],
    });
  }

  const { data: course } = await adminClient
    .from("courses")
    .select("id, program_id")
    .eq("id", course_id)
    .single();
  if (!course || course.program_id !== program_id) {
    return json({
      status: "error",
      imported: 0,
      file_errors: [{ type: "invalid_hierarchy", message: "Course does not belong to the specified program" }],
    });
  }

  // Parse CSV
  const csvText = await file.text();
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  // Validate header
  const requiredColumns = ["card ID", "question", "answers", "options"];
  const missingColumns = requiredColumns.filter(
    (col) => !parsed.meta.fields?.includes(col),
  );
  if (missingColumns.length > 0) {
    return json({
      status: "error",
      imported: 0,
      file_errors: missingColumns.map((col) => ({
        type: "missing_column",
        column: col,
        message: `Required column '${col}' is missing`,
      })),
    });
  }

  // Determine starting position for new cards
  const { data: existingCards } = await adminClient
    .from("cards")
    .select("position")
    .eq("lesson_id", lesson_id)
    .order("position", { ascending: false })
    .limit(1);
  let nextPosition = (existingCards?.[0]?.position ?? -1) + 1;

  let imported = 0;
  const row_errors: object[] = [];

  for (let i = 0; i < parsed.data.length; i++) {
    const row = parsed.data[i];
    const rowNum = i + 2; // 1-indexed; row 1 is the header
    const cardId = row["card ID"]?.trim();
    const question = row["question"]?.trim();

    // --- Row validation ---
    if (!cardId) {
      row_errors.push({ row: rowNum, card_id: "", question: question ?? "", field: "card ID", message: "Missing card ID" });
      continue;
    }
    if (!question) {
      row_errors.push({ row: rowNum, card_id: cardId, question: "", field: "question", message: "Missing question" });
      continue;
    }

    let answers: string[];
    try {
      const parsedAnswers = JSON.parse(row["answers"]);
      if (!Array.isArray(parsedAnswers) || !parsedAnswers.every((a: unknown) => typeof a === "string")) {
        throw new Error("Not an array of strings");
      }
      answers = parsedAnswers;
    } catch {
      row_errors.push({ row: rowNum, card_id: cardId, question, field: "answers", message: "Invalid JSON in answers" });
      continue;
    }

    let options: { type?: string; mode?: string };
    try {
      const parsedOptions = JSON.parse(row["options"]);
      if (typeof parsedOptions !== "object" || Array.isArray(parsedOptions)) throw new Error("Not an object");
      options = parsedOptions;
    } catch {
      row_errors.push({ row: rowNum, card_id: cardId, question, field: "options", message: "Invalid JSON in options" });
      continue;
    }

    if (!options.type) {
      row_errors.push({ row: rowNum, card_id: cardId, question, field: "options.type", message: "Missing type in options" });
      continue;
    }
    if (!VALID_CARD_TYPES.includes(options.type)) {
      row_errors.push({ row: rowNum, card_id: cardId, question, field: "options.type", message: `Unknown card type '${options.type}'` });
      continue;
    }
    if (!options.mode) {
      row_errors.push({ row: rowNum, card_id: cardId, question, field: "options.mode", message: "Missing mode in options" });
      continue;
    }

    // --- Insert card ---
    const { data: card, error: cardError } = await adminClient
      .from("cards")
      .insert({
        lesson_id,
        ext_id: cardId,
        question,
        card_type: options.type,
        position: nextPosition++,
      })
      .select("id")
      .single();

    if (cardError || !card) {
      row_errors.push({
        row: rowNum,
        card_id: cardId,
        question,
        field: "card",
        message: cardError?.message ?? "Failed to insert card",
      });
      continue;
    }

    // --- Insert answers ---
    if (answers.length > 0) {
      await adminClient.from("card_answers").insert(
        answers.map((answer_text, idx) => ({
          card_id: card.id,
          answer_text,
          is_correct: true,
          position: idx,
        })),
      );
    }

    // --- Parse and insert modes ---
    const { mapped, unknown } = parseModes(options.mode);

    if (unknown.length > 0) {
      // Warning: unknown tokens in mode string — card is still imported
      row_errors.push({
        row: rowNum,
        card_id: cardId,
        question,
        field: "options.mode",
        message: `Unknown mode token(s): ${unknown.join(", ")}`,
        warning: true,
      });
    }

    for (const mode of mapped) {
      await adminClient.from("card_modes").insert({
        card_id: card.id,
        mode,
        value: 1,
        min_score: 0,
      });
    }

    imported++;
  }

  const hasErrors = row_errors.some((e: object) => !("warning" in e && (e as { warning?: boolean }).warning));
  const status = imported === 0 && hasErrors
    ? "error"
    : row_errors.length === 0
    ? "success"
    : "partial_success";

  return json({ status, imported, row_errors });
});

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
