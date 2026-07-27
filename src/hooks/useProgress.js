import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";
import { useAuth } from "./useAuth.jsx";

export function useProgress(progressKey, namespace = "tree") {
  const { session } = useAuth();
  const userId = session?.user?.id;

  const [done, setDone] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !progressKey) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);

    supabase
      .from("progress")
      .select("done_ids")
      .eq("user_id", userId)
      .eq("namespace", namespace)
      .eq("progress_key", progressKey)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.error("Failed to load progress:", error);
        setDone(new Set(data?.done_ids || []));
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, progressKey, namespace]);

  async function persist(nextSet) {
    setDone(nextSet);
    if (!userId || !progressKey) return;
    const { error } = await supabase.from("progress").upsert(
      {
        user_id: userId,
        namespace,
        progress_key: progressKey,
        done_ids: [...nextSet]
      },
      { onConflict: "user_id,namespace,progress_key" }
    );
    if (error) console.error("Failed to save progress:", error);
  }

  function markDone(nodeId) {
    persist(new Set(done).add(nodeId));
  }

  function toggleDone(nodeId) {
    const next = new Set(done);
    if (next.has(nodeId)) next.delete(nodeId);
    else next.add(nodeId);
    persist(next);
  }

  function isDone(nodeId) {
    return done.has(nodeId);
  }

  return { done, markDone, toggleDone, isDone, loading };
}

// Walks a tree once to collect every leaf id — used to compute "3 of 12 done".
export function collectLeafIds(node, acc = []) {
  if (node.leaf) acc.push(node.id);
  (node.children || []).forEach(child => collectLeafIds(child, acc));
  return acc;
}
