import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import MetricsTable from "../components/MetricsTable.jsx";
import PageHeader from "../components/PageHeader.jsx";

export default function Metrics() {
  const [metrics, setMetrics] = useState([]);
  const [error, setError] = useState("");

  async function load() {
    try {
      const response = await api.metrics();
      setMetrics(response.data || []);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <PageHeader
        title="Metrics"
        subtitle="Live vendor performance and rate-limit usage."
        action={<button onClick={load}>Refresh</button>}
      />
      {error && <div className="alert">{error}</div>}
      <section className="card">
        <MetricsTable metrics={metrics} />
      </section>
    </>
  );
}
