import { useState } from "react";

export default function TreeNode({ node, depth, isDoneFn, onLeafClick, index }) {
  const [open, setOpen] = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  const done = node.leaf && isDoneFn(node.id);

  return (
    <li
      className={"tree-node" + (node.advanced ? " advanced-node" : "")}
      style={{ "--stagger": index }}
    >
      <div
        className={"node-row" + (done ? " done" : "")}
        onClick={() => (hasChildren ? setOpen(o => !o) : onLeafClick(node))}
      >
        {hasChildren ? (
          <span className={"caret" + (open ? " open" : "")}>&#8250;</span>
        ) : (
          <span className="dot" />
        )}
        <span className="node-label">{node.label}</span>
        {node.advanced && <span className="badge">advanced</span>}
      </div>

      {hasChildren && (
        <ul className={"tree-children" + (open ? " open" : "")}>
          {node.children.map((child, i) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              isDoneFn={isDoneFn}
              onLeafClick={onLeafClick}
              index={i}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
