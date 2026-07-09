import React, { useState, useEffect, useCallback, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { LaserJetPrint, DotMatrixPrint } from "./LRPrintComponents";
import "../styles/freightBooking.css";
const FreightBooking = ({ userData, onBackToBranches }) => {
  const sCode = (userData?.stationCode || "").trim().toUpperCase();
  const sName = userData?.stationName || "";
  const fromState = (userData?.state || "ANDHRAPRADESH").trim().toUpperCase();
  const [stations, setStations] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [holders, setHolders] = useState([]);
  const [distanceMaster, setDistanceMaster] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [savedBills, setSavedBills] = useState([]);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [hasError, setHasError] = useState(false);
  const [printMode, setPrintMode] = useState("LASER"); // Default Laser
  const [showPrintOptions, setShowPrintOptions] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false); // బిల్ స్క్రీన్ చూపడానికి
  const laserRef = useRef(null);
  const dotRef = useRef(null);
  const initialState = {
    lrtype: "",
    bdate: new Date().toISOString().split("T")[0],
    lrno: "", seriesChar: "", tstn: "", quotno: "", cnorname: "", cnorgstno: "", cnorphno: "",
    cnoraddr1: "", cnoraddr2: "", cneename: "", cneegstno: "", cneephno: "", cneeaddr1: "", cneeaddr2: "",
    desc1: "", desc2: "", arts: "", weight: "", cdm: "", cmentval: "", manualDDC: "", freight: 0,
    lrchg: 0, surchg: 0, artchg: 0, valchg: 0, wpchg: 0, ddchg: 0, hweitChg: 0, gst: 0, total: 0,
    rcm: 'Y', wpass: 'N', ddctype: 'N', isPrinted: false, isRCM: true
  };
  const [formData, setFormData] = useState(initialState);
  const checkDuplicateLR = async (lrno) => {
    try {
      const response = await fetch(`http://localhost:5001/api/lr/check?lrno=${lrno}&stn=${sCode}`);
      const data = await response.json();
      if (data.exists) {
        alert("ఈ LR నంబర్ ఆల్రెడీ సేవ్ అయింది!");
      }
    } catch (err) {
      console.error("Duplicate check error:", err);
    }
  };

const fetchNextLR = useCallback(async (typeOverride) => {
  if (!sCode) return;

  try {
    const type = typeOverride || formData.lrtype || "TOPAY";
    const currentStnCode = sCode.trim().toUpperCase();
    
    // State Group Logic
    const stateGroup = (fromState && (fromState.trim().toUpperCase() === "ANDHRAPRADESH" || fromState.trim().toUpperCase() === "AP"))
      ? "AP"
      : "OS";

    const response = await fetch("http://localhost:5001/api/lrseries/next-lr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stationCode: currentStnCode,
        lrtype: type.toUpperCase(),
        state: stateGroup 
      }),
    });

    const resData = await response.json();

    // ఇక్కడ resData.currentNo అని మార్చాను
    if (response.ok && resData.currentNo) {
      setFormData(prev => ({
        ...prev,
        lrno: resData.currentNo, 
        seriesChar: resData.seriesChar || "",
        lrtype: type
      }));
    } else {
      console.warn("Series Notice:", resData.message);
      setFormData(prev => ({
        ...prev,
        lrno: "",
        seriesChar: ""
      }));
      if (resData.message) alert(resData.message);
    }
  } catch (err) {
    console.error("Connection Error (fetchNextLR):", err);
    setFormData(prev => ({
      ...prev,
      lrno: "",
      seriesChar: ""
    }));
  }
}, [sCode, fromState, formData.lrtype]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        await fetchNextLR(formData.lrtype);
        const [stnRes, quotRes, holdRes, distRes, billsRes] = await Promise.all([
          fetch("http://localhost:5001/api/stations/all"),
          fetch("http://localhost:5001/api/quotations/all"),
          fetch("http://localhost:5001/api/holders/all"),
          fetch("http://localhost:5001/api/kilometers/all"),
          fetch("http://localhost:5001/api/lrseries/get-all-bills")
        ]);
        if (stnRes.ok) setStations(await stnRes.json());
        if (quotRes.ok) {
          const qData = await quotRes.json();
          const filtered = qData.filter((q) => {
            const stationMatch = (q.qstn || "").trim().toUpperCase() === sCode.toUpperCase();
            const isGen = (q.quotno || "").toUpperCase() === "GEN";
            return stationMatch || isGen;
          });
          setQuotations(filtered);
        }
        if (holdRes.ok) setHolders(await holdRes.json());
        if (distRes.ok) setDistanceMaster(await distRes.json());
        if (billsRes.ok) {
          const allBills = await billsRes.json();
          const currentBranchBills = allBills.filter(
            (b) => (b.fstn || "").trim().toUpperCase() === sCode.toUpperCase()
          );
          setSavedBills(currentBranchBills);
        }
      } catch (err) {
        console.error("Initial Data Load Error:", err);
      }
    };
    if (sCode) {
      fetchInitialData();
    }
  }, [sCode, fetchNextLR]);


