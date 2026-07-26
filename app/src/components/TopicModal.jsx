import { useState } from "react";

export default function TopicModal({ node, isDone, onMarkDone, onClose }) {
  const [tab, setTab] = useState("resources");

  if (!node) return null;

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>{node.label}</h2>

        <div className="choice-row">
          <button
            className={"choice" + (tab === "resources" ? " active" : "")}
            onClick={() => setTab("resources")}
          >
            Resources
          </button>
          <button
            className={"choice" + (tab === "explain" ? " active" : "")}
            onClick={() => setTab("explain")}
          >
            Explain here
          </button>
        </div>

        <div className="modal-content">
          {tab === "resources" ? (
            node.resources && node.resources.length > 0 ? (
              <ul>
                {node.resources.map((r, i) => (
                  <li key={i}>
                    <a href={r.url} target="_blank" rel="noreferrer">
                      {r.title}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No curated resources yet for {node.label} — placeholder for now.</p>
            )
          ) : (
            <p>{node.explain?.beginner}</p>
          )}
        </div>

        <div className="modal-footer">
          <button className="mark-done-btn" onClick={() => onMarkDone(node.id)}>
            {isDone ? "Marked done ✓" : "Mark as done"}
          </button>
          <button className="close-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
