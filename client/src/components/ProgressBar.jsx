import React from "react";

export default function ProgressBar({ current = 0, total = 1 }) {
  const percent = total > 0 ? Math.min((current / total) * 100, 100) : 0;

  return (
    <div className="progress-wrap">
      <div className="progress-bar" style={{ width: `${percent}%` }} />
    </div>
  );
}
