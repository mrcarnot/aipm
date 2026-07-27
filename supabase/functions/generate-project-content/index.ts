// Supabase Edge Function: generates a full personalized concept tree +
// roadmap for one specific project, based on everything the wizard
// collected. Validated with the same rules as the hand-authored domains
// (see SCHEMA.md / ROADMAP_SCHEMA.md) before being returned.
//
// Deploy the same way as wizard-question: Edge Functions -> Deploy a new
// function -> Via Editor -> paste -> name it "generate-project-content".
// It reuses the same GEMINI_API_KEY secret.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { projectTitle, domainLabel, fixedAnswers, dynamicQA } = await req.json();
    const prompt = buildPrompt(projectTitle, domainLabel, fixedAnswers, dynamicQA || []);

    let parsed = null;
    let errors = ["not attempted"];

    // Try twice — if the model's first JSON output fails our validation
    // rules, give it one more shot before giving up.
    for (let attempt = 0; attempt < 2 && errors.length > 0; attempt++) {
      parsed = await callGemini(prompt);
      errors = validate(parsed);
    }

    if (errors.length > 0) {
      throw new Error("Generated content failed validation after retry: " + errors.join("; "));
    }

    return jsonResponse(parsed);
  } catch (err) {
    console.error("generate-project-content error:", err);
    return new Response(JSON.stringify({ error: String(err?.message || err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});

async function callGemini(prompt) {
  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json", maxOutputTokens: 8192 }
    })
  });
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty response from Gemini");
  return JSON.parse(text);
}

function buildPrompt(projectTitle, domainLabel, fixedAnswers, dynamicQA) {
  const qaText = dynamicQA
    .map((h, i) => `Q${i + 1}: ${h.question}\nA${i + 1}: ${h.answer}`)
    .join("\n");
  const days = fixedAnswers?.days || 7;

  return `Generate a personalized learning plan for a student building this project.

Project idea: "${projectTitle}"
Domain: ${domainLabel}
Tech comfort level: ${fixedAnswers?.comfort}
Timeframe: ~${days} days
Depth preference: ${fixedAnswers?.depth}

Additional detail gathered:
${qaText || "(none)"}

Respond with ONLY a JSON object shaped exactly like this, no other text:

{
  "tree": {
    "domainId": "<a short kebab-case slug for this project>",
    "domainLabel": "${projectTitle}",
    "description": "<one line describing this project>",
    "tree": {
      "id": "root",
      "label": "${projectTitle}",
      "children": [
        {
          "id": "<unique-id>",
          "label": "<concept name>",
          "advanced": false,
          "children": [
            {
              "id": "<unique-id>",
              "label": "<subconcept>",
              "leaf": true,
              "advanced": false,
              "explain": { "beginner": "<2-3 sentence beginner explanation>", "advanced": "<2-3 sentence advanced explanation>" },
              "resources": []
            }
          ]
        }
      ]
    }
  },
  "roadmap": {
    "domainId": "<same slug as above>",
    "domainLabel": "${projectTitle}",
    "totalDays": ${days},
    "days": [
      {
        "day": 0,
        "title": "<day theme>",
        "tasks": [
          { "id": "<unique-id>", "label": "<concrete task>", "hint": "<1-2 sentence hint if stuck>" }
        ]
      }
    ]
  }
}

Rules:
- Every "id" must be unique within its own tree/roadmap.
- Every leaf node in the tree needs both "explain.beginner" and "explain.advanced" text, and an empty "resources": [] array.
- Non-leaf nodes must have at least one child. Leaf nodes must have no children.
- Build 3-4 levels of depth in the tree — around 12-20 leaf topics total, more if depth preference is "advanced".
- The roadmap must have exactly ${days} day entries (day 0 through day ${days - 1}), each with 2-4 tasks.
- Tailor everything to the specific project idea and the answers above — don't produce generic filler.`;
}

// Mirrors the rules in validate.js (stage 1) plus basic roadmap checks —
// same validation philosophy applied to AI output instead of hand-authored
// JSON.
function validate(parsed) {
  const errors = [];
  if (!parsed?.tree?.tree || !parsed?.roadmap?.days) {
    return ["missing tree or roadmap at the top level"];
  }

  const seenIds = new Set();
  function walk(node, path) {
    if (!node.id) errors.push(`${path}: missing id`);
    else if (seenIds.has(node.id)) errors.push(`${path}: duplicate id "${node.id}"`);
    else seenIds.add(node.id);

    if (!node.label) errors.push(`${path}: missing label`);
    const hasChildren = Array.isArray(node.children) && node.children.length > 0;

    if (node.leaf && hasChildren) errors.push(`${path} (${node.id}): leaf with children`);
    if (node.leaf) {
      if (!node.explain?.beginner || !node.explain?.advanced) {
        errors.push(`${path} (${node.id}): leaf missing explain text`);
      }
      if (!Array.isArray(node.resources)) errors.push(`${path} (${node.id}): leaf missing resources array`);
    }
    if (!node.leaf && !hasChildren && node.id !== "root") {
      errors.push(`${path} (${node.id}): branch with no children`);
    }
    (node.children || []).forEach((c, i) => walk(c, `${path} > ${node.label}[${i}]`));
  }
  walk(parsed.tree.tree, parsed.tree.domainId || "tree");

  parsed.roadmap.days.forEach((day, i) => {
    if (typeof day.day !== "number") errors.push(`roadmap day[${i}]: missing day number`);
    if (!Array.isArray(day.tasks) || day.tasks.length === 0) errors.push(`roadmap day[${i}]: no tasks`);
  });

  return errors;
}

function jsonResponse(body) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}
