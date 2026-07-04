import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api.js";
import PageHeader from "../components/PageHeader.jsx";
import StatCard from "../components/StatCard.jsx";
import StatusBadge from "../components/StatusBadge.jsx";

export default function Dashboard() {
  const [vendors, setVendors] = useState([]);
  const [rules, setRules] = useState([]);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [vendorData, ruleData, logData] = await Promise.all([api.vendors(), api.rules(), api.logs()]);
        setVendors(vendorData.data || []);
        setRules(ruleData.data || []);
        setLogs(logData.data || []);
      } catch (err) {
        setError(err.message);
      }
    }

    load();
  }, []);

  const stats = useMemo(() => {
    const successes = logs.filter((log) => log.status === "SUCCESS").length;
    const failures = logs.filter((log) => log.status !== "SUCCESS").length;
    const totalLatency = logs.reduce((sum, log) => sum + (log.latencyMs || 0), 0);

    return {
      totalVendors: vendors.length,
      activeVendors: vendors.filter((vendor) => vendor.enabled).length,
      totalRequests: logs.length,
      successRate: logs.length ? `${Math.round((successes / logs.length) * 100)}%` : "0%",
      avgLatency: logs.length ? `${Math.round(totalLatency / logs.length)}ms` : "0ms",
      failedRequests: failures
    };
  }, [vendors, logs]);

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Quick system overview for vendor routing." />
      {error && <div className="alert">{error}</div>}

      <div className="stat-grid">
        <StatCard label="Total Vendors" value={stats.totalVendors} />
        <StatCard label="Active Vendors" value={stats.activeVendors} />
        <StatCard label="Total Requests" value={stats.totalRequests} />
        <StatCard label="Success Rate" value={stats.successRate} />
        <StatCard label="Average Latency" value={stats.avgLatency} />
        <StatCard label="Failed Requests" value={stats.failedRequests} />
      </div>

      <div className="grid two">
        <section className="card">
          <h2>Current Routing Rules</h2>
          <div className="list">
            {rules.length === 0 && <p className="muted">No rules configured yet.</p>}
            {rules.map((rule) => (
              <div className="list-row" key={rule._id}>
                <strong>{rule.capability}</strong>
                <span>{String(rule.strategy).toUpperCase()}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <h2>Recent Routing Decisions</h2>
          <div className="list">
            {logs.length === 0 && <p className="muted">No routing decisions yet.</p>}
            {logs.slice(0, 6).map((log) => (
              <div className="list-row" key={log._id}>
                <span>{log.vendorUsed ? `${log.vendorUsed} selected for ${log.capability}` : log.routingReason}</span>
                <StatusBadge status={log.status} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
