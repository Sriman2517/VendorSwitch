import React, { Fragment, useState } from "react";
import JsonViewer from "./JsonViewer.jsx";
import StatusBadge from "./StatusBadge.jsx";

export default function LogsTable({ logs }) {
  const [openId, setOpenId] = useState("");

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Capability</th>
            <th>Strategy</th>
            <th>Vendor Used</th>
            <th>Status</th>
            <th>Latency</th>
            <th>Cost</th>
            <th>Routing Reason</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <Fragment key={log._id}>
              <tr className="clickable-row" onClick={() => setOpenId(openId === log._id ? "" : log._id)}>
                <td>{new Date(log.createdAt).toLocaleString()}</td>
                <td>{log.capability}</td>
                <td>{log.strategy}</td>
                <td>{log.vendorUsed || "-"}</td>
                <td>
                  <StatusBadge status={log.status} />
                </td>
                <td>{log.latencyMs || 0}ms</td>
                <td>{log.cost || 0}</td>
                <td>{log.routingReason}</td>
              </tr>
              {openId === log._id && (
                <tr>
                  <td colSpan="8">
                    <div className="details-grid">
                      <JsonViewer value={log.requestPayload} emptyText="No request payload" />
                      <JsonViewer value={log.responsePayload} emptyText="No response payload" />
                      <JsonViewer value={log.decisions} emptyText="No decisions" />
                      <JsonViewer value={log.attemptedVendors} emptyText="No attempted vendors" />
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
