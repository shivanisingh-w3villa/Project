import { useNavigate, useLocation, Link } from "react-router-dom";

export default function Layout({
  children,
  showBackButton = false,
  backLink = "/home",
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userName = user.name || "User";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="app-layout">
      <nav className="navbar">
        <div className="navbar-brand" onClick={() => navigate("/home")}>
          <div className="navbar-logo">A</div>
          <span>AppName</span>
        </div>

        <div className="navbar-nav">
          <Link
            to="/home"
            className={`nav-link ${isActive("/home") ? "active" : ""}`}
          >
            Home
          </Link>
          <Link
            to="/profile"
            className={`nav-link ${isActive("/profile") ? "active" : ""}`}
          >
            Profile
          </Link>
          <Link
            to="/payment"
            className={`nav-link ${isActive("/payment") ? "active" : ""}`}
          >
            Payment
          </Link>
          {user.role === "admin" && (
            <Link
              to="/admin"
              className={`nav-link ${isActive("/admin") ? "active" : ""}`}
            >
              Admin
            </Link>
          )}
        </div>

        <div className="navbar-user">
          <span className="user-name">{userName}</span>
          <button className="btn-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <main className="page-container">
        {showBackButton && (
          <div className="main-content" style={{ paddingBottom: 0 }}>
            <button className="btn-back" onClick={() => navigate(backLink)}>
              ← Back
            </button>
          </div>
        )}
        <div className="main-content">{children}</div>
      </main>

      <footer className="footer">
        © {new Date().getFullYear()} AppName. All rights reserved.
      </footer>
    </div>
  );
}
