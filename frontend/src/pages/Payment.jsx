import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";
import Layout from "../components/Layout";
import "../styles/payment.css";

// Helper functions (defined at top level before use)
const getPlanIcon = (planId) => {
  const icons = {
    free: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
      </svg>
    ),
    silver: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
      </svg>
    ),
    gold: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
      </svg>
    ),
  };
  return icons[planId];
};

const getPlanFeatures = (planId) => {
  const features = {
    free: ["Basic features", "Limited access"],
    silver: ["All basic features", "Priority support", "Advanced tools"],
    gold: ["All Silver features", "Premium tools", "24/7 support"],
  };
  return features[planId] || [];
};

const formatTime = (ms) => {
  if (!ms || ms <= 0) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

export default function Payment() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [userPlan, setUserPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [plans, setPlans] = useState([]);
  const [remainingTime, setRemainingTime] = useState(0);

  const fetchUserPlan = useCallback(async () => {
    try {
      const response = await axios.get("/payment/plan-status");
      setUserPlan(response.data);
      setRemainingTime(response.data.remainingTime || 0);
    } catch (error) {
      if (error.response?.status === 401) {
        setMessage({ type: "error", text: "Please login first" });
        navigate("/");
        return;
      }

      console.error("Error fetching plan status:", error);
    }
  }, [navigate]);

  // Fetch available plans
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await axios.get("/payment/plans");
        if (response.data.success) {
          const plansWithIcons = response.data.plans.map((plan) => ({
            ...plan,
            icon: getPlanIcon(plan.id),
            features: getPlanFeatures(plan.id),
          }));
          setPlans(plansWithIcons);
        }
      } catch (error) {
        if (error.response?.status === 401) {
          setMessage({ type: "error", text: "Please login first" });
          navigate("/");
        } else {
          console.error("Error fetching plans:", error);
        }
      }
    };
    fetchPlans();
  }, [navigate]);

  // Fetch user's current plan
  useEffect(() => {
    fetchUserPlan();
    // Refresh plan status every 30 seconds
    const interval = setInterval(fetchUserPlan, 30000);
    return () => clearInterval(interval);
  }, [fetchUserPlan]);

  useEffect(() => {
    if (!remainingTime || userPlan?.plan === "free") return;

    const timer = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1000) {
          fetchUserPlan();
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [fetchUserPlan, remainingTime, userPlan?.plan]);

  const handleActivatePlan = async (plan) => {
    if (loading) return;

    setLoading(true);
    setMessage(null);
    setSelectedPlan(plan);

    try {
      // Free plan doesn't require Stripe payment
      if (plan.id === "free") {
        const response = await axios.post("/payment/activate-free");

        if (response.data.success) {
          setMessage({
            type: "success",
            text: "Free plan activated successfully!",
          });
          setUserPlan({
            plan: plan.id,
            status: "active",
            expiration: null,
            remainingTime: 0,
          });
          setRemainingTime(0);
        }
      } else {
        const response = await axios.post("/payment/create-checkout-session", {
          planId: plan.id,
        });

        if (response.data?.url) {
          window.location.href = response.data.url;
          return;
        }

        setMessage({
          type: "error",
          text: "Stripe checkout URL was not returned",
        });
      }
    } catch (error) {
      if (error.response?.status === 401) {
        setMessage({
          type: "error",
          text: "Please login first",
        });
        navigate("/");
        return;
      }

      setMessage({
        type: "error",
        text: error.response?.data?.error || "Failed to activate plan",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout showBackButton backLink="/home">
      <div className="payment-container">
        <h1>Pricing Plans</h1>

        {userPlan && (
          <div className="current-plan">
            <span className="current-plan-badge">
              Current Plan:{" "}
              {userPlan.plan.charAt(0).toUpperCase() + userPlan.plan.slice(1)}
            </span>
            <p>
              Status:{" "}
              <span className={`status-badge ${userPlan.status}`}>
                {userPlan.status}
              </span>
            </p>
            {userPlan.expiration && (
              <>
                <div className="current-plan-expiration">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  Expires:{" "}
                  <strong>
                    {new Date(userPlan.expiration).toLocaleString()}
                  </strong>
                </div>
                {remainingTime > 0 && userPlan.status === "active" && (
                  <div className="current-plan-timer">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                    Time Remaining:{" "}
                    <strong className="timer-countdown">
                      {formatTime(remainingTime)}
                    </strong>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {message && (
          <div className={`message ${message.type}`}>{message.text}</div>
        )}

        <div className="plans-grid">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`plan-card ${selectedPlan?.id === plan.id ? "selected" : ""} ${
                userPlan?.plan === plan.id && userPlan?.status === "active"
                  ? "current"
                  : ""
              } ${plan.id}`}
            >
              <div className="plan-icon">{plan.icon}</div>
              <h2>{plan.name}</h2>
              <p className="price">{plan.displayPrice}</p>
              <p className="duration">{plan.duration}</p>
              <ul>
                {plan.features.map((feature, idx) => (
                  <li key={idx}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleActivatePlan(plan)}
                className="plan-button"
                disabled={
                  loading ||
                  (userPlan?.plan === plan.id && userPlan?.status === "active")
                }
              >
                {userPlan?.plan === plan.id && userPlan?.status === "active"
                  ? "Current Plan"
                  : loading && selectedPlan?.id === plan.id
                    ? "Processing..."
                    : plan.id === "free"
                      ? "Activate"
                      : `Buy - ${plan.displayPrice}`}
              </button>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
