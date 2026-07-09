// File Name: frontend/src/components/Navbar.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/navbar.css';

const Navbar = ({ userData, onLogout, onSectionClick }) => {
    const sections = ["ADMIN", "BUSINESS", "MAINACS", "DCRACS", "LCO", "INVOICE", "TMENT", "LPD", "SHED", "COMPUTERS", "BRANCHES"];

    const handleProtectedClick = (e, section) => {
        // 1. అడ్మిన్ కి కాకుండా వేరే యూజర్ కి రాంగ్ సెక్షన్ అయితే అలర్ట్ ఇస్తుంది
        if (userData.userId !== 'admin123' && userData.sectionName !== section) {
            e.preventDefault();
            alert(`⛔ మీకు ${section} సెక్షన్‌కు వెళ్లే అనుమతి లేదు! కేవలం ${userData.sectionName} మాత్రమే ఓపెన్ చేయగలరు.`);
            return;
        }

        // 2. పర్మిషన్ ఉంటే App.jsx లోని ఫంక్షన్ కి ఆ సెక్షన్ పేరును పంపిస్తుంది
        setTimeout(() => {
            onSectionClick(section); // ⭐ ఇక్కడ పేరు వెళ్తుంది
        }, 50);
    };

    return (
        <nav className="main-navbar">
            {/* Left Side Details */}
            <div className="nav-user-details" style={{ display: 'flex', flexDirection: 'column', gap: '2px', lineHeight: '1.2' }}>
                <span style={{ color: '#00d2ff', fontSize: '13px', fontWeight: 'bold' }}>
                    USER ID : <strong style={{ color: '#fff' }}>{userData.userId}</strong>
                </span>
                <span style={{ color: '#00d2ff', fontSize: '13px', fontWeight: 'bold' }}>
                    SECTION : <strong style={{ color: '#fff' }}>{userData.sectionName}</strong>
                </span>
                <span style={{ color: '#00d2ff', fontSize: '12px', fontWeight: 'bold' }}>
                    STATION : <strong style={{ color: '#fff' }}>{userData.stationName}</strong>
                </span>
                <span style={{ color: '#00d2ff', fontSize: '12px', fontWeight: 'bold' }}>
                    S.CODE : <strong style={{ color: '#fff' }}>{userData.stationCode}</strong>
                </span>
            </div>

            {/* Middle: 10 Section Links */}
            <div className="nav-links-list">
                {sections.map(section => (
                    <Link 
                        key={section} 
                        to={`/section/${section.toLowerCase()}`} 
                        className="nav-item-link"
                        onClick={(e) => handleProtectedClick(e, section)}
                        style={{ textDecoration: 'none' }}
                    >
                        {section}
                    </Link>
                ))}
            </div>

            {/* Right Side: Logout */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <button className="logout-button" onClick={onLogout}>
                    LOGOUT
                </button>
            </div>
        </nav>
    );
};

export default Navbar;