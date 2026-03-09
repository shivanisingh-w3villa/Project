import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../api/axios";
import "./Auth.css";

export default function VerifyEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Invalid verification link.");
        return;
      }

      try {
        const res = await API.get(`/auth/verify/${token}`);
        if (res.data.success) {
          setStatus("success");
          setMessage(res.data.message);
        } else {
          setStatus("error");
          setMessage(res.data.message);
        }
      } catch (err) {
        setStatus("error");
        setMessage(
          err.response?.data?.message || 
          "Verification failed. The link may be invalid or expired."
        );
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="auth-container">
      <div className="auth-card verification-card">
        <div className="verification-icon">
          {status === "loading" && (
            <div className="spinner"></div>
          )}
          {status === "success" && (
            <div className="icon-success">✓</div>
          )}
          {status === "error" && (
            <div className="icon-error">✕</div>
          )}
        </div>

        <h2>
          {status === "loading" && "Verifying your email..."}
          {status === "success" && "Email Verified!"}
          {status === "error" && "Verification Failed"}
        </h2>

        <p className="verification-message">{message}</p>

        {status === "success" && (
          <Link to="/auth" className="btn-submit">
            Go to Login
          </Link>
        )}

        {status === "error" && (
          <div className="verification-actions">
            <Link to="/auth" className="btn-submit">
              Go to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

