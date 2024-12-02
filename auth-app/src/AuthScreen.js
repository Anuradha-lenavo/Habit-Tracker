import './AuthScreen.css';
import React, { useState } from 'react';
import { FaGoogle, FaFacebook, FaUser, FaEnvelope, FaLock } from 'react-icons/fa';
import axios from 'axios';
import { motion } from 'framer-motion';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

function AuthScreen({ onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    otp: '',
  });
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const toggleAuthMode = () => {
    setIsSignUp((prevMode) => !prevMode);
    setError('');
    setOtpSent(false);
  };

  const textAnimation = {
    hidden: { opacity: 0, x: -50 }, // Start off-screen to the left
    visible: { opacity: 10, x: 5 }, // Fade in and slide to position
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleGetOtp = async () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!passwordRegex.test(formData.password)) {
      setError('Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/auth/send-otp', {
        email: formData.email,
      });

      if (response.data.success) {
        setOtpSent(true);
        setError('');
      } else {
        setError(response.data.message || 'Failed to send OTP');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while sending OTP');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSignUp) {
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      if (!passwordRegex.test(formData.password)) {
        setError('Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.');
        return;
      }

      if (!otpSent) {
        setError('Please get and enter the OTP');
        return;
      }

      try {
        const otpResponse = await axios.post('http://localhost:5000/api/auth/validate-otp', {
          email: formData.email,
          otp: formData.otp,
        });

        if (!otpResponse.data.success) {
          setError('Invalid OTP');
          return;
        }
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to validate OTP');
        return;
      }
    }

    const endpoint = isSignUp ? '/register' : '/login';
    try {
      const response = await axios.post(`http://localhost:5000/api/auth${endpoint}`, formData);

      if (response.data.token) {
        console.log('User authenticated:', response.data);
        localStorage.setItem('token', response.data.token);
        onLoginSuccess();
      }
    } catch (error) {
      console.error('Error:', error.response?.data || error.message);
      setError(error.response?.data?.message || 'An error occurred');
    }
  };

  return (
    <div className="header-container">
      <div className="header">
        <div className="logo">
          <div className="logo-dot green"></div>
          <div className="logo-dot white"></div>
          <h1>Trackify</h1>
        </div>
        <p>Stay on track with your Trackify</p>
      </div>

      <div className="auth-container">
        
        <div className="text-section">
        <motion.div
    className="text-section"
    initial="hidden"
    animate="visible"
    transition={{ duration: 1 }} // Animation duration
    variants={textAnimation}
  >
          <h2>Welcome to Trackify</h2>
          <p>Track your tasks, achieve your goals, and manage your time efficiently.</p>
          <p>{isSignUp ? "Sign up today and get started!" : "Sign in to continue your journey."}</p>
          </motion.div>
        </div>

        <div className="form-section">
          <div className="auth-toggle">
            <button className={isSignUp ? 'active' : ''} onClick={() => setIsSignUp(true)}>
              Sign Up
            </button>
            <button className={!isSignUp ? 'active' : ''} onClick={() => setIsSignUp(false)}>
              Sign In
            </button>
          </div>
          <form onSubmit={handleSubmit} className="auth-form">
            {isSignUp && (
              <div className="input-group">
                <FaUser className="icon" />
                <input
                  type="text"
                  placeholder="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>
            )}
            <div className="input-group">
              <FaEnvelope className="icon" />
              <input
                type="email"
                placeholder="Email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
            <div className="input-group">
              <FaLock className="icon" />
              <input
                type="password"
                placeholder="Password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
              />
            </div>
            {isSignUp && (
              <>
                <div className="input-group">
                  <FaLock className="icon" />
                  <input
                    type="password"
                    placeholder="Confirm Password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                  />
                </div>
                {!otpSent && (
                  <button type="button" className="otp-button" onClick={handleGetOtp}>
                    Get OTP
                  </button>
                )}
                {otpSent && (
                  <div className="input-group">
                    <input
                      type="text"
                      placeholder="Enter OTP"
                      name="otp"
                      value={formData.otp}
                      onChange={handleInputChange}
                    />
                  </div>
                )}
              </>
            )}
            {error && <p className="error-message">{error}</p>}
            <button type="submit" className="submit-button">
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AuthScreen;
