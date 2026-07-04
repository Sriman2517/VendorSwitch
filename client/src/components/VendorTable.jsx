import React from "react";
import StatusBadge from "./StatusBadge.jsx";

export default function VendorTable({ vendors, onToggleEnabled }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Capability</th>
            <th>Enabled</th>
            <th>Priority</th>
            <th>Weight</th>
            <th>Cost/request</th>
            <th>Timeout</th>
            <th>Rate Limit</th>
            <th>Health</th>
            <th>Avg Latency</th>
            <th>Success Rate</th>
            {onToggleEnabled && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {vendors.map((vendor) => (
            <tr key={vendor._id || vendor.id}>
              <td>{vendor.name}</td>
              <td>{vendor.capability}</td>
              <td>{vendor.enabled ? "Yes" : "No"}</td>
              <td>{vendor.priority}</td>
              <td>{vendor.weight}</td>
              <td>{vendor.costPerRequest}</td>
              <td>{vendor.timeoutMs}ms</td>
              <td>{vendor.rateLimitPerMinute}/min</td>
              <td>
                <StatusBadge status={vendor.health?.status} />
              </td>
              <td>{vendor.health?.avgLatencyMs ?? 0}ms</td>
              <td>{vendor.health?.successRate ?? 0}%</td>
              {onToggleEnabled && (
                <td>
                  <button className="table-action-button" type="button" onClick={() => onToggleEnabled(vendor)}>
                    {vendor.enabled ? "Disable" : "Enable"}
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
