# Concept tree + roadmap — stages 2-5 (Supabase auth + persistence + LLM wizard)

Real React frontend (Vite), content from stage 1/3 JSON files, progress
and projects persisted in Supabase (free tier). The wizard's fixed
questions are now followed by LLM-driven follow-up questions (Gemini,
free tier) via a Supabase Edge Function, until the model decides it
has a complete picture (capped at 6 as a safety net).

## One-time Supabase setup (do this before `npm install`)

1. Create a free project at supabase.com.
2. Settings → API Keys → copy the **Project URL** and the **anon**
   (Legacy tab) or **Publishable** key.
3. SQL Editor → run `supabase-schema.sql`, then also run
   `supabase-schema-update-2.sql` (adds a column for the wizard's
   dynamic Q&A).
4. Copy `.env.example` to `.env` and fill in the two values from step 2:
   ```
   cp .env.example .env
   ```

## One-time Gemini + Edge Function setup

1. Get a free Gemini API key at aistudio.google.com (sign in, "Get API key", no credit card needed).
2. In your Supabase project, go to **Edge Functions** in the left sidebar.
3. Click **Deploy a new function → Via Editor**. Name it `next-question`,
   paste in the contents of `supabase/functions/next-question/index.ts`,
   click Deploy.
4. Repeat for `generate-project-content` using
   `supabase/functions/generate-project-content/index.ts`.
5. Still in the Edge Functions section, find **Manage secrets** (or
   **Secrets**) and add one: `GEMINI_API_KEY` = your key from step 1.
   Both functions share this one secret.

No CLI or Docker install needed — this is all done in the browser.

## Run it locally

```
npm install
npm run dev
```

Opens at `http://localhost:5173`. You'll be asked to sign in with your
email (a magic link is sent — click it, then come back to the tab).
Once signed in, two entry points, matching the two paths in your
original doc:
- **Type an idea in the search bar** ("I want to build a banking app in
  C++...") → goes through the clarifying-question wizard: 4 fixed
  questions (confirm domain, tech comfort, timeframe, depth), then an
  LLM-driven follow-up phase — each question offers quick-pick options
  *and* a free-text box, and keeps going until the model decides it has
  enough (or hits the 6-question safety cap). It then generates a
  personalized concept tree and roadmap for this exact idea (a short
  loading step), and you choose Start learning or Jump to roadmap. This
  saves the idea, plus its generated content, as a project under "Your
  Projects" on the home screen.
- **Tap a category card's Learn/Build button** → skips the wizard,
  goes straight to that domain's tree or roadmap. This is the fast
  path for someone who already knows exactly what they want.

## Project layout

```
src/
  data/
    cpp-banking.json           concept tree content (schema in SCHEMA.md)
    web-development.json
    machine-learning.json
    domains.js                  exports all three concept trees
    cpp-banking-roadmap.json    roadmap content (schema in ROADMAP_SCHEMA.md)
    roadmaps.js                  exports the roadmaps map + hasRoadmap()
    projects.js                  Supabase queries for saved "Your Projects" rows
  lib/
    supabaseClient.js            Supabase client, reads from .env
    aiWizard.js                   calls the two AI Edge Functions from the browser
  components/
    DomainPicker.jsx             landing screen — search bar + category cards + Your Projects
    IntakeWizard.jsx              clarifying-question flow (fixed steps, no LLM)
    ConceptTree.jsx               concept tree screen
    TreeNode.jsx                   recursive expand/collapse node
    TopicModal.jsx                  resources / explain-here modal
    RoadmapScreen.jsx              day-path screen
    DayModal.jsx                    per-day task checklist + "I'm stuck" box
    AuthGate.jsx                   magic-link sign-in screen, gates the whole app
  hooks/
    useProgress.js                Supabase-backed done-tracking, namespaced
                                    ("tree" vs "roadmap") so a domain's learning
                                    progress and build progress don't collide
    useAuth.jsx                    session state, sign in/out
  App.jsx                          switches between picker / tree / roadmap
  styles.css
supabase-schema.sql                run once in Supabase's SQL editor
supabase-schema-update-2.sql       run once — adds dynamic_answers,
                                     tree_json, roadmap_json columns
supabase/functions/
  next-question/                    Edge Function: asks the next dynamic
                                      wizard question, or signals "done"
  generate-project-content/         Edge Function: generates one project's
                                      full concept tree + roadmap, validated
                                      the same way as the static domains
```

## Adding a new domain

Concept tree: author JSON following `SCHEMA.md`, validate with
`validate.js`, add it to `src/data/domains.js`.

Roadmap: author JSON following `ROADMAP_SCHEMA.md`, add it to the
`roadmaps` object in `src/data/roadmaps.js` — the Build button unlocks
for that domain automatically once it's there.

## Deploy for free

**Vercel** (recommended, zero config for Vite):
1. Push this folder to a GitHub repo.
2. Go to vercel.com, "Add New Project," import the repo.
3. Vercel auto-detects Vite — accept the defaults, deploy.
4. You get a free `*.vercel.app` URL immediately, and it redeploys
   automatically on every push.

**Netlify** is the same flow if you'd rather use that — import the repo,
build command `npm run build`, publish directory `dist`.

## What's still a placeholder

- `resources` arrays are still empty for **Your Projects** content too —
  the model is instructed to leave them `[]` rather than invent URLs
  that might not be real. The static Explore Topics domains are
  unchanged (still placeholder `explain` text there, since those are
  hand-authored, not AI-generated).
- Only `cpp-banking` (Explore Topics, static) has a hand-authored
  roadmap. Web Development and Machine Learning's *static* Explore
  Topics roadmaps still don't exist — but this no longer matters for
  **Your Projects**, since every AI-generated project now gets its own
  roadmap regardless of domain.
- The wizard's *first 4* questions and the search bar's domain-matching
  are still fixed/keyword-based, not AI — matching to one of the 3
  static domains is just used to confirm/label the project category
  and pick a starting point for the LLM's follow-up questions.
- If the Edge Function or Gemini call fails (rate limit, network,
  quota) during the dynamic-question phase, the wizard moves on to
  generation with whatever it has rather than blocking. If
  content *generation* itself fails, the wizard shows a "Try again"
  button instead of silently failing, since a project can't be created
  without its content.
- Gemini's free tier limits can change without much notice — if
  generation starts failing a lot, check aistudio.google.com for your
  current quota before assuming there's a bug.
- If the search bar's keyword match fails, there's no wizard fallback
  yet — the user just sees the "no match" hint and picks a card
  manually.
- Auth is magic-link only (no password, no Google/GitHub sign-in yet).
- Free Supabase tier limits: projects pause after a week of no API
  activity (a visit or API call un-pauses them, no data lost) and
  there's a monthly active-user cap — both are non-issues at this
  project's size, but worth knowing about if it ever gets real traffic.
- No offline support — every progress checkbox now requires a network
  request to Supabase, unlike the old instant localStorage writes.
