import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/sectionNavbar.css';

const SectionNavbar = ({ userData, sectionName, onBackToMain }) => {
    const navigate = useNavigate();
    
    // సబ్-మెనూని మేనేజ్ చేయడానికి స్టేట్ (ఉదా: ENTRY)
    const [activeSubMenu, setActiveSubMenu] = useState(null);

    // సెక్షన్ మారినప్పుడల్లా సబ్-మెనూని रीసెట్ చేయడానికి
    useEffect(() => {
        setActiveSubMenu(null);
    }, [sectionName]);

    // SRINIVASA ROAD TRANSPORT మెయిన్ సెక్షన్స్ వర్క్ డేటా
    const sectionsWorkData = {
        ADMIN: ["REGISTRATION", "RESET USER", "MASTERS", "ATTENDENCE", "DISPATCHES", "CLAIMS", "SYSTEM LOGS"],
        BUSINESS: ["QUOTATIONS", "CLIENTS", "CONTRACTS", "B-REPORTS"],
        MAINACS: ["ENTRY", "REPORTS", "RECONCILS"],
        DCRACS: ["DAILY CASH", "DCR ENTRY", "DCR VERIFY", "DCR REPORTS"],
        LCO: ["LCO LIST", "LCO ASSIGN", "LCO PAYMENTS", "LCO HISTORY"],
        INVOICE: ["GENERATE", "PENDING", "PAID INVOICES", "TAX INVOICE"],
        
        // 🎯 TMENT మరియు BRANCHES లో కూడా మన మూవ్‌మెంట్ బటన్లను పక్కాగా సెట్ చేశాం
        TMENT: ["LORRY MOVEMENT", "TMS ENTRY", "TMS REPORTS"],
        LPD: ["LPD ENTRY", "LPD LIST", "LPD VERIFY", "LPD SUMMARY"],
        SHED: ["SHED IN", "SHED OUT", "STOCK", "SHED REPORTS"],
        BRANCHES: ["LORRY MOVEMENT", "BOOKING", "DELIVERY", "REMARKS", "REPORTS", "CLAIMS", "CALCULATOR"]
    };

    // ENTRY నొక్కినప్పుడు లోపల కనిపించాల్సిన సబ్-మెనూ ఆప్షన్స్
    const subMenusData = {
        ENTRY: ["MASTERS", "VOUCHERS", "CASH BOOK"]
    };

    // ప్రస్తుతం చూపించాల్సిన వర్క్ బటన్ల లిస్ట్
    let currentWorks = activeSubMenu 
        ? subMenusData[activeSubMenu] 
        : (sectionsWorkData[sectionName] || []);

    // ADMIN సెక్షన్ లాజిక్ (రక్షణ కోసం)
    if (sectionName === "ADMIN" && userData.userId !== "admin123") {
        currentWorks = currentWorks.filter(work => work !== "REGISTRATION");
    }

    return (
        <nav className="sec-nav-container">
            {/* 1. Left Side: User & Section Details */}
            <div className="sec-nav-left" style={{ display: 'flex', flexDirection: 'column', gap: '2px', lineHeight: '1.2' }}>
                <span style={{ color: '#00d2ff', fontSize: '13px', fontWeight: 'bold' }}>
                    USER ID : <strong style={{ color: '#fff' }}>{userData.userId}</strong>
                </span>
                <div style={{ color: '#00d2ff', fontSize: '13px', fontWeight: 'bold' }}>
                    SECTION : <strong style={{ color: '#fff' }}>{sectionName}</strong>
                </div>
                <div style={{ color: '#00d2ff', fontSize: '12px', fontWeight: 'bold' }}>
                    S.CODE : <strong style={{ color: '#fff' }}>{userData.stationCode}</strong>
                </div>
            </div>

            {/* 2. Middle: Dynamic Work Buttons */}
            <div className="sec-nav-center">
                {currentWorks.map((workName) => {
                    
                    // A. ENTRY బటన్ నొక్కినప్పుడు సబ్-మెనూ ఓపెన్ అవుతుంది
                    if (workName === "ENTRY") {
                        return (
                            <button 
                                key={workName} 
                                className="work-btn"
                                onClick={() => setActiveSubMenu("ENTRY")}
                                style={{ backgroundColor: '#2d3748', border: '1px solid #ecc94b' }}
                            >
                                {workName} 📂
                            </button>
                        );
                    }

                    // B. MASTERS బటన్ (ఇది ENTRY లోపల ఉంటుంది)
                    if (workName === "MASTERS") {
                        return (
                            <Link
                                key={workName}
                                to="/section/mainacs/master-entry"
                                className="work-btn"
                                style={{ backgroundColor: '#2b6cb0', color: '#fff', border: '1px solid #fff' }}
                            >
                                {workName}
                            </Link>
                        );
                    }

                    // C. LORRY MASTER బటన్ లాజిక్
                    if (workName === "LORRY MASTER") {
                        return (
                            <Link 
                                key={workName} 
                                to="/admin/lorry-master" 
                                className="work-btn"
                                style={{ backgroundColor: '#2b6cb0', color: '#fff', border: '1px solid #ecc94b', fontWeight: 'bold' }}
                            >
                                🚚 {workName}
                            </Link>
                        );
                    }

                    // D. BOOKING బటన్ లాజిక్
                    if (workName === "BOOKING") {
                        return (
                            <Link key={workName} to="/section/branches/booking-form" className="work-btn">
                                {workName}
                            </Link>
                        );
                    }

                    {/* 🎯 E. SHED OUT బటన్ మార్పు: ఇది క్లిక్ చేయగానే మన కొత్త యూనివర్సల్ పేజీకి వెళ్తుంది */}
                    if (workName === "SHED OUT") {
                        return (
                            <Link 
                                key={workName} 
                                to="/section/universal-movement" 
                                className="work-btn"
                                style={{ backgroundColor: '#1a365d', color: '#fff', border: '1px solid #4ade80', fontWeight: 'bold' }}
                            >
                                SHED OUT 🚚
                            </Link>
                        );
                    }

                    {/* 🎯 F. TMENT / BRANCHES లలో "LORRY MOVEMENT" బటన్ లాజిక్ */}
                    if (workName === "LORRY MOVEMENT") {
                        return (
                            <Link 
                                key={workName} 
                                to="/section/universal-movement" 
                                className="work-btn"
                                style={{ backgroundColor: '#2c5282', color: '#fff', border: '1px solid #64ffda', fontWeight: 'bold' }}
                            >
                                🚛 LORRY MOVE (In/Out)
                            </Link>
                        );
                    }

                    // మిగతా సాధారణ బటన్ల ఆటోమేటిక్ రూటింగ్ లాజిక్
                    return (
                        <Link
                            key={workName}
                            to={`/section/${sectionName.toLowerCase()}/${workName.toLowerCase().replace(/\s+/g, '-')}`}
                            className="work-btn"
                        >
                            {workName}
                        </Link>
                    );
                })}
            </div>

            {/* 3. Right Side: Dynamic Back / Exit Button */}
            <div className="sec-nav-right">
                {activeSubMenu ? (
                    <button 
                        className="back-main-btn" 
                        onClick={() => setActiveSubMenu(null)}
                        style={{ backgroundColor: '#4a5568' }}
                    >
                        ⬅ BACK
                    </button>
                ) : (
                    <button className="back-main-btn" onClick={onBackToMain}>
                        ⬅ BACK
                    </button>
                )}
            </div>
        </nav>
    );
};

export default SectionNavbar;
