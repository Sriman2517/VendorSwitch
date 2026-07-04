import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import PageHeader from "../components/PageHeader.jsx";

const capabilityOptions = ["PAN_VERIFICATION", "OCR", "SMS"];
const strategies = ["priority", "weighted", "lowest_latency", "lowest_cost", "failover", "feature_based", "health_based"];
const fallbackStrategies = ["priority", "lowest_latency", "lowest_cost", "failover"];

const initialForm = {
  capability: "PAN_VERIFICATION",
  strategy: "lowest_latency",
  fallbackStrategy: "priority",
  maxLatencyMs: 2000,
  maxErrorRate: 5,
  minAvailability: 95
};

export default function RoutingRules() {
  const [rules, setRules] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const response = await api.rules();
    setRules(response.data || []);
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const response = await api.saveRule({
        capability: form.capability.toUpperCase(),
        strategy: form.strategy,
        fallbackStrategy: form.fallbackStrategy,
        thresholds: {
          maxLatencyMs: Number(form.maxLatencyMs),
          maxErrorRate: Number(form.maxErrorRate),
          minAvailability: Number(form.minAvailability)
        },
        enabled: true
      });
      setMessage(`${response.data.capability} rule saved. Existing capability rows are updated, not duplicated.`);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleRuleEnabled(rule) {
    setError("");
    setMessage("");

    try {
      await api.saveRule({
        capability: rule.capability,
        strategy: rule.strategy,
        fallbackStrategy: rule.fallbackStrategy || "priority",
        thresholds: rule.thresholds,
        enabled: !rule.enabled
      });
      setMessage(`${rule.capability} rule ${rule.enabled ? "disabled" : "enabled"}.`);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <PageHeader title="Routing Rules" subtitle="Configure routing strategy per capability." />
      {error && <div className="alert">{error}</div>}
      {message && <div className="success">{message}</div>}

      <section className="card">
        <h2>Add or Update Rule</h2>
        <form className="form" onSubmit={submit}>
          <div className="form-grid three">
            <label>
              Capability
              <select value={form.capability} onChange={(event) => updateField("capability", event.target.value)}>
                {capabilityOptions.map((capability) => (
                  <option key={capability} value={capability}>
                    {capability}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Strategy
              <select value={form.strategy} onChange={(event) => updateField("strategy", event.target.value)}>
                {strategies.map((strategy) => (
                  <option key={strategy} value={strategy}>
                    {strategy.toUpperCase()}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Fallback Strategy
              <select value={form.fallbackStrategy} onChange={(event) => updateField("fallbackStrategy", event.target.value)}>
                {fallbackStrategies.map((strategy) => (
                  <option key={strategy} value={strategy}>
                    {strategy.toUpperCase()}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Max Latency (ms)
              <input type="number" value={form.maxLatencyMs} onChange={(event) => updateField("maxLatencyMs", event.target.value)} />
            </label>
            <label>
              Max Error Rate (%)
              <div className="input-suffix">
                <input type="number" value={form.maxErrorRate} onChange={(event) => updateField("maxErrorRate", event.target.value)} />
                <span>%</span>
              </div>
            </label>
            <label>
              Min Availability (%)
              <div className="input-suffix">
                <input
                  type="number"
                  value={form.minAvailability}
                  onChange={(event) => updateField("minAvailability", event.target.value)}
                />
                <span>%</span>
              </div>
            </label>
          </div>
          <button className="primary-button">Save Rule</button>
        </form>
      </section>

      <section className="card">
        <h2>Existing Rules</h2>
        <p className="muted table-note">One routing rule is stored per capability. Saving the same capability updates that row.</p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Capability</th>
                <th>Strategy</th>
                <th>Fallback Strategy</th>
                <th>Max Latency</th>
                <th>Max Error Rate (%)</th>
                <th>Min Availability (%)</th>
                <th>Enabled</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule._id}>
                  <td>{rule.capability}</td>
                  <td>{rule.strategy}</td>
                  <td>{rule.fallbackStrategy || "priority"}</td>
                  <td>{rule.thresholds?.maxLatencyMs}ms</td>
                  <td>{rule.thresholds?.maxErrorRate}%</td>
                  <td>{rule.thresholds?.minAvailability}%</td>
                  <td>{rule.enabled ? "Yes" : "No"}</td>
                  <td>
                    <button className="table-action-button" type="button" onClick={() => toggleRuleEnabled(rule)}>
                      {rule.enabled ? "Disable" : "Enable"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
