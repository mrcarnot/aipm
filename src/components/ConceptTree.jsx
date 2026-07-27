import { useState } from "react";
import TreeNode from "./TreeNode.jsx";
import TopicModal from "./TopicModal.jsx";
import { useProgress, collectLeafIds } from "../hooks/useProgress.js";

export default function ConceptTree({ domain, progressKey, title, initialShowAdvanced = false, onBack }) {
  const { isDone, markDone, loading } = useProgress(progressKey || domain.domainId);
  const [showAdvanced, setShowAdvanced] = useState(initialShowAdvanced);
  const [activeLeaf, setActiveLeaf] = useState(null);

  const leafIds = collectLeafIds(domain.tree);
  const doneCount = leafIds.filter(isDone).length;

  if (loading) {
    return (
      <div className="concept-tree-screen">
        <button className="back-btn" onClick={onBack}>
          &#8249; Back
        </button>
        <p className="subtitle">Loading your progress…</p>
      </div>
    );
  }

  return (
    <div className={"concept-tree-screen" + (showAdvanced ? " show-advanced" : "")}>
      <button className="back-btn" onClick={onBack}>
        &#8249; Back
      </button>

      <header>
        <h1>{title || domain.tree.label}</h1>
        <p className="subtitle">Tap a concept to expand it. Tap a leaf topic to learn it.</p>
      </header>

      <div className="controls">
        <label className="toggle">
          <input
            type="checkbox"
            checked={showAdvanced}
            onChange={e => setShowAdvanced(e.target.checked)}
          />
          Show advanced topics
        </label>
        <span className="progress">
          <b>{doneCount}</b> of <b>{leafIds.length}</b> topics done
        </span>
      </div>

      <ul className="tree">
        {domain.tree.children.map((node, i) => (
          <TreeNode
            key={node.id}
            node={node}
            depth={0}
            isDoneFn={isDone}
            onLeafClick={setActiveLeaf}
            index={i}
          />
        ))}
      </ul>

      <TopicModal
        node={activeLeaf}
        isDone={activeLeaf ? isDone(activeLeaf.id) : false}
        onMarkDone={id => {
          markDone(id);
          setActiveLeaf(null);
        }}
        onClose={() => setActiveLeaf(null)}
      />
    </div>
  );
}
