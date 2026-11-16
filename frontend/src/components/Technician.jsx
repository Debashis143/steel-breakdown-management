import { useEffect, useState } from "react";
import {
  Plus,
  RefreshCw,
  Pencil,
  Power,
  Search,
  X,
  Users,
  UserCheck,
  Clock,
  UserX,
} from "lucide-react";

import api from "../services/api";
import "./Technician.css";

const emptyForm = {
  technician_code: "",
  full_name: "",
  department: "",
  specialization: "",
  phone_number: "",
  email: "",
  availability_status: "Available",
};

function Technician() {
  const [technicians, setTechnicians] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [availabilityFilter, setAvailabilityFilter] = useState("All");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchTechnicians = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/api/technicians/");
      setTechnicians(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Technician API Error:", err);
      setError(
        err.response?.data?.detail ||
          "Unable to load technicians. Check your backend.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTechnicians();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setMessage("");
    setShowForm(true);
  };

  const openEditForm = (technician) => {
    setEditingId(technician.id);

    setForm({
      technician_code: technician.technician_code || "",
      full_name: technician.full_name || "",
      department: technician.department || "",
      specialization: technician.specialization || "",
      phone_number: technician.phone_number || "",
      email: technician.email || "",
      availability_status: technician.availability_status || "Available",
    });

    setError("");
    setMessage("");
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError("");
      setMessage("");

      if (editingId !== null) {
        const updateData = {
          full_name: form.full_name,
          department: form.department,
          specialization: form.specialization,
          phone_number: form.phone_number || null,
          email: form.email || null,
          availability_status: form.availability_status,
        };

        await api.put(`/api/technicians/${editingId}`, updateData);

        setMessage("Technician updated successfully.");
      } else {
        await api.post("/api/technicians/", form);
        setMessage("Technician registered successfully.");
      }

      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);

      await fetchTechnicians();
    } catch (err) {
      console.error("Save Technician Error:", err);

      const detail = err.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : "Unable to save technician. Check the entered details.",
      );
    }
  };

  const handleAvailabilityChange = async (id, status) => {
    try {
      setError("");
      setMessage("");

      await api.patch(`/api/technicians/${id}/availability`, null, {
        params: { status },
      });

      setMessage("Technician availability updated.");
      await fetchTechnicians();
    } catch (err) {
      console.error("Availability Error:", err);
      setError(
        err.response?.data?.detail ||
          "Unable to update technician availability.",
      );
    }
  };

  const handleDeactivate = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to deactivate this technician?",
    );

    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      await api.patch(`/api/technicians/${id}/deactivate`);

      setMessage("Technician deactivated successfully.");
      await fetchTechnicians();
    } catch (err) {
      console.error("Deactivate Error:", err);
      setError(
        err.response?.data?.detail || "Unable to deactivate technician.",
      );
    }
  };

  const departments = [
    ...new Set(technicians.map((item) => item.department).filter(Boolean)),
  ];

  const filteredTechnicians = technicians.filter((item) => {
    const term = search.toLowerCase();

    const matchesSearch =
      (item.technician_code || "").toLowerCase().includes(term) ||
      (item.full_name || "").toLowerCase().includes(term) ||
      (item.department || "").toLowerCase().includes(term) ||
      (item.specialization || "").toLowerCase().includes(term);

    const matchesDepartment =
      departmentFilter === "All" || item.department === departmentFilter;

    const matchesAvailability =
      availabilityFilter === "All" ||
      item.availability_status === availabilityFilter;

    return matchesSearch && matchesDepartment && matchesAvailability;
  });

  const activeCount = technicians.filter((item) => item.is_active).length;

  const availableCount = technicians.filter(
    (item) => item.is_active && item.availability_status === "Available",
  ).length;

  const busyCount = technicians.filter(
    (item) => item.is_active && item.availability_status === "Busy",
  ).length;

  const getAvailabilityClass = (status) => {
    if (status === "Available") return "available";
    if (status === "Busy") return "busy";
    return "on-leave";
  };

  return (
    <div className="technician-page">
      <div className="technician-heading">
        <div>
          <h1>Technician Management</h1>
          <p>Register, monitor and manage plant technicians.</p>
        </div>

        <button className="tech-primary-btn" onClick={openAddForm}>
          <Plus size={18} />
          Add Technician
        </button>
      </div>

      <div className="technician-stats">
        <div className="technician-stat-card">
          <div className="tech-stat-icon blue">
            <Users size={22} />
          </div>
          <span>Total Technicians</span>
          <h2>{technicians.length}</h2>
        </div>

        <div className="technician-stat-card">
          <div className="tech-stat-icon green">
            <UserCheck size={22} />
          </div>
          <span>Active Technicians</span>
          <h2>{activeCount}</h2>
        </div>

        <div className="technician-stat-card">
          <div className="tech-stat-icon orange">
            <Clock size={22} />
          </div>
          <span>Available Technicians</span>
          <h2>{availableCount}</h2>
        </div>

        <div className="technician-stat-card">
          <div className="tech-stat-icon purple">
            <UserX size={22} />
          </div>
          <span>Busy Technicians</span>
          <h2>{busyCount}</h2>
        </div>
      </div>

      {message && <div className="tech-success">{message}</div>}

      {error && <div className="tech-error">{error}</div>}

      <div className="technician-table-panel">
        <div className="technician-toolbar">
          <div>
            <h3>Technician List</h3>
            <p>View and manage registered technicians.</p>
          </div>

          <div className="technician-filters">
            <div className="tech-search">
              <Search size={17} />
              <input
                type="text"
                placeholder="Search technicians..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="All">All Departments</option>
              {departments.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>

            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
            >
              <option value="All">All Availability</option>
              <option value="Available">Available</option>
              <option value="Busy">Busy</option>
              <option value="On Leave">On Leave</option>
            </select>

            <button
              className="tech-refresh-btn"
              onClick={fetchTechnicians}
              title="Refresh"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        {loading ? (
          <p className="tech-loading">Loading technicians...</p>
        ) : (
          <div className="technician-table-wrapper">
            <table className="technician-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Technician</th>
                  <th>Department</th>
                  <th>Specialization</th>
                  <th>Contact</th>
                  <th>Availability</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredTechnicians.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="empty-technician">
                      No technician records found.
                    </td>
                  </tr>
                ) : (
                  filteredTechnicians.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>

                      <td>
                        <strong>{item.full_name}</strong>
                        <small className="tech-code">
                          {item.technician_code}
                        </small>
                      </td>

                      <td>{item.department}</td>
                      <td>{item.specialization}</td>

                      <td>
                        <div className="tech-contact">
                          <span>{item.phone_number || "-"}</span>
                          <small>{item.email || "-"}</small>
                        </div>
                      </td>

                      <td>
                        {item.is_active ? (
                          <select
                            className={`availability-select ${getAvailabilityClass(
                              item.availability_status,
                            )}`}
                            value={item.availability_status}
                            onChange={(e) =>
                              handleAvailabilityChange(item.id, e.target.value)
                            }
                          >
                            <option value="Available">Available</option>
                            <option value="Busy">Busy</option>
                            <option value="On Leave">On Leave</option>
                          </select>
                        ) : (
                          <span className="availability-inactive">
                            Inactive
                          </span>
                        )}
                      </td>

                      <td>
                        <span
                          className={
                            item.is_active
                              ? "tech-status-active"
                              : "tech-status-inactive"
                          }
                        >
                          {item.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td>
                        <div className="tech-row-actions">
                          <button
                            className="tech-edit-btn"
                            onClick={() => openEditForm(item)}
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </button>

                          {item.is_active && (
                            <button
                              className="tech-deactivate-btn"
                              onClick={() => handleDeactivate(item.id)}
                              title="Deactivate"
                            >
                              <Power size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="tech-modal-overlay">
          <div className="tech-modal">
            <div className="tech-modal-header">
              <div>
                <h2>
                  {editingId !== null
                    ? "Edit Technician"
                    : "Register Technician"}
                </h2>
                <p>Enter technician information below.</p>
              </div>

              <button
                className="tech-close-btn"
                type="button"
                onClick={() => setShowForm(false)}
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="tech-form-grid">
                <div className="tech-form-group">
                  <label>Technician Code *</label>
                  <input
                    name="technician_code"
                    value={form.technician_code}
                    onChange={handleChange}
                    disabled={editingId !== null}
                    required
                  />
                </div>

                <div className="tech-form-group">
                  <label>Full Name *</label>
                  <input
                    name="full_name"
                    value={form.full_name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="tech-form-group">
                  <label>Department *</label>
                  <input
                    name="department"
                    value={form.department}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="tech-form-group">
                  <label>Specialization *</label>
                  <input
                    name="specialization"
                    value={form.specialization}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="tech-form-group">
                  <label>Phone Number</label>
                  <input
                    name="phone_number"
                    type="tel"
                    maxLength="15"
                    value={form.phone_number}
                    onChange={handleChange}
                  />
                </div>

                <div className="tech-form-group">
                  <label>Email Address</label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                  />
                </div>

                <div className="tech-form-group">
                  <label>Availability Status</label>
                  <select
                    name="availability_status"
                    value={form.availability_status}
                    onChange={handleChange}
                  >
                    <option value="Available">Available</option>
                    <option value="Busy">Busy</option>
                    <option value="On Leave">On Leave</option>
                  </select>
                </div>
              </div>

              <div className="tech-form-actions">
                <button
                  type="button"
                  className="tech-cancel-btn"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>

                <button type="submit" className="tech-primary-btn">
                  {editingId !== null
                    ? "Update Technician"
                    : "Register Technician"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Technician;
