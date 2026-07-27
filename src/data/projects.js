import { supabase } from "../lib/supabaseClient.js";

export async function loadProjects(userId) {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Failed to load projects:", error);
    return [];
  }
  return data;
}

// answers: { comfort, days, depth } from the fixed wizard steps
// dynamicAnswers: [{ question, answer }] from the LLM-driven follow-up phase
// treeJson / roadmapJson: the AI-generated content, shaped like SCHEMA.md /
// ROADMAP_SCHEMA.md, generated once at wizard completion and stored here so
// it doesn't need regenerating on every later visit
export async function createProject({
  userId,
  title,
  domainId,
  comfort,
  days,
  depth,
  dynamicAnswers,
  treeJson,
  roadmapJson
}) {
  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: userId,
      title,
      domain_id: domainId,
      comfort,
      days,
      depth,
      dynamic_answers: dynamicAnswers || [],
      tree_json: treeJson,
      roadmap_json: roadmapJson
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}
