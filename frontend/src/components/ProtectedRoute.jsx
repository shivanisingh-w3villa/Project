//protectedRoute.jsx

import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, requiredRole }) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  if (!token) return <Navigate to="/" />;
  if (requiredRole && user?.role !== requiredRole) {
    // unauthorized for this role, send back to home
    return <Navigate to="/home" />;
  }

  return children;
}
