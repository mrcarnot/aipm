import { supabase } from "./supabaseClient.js";

export async function fetchNextQuestion({ projectTitle, domainLabel, fixedAnswers, dynamicAnswers }) {
  const { data, error } = await supabase.functions.invoke("next-question", {
    body: { projectTitle, domainLabel, fixedAnswers, dynamicAnswers }
  });
  if (error) throw error;
  return data; // { done: true } or { done: false, question, options }
}

export async function generateProjectContent({ projectTitle, domainLabel, fixedAnswers, dynamicQA }) {
  const { data, error } = await supabase.functions.invoke("generate-project-content", {
    body: { projectTitle, domainLabel, fixedAnswers, dynamicQA }
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data; // { tree, roadmap }
}
