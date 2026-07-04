import React from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx";
import Vendors from "./pages/Vendors.jsx";
import RoutingRules from "./pages/RoutingRules.jsx";
import RouteRequest from "./pages/RouteRequest.jsx";
import Metrics from "./pages/Metrics.jsx";
import Logs from "./pages/Logs.jsx";
import AiAssistant from "./pages/AiAssistant.jsx";

const navItems = [
  ["Dashboard", "/"],
  ["Vendors", "/vendors"],
  ["Routing Rules", "/routing-rules"],
  ["Route Request", "/route-request"],
  ["Metrics", "/metrics"],
  ["Logs", "/logs"],
  ["AI Assistant", "/ai-assistant"]
];

export default function App() {
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <span>VendorSwitch</span>
          <small>Intelligent Vendor Routing Platform</small>
        </div>
        <nav>
          {navItems.map(([label, path]) => (
            <NavLink key={path} to={path} className={({ isActive }) => (isActive ? "active" : "")}>
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="main">
        <section className="content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/vendors" element={<Vendors />} />
            <Route path="/routing-rules" element={<RoutingRules />} />
            <Route path="/route-request" element={<RouteRequest />} />
            <Route path="/metrics" element={<Metrics />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="/ai-assistant" element={<AiAssistant />} />
          </Routes>
        </section>
      </div>
    </div>
  );
}
