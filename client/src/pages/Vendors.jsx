import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import PageHeader from "../components/PageHeader.jsx";
import VendorTable from "../components/VendorTable.jsx";
import { capabilityFeatureOptions, capabilityOptions } from "../constants/capabilities.js";

const initialForm = {
  name: "",
  capability: "PAN_VERIFICATION",
  priority: 1,
  weight: 50,
  costPerRequest: 1,
  timeoutMs: 2000,
  rateLimitPerMinute: 60,
  supportedFeatures: ["PAN_STATUS", "NAME_MATCH"],
  endpointUrl: "",
  enabled: true
};

export default function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const response = await api.vendors();
    setVendors(response.data || []);
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateCapability(capability) {
    setForm((current) => ({
      ...current,
      capability,
      supportedFeatures: capabilityFeatureOptions[capability].slice(0, 2)
    }));
    setFeaturesOpen(false);
  }

  function toggleSupportedFeature(feature) {
    setForm((current) => ({
      ...current,
      supportedFeatures: current.supportedFeatures.includes(feature)
        ? current.supportedFeatures.filter((item) => item !== feature)
        : [...current.supportedFeatures, feature]
    }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      await api.createVendor({
        ...form,
        capability: form.capability.toUpperCase(),
        priority: Number(form.priority),
        weight: Number(form.weight),
        costPerRequest: Number(form.costPerRequest),
        timeoutMs: Number(form.timeoutMs),
        rateLimitPerMinute: Number(form.rateLimitPerMinute),
        supportedFeatures: form.supportedFeatures
      });
      setMessage("Vendor saved.");
      setForm(initialForm);
      setFeaturesOpen(false);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleVendorEnabled(vendor) {
    setError("");
    setMessage("");

    try {
      await api.createVendor({
        ...vendor,
        enabled: !vendor.enabled,
        supportedFeatures: vendor.supportedFeatures || [],
        endpointUrl: vendor.endpointUrl || "",
        health: vendor.health
      });
      setMessage(`${vendor.name} ${vendor.enabled ? "disabled" : "enabled"}.`);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <PageHeader title="Vendors" subtitle="Register and manage vendor configuration." />
      {error && <div className="alert">{error}</div>}
      {message && <div className="success">{message}</div>}

      <section className="card">
        <h2>Add Vendor</h2>
        <form className="form" onSubmit={submit}>
          <div className="form-grid three">
            <label>
              Name
              <input value={form.name} onChange={(event) => updateField("name", event.target.value)} required />
            </label>
            <label>
              Capability
              <select value={form.capability} onChange={(event) => updateCapability(event.target.value)} required>
                {capabilityOptions.map((capability) => (
                  <option key={capability} value={capability}>
                    {capability}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Priority
              <input type="number" value={form.priority} onChange={(event) => updateField("priority", event.target.value)} />
            </label>
            <label>
              Weight
              <input type="number" value={form.weight} onChange={(event) => updateField("weight", event.target.value)} />
            </label>
            <label>
              Cost Per Request
              <input
                type="number"
                step="0.01"
                value={form.costPerRequest}
                onChange={(event) => updateField("costPerRequest", event.target.value)}
              />
            </label>
            <label>
              TimeoutMs
              <input type="number" value={form.timeoutMs} onChange={(event) => updateField("timeoutMs", event.target.value)} />
            </label>
            <label>
              RateLimitPerMinute
              <input
                type="number"
                value={form.rateLimitPerMinute}
                onChange={(event) => updateField("rateLimitPerMinute", event.target.value)}
              />
            </label>
            <label>
              Supported Features
              <div className="feature-dropdown">
                <button className="feature-dropdown-button" type="button" onClick={() => setFeaturesOpen((open) => !open)}>
                  <span>{form.supportedFeatures.length ? form.supportedFeatures.join(", ") : "Select features"}</span>
                  <strong>{featuresOpen ? "Close" : "Open"}</strong>
                </button>
                {featuresOpen && (
                  <div className="feature-picker">
                    {capabilityFeatureOptions[form.capability].map((feature) => (
                      <label className="feature-option" key={feature}>
                        <input
                          type="checkbox"
                          checked={form.supportedFeatures.includes(feature)}
                          onChange={() => toggleSupportedFeature(feature)}
                        />
                        {feature}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </label>
            <label>
              Endpoint URL
              <input value={form.endpointUrl} onChange={(event) => updateField("endpointUrl", event.target.value)} />
            </label>
          </div>
          <label className="checkbox-row">
            <input type="checkbox" checked={form.enabled} onChange={(event) => updateField("enabled", event.target.checked)} />
            Enabled
          </label>
          <button className="primary-button">Save Vendor</button>
        </form>
      </section>

      <section className="card">
        <h2>Registered Vendors</h2>
        <VendorTable vendors={vendors} onToggleEnabled={toggleVendorEnabled} />
      </section>
    </>
  );
}
