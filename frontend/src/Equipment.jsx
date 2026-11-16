import { useEffect, useState } from "react";
import { Plus, RefreshCw, Pencil, Power, Search, X } from "lucide-react";
import api from "../services/api";
import "./Equipment.css";

const emptyForm = {
  equipment_code: "",
  name: "",
  department: "",
  equipment_type: "",
  location: "",
  criticality: "Medium",
};

export default function Equipment() {
  const [equipment, setEquipment] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/api/equipment/");
      setEquipment(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error(err);
      setError("Unable to load equipment. Check the backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setMessage("");
    setShowForm(true);
  };

  const openEditForm = (item) => {
    setEditingId(item.id);
    setForm({
      equipment_code: item.equipment_code || "",
      name: item.name || "",
      department: item.department || "",
      equipment_type: item.equipment_type || "",
      location: item.location || "",
      criticality: item.criticality || "Medium",
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
        await api.put(`/api/equipment/${editingId}`, form);
        setMessage("Equipment updated successfully.");
      } else {
        await api.post("/api/equipment/", form);
        setMessage("Equipment added successfully.");
      }

      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      await fetchEquipment();
    } catch (err) {
      console.error(err);
      setError(
        typeof err.response?.data?.detail === "string"
          ? err.response.data.detail
          : "Unable to save equipment. Check the entered details.",
      );
    }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm("Deactivate this equipment?")) return;

    try {
      setError("");
      await api.patch(`/api/equipment/${id}/deactivate`);
      setMessage("Equipment deactivated successfully.");
      await fetchEquipment();
    } catch (err) {
      console.error(err);
      setError(
        typeof err.response?.data?.detail === "string"
          ? err.response.data.detail
          : "Unable to deactivate equipment.",
      );
    }
  };

  const filteredEquipment = equipment.filter((item) => {
    const term = search.toLowerCase();

    return (
      (item.equipment_code || "").toLowerCase().includes(term) ||
      (item.name || "").toLowerCase().includes(term) ||
      (item.department || "").toLowerCase().includes(term) ||
      (item.location || "").toLowerCase().includes(term)
    );
  });

  const activeCount = equipment.filter((item) => item.is_active).length;

  return (
    <div className="equipment-page">
      <div className="equipment-heading">
        <div>
          <h1>Equipment Management</h1>
          <p>Register and manage your plant equipment.</p>
        </div>

        <button className="primary-btn" onClick={openAddForm}>
          <Plus size={18} /> Add Equipment
        </button>
      </div>

      <div className="equipment-stats">
        <div className="equipment-stat-card">
          <span>Total Equipment</span>
          <h2>{equipment.length}</h2>
        </div>
        <div className="equipment-stat-card">
          <span>Active Equipment</span>
          <h2>{activeCount}</h2>
        </div>
      </div>

      {message && <div className="equipment-success">{message}</div>}
      {error && <div className="equipment-error">{error}</div>}

      <div className="equipment-table-panel">
        <div className="equipment-toolbar">
          <div>
            <h3>Equipment List</h3>
            <p>Manage registered equipment records.</p>
          </div>

          <div className="equipment-actions">
            <div className="equipment-search">
              <Search size={17} />
              <input
                placeholder="Search equipment..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <button className="refresh-btn" onClick={fetchEquipment}>
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        {loading ? (
          <p className="equipment-loading">Loading equipment...</p>
        ) : (
          <div className="equipment-table-wrapper">
            <table className="equipment-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Criticality</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredEquipment.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="empty-equipment">
                      No equipment records found.
                    </td>
                  </tr>
                ) : (
                  filteredEquipment.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.equipment_code}</td>
                      <td>{item.name}</td>
                      <td>{item.department}</td>
                      <td>{item.equipment_type}</td>
                      <td>{item.location}</td>
                      <td>
                        <span
                          className={`criticality ${String(item.criticality || "").toLowerCase()}`}
                        >
                          {item.criticality}
                        </span>
                      </td>
                      <td>
                        <span
                          className={
                            item.is_active ? "status-active" : "status-inactive"
                          }
                        >
                          {item.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <div className="equipment-row-actions">
                          <button
                            className="edit-btn"
                            onClick={() => openEditForm(item)}
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </button>

                          {item.is_active && (
                            <button
                              className="deactivate-btn"
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
        <div className="equipment-modal-overlay">
          <div className="equipment-modal">
            <div className="equipment-modal-header">
              <div>
                <h2>
                  {editingId !== null ? "Edit Equipment" : "Add Equipment"}
                </h2>
                <p>Enter equipment information.</p>
              </div>

              <button
                className="close-btn"
                type="button"
                onClick={() => setShowForm(false)}
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="equipment-form-grid">
                <div className="equipment-form-group">
                  <label>Equipment Code *</label>
                  <input
                    name="equipment_code"
                    value={form.equipment_code}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="equipment-form-group">
                  <label>Equipment Name *</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="equipment-form-group">
                  <label>Department *</label>
                  <input
                    name="department"
                    value={form.department}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="equipment-form-group">
                  <label>Equipment Type *</label>
                  <input
                    name="equipment_type"
                    value={form.equipment_type}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="equipment-form-group">
                  <label>Location *</label>
                  <input
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="equipment-form-group">
                  <label>Criticality *</label>
                  <select
                    name="criticality"
                    value={form.criticality}
                    onChange={handleChange}
                    required
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="equipment-form-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>

                <button type="submit" className="primary-btn">
                  {editingId !== null ? "Update Equipment" : "Save Equipment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
