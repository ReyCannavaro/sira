import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ok, badRequest, unauthorized, serverError } from "@/lib/api/response";

/* ─── Clean Code Score (tanpa AST execution) ─────────────────────────────── */
function calcCleanCodeScore(code: string): number {
  let score = 100;
  const lines = code.split("\n").filter(l => l.trim().length > 0);

  if (lines.length > 30) score -= 20;
  else if (lines.length > 20) score -= 10;

  // Nama variabel terlalu pendek
  const shortVarMatches = code.match(/\b(?:let|var|const)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g) ?? [];
  const allowed = new Set(["i", "j", "k", "n", "x", "y", "a", "b"]);
  let badVarCount = 0;
  for (const m of shortVarMatches) {
    const parts = m.split(/\s+/);
    const name  = parts[parts.length - 1];
    if (name && name.length <= 2 && !allowed.has(name)) badVarCount++;
  }
  score -= badVarCount * 10;

  // Nesting depth
  let maxDepth = 0, depth = 0;
  for (const ch of code) {
    if (ch === "{") { depth++; if (depth > maxDepth) maxDepth = depth; }
    if (ch === "}") depth = Math.max(0, depth - 1);
  }
  if (maxDepth > 4) score -= 20;
  else if (maxDepth > 3) score -= 10;

  return Math.max(0, Math.min(100, score));
}

/* ─── Socratic feedback ───────────────────────────────────────────────────── */
function buildFeedback(
  status: string,
  actualOutput: string,
  expectedOutput: string,
  cleanScore: number,
  language: string
): string {
  if (status === "syntax_error") {
    return language === "python"
      ? "Ada kesalahan sintaks. Di Python, indentasi sangat penting — pastikan setiap blok kode diindentasi dengan benar."
      : "Ada bagian kode yang tidak bisa dibaca mesin. Periksa apakah semua kurung kurawal {} dan tanda kurung () sudah berpasangan.";
  }
  if (status === "logic_error") {
    const trimmed = actualOutput?.trim();
    if (!trimmed) {
      return "Kode berjalan tapi tidak menghasilkan output. Pastikan kamu sudah mencetak hasilnya — apakah ada console.log() yang terlewat?";
    }
    return `Output kamu adalah "${trimmed}", tapi seharusnya "${expectedOutput.trim()}". Coba trace kodemu baris per baris — di mana nilainya mulai berbeda?`;
  }
  if (status === "passed_dirty") {
    return "Quest selesai! Tapi ada ruang untuk kode yang lebih bersih. Perhatikan penamaan variabel dan kedalaman nesting. Kode yang bersih lebih mudah di-debug.";
  }
  if (status === "passed_clean") {
    return "Luar biasa! Kode kamu bersih, logikanya tepat, dan outputnya benar. Wilayah berikutnya menantimu.";
  }
  return "";
}

