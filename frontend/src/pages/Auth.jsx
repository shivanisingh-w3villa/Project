//Auth.jsx

import { useState } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isLogin) {
      const res = await API.post("/auth/login", {
        email: form.email,
        password: form.password,
      });

      localStorage.setItem("token", res.data.token);
      navigate("/home");
    } else {
      await API.post("/auth/signup", form);
      alert("Signup successful! Please login.");
      setIsLogin(true);
    }
  };

  const socialLogin = (provider) => {
    window.location.href = `http://localhost:5000/auth/${provider}`;
  };

  return (
    <div>
      <h2>{isLogin ? "Login" : "Signup"}</h2>

      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <input
            placeholder="Name"
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
          />
        )}

        <input
          placeholder="Email"
          onChange={(e) =>
            setForm({ ...form, email: e.target.value })
          }
        />

        <input
          type="password"
          placeholder="Password"
          onChange={(e) =>
            setForm({ ...form, password: e.target.value })
          }
        />

        <button type="submit">
          {isLogin ? "Login" : "Signup"}
        </button>
      </form>

      <hr />

      <button onClick={() => socialLogin("google")}>
        Continue with Google
      </button>

      <button onClick={() => socialLogin("facebook")}>
        Continue with Facebook
      </button>

      <button onClick={() => socialLogin("microsoft")}>
        Continue with Microsoft
      </button>

      <p>
        {isLogin
          ? "Don't have an account?"
          : "Already have an account?"}

        <span
          style={{ cursor: "pointer", color: "blue" }}
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin ? " Signup" : " Login"}
        </span>
      </p>
    </div>
  );
}