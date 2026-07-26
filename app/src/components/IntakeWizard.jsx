import { useState } from "react";
import { domains } from "../data/domains.js";

// Fixed, pre-authored questions — no live LLM. This covers what your doc
// calls "the questions asked every time." Free-form understanding of an
// arbitrary idea (rather than matching one of our authored domains) is a
// later, AI-backed version of this same screen.
const STEPS = ["confirm", "comfort", "days", "depth", "summary"];

export default function IntakeWizard({ domainId, onAbort, onFinish }) {
  const domain = domains.find(d => d.domainId === domainId);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState({ comfort: null, days: null, depth: null });

  const step = STEPS[stepIndex];

  function next(patch) {
    if (patch) setAnswers(a => ({ ...a, ...patch }));
    setStepIndex(i => i + 1);
  }

  if (!domain) return null;

  return (
    <div className="wizard">
      <button className="back-btn" onClick={onAbort}>
        &#8249; Start over
      </button>

      {step === "confirm" && (
        <WizardStep
          title="Just confirming"
          question={`We think you're building: "${domain.tree.label}." Does that match what you had in mind?`}
          options={[
            { label: "Yes, that's right", action: () => next() },
            { label: "Not quite — let me pick manually", action: onAbort }
          ]}
        />
      )}

      {step === "comfort" && (
        <WizardStep
          title="Tech stack"
          question={`How comfortable are you with ${domain.domainLabel} already?`}
          options={[
            { label: "Comfortable — I know this stack", action: () => next({ comfort: "comfortable" }) },
            { label: "I want to learn it", action: () => next({ comfort: "learning" }) },
            { label: "Not sure yet", action: () => next({ comfort: "unsure" }) }
          ]}
        />
      )}

      {step === "days" && (
        <WizardStep
          title="Timeframe"
          question="How many days do you have to build this?"
          options={[
            { label: "~3 days", action: () => next({ days: 3 }) },
            { label: "~7 days", action: () => next({ days: 7 }) },
            { label: "~14 days", action: () => next({ days: 14 }) }
          ]}
          note="Note: only a 7-day roadmap is authored right now — whatever you pick, the roadmap screen currently shows that same 7-day plan until day-count-specific versions exist."
        />
      )}

      {step === "depth" && (
        <WizardStep
          title="Depth"
          question="Want to see advanced topics right away, or start with the basics?"
          options={[
            { label: "Just the basics for now", action: () => next({ depth: "beginner" }) },
            { label: "Show advanced topics too", action: () => next({ depth: "advanced" }) }
          ]}
        />
      )}

      {step === "summary" && (
        <div className="wizard-card">
          <h2>Here's what we've got</h2>
          <ul className="wizard-summary">
            <li>Domain: {domain.domainLabel}</li>
            <li>
              Comfort level:{" "}
              {answers.comfort === "comfortable"
                ? "already comfortable with the stack"
                : answers.comfort === "learning"
                ? "wants to learn the stack"
                : "not sure yet"}
            </li>
            <li>Timeframe: ~{answers.days} days</li>
            <li>{answers.depth === "advanced" ? "Showing advanced topics" : "Starting with the basics"}</li>
          </ul>
          <div className="wizard-final-actions">
            <button
              className="wizard-final-btn primary"
              onClick={() => onFinish(domainId, { screen: "tree", showAdvanced: answers.depth === "advanced" })}
            >
              Start learning
            </button>
            <button
              className="wizard-final-btn"
              onClick={() => onFinish(domainId, { screen: "roadmap" })}
            >
              Jump to roadmap
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function WizardStep({ title, question, options, note }) {
  return (
    <div className="wizard-card">
      <p className="wizard-step-label">{title}</p>
      <h2>{question}</h2>
      <div className="wizard-options">
        {options.map(opt => (
          <button key={opt.label} className="wizard-option" onClick={opt.action}>
            {opt.label}
          </button>
        ))}
      </div>
      {note && <p className="wizard-note">{note}</p>}
    </div>
  );
}
