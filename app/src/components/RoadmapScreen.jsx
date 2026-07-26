import { useState } from "react";
import DayModal from "./DayModal.jsx";
import { useProgress } from "../hooks/useProgress.js";

export default function RoadmapScreen({ roadmap, onBack }) {
  const { isDone, toggleDone } = useProgress(roadmap.domainId, "roadmap");
  const [activeDay, setActiveDay] = useState(null);

  function dayStatus(day) {
    const doneCount = day.tasks.filter(t => isDone(t.id)).length;
    if (doneCount === 0) return "pending";
    if (doneCount === day.tasks.length) return "complete";
    return "partial";
  }

  return (
    <div className="roadmap-screen">
      <button className="back-btn" onClick={onBack}>
        &#8249; Back
      </button>

      <header>
        <h1>{roadmap.domainLabel} — roadmap</h1>
        <p className="subtitle">Tap a day to see its checklist.</p>
      </header>

      <div className="day-path">
        {roadmap.days.map((day, i) => {
          const status = dayStatus(day);
          return (
            <div className="day-path-item" key={day.day} style={{ "--stagger": i }}>
              <button
                className={"day-circle " + status}
                onClick={() => setActiveDay(day)}
              >
                {status === "complete" ? "\u2713" : day.day}
              </button>
              <span className="day-path-title">{day.title}</span>
              {i < roadmap.days.length - 1 && <span className="day-path-line" />}
            </div>
          );
        })}
      </div>

      <DayModal
        day={activeDay}
        isTaskDone={isDone}
        onToggleTask={toggleDone}
        onClose={() => setActiveDay(null)}
      />
    </div>
  );
}