const handlePayTypeChange = (mode) => {
  setFormData((prev) => {
    let updatedData = {
      ...prev,
      lrtype: mode,
      quotno: (mode === "ONAC" && prev.quotno === "GEN") ? "" : prev.quotno
    };

    // FOC సెలెక్ట్ చేసినప్పుడు ఆటోమేటిక్ గా పేర్లు, అడ్రస్ లు సెట్ చేయడం
    if (mode === "FOC") {
      updatedData = {
        ...updatedData,
        cnorname: "THE AGENT / INCHARGE / MANAGER",
        cneename: "THE AGENT / INCHARGE / MANAGER",
        cnoraddr1: `SRINIVASA ROAD TRANSPORT, ${sCode.toUpperCase()}`,
        cneeaddr1: `SRINIVASA ROAD TRANSPORT, ${(prev.tstn || "").toUpperCase()}`,
        quotno: "GEN",
        remarks: "FREE OF COST",
        // చార్జీలు సున్నా చేయడం
        freight: 0, surchg: 0, artchg: 0, lrchg: 0, valchg: 0,
        wpchg: 0, ddchg: 0, hweitChg: 0, gst: 0, total: 0
      };
    } 
    // ఒకవేళ FOC నుండి వేరే దానికి మారితే పాత డేటా క్లియర్ చేయడం (Optional)
    else if (prev.lrtype === "FOC" && mode !== "FOC") {
      updatedData = {
        ...updatedData,
        cnorname: "", cneename: "", cnoraddr1: "", cneeaddr1: "",
        remarks: "", quotno: "GEN"
      };
    }

    return updatedData;
  });

  if (sCode) {
    fetchNextLR(mode);
  }
};
  const handleToStnChange = (e) => {
    const code = (e.target.value || "").toUpperCase();
    const found = stations.find((s) => (s.stationCode || "").trim().toUpperCase() === code);
    const dMatch = distanceMaster.find((d) => {
      const from = (d.fromStation || "").trim().toUpperCase();
      const to = (d.toStation || "").trim().toUpperCase();
      const current = sCode.trim().toUpperCase();
      return (from === current && to === code) || (from === code && to === current);
    });
    const dist = dMatch ? parseFloat(dMatch.kilometers) : 0;
    setFormData((prev) => ({
      ...prev,
      tstn: code,
      toStationName: found ? found.stationName : "",
      toStateName: found ? (found.state || "ANDHRAPRADESH") : "ANDHRAPRADESH",
      distance: dist,
      cneename: "",
      cneegstno: "",
      cneeaddr1: "",
      cneeaddr2: "",
      cneephno: "",
    }));
  };
  const handleQuotChange = (e) => {
    const qVal = (e.target.value || "").toUpperCase();
    const sel = quotations.find((q) => (q.quotno || "").toUpperCase() === qVal);
    setFormData((prev) => ({
      ...prev,
      quotno: qVal,
      cnorname: sel ? (sel.qcnorname || "") : "",
      cnorgstno: sel ? (sel.qcnorgstno || "") : "",
      cnoraddr1: sel ? (sel.qcnoraddrs1 || "") : "",
      cnoraddr2: sel ? (sel.qcnoraddrs2 || "") : "",
      cnorphno: sel ? (sel.qcnorphno || "") : "",
      qfreit: sel ? (parseFloat(sel.qfreit) || 0) : 0,
      qartchg: sel ? (parseFloat(sel.qartchg) || 0) : 0,
      qfrtcc: sel ? (parseFloat(sel.qfrtcc) || 0) : 0,
      qddchg: sel ? (parseFloat(sel.qddchg) || 0) : 0,
      qlrval: sel ? (parseFloat(sel.qlrval) || 0) : 0,
      qsurchg: sel ? (parseFloat(sel.qsurchg) || 0) : 0,
      qwpchg: sel ? (parseFloat(sel.qwpchg) || 0) : 0,
      qvalchg: sel ? (parseFloat(sel.qvalchg) || 0) : 0,
      qtype: sel ? (sel.qtype || "") : "",
    }));
  };
  const handleGSTChange = (e) => {
    const gstVal = (e.target.value || "").toUpperCase().trim();
    setFormData((prev) => ({ ...prev, cnorgstno: gstVal }));
    if (formData.quotno === "GEN") {
      const h = holders.find((hold) => (hold.gst_number || "").trim().toUpperCase() === gstVal);
      if (h) {
        setFormData((p) => ({
          ...p,
          cnorname: h.firmName,
          cnoraddr1: h.address || "",
          cnorphno: h.phone || "",
        }));
      }
    }
  };

