import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import SectionNavbar from "../components/SectionNavbar";

const MasterEntry = () => {
  const navigate = useNavigate();
  const mainInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  // 🌟 లాగిన్ సెషన్ నుండి ఆపరేటర్ విభాగం ఆటోమేటిక్‌గా వస్తుంది
  // (టెస్టింగ్ కోసం ఇక్కడ 'ADMIN' లేదా 'MAINACS' మార్చి చూసుకోవచ్చు)
  const loginUser = { login_id: "nsreddy_srt", login_station: "VZA", login_section: "ADMIN" };

  const isAdmin = loginUser.login_section === "ADMIN";

  // ఫారమ్ స్టేట్
  const [formData, setFormData] = useState({
    master_type: isAdmin ? "STAFF" : "3000S", // విభాగాన్ని బట్టి డిఫాల్ట్ వాల్యూ మారుతుంది
    input_value: "",
    phone: "",
    ac_type: isAdmin ? "BS" : "PL",
    ope_dr: 0,
    ope_cr: 0,
    stationName: "VIJAYAWADA",
    stationCode: "VZA",
    allow_erp_login: false,
    password: "",
  });

  useEffect(() => {
    mainInputRef.current?.focus();
  }, [formData.master_type]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg({ type: "", text: "" });

    try {
      // 🌟 మీ రూల్ ప్రకారం - అడ్మిన్ అయితే 3 ఫైల్స్ రూట్, అకౌంట్స్ అయితే 1 ఫైల్ రూట్ ఆటో లాక్
      const targetUrl = isAdmin
        ? "https://tms-crh2.onrender.com/api/admin/masters-save" // 3 ఫైల్స్ సేవ్
        : "https://tms-crh2.onrender.com/api/accounts/master-save"; // కేవలం masters లో సేవ్
      const res = await axios.post(targetUrl, { ...formData, ...loginUser });
      if (res.data.success) {
        setStatusMsg({ type: "success", text: `✓ మాస్టర్ రికార్డ్ పక్కాగా సేవ్ అయింది. కోడ్: ${res.data.data.ac_code}` });
        setFormData((prev) => ({
          ...prev,
          input_value: "",
          phone: "",
          allow_erp_login: false,
          password: "",
          ope_dr: 0,
          ope_cr: 0,
        }));
        mainInputRef.current?.focus();
      }
    } catch (error) {
      setStatusMsg({ type: "error", text: "❌ ఎర్రర్: " + (error.response?.data?.message || "సేవింగ్ ఫెయిల్!") });
    } finally {
      setLoading(false);
    }
  };

  const isLorry = ["OWN_LORRY", "CONTRACT_1", "CONTRACT_2"].includes(formData.master_type);

  return (
    <div style={{ backgroundColor: "#0b1437", minHeight: "100vh", color: "#fff", fontFamily: "monospace", padding: "20px" }}>
      <SectionNavbar userData={{ userId: loginUser.login_id }} sectionName={loginUser.login_section} onBackToMain={() => navigate("/home")} />

      <div style={{ marginTop: "20px", backgroundColor: "#111c44", padding: "25px", borderRadius: "6px", border: "1px solid #243068" }}>
        <h3 style={{ color: isAdmin ? "#ecc94b" : "#00d2ff", margin: "0 0 20px 0", fontSize: "15px" }}>SRINIVASA ROAD TRANSPORT - {loginUser.login_section} MASTER ENTRY</h3>

        {statusMsg.text && (
          <div style={{ padding: "10px", backgroundColor: statusMsg.type === "success" ? "#1c4532" : "#6b2020", marginBottom: "15px", fontSize: "12px" }}>{statusMsg.text}</div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "flex", flexDirection: "column", width: "350px", gap: "5px" }}>
            <label style={{ color: "#a0aec0", fontSize: "11px" }}>SELECT MASTER CATEGORY:</label>
            <select
              name="master_type"
              value={formData.master_type}
              onChange={handleChange}
              style={{ backgroundColor: "#0b1437", border: "1px solid #243068", color: isAdmin ? "#ecc94b" : "#00d2ff", height: "30px", fontWeight: "bold" }}
            >
              {/* 🌟 1. అడ్మిన్ లాగిన్ అయితే ఈ డ్రాప్‌డౌన్ మాత్రమే వస్తుంది */}
              {isAdmin ? (
                <optgroup label="ADMIN MASTERS (3 FILES SAVE)">
                  <option value="STAFF">STAFF (OFFICE STAFF)</option>
                  <option value="RSTAFF">RSTAFF (REGULAR STAFF)</option>
                  <option value="AGENT">AGENTS / BROKERS</option>
                  <option value="OWN_LORRY">OWN LORRIES</option>
                  <option value="CONTRACT_1">CONTRACT-1 LORRIES</option>
                  <option value="CONTRACT_2">CONTRACT-2 LORRIES</option>
                </optgroup>
              ) : (
                /* 🌟 2. అకౌంట్స్ లాగిన్ అయితే ఈ డ్రాప్‌డౌన్ మాత్రమే వస్తుంది */
                <optgroup label="MAIN ACS MASTERS (ONLY 1 FILE SAVE)">
                  <option value="1000S">1000S - BANKS & FINANCE A/C</option>
                  <option value="2000S">2000S - SUNDRY DEBTORS (PARTIES)</option>
                  <option value="3000S">3000S - GENERAL EXPENSES (EXP ACS, BILLS)</option>
                  <option value="4000S">4000S - INCOME (COLLECTION, MISC INCOME)</option>
                  <option value="4500S">4500S - OTHER ACCOUNTING CODES (LEGAL, TAX, PENALTIES)</option>
                </optgroup>
              )}
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", width: "450px", gap: "5px" }}>
            <label style={{ color: "#a0aec0", fontSize: "11px" }}>{isLorry ? "ENTER LORRY NUMBER (ac_name) *MANDATORY:" : "ENTER NAME / LEDGER HEAD (ac_name) *MANDATORY:"}</label>
            <input
              ref={mainInputRef}
              type="text"
              name="input_value"
              value={formData.input_value}
              onChange={handleChange}
              placeholder={isLorry ? "AP16TB1234" : "Eg: CURRENT BILLS A/C / PENALTIES A/C"}
              style={{ backgroundColor: "#0b1437", border: "1px solid #243068", color: "#fff", height: "28px", padding: "0 5px" }}
              required
            />
          </div>

          {/* 🌟 అడ్మిన్ వ్యూ ఫీల్డ్స్ */}
          {isAdmin && (
            <div style={{ display: "flex", gap: "15px", flexDirection: "column" }}>
              <div style={{ display: "flex", flexDirection: "column", width: "200px", gap: "5px" }}>
                <label style={{ color: "#a0aec0", fontSize: "11px" }}>MOBILE NO:</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  style={{ backgroundColor: "#0b1437", border: "1px solid #243068", color: "#fff", height: "26px", padding: "0 5px" }}
                />
              </div>

              {!isLorry && (
                <div style={{ backgroundColor: "#1b254b", padding: "15px", border: "1px solid #243068", width: "500px" }}>
                  <label style={{ color: "#00d2ff", fontWeight: "bold", fontSize: "12px", cursor: "pointer" }}>
                    <input type="checkbox" name="allow_erp_login" checked={formData.allow_erp_login} onChange={handleChange} style={{ marginRight: "8px" }} />
                    ENABLE ERP LOGIN FOR THIS USER?
                  </label>
                  {formData.allow_erp_login && (
                    <div style={{ marginTop: "15px" }}>
                      <input
                        type="text"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="ENTER PLAIN TEXT PASSWORD"
                        style={{ backgroundColor: "#0b1437", border: "1px solid #243068", color: "#48bb78", height: "26px", padding: "0 5px", fontWeight: "bold" }}
                        required
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 🌟 అకౌంట్స్ వ్యూ ఫీల్డ్స్ */}
          {!isAdmin && (
            <div style={{ display: "flex", gap: "20px" }}>
              <div style={{ display: "flex", flexDirection: "column", width: "120px", gap: "5px" }}>
                <label style={{ color: "#a0aec0", fontSize: "11px" }}>A/C TYPE:</label>
                <select
                  name="ac_type"
                  value={formData.ac_type}
                  onChange={handleChange}
                  style={{ backgroundColor: "#0b1437", border: "1px solid #243068", color: "#fff", height: "28px" }}
                >
                  <option value="PL">PROFIT & LOSS</option>
                  <option value="BS">BALANCE SHEET</option>
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", width: "140px", gap: "5px" }}>
                <label style={{ color: "#a0aec0", fontSize: "11px" }}>OPENING DR (Rs.):</label>
                <input
                  type="number"
                  name="ope_dr"
                  value={formData.ope_dr}
                  onChange={handleChange}
                  style={{ backgroundColor: "#0b1437", border: "1px solid #243068", color: "#fff", height: "26px", padding: "0 5px" }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", width: "140px", gap: "5px" }}>
                <label style={{ color: "#a0aec0", fontSize: "11px" }}>OPENING CR (Rs.):</label>
                <input
                  type="number"
                  name="ope_cr"
                  value={formData.ope_cr}
                  onChange={handleChange}
                  style={{ backgroundColor: "#0b1437", border: "1px solid #243068", color: "#fff", height: "26px", padding: "0 5px" }}
                />
              </div>
            </div>
          )}

          <div style={{ marginTop: "10px" }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: isAdmin ? "#ecc94b" : "#00b4d8",
                color: "#000",
                border: "none",
                padding: "8px 25px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "12px",
              }}
            >
              {loading ? "PROCESSING..." : "SAVE MASTER"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MasterEntry;
