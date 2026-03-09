// filepath: frontend/src/pages/Payment.jsx
import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import axios from "../api/axios";
import Layout from "../components/Layout";
import "../styles/payment.css";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export default function Payment() {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [userPlan, setUserPlan] = useState(null);

  const plans = [
    {
      id: "free",
      name: "Free",
      price: 0,
      duration: "Unlimited",
      features: ["Basic features", "Limited access"],
    },
    {
      id: "silver",
      name: "Silver",
      price: 9.99,
      duration: "1 Hour",
      features: ["All basic features", "Priority support", "Advanced tools"],
    },
    {
      id: "gold",
      name: "Gold",
      price: 29.99,
      duration: "6 Hours",
      features: ["All Silver features", "Premium tools", "24/7 support"],
    },
  ];

  useEffect(() => {
    // Get current user's plan status
    const fetchUserPlan = async () => {
      try {
        const userId = localStorage.getItem("userId");
        if (userId) {
          const response = await axios.get(`/payment/plan-status/${userId}`);
          setUserPlan(response.data);
        }
      } catch (error) {
        console.error("Error fetching plan status:", error);
      }
    };

    fetchUserPlan();
  }, []);

  return (
    <Layout showBackButton backLink="/home">
      <div className="payment-container">
      <h1>Pricing Plans</h1>

      {userPlan && (
        <div className="current-plan">
          <h3>Current Plan: {userPlan.plan.charAt(0).toUpperCase() + userPlan.plan.slice(1)}</h3>
          <p>Status: {userPlan.status}</p>
          {userPlan.expiration && (
            <p>Expires: {new Date(userPlan.expiration).toLocaleString()}</p>
          )}
        </div>
      )}

      <div className="plans-grid">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`plan-card ${selectedPlan?.id === plan.id ? "selected" : ""} ${
              userPlan?.plan === plan.id && userPlan?.status === "active" ? "current" : ""
            }`}
          >
            <h2>{plan.name}</h2>
            <p className="price">
              {plan.price === 0 ? "Free" : `$${plan.price}`}
            </p>
            <p className="duration">{plan.duration}</p>
            <ul>
              {plan.features.map((feature, idx) => (
                <li key={idx}>✓ {feature}</li>
              ))}
            </ul>
            <button
              onClick={() => setSelectedPlan(plan)}
              className="plan-button"
              disabled={userPlan?.plan === plan.id && userPlan?.status === "active"}
            >
              {userPlan?.plan === plan.id && userPlan?.status === "active"
                ? "Current Plan"
                : selectedPlan?.id === plan.id
                ? "Selected"
                : plan.price === 0
                ? "Activate"
                : "Select Plan"}
            </button>
          </div>
        ))}
      </div>

      {selectedPlan && (
        <Elements stripe={stripePromise}>
          <PaymentForm plan={selectedPlan} onSuccess={() => window.location.reload()} />
        </Elements>
      )}
      </div>
    </Layout>
  );
}

function PaymentForm({ plan, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const userId = localStorage.getItem("userId");

      // Step 1: Create payment intent
      const intentRes = await axios.post("/payment/create-payment-intent", {
        userId,
        planId: plan.id,
      });

      if (intentRes.data.success) {
        // Free plan activated
        setSuccess(true);
        setTimeout(onSuccess, 2000);
        return;
      }

      const { clientSecret } = intentRes.data;

      // Step 2: Confirm payment with Stripe
      const { paymentIntent, error: stripeError } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
            billing_details: { name: "User" },
          },
        }
      );

      if (stripeError) {
        setError(stripeError.message);
        setLoading(false);
        return;
      }

      // Step 3: Confirm payment on backend
      const confirmRes = await axios.post("/payment/confirm-payment", {
        userId,
        planId: plan.id,
        paymentIntentId: paymentIntent.id,
      });

      const result = confirmRes.data;
      if (result.success) {
        setSuccess(true);
        setTimeout(onSuccess, 2000);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <h3>Payment Details - {plan.name} Plan</h3>

      <div className="card-element">
        <CardElement
          options={{
            style: {
              base: { fontSize: "16px", color: "#424770" },
              invalid: { color: "#9e2146" },
            },
          }}
        />
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">Payment successful! Plan activated.</div>}

      <button type="submit" disabled={!stripe || loading} className="payment-button">
        {loading ? "Processing..." : plan.price === 0 ? "Activate Free Plan" : `Pay $${plan.price}`}
      </button>
    </form>
  );
}
