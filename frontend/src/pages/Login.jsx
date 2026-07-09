// File Name: frontend/src/pages/Login.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/login.css'; // మీ కొత్త CSS ఫైల్

const Login = ({ setUserData }) => {
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await axios.post('https://tms-crh2.onrender.com/api/auth/login', {
                userId,
                password
            });

            localStorage.setItem('user', JSON.stringify(response.data.user));
            setUserData(response.data.user);
            navigate('/home');
        } catch (err) {
            setError(err.response?.data?.message || 'Login Failed. Try again.');
        }
    };

    return (
        <div className="login-page">
            <div className="login-card-elevated">
                <h1 className="logo-text">NSR TMS</h1>
                <p style={{ color: '#7e8ca1', marginBottom: '30px' }}>Train Management System</p>

                {error && <div className="error-msg">{error}</div>}
                
                <form onSubmit={handleLogin} autoComplete="off">
                    {/* User ID Field */}
                    <div className="input-group-modern">
                        <input 
                            type="text" 
                            value={userId} 
                            onChange={(e) => setUserId(e.target.value)} 
                            required 
                        />
                        <label>User ID</label>
                    </div>

                    {/* Password Field */}
                    <div className="input-group-modern">
                        <input 
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                        />
                        <label>Password</label>
                    </div>

                    <button type="submit" className="submit-btn-dynamic">
                        LOGIN TO SYSTEM
                    </button>
                </form>

                <div className="login-footer">
                    <p style={{ color: '#4a5568', fontSize: '12px' }}>
                        © 2026 NSR TMS | All Rights Reserved
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;