const handleFirmChange = (e) => {
    // ఇక్కడ .trim() తీసేశాను, కేవలం .toUpperCase() ఉంచాను
    const nameVal = (e.target.value || "").toUpperCase(); 
    setFormData((prev) => ({ ...prev, cnorname: nameVal }));

    if (formData.quotno === "GEN") {
      // వెతకడానికి మాత్రం .trim() వాడుకోవాలి
      const searchVal = nameVal.trim();
      const h = holders.find((hold) =>
        (hold.firmName || "").trim().toUpperCase() === searchVal &&
        (
          (hold.stationCode || "").trim().toUpperCase() === sCode ||
          (hold.stationCode || "").trim().toUpperCase() === "ALL"
        )
      );
      if (h) {
        setFormData((p) => ({
          ...p,
          cnorname: nameVal, // యూజర్ టైప్ చేసినది (with spaces)
          cnorgstno: h.gst_number,
          cnoraddr1: h.address || "",
          cnorphno: h.phone || "",
        }));
      }
    }
  };

const handleConsigneeFirmChange = (e) => {
    // ఇక్కడ కూడా .trim() తీసేశాను
    const nameVal = (e.target.value || "").toUpperCase();
    const targetStn = (formData.tstn || "").trim().toUpperCase();
    const searchVal = nameVal.trim();

    const h = holders.find((hold) =>
      (hold.firmName || "").trim().toUpperCase() === searchVal &&
      (
        (hold.stationCode || "").trim().toUpperCase() === targetStn ||
        (hold.stationCode || "").trim().toUpperCase() === "ALL"
      )
    );
    setFormData((prev) => ({
      ...prev,
      cneename: nameVal,
      cneegstno: h ? h.gst_number : "",
      cneeaddr1: h ? h.address : "",
      cneephno: h ? h.phone : "",
    }));
  };
  
  const handleConsigneeGSTChange = (e) => {
    const gstVal = (e.target.value || "").toUpperCase().trim();
    const targetStn = (formData.tstn || "").trim().toUpperCase();
    const h = holders.find((hold) =>
      (hold.gst_number || "").trim().toUpperCase() === gstVal &&
      (
        (hold.stationCode || "").trim().toUpperCase() === targetStn ||
        (hold.stationCode || "").trim().toUpperCase() === "ALL"
      )
    );
    setFormData((prev) => ({
      ...prev,
      cneegstno: gstVal,
      cneename: h ? h.firmName : prev.cneename,
      cneeaddr1: h ? h.address : prev.cneeaddr1,
      cneephno: h ? h.phone : prev.cneephno,
    }));
  };
  useEffect(() => {
    try {
      const {
        lrtype, quotno, manualDDC, distance, qlrval, weight, cdm, qfreit, qsurchg,
        arts, qartchg, cmentval, qvalchg, ddcApply, qddchg, isWP, rcm, qwpchg
      } = formData;
      if (lrtype === "FOC") {
        setFormData((prev) => ({
          ...prev,
          quotno: "GEN",
          freight: 0, surchg: 0, artchg: 0, lrchg: 0, valchg: 0,
          wpchg: 0, ddchg: 0, hweitChg: 0, gst: 0, total: 0
        }));
        return;
      }
      const d = parseFloat(distance) || 0;
      const qf = parseFloat(qfreit) || 0;
      const w = parseFloat(weight) || 0;
      const c = parseFloat(cdm) || 0;
      const n_arts = parseInt(arts) || 0;
      const q_lrval = parseFloat(qlrval) || 0;
      const finalWeight = Math.max(w, c);
      const minFreight = Math.max(qf * 100, d * qf);
      const calculatedLrFreight = (minFreight * finalWeight) / 100;
      const freight = Math.round(Math.max(calculatedLrFreight, minFreight));
      const lrchg = d >= 400 ? q_lrval + 10 : q_lrval;
      const surchg = Math.round((freight * (parseFloat(qsurchg) || 0)) / 100);
      const artchg = Math.round(n_arts * (parseFloat(qartchg) || 0));
      const valchg = Math.ceil((parseFloat(cmentval) || 0) / 5000) * (parseFloat(qvalchg) || 0);
      let ddchg = 0;
      if (quotno === "GEN") {
        ddchg = ddcApply ? (parseFloat(manualDDC) || 0) : 0;
      } else {
        ddchg = (parseFloat(qddchg) || 0) * n_arts;
      }
      const wpchg = isWP ? (parseFloat(qwpchg) || 0) : 0;
      const hweitChg = n_arts > 0 && (w / n_arts) >= 200 ? n_arts * 10 : 0;
      const total = freight + surchg + artchg + lrchg + valchg + wpchg + ddchg + hweitChg;
      let gst = (rcm !== "Y") ? Math.round(total * 0.05) : 0;
      setFormData((prev) => ({
        ...prev,
        freight, surchg, artchg, lrchg, valchg, wpchg, ddchg, hweitChg, gst,
        total: total + gst,
      }));
    } catch (e) {
      console.error("Calculation Error:", e);
    }
  }, [formData.lrtype, formData.distance, formData.weight, formData.cdm, formData.arts, formData.quotno, formData.cmentval, formData.rcm, formData.isWP, formData.manualDDC, formData.qddchg, formData.ddcApply, formData.qfreit, formData.qlrval, formData.qsurchg]);



