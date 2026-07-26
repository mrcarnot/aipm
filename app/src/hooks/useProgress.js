import { useEffect, useState } from "react";

function storageKey(namespace, domainId) {
  return `${namespace}:${domainId}`;
}

export function useProgress(domainId, namespace = "tree") {
  const [done, setDone] = useState(() => {
    const raw = localStorage.getItem(storageKey(namespace, domainId));
    return new Set(raw ? JSON.parse(raw) : []);
  });

  useEffect(() => {
    localStorage.setItem(storageKey(namespace, domainId), JSON.stringify([...done]));
  }, [done, domainId, namespace]);

  function markDone(nodeId) {
    setDone(prev => new Set(prev).add(nodeId));
  }

  function toggleDone(nodeId) {
    setDone(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }

  function isDone(nodeId) {
    return done.has(nodeId);
  }

  return { done, markDone, toggleDone, isDone };
}

// Walks a tree once to collect every leaf id — used to compute "3 of 12 done".
export function collectLeafIds(node, acc = []) {
  if (node.leaf) acc.push(node.id);
  (node.children || []).forEach(child => collectLeafIds(child, acc));
  return acc;
}
