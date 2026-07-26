# Concept tree + roadmap — stages 2-3

Real React frontend (Vite), reading from stage 1/3 JSON content files —
no backend, no paid services.

## Run it locally

```
npm install
npm run dev
```

Opens at `http://localhost:5173`. Two entry points, matching the two
paths in your original doc:
- **Type an idea in the search bar** ("I want to build a banking app in
  C++...") → goes through the clarifying-question wizard (confirm
  domain, tech comfort, timeframe, depth), then you choose Start
  learning or Jump to roadmap at the end.
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
  components/
    DomainPicker.jsx             landing screen — search bar + category cards
    IntakeWizard.jsx              clarifying-question flow (fixed steps, no LLM)
    ConceptTree.jsx               concept tree screen
    TreeNode.jsx                   recursive expand/collapse node
    TopicModal.jsx                  resources / explain-here modal
    RoadmapScreen.jsx              day-path screen
    DayModal.jsx                    per-day task checklist + "I'm stuck" box
  hooks/
    useProgress.js                localStorage-backed done-tracking,
                                    namespaced ("tree" vs "roadmap") so a
                                    domain's learning progress and build
                                    progress don't collide
  App.jsx                          switches between picker / tree / roadmap
  styles.css
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

- `resources` arrays are empty in every domain file — the modal shows a
  "no curated resources yet" message instead of links.
- `explain` text and task `hint` text are filler copy, not real content.
- "I'm stuck" on a roadmap task shows the task's placeholder `hint`
  instead of a real answer — that's the AI-wiring stage (stage 4), not
  this one.
- Only `cpp-banking` has a roadmap authored. Web Development and
  Machine Learning need their own `*-roadmap.json` before their Build
  button lights up.
- The wizard's questions and domain-matching are fixed/pre-authored,
  not generated from the user's actual words — it can only route to
  one of the domains you've built, and the "3/7/14 days" choice
  doesn't change roadmap content yet since only the 7-day plan exists.
- If the search bar's keyword match fails, there's no wizard fallback
  yet — the user just sees the "no match" hint and picks a card
  manually.
