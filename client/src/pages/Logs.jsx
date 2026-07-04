import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import LogsTable from "../components/LogsTable.jsx";
import PageHeader from "../components/PageHeader.jsx";

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");

  async function load() {
    try {
      const response = await api.logs();
      setLogs(response.data || []);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <PageHeader title="Logs" subtitle="Routing decision history." action={<button onClick={load}>Refresh</button>} />
      {error && <div className="alert">{error}</div>}
      <section className="card">
        <LogsTable logs={logs} />
      </section>
    </>
  );
}
