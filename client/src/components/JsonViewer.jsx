import React from "react";

export default function JsonViewer({ value, emptyText = "No data" }) {
  return <pre className="json-viewer">{value ? JSON.stringify(value, null, 2) : emptyText}</pre>;
}
