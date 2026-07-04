import React, { useState } from "react";
import { api } from "../api.js";
import JsonViewer from "../components/JsonViewer.jsx";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { capabilityFeatureOptions, capabilityOptions, capabilityPayloads } from "../constants/capabilities.js";

const defaultCapability = "PAN_VERIFICATION";

function traceFromResult(result) {
  if (!result) return [];

  const attempts = (result.attemptedVendors || []).map((attempt) => ({
    vendorName: attempt.vendorName,
    status: attempt.status === "SUCCESS" ? "SELECTED" : attempt.status,
    latencyMs: attempt.latencyMs,
    reason: attempt.reason
  }));

  const decisionOnly = (result.decisions || []).map((decision) => ({
    vendorName: decision.split(" ")[0],
    status: decision.includes("eligible") ? "ELIGIBLE" : "REJECTED",
    latencyMs: "-",
    reason: decision
  }));

  return attempts.length ? attempts : decisionOnly;
}

export default function RouteRequest() {
  const [capability, setCapability] = useState(defaultCapability);
  const [payloadText, setPayloadText] = useState(JSON.stringify(capabilityPayloads[defaultCapability], null, 2));
  const [maxLatencyMs, setMaxLatencyMs] = useState(2000);
  const [requiredFeatures, setRequiredFeatures] = useState(capabilityFeatureOptions[defaultCapability].slice(0, 2));
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateCapability(nextCapability) {
    setCapability(nextCapability);
    setPayloadText(JSON.stringify(capabilityPayloads[nextCapability], null, 2));
    setRequiredFeatures(capabilityFeatureOptions[nextCapability].slice(0, 2));
    setFeaturesOpen(false);
  }

  function toggleRequiredFeature(feature) {
    setRequiredFeatures((current) =>
      current.includes(feature) ? current.filter((item) => item !== feature) : [...current, feature]
    );
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = JSON.parse(payloadText);
      const response = await api.route({
        capability,
        payload,
        requirements: {
          maxLatencyMs: Number(maxLatencyMs),
          requiredFeatures
        }
      });
      setResult(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const trace = traceFromResult(result);

  return (
    <>
      <PageHeader title="Route Request" subtitle="Demo the unified API and explain why a vendor was selected." />
      {error && <div className="alert">{error}</div>}

      <div className="grid two">
        <form className="card form" onSubmit={submit}>
          <h2>Request</h2>
          <label>
            Capability
            <select value={capability} onChange={(event) => updateCapability(event.target.value)} required>
              {capabilityOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label>
            Payload JSON
            <textarea value={payloadText} onChange={(event) => setPayloadText(event.target.value)} rows="9" />
          </label>
          <div className="form-grid">
            <label>
              Max Latency Ms
              <input type="number" value={maxLatencyMs} onChange={(event) => setMaxLatencyMs(event.target.value)} />
            </label>
            <label>
              Required Features
              <div className="feature-dropdown">
                <button className="feature-dropdown-button" type="button" onClick={() => setFeaturesOpen((open) => !open)}>
                  <span>{requiredFeatures.length ? requiredFeatures.join(", ") : "Select features"}</span>
                  <strong>{featuresOpen ? "Close" : "Open"}</strong>
                </button>
                {featuresOpen && (
                  <div className="feature-picker">
                    {capabilityFeatureOptions[capability].map((feature) => (
                      <label className="feature-option" key={feature}>
                        <input
                          type="checkbox"
                          checked={requiredFeatures.includes(feature)}
                          onChange={() => toggleRequiredFeature(feature)}
                        />
                        {feature}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </label>
          </div>
          <button className="primary-button" disabled={loading}>
            {loading ? "Routing..." : "Route Request"}
          </button>
        </form>

        <section className="card">
          <h2>Result</h2>
          {!result && <p className="muted">Submit a request to see vendor selection.</p>}
          {result && (
            <div className="result-grid">
              <div>
                <span>Status</span>
                <StatusBadge status={result.status} />
              </div>
              <div>
                <span>Vendor Used</span>
                <strong>{result.vendorUsed || "-"}</strong>
              </div>
              <div>
                <span>Strategy</span>
                <strong>{result.strategy || "-"}</strong>
              </div>
              <div>
                <span>Latency Ms</span>
                <strong>{result.latencyMs || 0}</strong>
              </div>
              <div>
                <span>Cost</span>
                <strong>{result.cost || 0}</strong>
              </div>
              <div className="wide">
                <span>Routing Reason</span>
                <strong>{result.routingReason}</strong>
              </div>
              <div className="wide">
                <span>Vendor Response JSON</span>
                <JsonViewer value={result.response} />
              </div>
            </div>
          )}
        </section>
      </div>

      <section className="card">
        <h2>Decision Trace</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Status</th>
                <th>Latency</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {trace.map((item, index) => (
                <tr key={`${item.vendorName}-${index}`}>
                  <td>{item.vendorName}</td>
                  <td>
                    <StatusBadge status={item.status} />
                  </td>
                  <td>{item.latencyMs === "-" ? "-" : `${item.latencyMs || 0}ms`}</td>
                  <td>{item.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
