# Roadmap content schema — v1

Separate from the concept tree schema (`SCHEMA.md`), since a roadmap is
about building the project, not learning concepts. One JSON file per
domain, describing a day-by-day task list.

## File shape

```json
{
  "domainId": "cpp-banking",
  "domainLabel": "C++ (banking app example)",
  "totalDays": 7,
  "days": [
    {
      "day": 0,
      "title": "Plan & setup",
      "tasks": [
        {
          "id": "d0-t1",
          "label": "Define your core features: deposit, withdraw, balance check",
          "hint": "Placeholder — guidance shown if the student is stuck on this task."
        }
      ]
    }
  ]
}
```

| Field         | Type    | Notes                                                                                  |
|---------------|---------|------------------------------------------------------------------------------------------|
| `domainId`    | string  | Should match the concept tree domain's `domainId` so progress/navigation line up.        |
| `totalDays`   | number  | Just a display convenience — `days.length` is the source of truth.                       |
| `days[].day`  | number  | Starts at 0, like the doc's Duolingo-style Day 0 circle.                                 |
| `tasks[].id`  | string  | Unique across the whole file (not just within the day) — this is the done-tracking key.  |
| `tasks[].hint`| string  | Placeholder for now. Stage 4 replaces this with a real inline answer to "I'm stuck here." |

## Rules carried over from the tree schema

- IDs are permanent once students can check tasks off.
- Same free/no-LLM approach: hand-author the task list now, wire in AI guidance later.
- No `resources` field here — tasks are about doing, not learning, so they point back to
  the concept tree's leaf nodes for that (a task can mention a topic by name; it doesn't
  need a formal link between the two files yet).
