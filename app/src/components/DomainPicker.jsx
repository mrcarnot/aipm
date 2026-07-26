import { useState } from "react";
import { domains } from "../data/domains.js";
import { collectLeafIds } from "../hooks/useProgress.js";

function domainProgress(domain) {
  const leafIds = collectLeafIds(domain.tree);
  const raw = localStorage.getItem(`tree:${domain.domainId}`);
  const done = new Set(raw ? JSON.parse(raw) : []);
  return { doneCount: leafIds.filter(id => done.has(id)).length, total: leafIds.length };
}

// Free, no-LLM stand-in for real intent understanding. Each authored domain
// gets a short list of keywords a typed idea might contain. This only ever
// matches what we've actually authored (src/data/*.json) — it can't handle
// an arbitrary idea the way the real clarifying-question flow eventually
// will. Add a line here whenever you author a new domain.
const KEYWORDS = {
  "cpp-banking": ["c++", "cpp", "bank", "banking"],
  "web-development": ["web", "website", "frontend", "front-end", "backend", "back-end", "react", "next.js", "node"],
  "machine-learning": ["machine learning", "ml", "model", "neural", "classification", "regression", "dataset"]
};

function matchDomain(query) {
  const q = query.toLowerCase().trim();
  if (!q) return null;
  return domains.find(d => (KEYWORDS[d.domainId] || []).some(k => q.includes(k))) || null;
}

export default function DomainPicker({ onSelectTree, onSelectRoadmap, onStartWizard, hasRoadmap }) {
  const [query, setQuery] = useState("");
  const [noMatch, setNoMatch] = useState(false);

  function handleAsk() {
    const match = matchDomain(query);
    if (match) {
      setNoMatch(false);
      onStartWizard(match.domainId);
    } else {
      setNoMatch(true);
    }
  }

  return (
    <div className="picker">
      <h1>What are you building today?</h1>
      <p className="subtitle">Enter the details of the project you want help with.</p>

      <div className="ask-bar">
        <input
          type="text"
          placeholder="e.g. I want to build a banking app in C++..."
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            if (noMatch) setNoMatch(false);
          }}
          onKeyDown={e => e.key === "Enter" && handleAsk()}
        />
        <button onClick={handleAsk}>Ask &#8594;</button>
      </div>
      {noMatch && (
        <p className="ask-hint">
          We don't have a matching tree for that yet — pick the closest topic below
          instead. (This stage matches on keywords only; free-form understanding of
          any idea comes with the real clarifying-question flow later on.)
        </p>
      )}

      <p className="explore-label">EXPLORE TOPICS</p>
      <div className="picker-grid">
        {domains.map(domain => {
          const { doneCount, total } = domainProgress(domain);
          const roadmapAvailable = hasRoadmap(domain.domainId);
          return (
            <div key={domain.domainId} className="picker-card">
              <span className="picker-card-title">{domain.domainLabel}</span>
              <span className="picker-card-desc">{domain.description}</span>
              <span className="picker-card-progress">
                {doneCount} of {total} topics done
              </span>
              <div className="picker-card-actions">
                <button className="picker-card-btn" onClick={() => onSelectTree(domain.domainId)}>
                  Learn
                </button>
                <button
                  className="picker-card-btn"
                  disabled={!roadmapAvailable}
                  title={roadmapAvailable ? "" : "Roadmap coming soon for this domain"}
                  onClick={() => roadmapAvailable && onSelectRoadmap(domain.domainId)}
                >
                  Build
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
