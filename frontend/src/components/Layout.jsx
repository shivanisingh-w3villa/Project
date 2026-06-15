import { useNavigate, useLocation, Link } from "react-router-dom";

export default function Layout({
  children,
  showBackButton = false,
  backLink = "/home",
  isPublic = false,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userName = user.name || "User";
  const hasToken = !!localStorage.getItem("token");
  const brandLink = hasToken ? "/home" : "/";
  const showProtectedNav = hasToken && !isPublic;

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
        <div className="navbar-brand" onClick={() => navigate(brandLink)}>
          <div className="navbar-logo">A</div>
          <span>AppName</span>
        </div>

        <div className="navbar-nav">
          {showProtectedNav && (
            <>
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
            </>
          )}
          {!hasToken && (
            <Link
              to="/"
              className={`nav-link ${isActive("/") ? "active" : ""}`}
            >
              Sign In
            </Link>
          )}
        </div>

        {hasToken ? (
          <div className="navbar-user">
            <span className="user-name">{userName}</span>
            <button className="btn-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        ) : (
          <div className="navbar-user legal-nav-links">
            <Link
              to="/privacy-policy"
              className={`nav-link ${isActive("/privacy-policy") ? "active" : ""}`}
            >
              Privacy
            </Link>
            <Link
              to="/terms-of-service"
              className={`nav-link ${isActive("/terms-of-service") ? "active" : ""}`}
            >
              Terms
            </Link>
          </div>
        )}
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
        <div className="footer-content">
          <span>© {new Date().getFullYear()} AppName. All rights reserved.</span>
          <div className="footer-links">
            <Link to="/privacy-policy">Privacy Policy</Link>
            <Link to="/terms-of-service">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
