import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/register.css";

const Login = () => {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("http://localhost:5001/api/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userRole", data.user.role);
        localStorage.setItem("userName", data.user.name);

        alert(`Welcome back, ${data.user.name}!`);

        // --- මෙන්න මෙතැනයි වෙනස සිදු වෙන්නේ ---
        if (data.user.role === "Admin") {
          navigate("/adminDashboard"); // Admin නම් කෙලින්ම Dashboard එකට
        } else {
          navigate("/"); // අනෙක් අය Home page එකට
        }

        window.location.reload();
      } else {
        setError(data.message || "Invalid Login Details");
      }
    } catch (err) {
      setError("Server connection failed.");
    }
  };

  return (
    <div className="auth-container1">
      <div className="auth-card1 login-card1">
        <h2 className="auth-title1">Welcome Back</h2>
        <p className="auth-subtitle1">Login to your dashboard</p>

        {/* Error message එකක් තිබේ නම් පෙන්වයි */}
        {error && (
          <p style={{ color: "red", textAlign: "center", fontSize: "14px" }}>
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group1">
            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="email@imagine.com"
              value={credentials.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="input-group1">
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={credentials.password}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className="auth-btn1">
            Sign In
          </button>
        </form>
        <p className="auth-footer1">
          Don't have an account?{" "}
          <span onClick={() => navigate("/register")}>Register</span>
        </p>
      </div>
    </div>
  );
};

export default Login;
