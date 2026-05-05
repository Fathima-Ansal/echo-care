import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Auth.css';

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    
    // OTP states
    const [showOtp, setShowOtp] = useState(false);
    const [otp, setOtp] = useState('');

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const response = await fetch('http://localhost:5000/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Registration failed');
            }

            setSuccess(data.message || 'Registration successful! Please verify your email.');
            setShowOtp(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const response = await fetch('http://localhost:5000/api/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Verification failed');
            }

            setSuccess('Email verified successfully! Redirecting to login...');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>{showOtp ? 'Verify Email' : 'Create an Account'}</h2>
                {error && <div className="auth-error">{error}</div>}
                {success && <div className="auth-success">{success}</div>}
                
                {!showOtp ? (
                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label htmlFor="email">Email address</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="Enter your email"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="Create a password"
                            />
                        </div>
                        <button type="submit" disabled={loading} className="auth-button">
                            {loading ? 'Registering...' : 'Register'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOtp} className="auth-form">
                        <div className="form-group">
                            <label htmlFor="otp">Verification Code</label>
                            <input
                                type="text"
                                id="otp"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                required
                                placeholder="Enter 6-digit code"
                                maxLength="6"
                            />
                        </div>
                        <button type="submit" disabled={loading} className="auth-button">
                            {loading ? 'Verifying...' : 'Verify Email'}
                        </button>
                    </form>
                )}
                
                {!showOtp && (
                    <p className="auth-link">
                        Already have an account? <Link to="/login">Log In</Link>
                    </p>
                )}
            </div>
        </div>
    );
};

export default Register;
