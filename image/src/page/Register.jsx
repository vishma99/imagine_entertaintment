import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/register.css";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "Admin",
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5001/api/user/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert("Registration Successful!");
        navigate("/login");
      } else {
        const data = await response.json();
        alert(data.message);
      }
    } catch (error) {
      alert("Connection Error");
    }
  };

  return (
    <div className="auth-container1">
      <div className="auth-card1">
        <h2 className="auth-title1">Create Account</h2>
        <p className="auth-subtitle1">Join Imagine Entertainment Team</p>

        <form onSubmit={handleSubmit}>
          <div className="input-group1">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              placeholder="Enter your name"
              onChange={handleChange}
              value={formData.name}
              required
            />
          </div>

          <div className="input-group1">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="email@imagine.com"
              onChange={handleChange}
              value={formData.email}
              required
            />
          </div>

          <div className="input-group1">
            <label>User Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="auth-select1"
            >
              <option value="Admin">Admin</option>
              <option value="HR">HR</option>
              <option value="Marketing">Marketing</option>
              <option value="Section User">Section User</option>
            </select>
          </div>

          <div className="input-group1">
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              onChange={handleChange}
              value={formData.password}
              required
            />
          </div>

          <button type="submit" className="auth-btn1">
            Register Now
          </button>
        </form>
        <p className="auth-footer1">
          Already have an account?{" "}
          <span onClick={() => navigate("/login")}>Login</span>
        </p>
      </div>
    </div>
  );
};

export default Register;
