import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api.js";
import JsonViewer from "../components/JsonViewer.jsx";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";

const tabs = ["Generate Routing Rule", "Explain Routing Decision", "Vendor Health Insights"];

const defaultRuleText = `Use Lowest Latency for PAN Verification.
If latency exceeds 2000ms or error rate exceeds 5%, fallback to Priority Routing.`;

function toApiStrategy(strategy) {
  return String(strategy).toLowerCase();
}

export default function AiAssistant() {
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [ruleText, setRuleText] = useState(defaultRuleText);
  const [generated, setGenerated] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [applyMessage, setApplyMessage] = useState("");
  const [logs, setLogs] = useState([]);
  const [selectedLogId, setSelectedLogId] = useState("");
  const [decisionExplanation, setDecisionExplanation] = useState("");
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [vendorInsights, setVendorInsights] = useState({});
  const [vendorLoading, setVendorLoading] = useState("");
  const [error, setError] = useState("");

  const selectedLog = useMemo(() => logs.find((log) => log._id === selectedLogId), [logs, selectedLogId]);

  useEffect(() => {
    async function load() {
      try {
        const [logResponse, metricsResponse] = await Promise.all([api.logs(), api.metrics()]);
        const logData = logResponse.data || [];
        setLogs(logData);
        setSelectedLogId(logData[0]?._id || "");
        setVendors(metricsResponse.data || []);
      } catch (err) {
        setError(err.message);
      }
    }

    load();
  }, []);

  async function generateConfiguration() {
    setIsGenerating(true);
    setApplyMessage("");
    setError("");

    try {
      const response = await api.aiGenerateRule({ prompt: ruleText });
      setGenerated({
        rule: response.data.rule,
        explanation: response.data.explanation,
        source: response.data.source
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  }

  async function applyRule() {
    if (!generated?.rule) return;

    setApplyMessage("");
    setError("");

    try {
      await api.saveRule({
        capability: generated.rule.capability,
        strategy: toApiStrategy(generated.rule.strategy),
        fallbackStrategy: toApiStrategy(generated.rule.fallbackStrategy),
        thresholds: generated.rule.thresholds,
        enabled: true
      });
      setApplyMessage("Routing rule applied successfully.");
    } catch (err) {
      setError(err.message);
    }
  }

  async function explainDecision() {
    setDecisionLoading(true);
    setError("");

    try {
      const response = await api.aiExplainDecision({ logId: selectedLogId });
      setDecisionExplanation(response.data.explanation);
    } catch (err) {
      setError(err.message);
    } finally {
      setDecisionLoading(false);
    }
  }

  async function analyze(vendor) {
    setVendorLoading(vendor.id);
    setError("");

    try {
      const response = await api.aiVendorInsight({ vendorId: vendor.id });
      setVendorInsights((current) => ({ ...current, [vendor.id]: response.data.insight }));
    } catch (err) {
      setError(err.message);
    } finally {
      setVendorLoading("");
    }
  }

  return (
    <>
      <PageHeader
        title="AI Assistant"
        subtitle="Configure, understand, and improve routing operations without changing the rule-based engine."
      />
      {error && <div className="alert">{error}</div>}
      {applyMessage && <div className="success">{applyMessage}</div>}
      <div className="assistant-disclaimer">
        AI suggestions are recommendations only. Routing decisions are still enforced by the rule-based routing engine.
      </div>

      <div className="tabs">
        {tabs.map((tab) => (
          <button key={tab} className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Generate Routing Rule" && (
        <div className="grid">
          <section className="card form">
            <label>
              Describe your routing rule in plain English
              <textarea
                value={ruleText}
                onChange={(event) => setRuleText(event.target.value)}
                placeholder={`Example:\nUse Lowest Latency for PAN Verification.\nIf latency exceeds 2000ms or error rate exceeds 5%, fallback to Priority Routing.`}
                rows="7"
              />
            </label>
            <button className="primary-button" onClick={generateConfiguration} disabled={isGenerating}>
              {isGenerating ? "Generating..." : "Generate Configuration"}
            </button>
          </section>

          {generated && (
            <div className="grid two">
              <section className="card">
                <h2>Generated Routing Rule</h2>
                <JsonViewer value={generated.rule} />
                <button className="primary-button apply-button" onClick={applyRule}>
                  Apply Rule
                </button>
              </section>
              <section className="card explanation-card">
                <h2>Explanation</h2>
                <p>{generated.explanation}</p>
                {generated.source && <p className="muted">Source: {generated.source}</p>}
              </section>
            </div>
          )}
        </div>
      )}

      {activeTab === "Explain Routing Decision" && (
        <div className="grid two">
          <section className="card form">
            <label>
              Select Request Log
              <select value={selectedLogId} onChange={(event) => setSelectedLogId(event.target.value)}>
                {logs.map((log) => (
                  <option key={log._id} value={log._id}>
                    {new Date(log.createdAt).toLocaleString()} - {log.capability} - {log.vendorUsed || "No vendor"}
                  </option>
                ))}
              </select>
            </label>
            {selectedLog && (
              <div className="summary-grid">
                <span>Capability</span>
                <strong>{selectedLog.capability}</strong>
                <span>Selected Vendor</span>
                <strong>{selectedLog.vendorUsed || "-"}</strong>
                <span>Routing Strategy</span>
                <strong>{selectedLog.strategy}</strong>
                <span>Latency</span>
                <strong>{selectedLog.latencyMs || 0}ms</strong>
                <span>Rejected Vendors</span>
                <strong>
                  {(selectedLog.attemptedVendors || [])
                    .filter((vendor) => vendor.vendorName !== selectedLog.vendorUsed)
                    .map((vendor) => vendor.vendorName)
                    .join(", ") || "-"}
                </strong>
              </div>
            )}
            <button className="primary-button" onClick={explainDecision} disabled={!selectedLog || decisionLoading}>
              {decisionLoading ? "Explaining..." : "Explain Decision"}
            </button>
          </section>
          <section className="card explanation-card">
            <h2>Explanation</h2>
            <p className="preserve-lines">{decisionExplanation || "Choose a request log and generate an explanation."}</p>
          </section>
        </div>
      )}

      {activeTab === "Vendor Health Insights" && (
        <div className="vendor-insight-grid">
          {vendors.map((vendor) => (
            <section className="card vendor-insight-card" key={vendor.id}>
              <div className="vendor-insight-head">
                <h2>{vendor.name}</h2>
                <StatusBadge status={vendor.health?.status} />
              </div>
              <div className="summary-grid">
                <span>Capability</span>
                <strong>{vendor.capability}</strong>
                <span>Latency</span>
                <strong>{vendor.health?.avgLatencyMs ?? 0}ms</strong>
                <span>Success Rate</span>
                <strong>{vendor.health?.successRate ?? 0}%</strong>
                <span>Rate Limit</span>
                <strong>
                  {vendor.rateLimit?.currentUsage ?? 0}/{vendor.rateLimit?.limit ?? vendor.rateLimitPerMinute}
                </strong>
              </div>
              <button className="primary-button" onClick={() => analyze(vendor)} disabled={vendorLoading === vendor.id}>
                {vendorLoading === vendor.id ? "Analyzing..." : "Analyze"}
              </button>
              {vendorInsights[vendor.id] && (
                <div className="ai-response-card">
                  <strong>AI Response</strong>
                  <p>{vendorInsights[vendor.id]}</p>
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </>
  );
}
