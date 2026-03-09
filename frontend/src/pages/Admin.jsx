// filepath: frontend/src/pages/Admin.jsx
import { useState, useEffect } from "react";
import axios from "../api/axios";
import "../styles/admin.css";

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get("/admin/users");
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserPlan = async (userId, plan, planExpiration) => {
    try {
      await axios.put(`/admin/user/${userId}/plan`, { plan, planExpiration });
      fetchUsers(); // Refresh the list
      setEditingUser(null);
    } catch (error) {
      console.error("Error updating user plan:", error);
    }
  };

  const getPlanColor = (plan, status) => {
    if (status === "expired") return "#dc2626";
    switch (plan) {
      case "free": return "#6b7280";
      case "silver": return "#d97706";
      case "gold": return "#d4af37";
      default: return "#6b7280";
    }
  };

  if (loading) return <div className="loading-state">Loading users...</div>;

  return (
    <div className="admin-container">
      <h1>Admin Panel - User Management</h1>

      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Expiration</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <span
                    style={{
                      color: getPlanColor(user.plan, user.planStatus),
                      fontWeight: "bold"
                    }}
                  >
                    {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)}
                  </span>
                </td>
                <td>
                  <span className={`status ${user.planStatus}`}>
                    {user.planStatus}
                  </span>
                </td>
                <td>
                  {user.planExpiration
                    ? new Date(user.planExpiration).toLocaleString()
                    : "Never"
                  }
                </td>
                <td>
                  {editingUser === user._id ? (
                    <PlanEditor
                      user={user}
                      onSave={(plan, expiration) => updateUserPlan(user._id, plan, expiration)}
                      onCancel={() => setEditingUser(null)}
                    />
                  ) : (
                    <button
                      onClick={() => setEditingUser(user._id)}
                      className="edit-button"
                    >
                      Edit Plan
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PlanEditor({ user, onSave, onCancel }) {
  const [plan, setPlan] = useState(user.plan);
  const [expiration, setExpiration] = useState(
    user.planExpiration ? new Date(user.planExpiration).toISOString().slice(0, 16) : ""
  );

  const handleSave = () => {
    const expDate = plan === "free" ? null : expiration ? new Date(expiration) : null;
    onSave(plan, expDate);
  };

  return (
    <div className="plan-editor">
      <select value={plan} onChange={(e) => setPlan(e.target.value)}>
        <option value="free">Free</option>
        <option value="silver">Silver</option>
        <option value="gold">Gold</option>
      </select>
      {plan !== "free" && (
        <input
          type="datetime-local"
          value={expiration}
          onChange={(e) => setExpiration(e.target.value)}
        />
      )}
      <button onClick={handleSave} className="save-button">Save</button>
      <button onClick={onCancel} className="cancel-button">Cancel</button>
    </div>
  );
}