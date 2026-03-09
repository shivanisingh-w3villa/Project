import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";

export default function Home() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="home-container">
        <div className="home-hero">
          <h1>Welcome to Your Dashboard</h1>
          <p className="home-subtitle">
            Manage your profile, view payment options, and more.
          </p>
        </div>

        <div className="home-cards">
          <div className="home-card" onClick={() => navigate("/profile")}>
            <div className="home-card-icon">👤</div>
            <h3>Profile</h3>
            <p>View and edit your profile information</p>
          </div>

          <div className="home-card" onClick={() => navigate("/payment")}>
            <div className="home-card-icon">💳</div>
            <h3>Payment</h3>
            <p>Manage your subscription plans</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

