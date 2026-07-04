import React from "react";
import ProgressBar from "./ProgressBar.jsx";
import StatusBadge from "./StatusBadge.jsx";

export default function MetricsTable({ metrics }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Vendor</th>
            <th>Capability</th>
            <th>Health</th>
            <th>Avg Latency</th>
            <th>Success Rate</th>
            <th>Error Rate</th>
            <th>Availability</th>
            <th>Rate Limit Usage</th>
            <th>Remaining</th>
            <th>Limited</th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((vendor) => (
            <tr key={vendor.id}>
              <td>{vendor.name}</td>
              <td>{vendor.capability}</td>
              <td>
                <StatusBadge status={vendor.health?.status} />
              </td>
              <td>{vendor.health?.avgLatencyMs ?? 0}ms</td>
              <td>{vendor.health?.successRate ?? 0}%</td>
              <td>{vendor.health?.errorRate ?? 0}%</td>
              <td>{vendor.health?.availability ?? 0}%</td>
              <td>
                <span>
                  {vendor.rateLimit?.currentUsage ?? 0}/{vendor.rateLimit?.limit ?? vendor.rateLimitPerMinute}
                </span>
                <ProgressBar
                  current={vendor.rateLimit?.currentUsage ?? 0}
                  total={vendor.rateLimit?.limit ?? vendor.rateLimitPerMinute}
                />
              </td>
              <td>{vendor.rateLimit?.remaining ?? vendor.rateLimitPerMinute}</td>
              <td>{vendor.rateLimit?.isLimited ? "Yes" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