/* ─── POST /api/quests/submit ─────────────────────────────────────────────── */
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  let body: {
    quest_id:         string;
    submitted_code:   string;
    hints_used_count: number;
    duration_sec:     number;
    language:         string;
    expected_output:  string;
    actual_output:    string;   // ← client sudah jalankan kode, kirim hasilnya
    had_syntax_error: boolean;  // ← client tahu ada syntax error
    test_cases:       { input: string; expected_output: string }[];
  };

  try {
    body = await request.json();
  } catch {
    return badRequest("Body tidak valid");
  }

  const {
    quest_id, submitted_code, hints_used_count, duration_sec,
    language, expected_output, actual_output, had_syntax_error, test_cases,
  } = body;

  if (!quest_id || submitted_code === undefined) {
    return badRequest("quest_id dan submitted_code wajib diisi");
  }

  /* ── Cek first pass ── */
  const { count: passedCount } = await supabase
    .from("quest_attempts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("quest_id", quest_id)
    .in("status", ["passed_clean", "passed_dirty"]);
  const isFirstPass = (passedCount ?? 0) === 0;

  /* ── Tentukan status dari hasil eksekusi client ── */
  // Normalize teks biasa (JS output)
  const normalize = (s: string) =>
    (s ?? "").trim().replace(/\r\n/g, "\n").replace(/[ \t]+$/gm, "");

  // Normalize HTML: hapus whitespace berlebih, lowercase, hapus atribut whitespace
  const normalizeHTML = (s: string) =>
    (s ?? "").trim()
      .replace(/\r\n|\n|\r/g, "")
      .replace(/\s{2,}/g, " ")
      .replace(/> </g, "><")
      .replace(/ >/g, ">")
      .toLowerCase();

  // Ekstrak konten dalam <body> jika ada, fallback ke seluruh string
  const extractBody = (s: string): string => {
    const lower = s.toLowerCase();
    const start = lower.indexOf("<body");
    const end   = lower.lastIndexOf("</body>");
    if (start !== -1 && end !== -1) {
      // ambil konten dalam body tag (skip tag <body ...> itu sendiri)
      const bodyTagEnd = s.indexOf(">", start);
      return s.slice(bodyTagEnd + 1, end).trim();
    }
    return s;
  };

  // Deteksi HTML quest: expected dimulai dengan tag HTML atau tag heading/block
  const htmlTags = ["<!doctype", "<html", "<h1", "<h2", "<h3", "<h4", "<h5", "<h6", "<p", "<div", "<ul", "<ol", "<table", "<form", "<header", "<nav", "<main", "<section", "<article", "<footer"];
  const expectedTrimmed = expected_output?.trim().toLowerCase() ?? "";
  const isHTMLQuest = htmlTags.some(tag => expectedTrimmed.startsWith(tag));

  let attemptStatus: "syntax_error" | "logic_error" | "passed_dirty" | "passed_clean";

  if (had_syntax_error) {
    attemptStatus = "syntax_error";
  } else {
    const outputStr = actual_output ?? "";
    let allPassed   = false;

    if (isHTMLQuest) {
      const submittedBody  = normalizeHTML(extractBody(outputStr));
      const expectedNorm   = normalizeHTML(expected_output);
      const submittedFull  = normalizeHTML(outputStr);
      allPassed = submittedBody === expectedNorm || submittedFull === expectedNorm;
    } else if (test_cases && test_cases.length > 0) {
      allPassed = test_cases.every(tc =>
        normalize(outputStr) === normalize(tc.expected_output)
      );
    } else {
      allPassed = normalize(outputStr) === normalize(expected_output);
    }

    if (allPassed) {
      const cleanScore  = calcCleanCodeScore(submitted_code);
      attemptStatus = cleanScore >= 80 ? "passed_clean" : "passed_dirty";
    } else {
      attemptStatus = "logic_error";
    }
  }

  const cleanCodeScore = calcCleanCodeScore(submitted_code);
  const socraticText   = buildFeedback(
    attemptStatus, actual_output ?? "", expected_output, cleanCodeScore, language
  );

  const { data: questRow } = await supabase
    .from("quests")
    .select("exp_reward")
    .eq("id", quest_id)
    .single();
  const baseReward = questRow?.exp_reward ?? 100;

  const passed = attemptStatus === "passed_clean" || attemptStatus === "passed_dirty";
  let expEarned = 0;
  if (passed) {
    if (isFirstPass) {
      expEarned = hints_used_count === 0 ? baseReward * 2 : baseReward;
    }
    if (cleanCodeScore >= 80) expEarned += 25;
  }

  const { data: attempt, error: insertError } = await supabase
    .from("quest_attempts")
    .insert({
      user_id:              user.id,
      quest_id,
      submitted_code,
      status:               attemptStatus,
      correctness_score:    passed ? 100 : 0,
      efficiency_score:     cleanCodeScore,
      speed_score:          Math.max(0, 100 - Math.floor((duration_sec ?? 0) / 60) * 5),
      final_score:          passed ? Math.round((100 + cleanCodeScore) / 2) : 0,
      exp_earned:           expEarned,
      hints_used_count:     hints_used_count ?? 0,
      is_first_pass:        isFirstPass && passed,
      execution_output:     actual_output ?? "",
      socratic_feedback:    socraticText,
      attempt_duration_sec: duration_sec ?? 0,
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("insert attempt:", insertError);
    return serverError("Gagal menyimpan attempt.");
  }

  if (passed && expEarned > 0) {
    const { data: stats } = await supabase
      .from("user_stats")
      .select("total_exp, weekly_exp, quests_completed, clean_code_avg, hints_used_total")
      .eq("user_id", user.id)
      .single();

    if (stats) {
      const newTotal     = (stats.total_exp ?? 0) + expEarned;
      const newLevel     = Math.floor(1 + Math.sqrt(newTotal / 500));
      const newCompleted = isFirstPass ? (stats.quests_completed ?? 0) + 1 : (stats.quests_completed ?? 0);
      const n            = Math.max(newCompleted, 1);
      const newAvg       = (((stats.clean_code_avg ?? 0) * (n - 1)) + cleanCodeScore) / n;

      await supabase.from("user_stats").update({
        total_exp:        newTotal,
        current_level:    newLevel,
        weekly_exp:       (stats.weekly_exp ?? 0) + expEarned,
        quests_completed: newCompleted,
        clean_code_avg:   Math.round(newAvg * 100) / 100,
        hints_used_total: (stats.hints_used_total ?? 0) + (hints_used_count ?? 0),
        last_active_date: new Date().toISOString().split("T")[0],
      }).eq("user_id", user.id);
    }
  }

  return ok({
    attempt_id:        attempt?.id,
    status:            attemptStatus,
    execution_output:  actual_output ?? "",
    socratic_feedback: socraticText,
    clean_code_score:  cleanCodeScore,
    exp_earned:        expEarned,
    is_first_pass:     isFirstPass && passed,
  });
}