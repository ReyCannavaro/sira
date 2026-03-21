import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import QuestEditorClient from "./QuestEditorClient";

interface Props {
  params: Promise<{ region: string; quest: string }>;
}

export default async function QuestPage({ params }: Props) {
  const { region, quest: questSlug } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: regionData } = await supabase
    .from("regions")
    .select("id, name, accent_color, slug")
    .eq("slug", region)
    .single();
  if (!regionData) notFound();

  const { data: questData } = await supabase
    .from("quests")
    .select("id, slug, title, story_intro, instructions, language, starter_code, expected_output, test_cases, hints, difficulty, exp_reward, order_index, prerequisite_quest_id")
    .eq("region_id", regionData.id)
    .eq("slug", questSlug)
    .eq("is_active", true)
    .single();
  if (!questData) notFound();

  if (questData.prerequisite_quest_id) {
    const { data: prereqAttempt } = await supabase
      .from("quest_attempts")
      .select("id")
      .eq("user_id", user.id)
      .eq("quest_id", questData.prerequisite_quest_id)
      .in("status", ["passed_clean", "passed_dirty"])
      .limit(1)
      .single();
    if (!prereqAttempt) notFound();
  }

  const { data: lastAttempt } = await supabase
    .from("quest_attempts")
    .select("submitted_code, status, exp_earned, correctness_score, efficiency_score, socratic_feedback")
    .eq("user_id", user.id)
    .eq("quest_id", questData.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const { count: passedCount } = await supabase
    .from("quest_attempts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("quest_id", questData.id)
    .in("status", ["passed_clean", "passed_dirty"]);

  const isFirstPass = (passedCount ?? 0) === 0;

  return (
    <QuestEditorClient
      quest={questData}
      region={{ slug: regionData.slug, name: regionData.name, color: regionData.accent_color }}
      lastAttempt={lastAttempt ?? null}
      isFirstPass={isFirstPass}
      userId={user.id}
    />
  );
}