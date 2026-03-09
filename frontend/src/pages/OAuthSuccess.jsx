//OAuthSucess.jsx

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";

export default function OAuthSuccess() {
  const navigate = useNavigate();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const handleToken = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");

      if (token) {
        localStorage.setItem("token", token);
        // call backend to get user profile (role etc.)
        try {
          const res = await fetch("http://localhost:5000/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const body = await res.json();
            localStorage.setItem("user", JSON.stringify(body.user));
            if (body.user.role === "admin") {
              navigate("/admin");
              return;
            }
          }
        } catch (e) {
          console.error("failed to fetch user info", e);
        }
        navigate("/home");
      }
    };
    handleToken();
  }, []);

  return <Layout><div className="oauth-loading"><h2>Logging you in...</h2></div></Layout>;
}
