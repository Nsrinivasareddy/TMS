import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; 

const ShedOutPage = () => {
  const navigate = useNavigate();

  // 👤 ఆపరేటర్ / లాగిన్ వివరాలు
  const [loggedInUser, setLoggedInUser] = useState({
    userId: "NSR-OPERATOR",
    section: "SHED",
    sCode: "HOVZA"
  });

  // 🗄️ డేటాబేస్ నుండి వచ్చే మాస్టర్ లిస్ట్‌ల స్టేట్స్
  const [shedLorryList, setShedLorryList] = useState([]);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [availableCleaners, setAvailableCleaners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null); 

  // 📥 ఎడమ వైపు: గతంలో లారీ లోపలికి వచ్చిన (Shed IN / Duty Off) రിക്കార్డు హిస్టరీ స్టేట్
  const [shedInHistory, setShedInHistory] = useState({
    date: "N/A",
    time: "N/A",
    driver: "N/A",
    cleaner: "N/A",
    reading: "N/A"
  });

  // 📤 కుడి వైపు: ఇప్పుడు బయలుదేరే (Shed OUT / New Dispatch) ఫామ్ ఇన్‌పుట్ స్టేట్స్
  const [selectedLorry, setSelectedLorry] = useState(null);
  const [invoiceNo, setInvoiceNo] = useState(""); 
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedCleaner, setSelectedCleaner] = useState(null);
  const [openingMeterReading, setOpeningMeterReading] = useState("");
  
  // 📍 రూట్ కనెక్షన్ స్టేట్స్
  const [routeFrom, setRouteFrom] = useState("HOVZA"); 
  const [routeTo, setRouteTo] = useState("");
  const [viaStations, setViaStations] = useState("");

  // 🤝 హ్యాండోవర్ కన్ఫర్మేషన్ స్టేట్
  const [acceptDetails, setAcceptDetails] = useState(null);

  // 🔄 పేజీ లోడ్ అవ్వగానే యూజర్ డేటా మరియు లైవ్ లారీల లిస్ట్ తెచ్చుకోవడం
  useEffect(() => {
    const savedUserStr = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (savedUserStr) {
      try {
        const userData = JSON.parse(savedUserStr);
        setLoggedInUser({
          userId: userData.userId || userData.username || "NSR-OPERATOR",
          section: userData.section || "SHED",
          sCode: userData.sCode || "HOVZA"
        });
        setRouteFrom(userData.sCode || "HOVZA"); // లాగిన్ అయిన బ్రాంచ్ ఆటోమేటిక్‌గా 'Route From' అవుతుంది
      } catch (e) {
        console.error("Error parsing user data");
      }
    }
    fetchLiveShedData();
  }, []);