const validateForm = () => {
  const { 
    lrno, lrtype, tstn, quotno, cnorname, cneename, 
    arts, weight, cmentval, cnorphno, cneephno, 
    cnorgstno, cneegstno, ddcApply, manualDDC 
  } = formData;

  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  const phoneRegex = /^[6-9]\d{9}$/;
  const dummyPAN = "AAAAA1111A";
  const isFOC = lrtype === "FOC";

  if (!lrno || lrno.toString().trim() === "") {
    alert("LR Number generate కాలేదు.");
    return false;
  }
  if (!lrtype) {
    alert("దయచేసి LR Type ని ఎంచుకోండి.");
    return false;
  }
  if (!tstn) {
    alert("దయచేసి To Station నమోదు చేయండి.");
    return false;
  }

  // పేర్లు కచ్చితంగా ఉండాలి
  if (!cnorname) { alert("Consignor పేరు ఉండాలి."); return false; }
  if (!cneename) { alert("Consignee పేరు ఉండాలి."); return false; }

  // Phone & GST Validation (Using String to avoid trim error)
  const vPhone = (n, l) => {
    const s = n ? String(n).trim() : "";
    if (s !== "" && !phoneRegex.test(s)) { alert(`${l} ఫోన్ నంబర్ తప్పు.`); return false; }
    return true;
  };
  if (!vPhone(cnorphno, "Consignor") || !vPhone(cneephno, "Consignee")) return false;

  // FOC కాకపోతేనే Articles, Weight, Value అడగాలి
  if (!isFOC) {
    if (!arts || parseInt(arts) <= 0) { alert("Articles నమోదు చేయండి."); return false; }
    if (!weight || parseFloat(weight) <= 0) { alert("Weight నమోదు చేయండి."); return false; }
    if (!cmentval || parseFloat(cmentval) <= 0) { alert("Value నమోదు చేయండి."); return false; }
    if (!quotno) { alert("Quotation Number ఉండాలి."); return false; }
  }

  if (ddcApply && (!manualDDC || parseFloat(manualDDC) <= 0)) {
    alert("Manual DDC అమౌంట్ నమోదు చేయాలి.");
    return false;
  }

  return true;
};
const handleSave = async (shouldPrint = false) => {
  if (!formData.lrno) { alert("LR నంబర్ లేదు!"); return; }
  if (!validateForm()) return;

  setIsSaving(true);
  try {
    const isFOC = formData.lrtype === "FOC";

    const payload = {
      ...formData,
      // టెక్స్ట్ ఫార్మాటింగ్
      remarks: isFOC ? "FREE OF COST" : (formData.remarks || "").trim().toUpperCase(),
      cnorname: (formData.cnorname || "").trim().toUpperCase(),
      cneename: (formData.cneename || "").trim().toUpperCase(),
      cnoraddr1: (formData.cnoraddr1 || "").trim().toUpperCase(),
      cneeaddr1: (formData.cneeaddr1 || "").trim().toUpperCase(),
      
      // FOC కి డేటా ఆటో-ఫిల్లింగ్
      arts: isFOC ? (parseInt(formData.arts) || 1) : parseInt(formData.arts),
      weight: isFOC ? (parseFloat(formData.weight) || 0) : parseFloat(formData.weight),
      cmentval: isFOC ? (parseFloat(formData.cmentval) || 0) : parseFloat(formData.cmentval),
      
      // అమౌంట్లు (FOC అయితే 0)
      freight: isFOC ? 0 : (parseFloat(formData.freight) || 0),
      gst: isFOC ? 0 : (parseFloat(formData.gst) || 0),
      total: isFOC ? 0 : (parseFloat(formData.total) || 0),
      
      fstn: sCode,
      userId: userData?.userId || "UNKNOWN",
      shouldPrint: !!shouldPrint
    };

    const res = await fetch("http://localhost:5001/api/lrseries/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (res.ok) {

      // ======================================================
      // 🎯 ఇద్దరికీ మెసేజ్ పంపే లాజిక్ (Consignor & Consignee)
      // ======================================================
      const sendWhatsAppToBoth = () => {
        const { cnorphno, cneephno, lrno, fstn, tstn, arts, weight, total, lrtype } = payload;
        
        // మెసేజ్ కంటెంట్
        const msg = `*SRINIVASA ROAD TRANSPORT*%0A` +
                    `----------------------------%0A` +
                    `✅ *LR Booking Experiment Message Sent*%0A` +
                    `📍 LR No: ${lrno}%0A` +
                    `🚛 From: ${fstn}%0A` +
                    `🏁 To: ${tstn}%0A` +
                    `📦 Arts: ${arts}%0A` +
                    `⚖️ Weight: ${weight}%0A` +
                    `💰 Total: ₹${lrtype === 'FOC' ? '0 (FOC)' : total}%0A` +
                    `----------------------------%0A` +
                    `ధన్యవాదాలు!`;

        // 1. Consignor కి పంపడం
        if (cnorphno && String(cnorphno).trim().length === 10) {
          window.open(`https://wa.me/91${cnorphno}?text=${msg}`, '_blank');
        }

        // 2. Consignee కి పంపడం (చిన్న గ్యాప్ ఇచ్చి ఓపెన్ చేస్తే బ్రౌజర్ బ్లాక్ చేయదు)
        if (cneephno && String(cneephno).trim().length === 10) {
          setTimeout(() => {
            window.open(`https://wa.me/91${cneephno}?text=${msg}`, '_blank');
          }, 1000); // 1 సెకను ఆగి రెండో ట్యాబ్ ఓపెన్ అవుతుంది
        }
      };
      // ఫంక్షన్ కాల్ చేయండి
      sendWhatsAppToBoth();
      // ======================================================
      alert("బిల్లు విజయవంతంగా సేవ్ చేయబడింది!");
      const result = await res.json();
      if (result.data) {
        setSavedBills(prev => [result.data, ...prev]);
        if (shouldPrint) {
          setSelectedBill(result.data);
          setPrintMode("LASER");
          setShowPrintModal(true);
        }
      }
      // రీసెట్
      setFormData({ ...initialState, bdate: new Date().toISOString().split("T")[0] });
      await fetchNextLR(formData.lrtype);
    } else {
      const err = await res.json();
      alert("ఎర్రర్: " + (err.message || "సేవ్ కాలేదు."));
    }
  } catch (err) {
    console.error(err);
    alert("సర్వర్ కనెక్షన్ సమస్య.");
  } finally {
    setIsSaving(false);
  }
};
  // పాత పేరు handleFinalPrint ని handlePrintAction గా మార్చాం
  const handlePrintAction = useReactToPrint({
    content: () => (printMode === "LASER" ? laserRef.current : dotRef.current),
    onAfterPrint: () => {
      setShowPrintModal(false); // పెండింగ్ మోడల్ క్లోజ్ అవుతుంది
      setPrintMode("");
      setSelectedBill(null);
    },
  });

  const onPrintSelect = (bill, mode) => {
    if (mode === "LASER" || mode === "DOT") {
      setSelectedBill(bill);
      setPrintMode(mode);
      setIsPreviewOpen(true);
    } else {
      setIsPreviewOpen(false);
      setSelectedBill(null);
    }
  };
  if (hasError) {
    return <div style={{ color: "red", padding: "20px", background: "#fff" }}>ఏదో లోపం ఏర్పడింది. దయచేసి కన్సోల్ ని పరిశీలించండి.</div>;
  }
  return (
    <div className="booking-page-bg">
      <div className="sticky-form-container">
        <nav className="line-1-navbar">
          <div className="nav-left">
            USER: <strong>{userData?.userId || "Guest"}</strong>
            <span style={{ marginLeft: "15px", color: "#ddd" }}>
              STATION: <strong>{sName} ({sCode})</strong>
            </span>
          </div>
          <div className="pay-modes">
            {["PAID", "TOPAY", "ONAC", "FOC"].map((mode) => (
              <button
                key={mode}
                className={`pay-mode-btn ${formData.lrtype === mode ? "active" : ""}`}
                onClick={() => handlePayTypeChange(mode)}>
                {mode}
              </button>
            ))}
          </div>
          <div>
            <a href="https://www.gst.gov.in/" className="nav-item-link" target="_blank" rel="noopener noreferrer"
              style={{ textDecoration: 'none', color: '#fff', fontSize: '14px', fontWeight: 'bold' }} >
              GST Verify
            </a>
          </div>
          <button className="back-btn" onClick={onBackToBranches}>⬅ MENU BACK</button>
        </nav>
        <div className="content-layout-80-20">
          <div className="left-80">
            <div className="line-2-header">
              <div className="f-grp">
                <label>DATE:</label>
                <input type="date" value={formData.bdate} onChange={(e) => setFormData({ ...formData, bdate: e.target.value })} />
              </div>
              <div className="f-grp">
                <label>LR NO:</label>
                <input type="text" value={(formData.lrno === 0 || !formData.lrno) ? "" : formData.lrno.toString().replace(/^0+/, '')}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || /^\d+$/.test(val)) {
                      setFormData(prev => ({
                        ...prev,
                        lrno: val === "" ? "" : parseInt(val, 10)
                      }));
                    }
                  }}
                  onBlur={(e) => {
                    if (e.target.value) { checkDuplicateLR(e.target.value); }
                  }}
                />
              </div>
              <div className="f-grp">
                <label>TO STN:</label>
                <input type="text" list="stn-list" className="stn-input-small" value={formData.tstn || ""} onChange={handleToStnChange} placeholder="CODE" />
                <span className="stn-name-val">{formData.toStationName}</span>
                <datalist id="stn-list">
                  {stations
                    .filter((s) => {
                      const c = (s.stationCode || "").trim().toUpperCase();
                      if (c === sCode.toUpperCase() || c.endsWith("TR")) {
                        return false;
                      }
                      return true;
                    })
                    .map((s, i) => (
                      <option key={i} value={s.stationCode}>
                        {s.stationName}
                      </option>
                    ))}
                </datalist>
                <div>
                  <span className="kms-val">{formData.distance || 0} KM</span>
                </div>
              </div>
              <div className="f-grp">
                <label>QUOT NO:</label>
                <input type="text" list="quot-list" className="quot-input-small" value={formData.quotno || ""} onChange={handleQuotChange} placeholder="SELECT" />
                <datalist id="quot-list">
                  {quotations
                    .filter((q) => {
                      // కండిషన్: lrtype "ONAC" అయితే, quotno "GEN" ఉన్న వాటిని తీసేయాలి
                      if (formData.lrtype === "ONAC" && (q.quotno || "").toUpperCase() === "GEN") {
                        return false;
                      }
                      return true;
                    })
                    .map((q, i) => (
                      <option key={i} value={q.quotno}>
                        {q.qcnorname}
                      </option>
                    ))}
                </datalist>
              </div>
            </div>
            <div className="line-3-boxes">
              <div className="entry-box">
                <h4>Consignor</h4>
                <div className="row-input">
                  <label>Name:</label>
                  <input
                    type="text"
                    list="firm-list"
                    value={formData.cnorname || ""}
                    onChange={handleFirmChange}
                    readOnly={formData.quotno !== "GEN"}
                  />
                  <datalist id="firm-list">
                    {holders.filter((h) => {
                      const stnCodeMatch = (h.stationCode || "").trim().toUpperCase() === sCode;
                      const isAll = (h.stationCode || "").trim().toUpperCase() === "ALL";
                      return stnCodeMatch || isAll;
                    }).map((h, i) => (
                      <option key={i} value={h.firmName}>{h.firmName} - {h.gst_number}</option>
                    ))}
                  </datalist>
                </div>
                <div className="row-input">
                  <label>GST NO:</label>
                  <input
                    type="text"
                    list="gst-list"
                    value={formData.cnorgstno || ""}
                    onChange={handleGSTChange}
                    readOnly={formData.quotno !== "GEN"}
                  />
                  <datalist id="gst-list">
                    {holders.filter((h) => {
                      const stnCodeMatch = (h.stationCode || "").trim().toUpperCase() === sCode;
                      const isAll = (h.stationCode || "").trim().toUpperCase() === "ALL";
                      return stnCodeMatch || isAll;
                    }).map((h, i) => (
                      <option key={i} value={h.gst_number}>{h.firmName} ({h.stationCode})</option>
                    ))}
                  </datalist>
                </div>
                <div className="row-input">
                  <label>Phone:</label>
                  <input
                    type="text"
                    value={formData.cnorphno || ""}
                    onChange={(e) => setFormData({ ...formData, cnorphno: e.target.value })}
                  />
                </div>
                <div className="row-input">
                  <label>Address:</label>
                  <textarea
                    value={formData.cnoraddr1 || ""}
                    rows="2"
                    onChange={(e) => setFormData({ ...formData, cnoraddr1: e.target.value })}
                  ></textarea>
                </div>
              </div>
              <div className="entry-box">
                <h4>Consignee</h4>
                <div className="row-input">
                  <label>Name:</label>
                  <input
                    type="text"
                    list="consignee-firm-list"
                    value={formData.cneename || ""}
                    onChange={handleConsigneeFirmChange}
                    placeholder="Select Consignee"
                  />
                  <datalist id="consignee-firm-list">
                    {holders.filter((h) => {
                      const stnCodeMatch = (h.stationCode || "").trim().toUpperCase() === (formData.tstn || "").trim().toUpperCase();
                      const isAll = (h.stationCode || "").trim().toUpperCase() === "ALL";
                      return stnCodeMatch || isAll;
                    }).map((h, i) => (
                      <option key={i} value={h.firmName}>{h.firmName} - {h.gst_number}</option>
                    ))}
                  </datalist>
                </div>
                <div className="row-input">
                  <label>GST NO:</label>
                  <input
                    type="text"
                    list="consignee-gst-list"
                    value={formData.cneegstno || ""}
                    onChange={handleConsigneeGSTChange}
                  />
                  <datalist id="consignee-gst-list">
                    {holders.filter((h) => {
                      const stnCodeMatch = (h.stationCode || "").trim().toUpperCase() === (formData.tstn || "").trim().toUpperCase();
                      const isAll = (h.stationCode || "").trim().toUpperCase() === "ALL";
                      return stnCodeMatch || isAll;
                    }).map((h, i) => (
                      <option key={i} value={h.gst_number}>{h.firmName} ({h.stationCode})</option>
                    ))}
                  </datalist>
                </div>
                <div className="row-input">
                  <label>Phone:</label>
                  <input
                    type="text"
                    value={formData.cneephno || ""}
                    onChange={(e) => setFormData({ ...formData, cneephno: e.target.value })}
                  />
                </div>
                <div className="row-input">
                  <label>Address:</label>
                  <textarea
                    value={formData.cneeaddr1 || ""}
                    rows="2"
                    onChange={(e) => setFormData({ ...formData, cneeaddr1: e.target.value })}
                  ></textarea>
                </div>
              </div>
              <div className="entry-box">
                <h4>Details</h4>
                <div className="mini-grid">
                  <label>Articles:</label><input type="number" value={formData.arts || ""} onChange={(e) => setFormData({ ...formData, arts: e.target.value === "" ? "" : parseInt(e.target.value) })} />
                  <label>Weight:</label><input type="number" value={formData.weight || ""} onChange={(e) => setFormData({ ...formData, weight: e.target.value === "" ? "" : parseFloat(e.target.value) })} />
                  <label>CDM :</label><input type="number" value={formData.cdm || ""} onChange={(e) => setFormData({ ...formData, cdm: e.target.value === "" ? "" : parseFloat(e.target.value) })} />
                  <label>Value:</label><input type="number" value={formData.cmentval || ""} onChange={(e) => setFormData({ ...formData, cmentval: e.target.value === "" ? "" : parseFloat(e.target.value) })} />
                </div>
              </div>
              <div className="entry-box">
                <h4>Options</h4>
                <label>RCM<input type="checkbox" checked={true} disabled={true} readOnly={true} /></label>
                <label>W.P<input type="checkbox" checked={formData.isWP || false} onChange={(e) => setFormData({ ...formData, isWP: e.target.checked })} /> </label>
                <label>DDC <input type="checkbox" checked={formData.quotno !== "GEN" && formData.qddchg > 0 ? true : (formData.ddcApply || false)}
                  onChange={(e) => setFormData({ ...formData, ddcApply: e.target.checked })}
                  disabled={formData.quotno !== "GEN" && formData.qddchg > 0} />
                </label>
                {(formData.quotno === "GEN" || (formData.quotno !== "GEN" && formData.qddchg === 0)) && (formData.ddcApply) && (
                  <div className="manual-ddc-input">
                    <input type="number" value={formData.manualDDC || ""} onChange={(e) => setFormData({ ...formData, manualDDC: e.target.value === "" ? "" : parseFloat(e.target.value) })} placeholder="Amt" className="small-input" />
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="right-20-summary">
            <h4>Summary</h4>
            <div className="summary-grid-mini">
              {[
                { label: "Freight", value: formData.freight },
                { label: "LR Charge", value: formData.lrchg },
                { label: "Surcharge", value: formData.surchg },
                { label: "Article Chg", value: formData.artchg },
                { label: "Value Chg", value: formData.valchg },
                { label: "Withpass Chg", value: formData.wpchg },
                { label: "DD Charge", value: formData.ddchg },
                { label: "H.weit Chg", value: formData.hweitChg },
              ].map(
                (item, index) =>
                  item.value > 0 && (
                    <div key={index} className="summary-item">
                      <span className="summary-label">{item.label}:</span>
                      <span className="summary-value">₹{item.value}</span>
                    </div>
                  ),
              )}
              <div className="summary-item gst-row">
                <span className="summary-label">GST :</span>
                <span className="summary-value">₹{formData.gst || 0}</span>
              </div>
            </div>
            <hr className="summary-divider" />
            <div className="summary-total-row">
              <span className="total-label">Total :</span>
              <span className="total-value-highlight">₹{formData.total || 0}</span>
            </div>
          </div>
        </div>
        <div className="line-4-actions">
          <div className="desc-inputs">
            <input placeholder="Desc1" value={formData.desc1 || ""} onChange={(e) => setFormData({ ...formData, desc1: e.target.value })} />
            <input placeholder="Desc2" value={formData.desc2 || ""} onChange={(e) => setFormData({ ...formData, desc2: e.target.value })} />
          </div>
          <div className="btn-group">
            <button className="btn-save" onClick={() => handleSave(false)} disabled={isSaving}>{isSaving ? "SAVING..." : "💾 SAVE"}</button>
            {/* <button className="btn-print" onClick={() => handleSave(true)} disabled={isSaving}>{isSaving ? "WAIT..." : "🖨️ SAVE & PRINT"}</button> */}
            <button className="btn-clear" onClick={() => setFormData(initialState)}>❌ CANCEL</button>
          </div>
        </div>
      </div>
      <div className="scrolling-pending-area">
        <table className="pending-table">
          <thead><tr><th>LR NO</th><th>TO STN</th><th>CONSIGNEE</th><th>STATUS</th><th>ACTION</th></tr></thead>
          <tbody>
            {savedBills && savedBills.length > 0 ? (
              savedBills
                .filter(b => b.isPrinted !== true)
                .map(b => (
                  <tr key={b._id || b.lrno}>
                    <td>{b.lrno || ''}</td>
                    <td>{b.tstn || ''}</td>
                    <td>{b.cneename || b.cneeName || ''}</td>
                    <td>⏳ Pending</td>
                    <td>
                      <select
                        className="print-dropdown"
                        value=""
                        onChange={(e) => {
                          const mode = e.target.value;
                          if (mode === "LASER" || mode === "DOT") {
                            setSelectedBill(b);
                            setPrintMode(mode);
                            setShowPrintModal(true);
                          }
                        }}
                        style={{ padding: '1px', borderRadius: '4px', cursor: 'pointer' }}>
                        <option value="" disabled hidden>🖨️ Print</option>
                        <option value="LASER">Laser Jet</option>
                        <option value="DOT">Dot Matrix</option>
                        <option value="CANCEL">Cancel</option>
                      </select>
                    </td>
                  </tr>
                ))
            ) : (
              <tr>
                <td colSpan="5">పెండింగ్ బిల్లులు ఏమీ లేవు.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {showPrintModal && selectedBill && (
        <div className="preview-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="modal-content" style={{ background: 'white', padding: '20px', borderRadius: '8px', maxWidth: '90%', maxHeight: '90%', overflow: 'auto' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #ccc', marginBottom: '10px' }}>
              <h3 style={{ margin: 0 }}>Bill Preview ({printMode})</h3>
              <button onClick={() => setShowPrintModal(false)} style={{ cursor: 'pointer', background: 'none', border: 'none', fontSize: '20px' }}>&times;</button>
            </div>

            <div className="modal-body" style={{ padding: '10px', minHeight: '300px' }}>
              {/* printMode "LASER" అయితే ఒకలా, "DOT" అయితే మరోలా చూపిస్తుంది */}
              {printMode === "LASER" ? (
                <LaserJetPrint data={selectedBill} />
              ) : (
                <div style={{ border: '1px dashed #ccc', padding: '10px', backgroundColor: '#f9f9f9' }}>
                  {/* DotMatrixPrint ఇక్కడ ఖచ్చితంగా కనిపిస్తుంది */}
                  <DotMatrixPrint data={selectedBill} />
                </div>
              )}
            </div>


            <div className="modal-footer" style={{ marginTop: '20px', textAlign: 'right' }}>
              <button
                onClick={handlePrintAction} // ఇక్కడ పేరు పైన ఉన్న useReactToPrint పేరుతో మ్యాచ్ అవ్వాలి
                style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', marginRight: '10px', cursor: 'pointer', borderRadius: '4px' }}
              >
                ✅ Confirm & Print
              </button>
              <button
                onClick={() => setShowPrintModal(false)}
                style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
              >
                ❌ Close
              </button>
            </div>
          </div>
        </div>
      )}
      <div style={{ display: "none" }}>
        <LaserJetPrint ref={laserRef} data={selectedBill} />
        <DotMatrixPrint ref={dotRef} data={selectedBill} />
      </div>
    </div>
  );
};
export default FreightBooking;