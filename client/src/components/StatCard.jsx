import React from "react";

export default function StatCard({ label, value }) {
  return (
    <div className="card stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