// 🌐 బ్యాకెండ్ నుండి డేటా లాగే ఫంక్షన్
  const fetchLiveShedData = async () => {
    try {
      setLoading(true);
      setApiError(null);
      const response = await axios.get("http://localhost:5001/api/shed/available-resources", {
        withCredentials: true
      });

      console.log("📺 Backend Response Data:", response.data); // బ్రౌజర్ కన్సోల్‌లో డేటా చెక్ చేయడానికి

      if (response.data && response.data.success) {
        // 🌟 మీ బ్యాకెండ్ నుండి వచ్చే డేటా ఆబ్జెక్ట్స్ కీస్ (lorries/drivers/cleaners)
        // ఒకవేళ మీ బ్యాకెండ్ వేరే కీస్ పంపితే ఇక్కడ మార్చాలి (ఉదా: response.data.lorryList)
        setShedLorryList(response.data.lorries || response.data.lorryList || []);
        setAvailableDrivers(response.data.drivers || response.data.driverList || []);
        setAvailableCleaners(response.data.cleaners || response.data.cleanerList || []);
      } else {
        setApiError("డేటాబేస్ నుండి రిసోర్సెస్ లభించలేదు!");
      }
    } catch (error) {
      console.error("❌ Fetch error:", error);
      setApiError("సర్వర్ కనెక్ట్ అవ్వడం లేదు. మీ నోడ్ బ్యాకెండ్ రన్ అవుతుందో లేదో చూడండి!");
    } finally {
      setLoading(false);
    }
  };
  
  // 🚛 లారీ నెంబర్ ఎంచుకున్నప్పుడు జరిగే ఆటోమేటిక్ మార్పులు (Invoice Basis Connection)
  const handleLorryChange = (e) => {
    const code = parseInt(e.target.value);
    const lorry = shedLorryList.find(l => l.lorryAcCode === code);
    setSelectedLorry(lorry || null);
    setAcceptDetails(null); // పాత కన్ఫర్మేషన్ రీసెట్ అవుతుంది
    
    if (lorry) {
      // 🌟 [Invoice Basis]: కుడి వైపు రన్నింగ్ ఇన్‌వాయిస్ నెంబర్ ఆటోమేటిక్‌గా సెట్ అవుతుంది
      setInvoiceNo(lorry.lastInvoiceNo || "");
      setOpeningMeterReading(lorry.startKm || "");

      // 🌟 [Invoice Basis]: ఎడమ వైపు ఆ ఇన్‌వాయిస్‌కు సంబంధించిన పాత ట్రిప్ హిస్టరీ లోడ్ అవుతుంది
      setShedInHistory({
        date: lorry.lastInvoiceDate || "N/A",
        time: lorry.lastInvoiceTime || "10:30 AM (Auto)", 
        driver: lorry.oldDriverName ? `${lorry.oldDriverCode || ''} - ${lorry.oldDriverName}` : "Duty Off Driver Not Found",
        cleaner: lorry.oldCleanerName ? `${lorry.oldCleanerCode || ''} - ${lorry.oldCleanerName}` : "No Cleaner (Duty Off)",
        reading: lorry.startKm ? `${lorry.startKm} KM` : "N/A"
      });
    } else {
      setInvoiceNo("");
      setOpeningMeterReading("");
      setShedInHistory({ date: "N/A", time: "N/A", driver: "N/A", cleaner: "N/A", reading: "N/A" });
    }
  };

  // 🤝 డ్యూటీ మరియు హ్యాండోవర్ కన్ఫర్మ్ చేయడం
  const handleAcceptHandover = () => {
    if (!selectedLorry || !selectedDriver || !openingMeterReading || !routeTo) {
      alert("⚠️ దయచేసి లారీ, కొత్త డ్రైవర్, రూట్ To, మరియు ఓపెనింగ్ మీటర్ రీడింగ్ వివరాలు అన్నీ ఎంటర్ చేయండి!");
      return;
    }
    setAcceptDetails({
      date: new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" })
    });
  };

  // 💾 డేటాను డేటాబేస్ (MongoDB) లో సేవ్ చేసే సబ్మిట్ ఫంక్షన్
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!acceptDetails) return;

    // బ్యాకెండ్‌కు వెళ్లే పూర్తి ప్యాకేజీ (యూనివర్సల్ మూవ్‌మెంట్ లాగ్)
    const payload = {
      invoiceNo: String(invoiceNo).replace(/\D/g, ""), // ఇన్‌వాయిస్ లో కేవలం అంకెలు మాత్రమే వెళ్తాయి
      lorryAcCode: selectedLorry.lorryAcCode,
      lorryNo: selectedLorry.lorryNo,
      driverAcCode: selectedDriver.driverAcCode,
      driverName: selectedDriver.driverName,
      cleanerAcCode: selectedCleaner ? selectedCleaner.cleanerAcCode : "N/A",
      cleanerName: selectedCleaner ? selectedCleaner.cleanerName : "No Cleaner",
      openingMeterReading: parseInt(openingMeterReading),
      operatorId: loggedInUser.userId,

      // లైవ్ మూవ్‌మెంట్ స్టేషన్ & సెక్షన్ ఇన్ఫో
      currentSection: loggedInUser.section || "SHED",
      stationCode: selectedLorry.stationCode || loggedInUser.sCode || "HOVZA",
      
      // ఇన్‌కమింగ్ రికార్డ్స్ (ఎడమ పక్క నుండి)
      incomingDate: selectedLorry.lastInvoiceDate, 
      incomingTime: "10:30 AM", 
      incomingMeterReading: selectedLorry.startKm,

      // అవుట్‌గోయింగ్ రికార్డ్స్ (కుడి పక్క నుండి)
      outgoingDate: acceptDetails.date,
      outgoingTime: acceptDetails.time,

      // 📍 రూట్ కనెక్షన్ వివరాలు
      routeFrom: routeFrom,
      routeTo: routeTo,
      viaStations: viaStations
    };

    try {
      const response = await axios.post("http://localhost:5001/api/shed/save-dispatch", payload, {
        withCredentials: true
      });

      if (response.data.success) {
        alert(`✅ MongoDB Success: ఇన్‌వాయిస్ ${invoiceNo} - రూట్ మరియు డిస్పాచ్ వివరాలు డేటాబేస్ (trips) లో శాశ్వతంగా సేవ్ అయ్యాయి!`);
        
        // ఫామ్ మొత్తం క్లీన్ చేసి, ఫ్రెష్ డేటా లోడ్ చేయడం
        setSelectedLorry(null); setInvoiceNo(""); setSelectedDriver(null); setSelectedCleaner(null);
        setOpeningMeterReading(""); setAcceptDetails(null); setRouteTo(""); setViaStations("");
        setShedInHistory({ date: "N/A", time: "N/A", driver: "N/A", cleaner: "N/A", reading: "N/A" });
        e.target.reset();
        
        fetchLiveShedData(); // స్క్రీన్ రిఫ్రెష్ అవుతుంది
      }
    } catch (error) {
      console.error("Save Error:", error);
      alert("❌ ఎర్రర్: డేటాబేస్ కనెక్ట్ అవ్వలేదు, డేటా సేవ్ కాలేదు!");
    }
  };

  if (loading) {
    return <div style={{ color: "#64ffda", textAlign: "center", marginTop: "50px", fontWeight: "bold" }}>⏳ లైవ్ డేటా లోడ్ అవుతోంది, దయచేసి వేచి ఉండండి...</div>;
  }

  return (
    <div style={{ maxWidth: "1150px", margin: "10px auto", fontFamily: "sans-serif", color: "white" }}>
      
      {/* 👤 టాప్ ఆపరేటర్ హెడర్ బోర్డు */}
      <div style={{ display: "flex", justifyContent: "space-between", background: "#0a192f", padding: "10px 15px", borderRadius: "4px", marginBottom: "12px", border: "1px solid #233554", fontSize: "12px" }}>
        <div>👤 OPERATOR: <span style={{ color: "#64ffda" }}>{loggedInUser.userId}</span></div>
        <div>📂 SECTION: <span style={{ color: "#64ffda" }}>{loggedInUser.section}</span></div>
        <div>🔑 STATION CODE: <span style={{ color: "#64ffda" }}>{loggedInUser.sCode}</span></div>
      </div>

      {apiError && <div style={{ background: "#742a2a", padding: "10px", borderRadius: "4px", marginBottom: "12px", fontWeight: "bold" }}>⚠️ {apiError}</div>}

      {/* 🚛 ప్రధాన కంటైనర్ ప్యానెల్ */}
      <div style={{ background: "#112240", padding: "20px", borderRadius: "6px", boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}>
        
        {/* లారీ సెలెక్షన్ బాక్స్ (పాత కోడ్ లేఅవుట్ ప్రకారమే ఉంటుంది) */}
        <div style={{ marginBottom: "20px", background: "#1b2a47", padding: "12px", borderRadius: "4px", border: "1px solid #64ffda" }}>
          <label style={{ ...labelStyle, color: "#64ffda", fontSize: "12px" }}>Select Vehicle / లారీ నెంబర్ ఎంచుకోండి *</label>
          <select onChange={handleLorryChange} style={{ ...inputStyle, fontSize: "15px", fontWeight: "bold" }} defaultValue="">
            <option value="" disabled>-- Select Lorry for Shed-Out --</option>
            {shedLorryList.map(l => (
              <option key={l.lorryAcCode} value={l.lorryAcCode}>
                {l.lorryNo} ({l.lorryAcCode}) — [Inv: {l.lastInvoiceNo || "NEW"}]
              </option>
            ))}
          </select>
        </div>

        <form onSubmit={handleSubmit}>
          {/* స్ప్లిట్ లేఅవుట్ (ఎడమ మరియు కుడి భాగాలూ - పాత కోడ్ డిజైన్) */}
          <div style={{ display: "flex", gap: "20px" }}>
            
            {/* 📥 1. Eedama Vaipu: Gatham lo jarigina Incoming details */}
            <div style={{ flex: 1, background: "#0a192f", padding: "15px", borderRadius: "6px", border: "1px solid #f6ad55" }}>
              <h4 style={{ color: "#f6ad55", margin: "0 0 15px 0", borderBottom: "1px solid #233554", paddingBottom: "5px", fontSize: "13px" }}>
                📥 GATHAM LO SHED-IN / DUTY OFF VIVARALU (Read-Only)
              </h4>
              
              <div style={infoRowStyle}>
                <span style={infoLabelStyle}>Shed In Date:</span>
                <span style={infoValueStyle}>{shedInHistory.date}</span>
              </div>
              <div style={infoRowStyle}>
                <span style={infoLabelStyle}>Shed In Time:</span>
                <span style={infoValueStyle}>{shedInHistory.time}</span>
              </div>
              <div style={infoRowStyle}>
                <span style={infoLabelStyle}>Duty Off Driver:</span>
                <span style={{ ...infoValueStyle, color: "#f6ad55" }}>{shedInHistory.driver}</span>
              </div>
              <div style={infoRowStyle}>
                <span style={infoLabelStyle}>Duty Off Cleaner:</span>
                <span style={infoValueStyle}>{shedInHistory.cleaner}</span>
              </div>
              <div style={infoRowStyle}>
                <span style={infoLabelStyle}>Shed In Reading:</span>
                <span style={{ ...infoValueStyle, color: "#4ade80", fontWeight: "bold" }}>{shedInHistory.reading}</span>
              </div>
              <p style={{ fontSize: "11px", color: "#8892b0", marginTop: "25px", fontStyle: "italic", lineHeight: "1.5" }}>
                * గమనిక: పై विवरणాలు ఈ వాహనం గత ట్రిప్ ముగించుకొని లోపలికి వచ్చినప్పుడు రికార్డ్ అయిన Invoice Basis పాత హిస్టరీ డేటా.
              </p>
            </div>

            {/* 📤 2. Kudi Vaipu: Ippudu velthe kotha outgoing details */}
            <div style={{ flex: 1.1, background: "#1b2a47", padding: "15px", borderRadius: "6px", border: "1px solid #4ade80" }}>
              <h4 style={{ color: "#4ade80", margin: "0 0 15px 0", borderBottom: "1px solid #233554", paddingBottom: "5px", fontSize: "13px" }}>
                🚛 IPPUDU SHED-OUT / NEW ROUTE & DUTY ON VIVARALU
              </h4>

              {/* ఇన్‌వాయిస్ నెంబర్ ఫీల్డ్ */}
              <div style={{ marginBottom: "10px" }}>
                <label style={labelStyle}>Shed Out Invoice No (Digits Only) *</label>
                <input 
                  type="text" 
                  value={invoiceNo} 
                  onChange={(e) => setInvoiceNo(e.target.value.replace(/\D/g, ""))} 
                  required
                  placeholder="ఇన్‌వాయిస్ నెంబర్"
                  style={{ ...inputStyle, color: "#64ffda", fontWeight: "bold" }} 
                />
              </div>

              {/* కొత్త డ్రైవర్ అసైన్మెంట్ */}
              <div style={{ marginBottom: "10px" }}>
                <label style={labelStyle}>Assign New Driver (Duty On) *</label>
                <select onChange={(e) => {
                  const code = parseInt(e.target.value);
                  setSelectedDriver(availableDrivers.find(d => d.driverAcCode === code) || null);
                  setAcceptDetails(null);
                }} style={inputStyle} required defaultValue="">
                  <option value="" disabled>-- Select New Driver --</option>
                  {availableDrivers.map(d => (
                    <option key={d.driverAcCode} value={d.driverAcCode}>{d.driverName} ({d.driverAcCode})</option>
                  ))}
                </select>
              </div>

              {/* కొత్త క్లీనర్ అసైన్మెంట్ */}
              <div style={{ marginBottom: "10px" }}>
                <label style={labelStyle}>Assign New Cleaner (Duty On)</label>
                <select onChange={(e) => {
                  const code = parseInt(e.target.value);
                  setSelectedCleaner(availableCleaners.find(c => c.cleanerAcCode === code) || null);
                  setAcceptDetails(null);
                }} style={inputStyle} defaultValue="">
                  <option value="">-- No Cleaner (డ్రైవర్ సింగిల్) --</option>
                  {availableCleaners.map(c => (
                    <option key={c.cleanerAcCode} value={c.cleanerAcCode}>{c.cleanerName}</option>
                  ))}
                </select>
              </div>

              {/* ఓపెనింగ్ మీటర్ రీడింగ్ */}
              <div style={{ marginBottom: "12px" }}>
                <label style={labelStyle}>Shed Out / Opening Meter Reading (KM) *</label>
                <input 
                  type="number" 
                  value={openingMeterReading} 
                  onChange={(e) => { setOpeningMeterReading(e.target.value); setAcceptDetails(null); }} 
                  required 
                  style={{ ...inputStyle, color: "#4ade80", fontWeight: "bold", fontSize: "14px" }} 
                />
              </div>

              {/* 📍 రూట్ కనెక్షన్ సెక్షన్ */}
              <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Route From *</label>
                  <select value={routeFrom} onChange={(e) => setRouteFrom(e.target.value)} style={inputStyle} required>
                    <option value="HOVZA">HOVZA (HO)</option>
                    <option value="VZA">VIJAYAWADA</option>
                    <option value="HYD">HYDERABAD</option>
                    <option value="GNT">GUNTUR</option>
                    <option value="NLR">NELLORE</option>
                  </select>
                </div>
                
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Route To (Destination) *</label>
                  <select value={routeTo} onChange={(e) => { setRouteTo(e.target.value); setAcceptDetails(null); }} style={inputStyle} required>
                    <option value="">-- Select To --</option>
                    <option value="VZA">VIJAYAWADA</option>
                    <option value="HYD">HYDERABAD</option>
                    <option value="GNT">GUNTUR</option>
                    <option value="NLR">NELLORE</option>
                    <option value="TPT">TIRUPATI</option>
                    <option value="BLR">BANGALORE</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Via Stations (మధ్యలో ఆగే ఊర్లు - Optional)</label>
                <input 
                  type="text" 
                  value={viaStations} 
                  onChange={(e) => setViaStations(e.target.value)} 
                  placeholder="ఉదా: GNT, NLR, TPT మీదుగా..." 
                  style={inputStyle} 
                />
              </div>

            </div>
          </div>

          {/* 🤝 కన్ఫర్మేషన్ ప్యానెల్ */}
          <div style={{ background: "#0a192f", padding: "12px", borderRadius: "4px", margin: "15px 0", textAlign: "center", border: "1px dashed #233554" }}>
            {!acceptDetails ? (
              <button type="button" onClick={handleAcceptHandover} style={{ background: "#f6ad55", color: "#0a192f", padding: "8px 25px", border: "none", borderRadius: "4px", fontWeight: "bold", cursor: "pointer", fontSize: "13px", letterSpacing: "0.5px" }}>
                🤝 ACCEPT HANDOVER & CONFIRM ROUTE DETAILS
              </button>
            ) : (
              <div style={{ display: "flex", justifyContent: "center", gap: "25px", fontSize: "13px", color: "#4ade80" }}>
                <span><b>✓ HANDOVER & ROUTE DETAILS CONFIRMED</b></span>
                <span style={{ color: "white" }}>📅 Date: <b>{acceptDetails.date}</b></span>
                <span style={{ color: "white" }}>⏰ Time: <b>{acceptDetails.time}</b></span>
              </div>
            )}
          </div>

          {/* యాクション బటన్స్ */}
          <div style={{ display: "flex", gap: "12px" }}>
            <button type="button" onClick={() => navigate("/section/shed")} style={{ flex: 1, background: "#4a5568", color: "white", padding: "11px", border: "none", borderRadius: "4px", fontWeight: "bold", cursor: "pointer" }}>⬅ BACK</button>
            <button type="submit" disabled={!acceptDetails} style={{ flex: 2, background: !acceptDetails ? "#233554" : "#64ffda", color: !acceptDetails ? "#8892b0" : "#0a192f", padding: "11px", border: "none", borderRadius: "4px", fontWeight: "bold", cursor: !acceptDetails ? "not-allowed" : "pointer", fontSize: "14px" }}>
              💾 SAVE ROUTE DISPATCH TO MONGO DATABASE
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

// 🎨 స్టైలింగ్ టూల్‌కిట్ (CSS ఆబ్జెక్ట్స్)
const labelStyle = { display: "block", color: "#8892b0", fontSize: "11px", fontWeight: "600", marginBottom: "4px", textTransform: "uppercase" };
const inputStyle = { width: "100%", padding: "8px", background: "#0a192f", border: "1px solid #233554", borderRadius: "4px", color: "#64ffda", fontSize: "13px", boxSizing: "border-box", outline: "none" };
const infoRowStyle = { display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid #112240", fontSize: "13px" };
const infoLabelStyle = { color: "#8892b0", fontWeight: "500" };
const infoValueStyle = { color: "#ccd6f6", fontWeight: "bold" };

export default ShedOutPage;