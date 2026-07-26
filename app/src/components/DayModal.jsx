import { useState } from "react";

function TaskRow({ task, isDone, onToggle }) {
  const [asking, setAsking] = useState(false);
  const [question, setQuestion] = useState("");
  const [asked, setAsked] = useState(false);

  return (
    <div className="task-row">
      <label className="task-check">
        <input type="checkbox" checked={isDone} onChange={() => onToggle(task.id)} />
        <span className={isDone ? "task-label done" : "task-label"}>{task.label}</span>
      </label>

      <button className="task-ask-btn" onClick={() => setAsking(a => !a)}>
        {asking ? "Hide" : "I'm stuck"}
      </button>

      {asking && (
        <div className="task-ask-box">
          {!asked ? (
            <>
              <textarea
                placeholder="What's confusing about this task?"
                value={question}
                onChange={e => setQuestion(e.target.value)}
                rows={2}
              />
              <button
                className="task-ask-submit"
                disabled={!question.trim()}
                onClick={() => setAsked(true)}
              >
                Ask
              </button>
            </>
          ) : (
            <p className="task-ask-response">
              {task.hint || "Placeholder — the platform will guide you here once AI is wired in."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function DayModal({ day, isTaskDone, onToggleTask, onClose }) {
  if (!day) return null;

  const doneCount = day.tasks.filter(t => isTaskDone(t.id)).length;

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>
          Day {day.day} — {day.title}
        </h2>
        <p className="day-progress">
          {doneCount} of {day.tasks.length} tasks done
        </p>

        <div className="task-list">
          {day.tasks.map(task => (
            <TaskRow
              key={task.id}
              task={task}
              isDone={isTaskDone(task.id)}
              onToggle={onToggleTask}
            />
          ))}
        </div>

        <div className="modal-footer">
          <button className="close-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
