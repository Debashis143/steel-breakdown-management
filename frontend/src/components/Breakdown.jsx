import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  RefreshCw,
  Pencil,
  X,
  AlertTriangle,
  Clock,
  CheckCircle,
  ClipboardList,
} from "lucide-react";

import api from "../services/api";
import "./Breakdown.css";

const emptyForm = {
  equipment_id: "",
  description: "",
  severity: "Low",
  reported_by: "",
};

function Breakdown() {
  const [breakdowns, setBreakdowns] = useState([]);
  const [equipment, setEquipment] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Fetch breakdowns and equipment
  const fetchData = async () => {
    setLoading(true);
    setError("");

    try {
      const [breakdownResponse, equipmentResponse] = await Promise.all([
        api.get("/api/breakdowns/"),
        api.get("/api/equipment/"),
      ]);

      setBreakdowns(breakdownResponse.data);
      setEquipment(equipmentResponse.data);
    } catch (err) {
      console.error("Breakdown API Error:", err);
      setError(
        err.response?.data?.detail ||
          "Unable to load breakdowns. Check your backend API.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Dashboard statistics
  const stats = useMemo(() => {
    return {
      total: breakdowns.length,
      open: breakdowns.filter((b) => b.status === "Open").length,
      critical: breakdowns.filter((b) => b.severity === "Critical").length,
      resolved: breakdowns.filter((b) => b.status === "Resolved").length,
    };
  }, [breakdowns]);

  // Search and filters
  const filteredBreakdowns = useMemo(() => {
    return breakdowns.filter((item) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        String(item.id).includes(searchText) ||
        item.description?.toLowerCase().includes(searchText) ||
        item.reported_by?.toLowerCase().includes(searchText);

      const matchesSeverity =
        !severityFilter || item.severity === severityFilter;

      const matchesStatus = !statusFilter || item.status === statusFilter;

      return matchesSearch && matchesSeverity && matchesStatus;
    });
  }, [breakdowns, search, severityFilter, statusFilter]);

  // Open add modal
  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  };

  // Open edit modal
  const openEditModal = (item) => {
    setEditingId(item.id);

    setForm({
      equipment_id: String(item.equipment_id),
      description: item.description || "",
      severity: item.severity || "Low",
      reported_by: item.reported_by || "",
    });

    setError("");
    setModalOpen(true);
  };

  // Handle form input
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Save breakdown
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      equipment_id: Number(form.equipment_id),
      description: form.description.trim(),
      severity: form.severity,
      reported_by: form.reported_by.trim(),
    };

    try {
      if (editingId) {
        await api.put(`/api/breakdowns/${editingId}`, payload);
      } else {
        await api.post("/api/breakdowns/", payload);
      }

      setModalOpen(false);
      setForm(emptyForm);
      setEditingId(null);

      await fetchData();
    } catch (err) {
      console.error("Save Breakdown Error:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to save breakdown. Please check the entered details.",
      );
    } finally {
      setSaving(false);
    }
  };

  // Update breakdown status
  const updateStatus = async (item) => {
    const nextStatus =
      item.status === "Open"
        ? "In Progress"
        : item.status === "In Progress"
          ? "Resolved"
          : null;

    if (!nextStatus) {
      alert("This breakdown is already resolved.");
      return;
    }

    const confirmed = window.confirm(
      `Change breakdown #${item.id} status to ${nextStatus}?`,
    );

    if (!confirmed) return;

    try {
      await api.patch(`/api/breakdowns/${item.id}/status`, {
        status: nextStatus,
      });

      await fetchData();
    } catch (err) {
      console.error("Update Status Error:", err);

      setError(
        err.response?.data?.detail || "Unable to update breakdown status.",
      );
    }
  };

  const getEquipmentName = (equipmentId) => {
    const item = equipment.find(
      (equipmentItem) => equipmentItem.id === equipmentId,
    );

    return item
      ? `${item.equipment_code || item.equipment_name || `Equipment #${item.id}`}`
      : `Equipment #${equipmentId}`;
  };

  const formatDate = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "-";

    return parsedDate.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="breakdown-container">
      {/* Header */}
      <div className="breakdown-header">
        <div>
          <h1>Breakdown Management</h1>
          <p>Register and monitor equipment breakdowns.</p>
        </div>

        <button className="breakdown-add-btn" onClick={openAddModal}>
          <Plus size={18} />
          Register Breakdown
        </button>
      </div>

      {error && (
        <div className="breakdown-error">
          {typeof error === "string" ? error : JSON.stringify(error)}
        </div>
      )}

      {/* Statistics */}
      <div className="breakdown-stats">
        <div className="breakdown-stat-card">
          <div className="breakdown-stat-icon blue">
            <ClipboardList />
          </div>
          <div className="breakdown-stat-info">
            <p>Total Breakdowns</p>
            <h2>{stats.total}</h2>
          </div>
        </div>

        <div className="breakdown-stat-card">
          <div className="breakdown-stat-icon orange">
            <Clock />
          </div>
          <div className="breakdown-stat-info">
            <p>Open Breakdowns</p>
            <h2>{stats.open}</h2>
          </div>
        </div>

        <div className="breakdown-stat-card">
          <div className="breakdown-stat-icon red">
            <AlertTriangle />
          </div>
          <div className="breakdown-stat-info">
            <p>Critical Breakdowns</p>
            <h2>{stats.critical}</h2>
          </div>
        </div>

        <div className="breakdown-stat-card">
          <div className="breakdown-stat-icon green">
            <CheckCircle />
          </div>
          <div className="breakdown-stat-info">
            <p>Resolved Breakdowns</p>
            <h2>{stats.resolved}</h2>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="breakdown-filter-section">
        <div className="breakdown-filters">
          <div className="breakdown-search">
            <Search size={18} />

            <input
              type="text"
              placeholder="Search ID, description or reporter..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
          >
            <option value="">All Severities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>

          <button
            className="breakdown-refresh-btn"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Breakdown Table */}
      <div className="breakdown-table-card">
        <div className="breakdown-table-header">
          <h3>Breakdown Records</h3>
          <span>{filteredBreakdowns.length} records</span>
        </div>

        {loading ? (
          <div className="breakdown-loading">Loading breakdown records...</div>
        ) : filteredBreakdowns.length === 0 ? (
          <div className="breakdown-empty">No breakdown records found.</div>
        ) : (
          <div className="breakdown-table-wrapper">
            <table className="breakdown-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Equipment</th>
                  <th>Description</th>
                  <th>Severity</th>
                  <th>Reported By</th>
                  <th>Status</th>
                  <th>Reported At</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredBreakdowns.map((item) => (
                  <tr key={item.id}>
                    <td className="breakdown-id">#{item.id}</td>

                    <td>{getEquipmentName(item.equipment_id)}</td>

                    <td className="breakdown-description">
                      {item.description}
                    </td>

                    <td>
                      <span
                        className={`breakdown-severity ${item.severity?.toLowerCase()}`}
                      >
                        {item.severity}
                      </span>
                    </td>

                    <td>{item.reported_by}</td>

                    <td>
                      <span
                        className={`breakdown-status ${item.status
                          ?.toLowerCase()
                          .replace(/\s+/g, "-")}`}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td>{formatDate(item.reported_at)}</td>

                    <td>
                      <div className="breakdown-actions">
                        <button
                          className="breakdown-action-btn edit"
                          title="Edit Breakdown"
                          onClick={() => openEditModal(item)}
                        >
                          <Pencil size={15} />
                        </button>

                        {item.status !== "Resolved" && (
                          <button
                            className="breakdown-action-btn status"
                            title="Update Status"
                            onClick={() => updateStatus(item)}
                          >
                            <CheckCircle size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="breakdown-modal-overlay">
          <div className="breakdown-modal">
            <div className="breakdown-modal-header">
              <h2>{editingId ? "Edit Breakdown" : "Register New Breakdown"}</h2>

              <button
                className="breakdown-modal-close"
                onClick={() => setModalOpen(false)}
                type="button"
              >
                <X size={19} />
              </button>
            </div>

            <form className="breakdown-form" onSubmit={handleSubmit}>
              <div className="breakdown-form-group">
                <label>Equipment *</label>

                <select
                  name="equipment_id"
                  value={form.equipment_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Equipment</option>

                  {equipment.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.equipment_code ||
                        item.equipment_name ||
                        `Equipment #${item.id}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="breakdown-form-group">
                <label>Breakdown Description *</label>

                <textarea
                  name="description"
                  placeholder="Describe the equipment problem..."
                  value={form.description}
                  onChange={handleChange}
                  required
                  minLength={3}
                />
              </div>

              <div className="breakdown-form-row">
                <div className="breakdown-form-group">
                  <label>Severity *</label>

                  <select
                    name="severity"
                    value={form.severity}
                    onChange={handleChange}
                    required
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div className="breakdown-form-group">
                  <label>Reported By *</label>

                  <input
                    type="text"
                    name="reported_by"
                    placeholder="Enter reporter name"
                    value={form.reported_by}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="breakdown-form-actions">
                <button
                  type="button"
                  className="breakdown-cancel-btn"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="breakdown-submit-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update Breakdown"
                      : "Register Breakdown"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Breakdown;
