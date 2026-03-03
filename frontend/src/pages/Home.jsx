//home.jsx

import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  return (
    <div>
      <h2>Welcome User</h2>

      <button onClick={() => navigate("/profile")}>
        Go to Profile
      </button>

      <button onClick={logout}>Logout</button>
    </div>
  );
}