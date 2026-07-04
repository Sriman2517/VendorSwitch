import React from "react";

export default function StatusBadge({ status }) {
  const value = status || "UNKNOWN";
  return <span className={`badge ${String(value).toLowerCase()}`}>{value}</span>;
}
