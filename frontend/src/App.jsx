import { useState, useEffect } from "react";

import {
  LayoutDashboard,
  Settings,
  Users,
  AlertTriangle,
  Wrench,
  ClipboardList,
  BarChart3,
  Factory,
} from "lucide-react";

import api from "./services/api";

import Equipment from "./components/Equipment";
import Technician from "./components/Technician";
import Breakdown from "./components/Breakdown";

import "./App.css";

function App() {
  const [activePage, setActivePage] = useState("Dashboard");

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch Dashboard Summary
  useEffect(() => {
    api
      .get("/api/analytics/summary")
      .then((response) => {
        setSummary(response.data);
      })
      .catch((err) => {
        console.error("Dashboard API Error:", err);
        setError("Unable to load dashboard data.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Sidebar Menu Items
  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Equipment", icon: Settings },
    { name: "Technicians", icon: Users },
    { name: "Breakdowns", icon: AlertTriangle },
    { name: "Assignments", icon: ClipboardList },
    { name: "Repair Tracking", icon: Wrench },
    { name: "Analytics", icon: BarChart3 },
  ];

  // Dashboard Statistics
  const stats = [
    {
      title: "Total Equipment",
      value: summary?.total_equipment ?? 0,
      icon: Settings,
      color: "blue",
    },
    {
      title: "Total Technicians",
      value: summary?.total_technicians ?? 0,
      icon: Users,
      color: "green",
    },
    {
      title: "Open Breakdowns",
      value: summary?.open_breakdowns ?? 0,
      icon: AlertTriangle,
      color: "orange",
    },
    {
      title: "Total Repair Cost",
      value: `₹${Number(summary?.total_repair_cost ?? 0).toLocaleString(
        "en-IN",
      )}`,
      icon: Wrench,
      color: "purple",
    },
  ];

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <Factory size={30} />

          <div>
            <h2>STEEL PLANT</h2>
            <span>Management System</span>
          </div>
        </div>

        <p className="menu-heading">MAIN MENU</p>

        <nav>
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                className={`menu-item ${
                  activePage === item.name ? "active" : ""
                }`}
                onClick={() => setActivePage(item.name)}
              >
                <Icon size={19} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <span>Equipment Breakdown System</span>
          <small>Version 1.0.0</small>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Top Header */}
        <header className="topbar">
          <div>
            <h2>{activePage}</h2>
            <p>Steel Plant Equipment Management</p>
          </div>

          <div className="user-profile">
            <div className="avatar">A</div>

            <div>
              <strong>Administrator</strong>
              <small>Plant Manager</small>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <section className="content-area">
          {/* Equipment Module */}
          {activePage === "Equipment" ? (
            <Equipment />
          ) : /* Technician Module */
          activePage === "Technicians" ? (
            <Technician />
          ) : /* Breakdown Module */
          activePage === "Breakdowns" ? (
            <Breakdown />
          ) : /* Dashboard Module */
          activePage === "Dashboard" ? (
            <>
              <div className="welcome-section">
                <div>
                  <h1>Welcome to Dashboard</h1>
                  <p>Monitor and manage your plant operations.</p>
                </div>
              </div>

              {/* Loading and Error */}
              {loading && <p>Loading dashboard data...</p>}

              {error && <p>{error}</p>}

              {/* Statistics Cards */}
              <div className="stats-grid">
                {stats.map((stat) => {
                  const Icon = stat.icon;

                  return (
                    <div className="stat-card" key={stat.title}>
                      <div className={`stat-icon ${stat.color}`}>
                        <Icon />
                      </div>

                      <p>{stat.title}</p>

                      <h2>{loading ? "..." : stat.value}</h2>
                    </div>
                  );
                })}
              </div>

              {/* System Overview */}
              <div className="dashboard-panel">
                <h3>System Overview</h3>

                {summary && <pre>{JSON.stringify(summary, null, 2)}</pre>}
              </div>
            </>
          ) : (
            /* Other Modules - Coming Soon */
            <div className="dashboard-panel">
              <h3>{activePage}</h3>

              <p>This module will be implemented next.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;

