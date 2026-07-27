// Supabase Edge Function — runs on Deno, not Node. Deploy with:
//   supabase functions deploy next-question
// Requires a secret set first:
//   supabase secrets set GEMINI_API_KEY=your-key-here
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_MODEL = "gemini-2.5-flash-lite"; // highest free-tier daily quota
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

function buildPrompt({ projectTitle, domainLabel, fixedAnswers, dynamicAnswers }) {
  return `You are helping a learning platform ask good clarifying questions about a
student's coding project, so the platform can build the right concept tree and
roadmap for them. Do not assume anything unstated — only ask about things that
would meaningfully change what gets built or taught.

Project idea: "${projectTitle}"
Domain: ${domainLabel}
Fixed intake answers so far: ${JSON.stringify(fixedAnswers)}
Your previous follow-up questions and their answers: ${JSON.stringify(dynamicAnswers)}

Decide: do you now have a complete enough picture of what they want to build
(core features, rough scope, anything unusual about their idea)? If yes,
respond with exactly:
{"done": true}

If not, ask exactly ONE more clarifying question, as multiple choice with 3-4
short options (no free text, no open-ended answers). Respond with exactly:
{"done": false, "question": "...", "options": ["...", "...", "..."]}

Respond with ONLY that JSON object — no other text, no markdown formatting.`;
}

serve(async req => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const prompt = buildPrompt(body);

    const geminiRes = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API error:", errText);
      // Fail safe: if the LLM call fails (rate limit, quota, etc.), tell the
      // wizard we're done rather than blocking the user's whole flow.
      return new Response(JSON.stringify({ done: true, error: "llm_unavailable" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const geminiData = await geminiRes.json();
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = JSON.parse(text);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("next-question error:", err);
    return new Response(JSON.stringify({ done: true, error: String(err) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
