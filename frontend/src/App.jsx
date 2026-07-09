import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";

import Login from "./pages/Login";
import Navbar from "./components/Navbar";
import SectionNavbar from "./components/SectionNavbar";
import Registration from "./pages/Registration";
import FreightBooking from "./pages/FreightBooking";
import MasterEntry from "./pages/MasterEntry";
import ShedOutPage from "./pages/ShedOutPage"; // 🌟 మీ పాత లారీ సెలెక్షన్ ఒరిజినల్ పేజీ

const App = () => {
  const [userData, setUserData] = useState(null);
  const [showSectionNav, setShowSectionNav] = useState(false);
  const [currentSection, setCurrentSection] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  // లోకల్ స్టోరేజ్ నుండి యూజర్ సెషన్‌ను లోడ్ చేయడం
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUserData(parsedUser);
      // యూజర్ డేటా లోడ్ అవ్వగానే ఆటోమేటిక్‌గా సెక్షన్ ట్రాక్ చేయడం కోసం
      if (parsedUser.sectionName || parsedUser.section) {
        setCurrentSection((parsedUser.sectionName || parsedUser.section).toUpperCase());
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUserData(null);
    setCurrentSection("");
    setShowSectionNav(false);
    navigate("/");
  };

  const handleSectionClick = (sectionName) => {
    setCurrentSection(sectionName.toUpperCase());
    setShowSectionNav(true);
  };

  const handleBackToMain = () => {
    setShowSectionNav(false);
    setCurrentSection("");
    navigate("/home");
  };

  const handleBackToBranches = () => {
    setCurrentSection("BRANCHES");
    setShowSectionNav(true);
    navigate("/section/branches");
  };

  // ==========================================
  // 1. లాగిన్ అవ్వకముందు చూپے రూట్లు (Unauthenticated)
  // ==========================================
  if (!userData) {
    return (
      <Routes>
        <Route path="/" element={<Login setUserData={setUserData} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    );
  }

  // 🌟 FULL SCREEN UI CHECK - పాత స్క్రీన్ ఓపెన్ అయినప్పుడు నవ్‌బార్ హైడ్ అయ్యేలా పక్కా కండిషన్స్
  const isBookingPage = location.pathname === "/section/branches/booking-form";
  const isShedOutPage = 
    location.pathname === "/section/shed/shed-out" || 
    location.pathname === "/section/shed/driver-entry" ||
    location.pathname === "/section/universal-movement"; // 🎯 ఇది కూడా యాడ్ చేశాం

  // ==========================================
  // 2. లాగిన్ అయిన తర్వాత చూپے రూట్లు (Authenticated)
  // ==========================================
  return (
    <div style={{ background: "#0a192f", minHeight: "100vh", color: "white" }}>
      {/* --- NAVBAR LOGIC --- */}
      {!showSectionNav ? (
        <Navbar
          userData={userData}
          onLogout={handleLogout}
          onSectionClick={handleSectionClick}
        />
      ) : (
        // 🎯 బుకింగ్ లేదా షెడ్ అవుట్ పాత పేజీల్లో ఉన్నప్పుడు సెక్షన్ నవ్‌బార్ కనిపించదు
        (!isBookingPage && !isShedOutPage) && (
          <SectionNavbar
            userData={userData}
            sectionName={currentSection}
            onBackToMain={handleBackToMain}
          />
        )
      )}

      {/* --- CONTENT AREA --- */}
      <div style={{ padding: "20px" }}>
        <Routes>
          {/* హోమ్ స్క్రీన్ */}
          <Route
            path="/home"
            element={
              <div style={{ textAlign: "center", marginTop: "50px" }}>
                <h2>Welcome, {userData.userName || userData.userId}!</h2>
                <p>
                  STATION: {userData.stationName || userData.sCode} | SECTION: {userData.sectionName || userData.section}
                </p>
              </div>
            }
          />

          {/* అడ్మిన్ రిజిస్ట్రేషన్ */}
          <Route path="/section/admin/registration" element={<Registration />} />

          {/* మాస్టర్ ఎంట్రీ రూట్ */}
          <Route path="/section/mainacs/master-entry" element={<MasterEntry userData={userData} />} />

          {/* ========================================================================= */}
          // 🌟 హార్డ్ కోడెడ్ రూట్స్: ఇవి జెనరిక్ రూట్స్ కన్నా ముందే ఉండాలి (పాత స్క్రీన్ ఇక్కడే ఓపెన్ అవుతుంది)
          {/* ========================================================================= */}
          
          {/* 🎯 TMENT మరియు BRANCHES బటన్ల కోసం కొత్త యూనివర్సల్ పాత్ */}
          <Route
            path="/section/universal-movement"
            element={<ShedOutPage />}
          />

          {/* 🚛 పాత షెడ్ లింకులు - పక్కాగా పాత లారీ సెలెక్షన్ స్క్రీన్ కి కనెక్ట్ చేశాం */}
          <Route
            path="/section/shed/shed-out"
            element={<ShedOutPage />}
          />
          <Route
            path="/section/shed/driver-entry"
            element={<ShedOutPage />}
          />

          {/* బుకింగ్ ప్రోగ్రామ్ స్క్రీన్ */}
          <Route
            path="/section/branches/booking-form"
            element={
              <FreightBooking
                userData={userData}
                sectionName={currentSection}
                onBackToBranches={handleBackToBranches}
              />
            }
          />

          {/* ⚠️ GENERIC ROUTE 1: నిర్దిష్టమైన రూట్ మ్యాచ్ కానప్పుడు మాత్రమే ఇది రన్ అవ్వాలి */}
          <Route
            path="/section/:sectionName"
            element={
              <div style={{ textAlign: "center", marginTop: "50px" }}>
                <h2>{currentSection || "Work"} Section Home</h2>
                <p>Please select a work program from the menu above.</p>
              </div>
            }
          />

          {/* ⚠️ GENERIC ROUTE 2: ఒకవేళ మెనూ లో వేరే ప్రోగ్రామ్ క్లిక్ చేస్తే వచ్చే డైనమిక్ స్క్రీన్ */}
          <Route
            path="/section/:sectionName/:workName"
            element={
              <div style={{ textAlign: "center", marginTop: "50px" }}>
                <h2>
                  Work Program:{" "}
                  {location.pathname.split("/").pop().toUpperCase()}
                </h2>
                <p>Program content will be loaded here.</p>
              </div>
            }
          />

          {/* ఏ రూట్ మ్యాచ్ కాకపోతే హోమ్‌కు రిడైరెక్ట్ అవుతుంది */}
          <Route path="*" element={<Navigate to="/home" />} />
        </Routes>
      </div>
    </div>
  );
};

export default App;
