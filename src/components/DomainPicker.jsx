import { useEffect, useState } from "react";
import { domains } from "../data/domains.js";
import { collectLeafIds } from "../hooks/useProgress.js";
import { loadProjects } from "../data/projects.js";
import { supabase } from "../lib/supabaseClient.js";
import { useAuth } from "../hooks/useAuth.jsx";

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
  const { session, signOut } = useAuth();
  const userId = session?.user?.id;

  const [query, setQuery] = useState("");
  const [noMatch, setNoMatch] = useState(false);
  const [projects, setProjects] = useState([]);
  const [progressByKey, setProgressByKey] = useState({}); // progress_key -> done_ids array
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      const [projectRows, { data: progressRows, error }] = await Promise.all([
        loadProjects(userId),
        supabase.from("progress").select("progress_key, done_ids").eq("user_id", userId).eq("namespace", "tree")
      ]);
      if (cancelled) return;
      if (error) console.error("Failed to load progress:", error);

      const map = {};
      (progressRows || []).forEach(row => {
        map[row.progress_key] = row.done_ids || [];
      });

      setProjects(projectRows);
      setProgressByKey(map);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  function progressFor(key, leafIds) {
    const doneIds = progressByKey[key] || [];
    return { doneCount: leafIds.filter(id => doneIds.includes(id)).length, total: leafIds.length };
  }

  function handleAsk() {
    const match = matchDomain(query);
    if (match) {
      setNoMatch(false);
      onStartWizard(match.domainId, query);
    } else {
      setNoMatch(true);
    }
  }

  return (
    <div className="picker">
      <div className="picker-header-row">
        <div />
        <button className="sign-out-btn" onClick={signOut}>
          Sign out
        </button>
      </div>

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

      {loading && <p className="subtitle">Loading your projects…</p>}

      {!loading && projects.length > 0 && (
        <>
          <p className="explore-label">YOUR PROJECTS</p>
          <div className="picker-grid">
            {projects.map(project => {
              const leafIds = project.tree_json?.tree ? collectLeafIds(project.tree_json.tree) : [];
              const { doneCount, total } = progressFor(project.id, leafIds);
              const roadmapAvailable = Boolean(project.roadmap_json);
              return (
                <div key={project.id} className="picker-card">
                  <span className="picker-card-title">{project.title}</span>
                  <span className="picker-card-desc">{project.tree_json?.description || project.domain_id}</span>
                  <span className="picker-card-progress">
                    {doneCount} of {total} topics done
                  </span>
                  <div className="picker-card-actions">
                    <button
                      className="picker-card-btn"
                      onClick={() => onSelectTree(project.domain_id, project.id, project.title, project.tree_json)}
                    >
                      Learn
                    </button>
                    <button
                      className="picker-card-btn"
                      disabled={!roadmapAvailable}
                      title={roadmapAvailable ? "" : "This project's roadmap isn't available"}
                      onClick={() =>
                        roadmapAvailable &&
                        onSelectRoadmap(project.domain_id, project.id, project.title, project.roadmap_json)
                      }
                    >
                      Build
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <p className="explore-label">EXPLORE TOPICS</p>
      <div className="picker-grid">
        {domains.map(domain => {
          const leafIds = collectLeafIds(domain.tree);
          const { doneCount, total } = progressFor(domain.domainId, leafIds);
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
