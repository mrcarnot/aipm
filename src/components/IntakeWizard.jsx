import { useEffect, useState } from "react";
import { domains } from "../data/domains.js";
import { supabase } from "../lib/supabaseClient.js";
import { generateProjectContent } from "../lib/aiWizard.js";
import { collectLeafIds } from "../hooks/useProgress.js";

// Fixed, pre-authored questions — no LLM. This covers what your doc calls
// "the questions asked every time." After these, a "dynamic" phase kicks in
// where an Edge Function (calling Gemini) asks further questions until it
// decides it has a complete picture — matching your doc's "the platform can
// ask more questions based on whether it has a complete picture yet." Once
// that's done, "generating" calls a second Edge Function that builds this
// specific project's own concept tree + roadmap (not one of the shared
// static domains) before landing on the summary.
const STEPS = ["confirm", "comfort", "days", "depth", "dynamic", "generating", "summary"];

// Safety net independent of what the LLM decides — see supabase/functions/
// next-question for why this exists.
const MAX_DYNAMIC_QUESTIONS = 6;

export default function IntakeWizard({ domainId, title, onAbort, onFinish }) {
  const domain = domains.find(d => d.domainId === domainId);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState({ comfort: null, days: null, depth: null });

  const [dynamicQuestion, setDynamicQuestion] = useState(null); // { question, options } | null
  const [dynamicAnswers, setDynamicAnswers] = useState([]); // [{ question, answer }]
  const [freeText, setFreeText] = useState("");
  const [dynamicLoading, setDynamicLoading] = useState(false);
  const [dynamicError, setDynamicError] = useState(false);

  const [generatedContent, setGeneratedContent] = useState(null); // { tree, roadmap } | null
  const [generationError, setGenerationError] = useState(null);
  const [generating, setGenerating] = useState(false);

  const step = STEPS[stepIndex];
  const projectTitle = title?.trim() || domain?.tree.label;

  function next(patch) {
    if (patch) setAnswers(a => ({ ...a, ...patch }));
    setStepIndex(i => i + 1);
  }

  async function fetchNextQuestion(updatedDynamicAnswers) {
    if (updatedDynamicAnswers.length >= MAX_DYNAMIC_QUESTIONS) {
      setStepIndex(STEPS.indexOf("generating"));
      return;
    }
    setDynamicLoading(true);
    setDynamicError(false);
    try {
      const { data, error } = await supabase.functions.invoke("next-question", {
        body: {
          projectTitle,
          domainLabel: domain.domainLabel,
          fixedAnswers: answers,
          dynamicAnswers: updatedDynamicAnswers
        }
      });
      if (error || !data || data.done) {
        setDynamicQuestion(null);
        setStepIndex(STEPS.indexOf("generating"));
      } else {
        setDynamicQuestion({ question: data.question, options: data.options });
      }
    } catch (err) {
      console.error("Dynamic question failed:", err);
      setDynamicError(true);
      setDynamicQuestion(null);
      setStepIndex(STEPS.indexOf("generating"));
    } finally {
      setDynamicLoading(false);
    }
  }

  // Enter the dynamic phase: fetch the first LLM-generated question.
  useEffect(() => {
    if (step === "dynamic" && !dynamicQuestion && !dynamicLoading) {
      fetchNextQuestion(dynamicAnswers);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  function answerDynamicQuestion(answerText) {
    const trimmed = answerText.trim();
    if (!trimmed) return;
    const updated = [...dynamicAnswers, { question: dynamicQuestion.question, answer: trimmed }];
    setDynamicAnswers(updated);
    setDynamicQuestion(null);
    setFreeText("");
    fetchNextQuestion(updated);
  }

  function runGeneration() {
    setGenerating(true);
    setGenerationError(null);
    generateProjectContent({
      projectTitle,
      domainLabel: domain.domainLabel,
      fixedAnswers: answers,
      dynamicQA: dynamicAnswers
    })
      .then(content => {
        setGeneratedContent(content);
        setStepIndex(STEPS.indexOf("summary"));
      })
      .catch(err => {
        console.error("Content generation failed:", err);
        setGenerationError(err.message || "Something went wrong generating your plan.");
      })
      .finally(() => setGenerating(false));
  }

  // Enter the generating phase: build this project's own tree + roadmap.
  useEffect(() => {
    if (step !== "generating" || generatedContent || generating) return;
    runGeneration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  function retryGeneration() {
    runGeneration();
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
          question={`"${projectTitle}" — that's a ${domain.domainLabel} project, right?`}
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
          note="This sets how many days your generated roadmap will have."
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

      {step === "dynamic" && (
        <div className="wizard-card">
          <p className="wizard-step-label">A few more details</p>
          {dynamicLoading && <h2>Thinking of a good question…</h2>}
          {!dynamicLoading && dynamicQuestion && (
            <>
              <h2>{dynamicQuestion.question}</h2>
              <div className="wizard-options">
                {dynamicQuestion.options.map(opt => (
                  <button key={opt} className="wizard-option" onClick={() => answerDynamicQuestion(opt)}>
                    {opt}
                  </button>
                ))}
              </div>
              <div className="wizard-freetext-row">
                <input
                  type="text"
                  placeholder="Or type your own answer..."
                  value={freeText}
                  onChange={e => setFreeText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && answerDynamicQuestion(freeText)}
                />
                <button
                  className="wizard-freetext-submit"
                  disabled={!freeText.trim()}
                  onClick={() => answerDynamicQuestion(freeText)}
                >
                  Send
                </button>
              </div>
            </>
          )}
          {dynamicError && (
            <p className="wizard-note">
              Couldn't reach the question generator — moving on with what we've got so far.
            </p>
          )}
        </div>
      )}

      {step === "generating" && (
        <div className="wizard-card">
          <p className="wizard-step-label">Almost there</p>
          {generationError ? (
            <>
              <h2>Couldn't generate your plan</h2>
              <p className="wizard-note">{generationError}</p>
              <button className="wizard-final-btn primary" onClick={retryGeneration}>
                Try again
              </button>
            </>
          ) : (
            <h2>Building your personalized concept tree and roadmap…</h2>
          )}
        </div>
      )}

      {step === "summary" && generatedContent && (
        <div className="wizard-card">
          <h2>Here's what we've got</h2>
          <ul className="wizard-summary">
            <li>Project: {projectTitle}</li>
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
            {dynamicAnswers.map((qa, i) => (
              <li key={i}>
                {qa.question} — {qa.answer}
              </li>
            ))}
            <li>
              Generated: a custom concept tree ({collectLeafIds(generatedContent.tree.tree).length} topics)
              and a {generatedContent.roadmap.days.length}-day roadmap, tailored to this specific idea.
            </li>
          </ul>
          <div className="wizard-final-actions">
            <button
              className="wizard-final-btn primary"
              onClick={() =>
                onFinish(domainId, projectTitle, answers, dynamicAnswers, generatedContent, {
                  screen: "tree",
                  showAdvanced: answers.depth === "advanced"
                })
              }
            >
              Start learning
            </button>
            <button
              className="wizard-final-btn"
              onClick={() =>
                onFinish(domainId, projectTitle, answers, dynamicAnswers, generatedContent, { screen: "roadmap" })
              }
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
