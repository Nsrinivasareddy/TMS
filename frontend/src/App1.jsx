



// File Name: frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Navbar from './components/Navbar';
import SectionNavbar from './components/SectionNavbar';

const App = () => {
    const [userData, setUserData] = useState(null);
    const [showSectionNav, setShowSectionNav] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) setUserData(JSON.parse(savedUser));
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('user');
        setUserData(null);
        navigate('/');
    };

    if (!userData) {
        return (
            <Routes>
                <Route path="/" element={<Login setUserData={setUserData} />} />
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        );
    }

    return (
        <div style={{ background: '#0f172a', minHeight: '100vh' }}>
            {/* Navbar Toggle Logic */}
            {!showSectionNav ? (
                <Navbar 
                    userData={userData} 
                    onLogout={handleLogout} 
                    onSectionClick={() => setShowSectionNav(true)} 
                />
            ) : (
                <SectionNavbar 
                    userData={userData} 
                    onBackToMain={() => setShowSectionNav(false)} 
                />
            )}

            <Routes>
                <Route path="/home" element={<div style={{padding:'50px', color:'white'}}><h1>Welcome to Dashboard</h1></div>} />
                <Route path="/section/:sectionName" element={<div style={{padding:'50px', color:'white'}}><h1>Select a Work Program</h1></div>} />
                {/* ఇతర రూట్స్ ఇక్కడ వస్తాయి */}
            </Routes>
        </div>
    );
};

export default App;