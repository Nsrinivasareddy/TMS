
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const MasterEntry = () => {
    const mainInputRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
    const [currentMode, setCurrentMode] = useState('ADD'); 

    // 🚉 Stations Data Core States
    const [dbStations, setDbStations] = useState([]);
    const [filteredStations, setFilteredStations] = useState([]);

    // 🏢 Official Transport 10 Business Sections
    const businessSections = [
        { id: 'ADMIN' }, { id: 'BUSINESS' }, { id: 'MAINACS' }, { id: 'DCRACS' }, { id: 'LCO' },
        { id: 'INVOICE' }, { id: 'TMENT' }, { id: 'LPD' }, { id: 'SHED' }, { id: 'BRANCHES' }
    ];

    // 🔐 Login User Metadata
    const loginUser = { login_id: 'nsreddy_srt', login_station: 'VZA', login_section: 'MAINACS' }; 
    const isAccountsUser = loginUser.login_section === 'MAINACS';


    // 🌟 Master Categories List
    const [categoriesList, setCategoriesList] = useState([
        { id: 'CUSTOMER', name: 'CUSTOMER' },
        { id: 'SUPPLIER', name: 'SUPPLIER' },
        { id: 'STAFF', name: 'STAFF' },
        { id: 'RSTAFF', name: 'RSTAFF' },
        { id: 'AGENT', name: 'AGENT' },
        { id: 'OWN_LORRY', name: 'OWN_LORRY' },
        { id: 'BANK_AC', name: 'BANK_AC' },
        { id: 'EXPENSES', name: 'EXPENSES' },
        { id: 'TAX_AC', name: 'TAX_AC' }
    ]);

    const [showNewCatInput, setShowNewCatInput] = useState(false);
    const [newCatNumber, setNewCatNumber] = useState(''); 
    const [newCatName, setNewCatName] = useState(''); 

    const initialFormState = {
        selected_category_id: 'CUSTOMER', 
        ac_status_display: 'CUSTOMER',    
        ac_code: '', 
        input_value: '', 
        sectionName: '', 
        stationCode: '', 
        stationName: '', 
        email: '',       
        phone: '',       
        allow_erp_login: false,
        ac_type: 'PL', 
        ope_dr: '0.00',
        ope_cr: '0.00'
    };

    const [formData, setFormData] = useState(initialFormState);
    const [isFirstAccountOfNewGroup, setIsFirstAccountOfNewGroup] = useState(false);

    useEffect(() => {
        fetchCategoriesFromMasters();
        fetchAllStationsFromDB();
    }, []);

    const fetchCategoriesFromMasters = async () => {
        try {
const res = await axios.get('http://localhost:5001/api/masters/main-heads');
            if (res.data && res.data.success) {
                const allRecords = res.data.data || [];
                const existingMap = new Map();
                categoriesList.forEach(c => existingMap.set(c.id, c.name));

                allRecords.forEach(rec => {
                    const status = String(rec.ac_status || '').trim();
                    if (status && !isNaN(status) && !status.toUpperCase().endsWith('S')) {
                        if (!existingMap.has(status)) {
                            existingMap.set(status, rec.group_name || `${status} GROUP`);
                        }
                    }
                });
                setCategoriesList(Array.from(existingMap.entries()).map(([id, name]) => ({ id, name })));
            }
        } catch (error) {
            console.error("error fetching categories", error);
        }
    };

    useEffect(() => {
        if (currentMode === 'ADD' && formData.selected_category_id) {
            const currentId = formData.selected_category_id;
            const isNumberGroup = !isNaN(currentId);

            if (isNumberGroup) {
                const enteredCode = String(formData.ac_code).trim();
                const isFirst = enteredCode.endsWith('01') || enteredCode.endsWith('001') || enteredCode === `${currentId}1`;
                
                setIsFirstAccountOfNewGroup(isFirst);

                setFormData(prev => ({
                    ...prev,
                    ac_status_display: isFirst ? currentId : `${currentId}S`
                }));

                if (isFirst) {
                    const selectedObj = categoriesList.find(c => c.id === currentId);
                    if (selectedObj) {
                        setFormData(prev => ({ ...prev, input_value: selectedObj.name }));
                    }
                }
            } else {
                setIsFirstAccountOfNewGroup(false);
                setFormData(prev => ({ ...prev, ac_status_display: currentId }));
            }
        }
    }, [formData.selected_category_id, formData.ac_code, currentMode, categoriesList]);

    const handleAddNewCategoryGroup = () => {
        const num = newCatNumber.trim();
        const name = newCatName.trim().toUpperCase();

        if (!num || !name) {
            alert("Group నంబర్ మరియు పేరు నమోదు చేయండి!");
            return;
        }

        if (categoriesList.some(cat => cat.id === num)) {
            alert("ఈ గ్రూప్ నంబర్ ఇప్పటికే ఉంది!");
            return;
        }

        const newGroup = { id: num, name: name };
        setCategoriesList(prev => [...prev, newGroup]);
        
        setFormData(prev => ({ 
            ...prev, 
            selected_category_id: num, 
            ac_status_display: num,
            ac_code: '',
            input_value: name 
        })); 

        setIsFirstAccountOfNewGroup(true);
        setNewCatNumber('');
        setNewCatName('');
        setShowNewCatInput(false);
    };

    // 🚉 1. STRICT OVERRIDE RULE ENGINE (Fixed Return Interception)
    useEffect(() => {
        if (!formData.sectionName) {
            setFilteredStations([]);
            return;
        }

        const currentSection = formData.sectionName.toUpperCase();
        const vzaOnlySections = ['ADMIN', 'BUSINESS', 'MAINACS', 'DCRACS', 'LCO', 'INVOICE', 'LPD', 'SHED'];
        let resultStations = [];

        // Data normalize keys check up standardizing layout
        const normalizedStations = dbStations.map(st => ({
            stationCode: String(st.stationCode || st.station_code || '').toUpperCase().trim(),
            stationName: String(st.stationName || st.station_name || '').toUpperCase().trim()
        }));

        // 🔥 CRITICAL FIXED: TMENT & BRANCHES checks run first, bypassing the global accounts user restrictions
        if (currentSection === 'TMENT') {
            // 🌟 Rule: Length must be exactly 4 AND end with "TR"
            resultStations = normalizedStations.filter(st => {
                return st.stationCode.length === 4 && st.stationCode.endsWith('TR');
            });
        } else if (currentSection === 'BRANCHES') {
            // 🌟 Rule: All generic stations excluding Transhipment points
            resultStations = normalizedStations.filter(st => {
                return !st.stationCode.endsWith('TR');
            });
        } else if (vzaOnlySections.includes(currentSection)) {
            // Standard Head Office dynamic route locks to VZA only
            resultStations = normalizedStations.filter(st => st.stationCode === 'VZA');
        } else if (isAccountsUser) {
            // Fallback default catch block for accounts standard profiles
            resultStations = [...normalizedStations];
        }

        setFilteredStations(resultStations.sort((a, b) => a.stationCode.localeCompare(b.stationCode)));
    }, [formData.sectionName, dbStations, isAccountsUser]);


    // 🏢 2. SECTION SELECTION CHANGE LOGIC
    const handleSectionChange = (e) => {
        const selectedSection = e.target.value.toUpperCase();
        const vzaOnlySections = ['ADMIN', 'BUSINESS', 'MAINACS', 'DCRACS', 'LCO', 'INVOICE', 'LPD', 'SHED'];

        if (vzaOnlySections.includes(selectedSection)) {
            setFormData(prev => ({
                ...prev,
                sectionName: selectedSection,
                stationCode: 'VZA',
                stationName: 'VIJAYAWADA'
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                sectionName: selectedSection,
                stationCode: '',
                stationName: ''
            }));
        }
    };

    // 🚉 3. DYNAMIC STATION SELECTION ONCHANGE
    const handleStationChange = (e) => {
        const selectedCode = e.target.value.toUpperCase().trim();
        const matchedStation = dbStations.find(st => {
            const code = String(st.stationCode || st.station_code || '').toUpperCase().trim();
            return code === selectedCode;
        });

        setFormData(prev => ({
            ...prev,
            stationCode: selectedCode,
            stationName: matchedStation ? String(matchedStation.stationName || matchedStation.station_name || '').toUpperCase().trim() : ''
        }));
    };

    const fetchAllStationsFromDB = async () => {
        try {
            const res = await axios.get('http://localhost:5001/api/stations/all');
            const data = res.data;
            setDbStations(Array.isArray(data) ? data : (data.data || []));
        } catch (error) {
            setDbStations([
                { stationCode: 'VZA', stationName: 'VIJAYAWADA' },
                { stationCode: 'GNTTR', stationName: 'GUNTUR TR' },
                { stationCode: 'VZATR', stationName: 'VIJAYAWADA TR' },
                { stationCode: 'TPTTR', stationName: 'TIRUPATI TR' },
                { stationCode: 'NLR', stationName: 'NELLORE' }
            ]);
        }
    };

    const handleFetchMasterDetails = async (code) => {
        if (!code) return;
        setLoading(true);
        try {
            
            const res = await axios.get(`http://localhost:5001/api/masters/details/${code}`);
            if (res.data && res.data.success) {
                const dbData = res.data.data;
                let dbStatus = String(dbData.ac_status || 'CUSTOMER');
                let baseMatch = dbStatus;
                if (dbStatus.toUpperCase().endsWith('S') && dbStatus.length > 2 && !isNaN(dbStatus.slice(0, -1))) {
                    baseMatch = dbStatus.slice(0, -1);
                }

                if (!categoriesList.some(c => c.id === baseMatch)) {
                    setCategoriesList(prev => [...prev, { id: baseMatch, name: dbData.group_name || `${baseMatch} GROUP` }]);
                }

                setFormData({
                    selected_category_id: baseMatch,
                    ac_status_display: dbStatus, 
                    ac_code: String(dbData.ac_code),
                    input_value: dbData.ac_name || '',
                    sectionName: dbData.sectionName || '',
                    stationCode: dbData.stationCode || dbData.station_code || '',
                    stationName: dbData.stationName || dbData.station_name || '',
                    email: dbData.email || '',
                    phone: dbData.phone || '',
                    allow_erp_login: dbData.allow_erp_login || false,
                    ac_type: dbData.ac_type || 'PL', 
                    ope_dr: dbData.ope_dr || '0.00',
                    ope_cr: dbData.ope_cr || '0.00'
                });
            }
        } catch (error) {
            setStatusMsg({ type: 'error', text: "Account కోడ్ దొరకలేదు!" });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const changeMode = (mode) => {
        setCurrentMode(mode);
        setFormData(initialFormState);
        setStatusMsg({ type: '', text: '' });
    };

const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.ac_code) {
        alert("దయచేసి A/C Code నమోదు చేయండి!");
        return;
    }

    const finalStatus = String(formData.ac_status_display).trim();
    const selectedGroupObj = categoriesList.find(c => c.id === formData.selected_category_id);
    const groupName = selectedGroupObj ? selectedGroupObj.name : '';

    // 🔥 బ్యాక్-ఎండ్ సర్వర్ రిజెక్ట్ చేయకుండా సేఫ్ పేలోడ్ బిల్డ్ చేయడం
    const cleanPayload = {
        selected_category_id: String(formData.selected_category_id).toUpperCase().trim(),
        ac_status: finalStatus, // Eg: "CUSTOMER", "90", "90S"
        group_name: String(groupName).toUpperCase().trim(),
        ac_code: String(formData.ac_code).toUpperCase().trim(),
        ac_name: String(formData.input_value).toUpperCase().trim(),
        sectionName: String(formData.sectionName).toUpperCase().trim(),
        stationCode: String(formData.stationCode).toUpperCase().trim(),
        stationName: String(formData.stationName).toUpperCase().trim(),
        email: String(formData.email || '').toLowerCase().trim(),
        phone: String(formData.phone || '').trim(),
        allow_erp_login: Boolean(formData.allow_erp_login),
        ac_type: String(formData.ac_type).toUpperCase().trim(), 
        ope_dr: Number(formData.ope_dr || 0).toFixed(2), // స్ట్రింగ్‌ను నంబర్‌గా మార్చడం
        ope_cr: Number(formData.ope_cr || 0).toFixed(2), // స్ట్రింగ్‌ను నంబర్‌గా మార్చడం
        login_id: String(loginUser.login_id),
        login_station: String(loginUser.login_station),
        login_section: String(loginUser.login_section)
    };

    setLoading(true);
    setStatusMsg({ type: '', text: '' });

    try {
        const res = await axios.post('http://localhost:5001/api/masters/accounts/master-save', cleanPayload);
                if (res && res.data.success) {
            setStatusMsg({ type: 'success', text: `✓ విజయవంతంగా సేవ్ అయింది! AC_NAME: "${formData.input_value}"` });
            setFormData(initialFormState);
            fetchCategoriesFromMasters(); 
        } else {
            setStatusMsg({ type: 'error', text: `సర్వర్ ఎర్రర్: ${res.data.message || 'Operation Failed!'}` });
        }
    } catch (error) {
        console.error("CRITICAL BACKEND ERROR TRACE:", error);
        
        // 🔥 సర్వర్ నుండి వచ్చే అసలైన ఎర్రర్ మెసేజ్‌ని పట్టుకోవడం
        const serverErrorMessage = error.response && error.response.data && error.response.data.message
            ? error.response.data.message
            : "Server Connection Error or Schema Validation Failure!";
            
        setStatusMsg({ type: 'error', text: `❌ SERVER ERROR: ${serverErrorMessage}` });
    } finally {
        setLoading(false);
    }
};



    const isNameReadOnly = (currentMode === 'ADD' && isFirstAccountOfNewGroup) || currentMode === 'ENQUIRY' || currentMode === 'DELETE';

    return (
        <div style={{ color: '#fff', fontFamily: 'monospace', padding: '5px', boxSizing: 'border-box', width: '100%' }}>
            <div style={{ backgroundColor: '#111c44', padding: '12px', borderRadius: '4px', border: '1px solid #243068', width: '100%' }}>
                
                {/* Modes Architecture Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '6px', marginBottom: '12px' }}>
                    <button type="button" onClick={() => changeMode('ADD')} style={{ backgroundColor: currentMode === 'ADD' ? '#48bb78' : '#1d2854', color: currentMode === 'ADD' ? '#000' : '#fff', border: '1px solid #243068', height: '28px', fontWeight: 'bold', fontSize: '11px' }}>➕ ADD MODE</button>
                    <button type="button" onClick={() => changeMode('ENQUIRY')} style={{ backgroundColor: currentMode === 'ENQUIRY' ? '#4299e1' : '#1d2854', color: currentMode === 'ENQUIRY' ? '#000' : '#fff', border: '1px solid #243068', height: '28px', fontWeight: 'bold', fontSize: '11px' }}>🔍 ENQUIRY MODE</button>
                    <button type="button" onClick={() => changeMode('UPDATE')} style={{ backgroundColor: currentMode === 'UPDATE' ? '#ecc94b' : '#1d2854', color: currentMode === 'UPDATE' ? '#000' : '#fff', border: '1px solid #243068', height: '28px', fontWeight: 'bold', fontSize: '11px' }}>📝 UPDATE MODE</button>
                    <button type="button" onClick={() => changeMode('DELETE')} style={{ backgroundColor: currentMode === 'DELETE' ? '#f56565' : '#1d2854', color: currentMode === 'DELETE' ? '#000' : '#fff', border: '1px solid #243068', height: '28px', fontWeight: 'bold', fontSize: '11px' }}>❌ DELETE MODE</button>
                </div>

                {/* Account Category Creator Inline Layout */}
                <div style={{ backgroundColor: '#16224f', padding: '8px', borderRadius: '4px', border: '1px solid #00d2ff', marginBottom: '12px' }}>
                    {!showNewCatInput ? (
                        <button type="button" onClick={() => setShowNewCatInput(true)} style={{ backgroundColor: '#00d2ff', color: '#000', border: 'none', height: '24px', padding: '0 10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '11px' }}>
                            ➕ CREATE NEW CATEGORY GROUP
                        </button>
                    ) : (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input type="number" value={newCatNumber} onChange={(e) => setNewCatNumber(e.target.value)} placeholder="GROUP CODE" style={{ backgroundColor: '#0b1437', color: '#00d2ff', border: '1px solid #243068', height: '24px', padding: '0 8px', fontSize: '11px', flex: '0 0 25%', fontWeight: 'bold' }} />
                            <input type="text" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="NAME (Eg: COLLECTION A/C)" style={{ backgroundColor: '#0b1437', color: '#fff', border: '1px solid #243068', height: '24px', padding: '0 8px', fontSize: '11px', flex: 1 }} />
                            <button type="button" onClick={handleAddNewCategoryGroup} style={{ backgroundColor: '#48bb78', color: '#000', border: 'none', height: '24px', padding: '0 12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '11px' }}>CREATE</button>
                            <button type="button" onClick={() => setShowNewCatInput(false)} style={{ backgroundColor: '#f56565', color: '#fff', border: 'none', height: '24px', padding: '0 12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '11px' }}>CANCEL</button>
                        </div>
                    )}
                </div>

                {statusMsg.text && (
                    <div style={{ padding: '5px', backgroundColor: statusMsg.type === 'success' ? '#1c4532' : '#6b2020', marginBottom: '8px', fontSize: '11px' }}>
                        {statusMsg.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    
                    {/* Data Row Line 1 */}
                    <div style={{ display: 'flex', gap: '8px', width: '100%', alignItems: 'flex-end' }}>
                        <div style={{ flex: '0 0 22%', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <label style={{ color: '#a0aec0', fontWeight: 'bold', fontSize: '10px' }}>1. SELECT DROPDOWN:</label>
                            <select name="selected_category_id" value={formData.selected_category_id} onChange={handleInputChange} disabled={currentMode === 'UPDATE' || currentMode === 'ENQUIRY'} style={{ backgroundColor: '#0b1437', color: '#fff', height: '24px', border: '1px solid #243068', fontWeight: 'bold', fontSize: '11px', width: '100%' }}>
                                {categoriesList.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                            </select>
                        </div>

                        <div style={{ flex: '0 0 13%', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <label style={{ color: '#ecc94b', fontWeight: 'bold', fontSize: '10px' }}>2. AC_STATUS:</label>
                            <input type="text" name="ac_status_display" value={formData.ac_status_display} readOnly style={{ backgroundColor: '#0f172a', color: '#ecc94b', height: '22px', border: '1px solid #243068', padding: '0 6px', fontWeight: 'bold', textAlign: 'center', fontSize: '12px' }} />
                        </div>
                        
                        <div style={{ flex: '0 0 13%', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <label style={{ color: '#00d2ff', fontWeight: 'bold', fontSize: '10px' }}>3. A/C CODE:</label>
                            <input type="text" name="ac_code" value={formData.ac_code} onChange={handleInputChange} onKeyDown={(e) => e.key === 'Enter' && currentMode !== 'ADD' && handleFetchMasterDetails(formData.ac_code)} placeholder="CODE" style={{ backgroundColor: '#0b1437', color: '#00d2ff', height: '22px', border: '1px solid #00d2ff', padding: '0 4px', fontWeight: 'bold', textAlign: 'center', fontSize: '12px' }} required />
                        </div>
                        
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <label style={{ color: isNameReadOnly ? '#48bb78' : '#00d2ff', fontWeight: 'bold', fontSize: '10px' }}>
                                {isFirstAccountOfNewGroup ? "4. A/C NAME (AUTO FILLED):" : "4. A/C NAME / SUB A/C NAME:"}
                            </label>
                            <input ref={mainInputRef} type="text" name="input_value" value={formData.input_value} onChange={handleInputChange} readOnly={isNameReadOnly} style={{ backgroundColor: isNameReadOnly ? '#0f172a' : '#0b1437', color: isNameReadOnly ? '#48bb78' : '#fff', height: '22px', border: isNameReadOnly ? '1px solid #243068' : '1px solid #00d2ff', padding: '0 8px', textTransform: 'uppercase', width: '100%', boxSizing: 'border-box', fontSize: '11px', fontWeight: isFirstAccountOfNewGroup ? 'bold' : 'normal' }} required />
                        </div>
                    </div>

                    {/* Data Row Line 2 */}
                    <div style={{ display: 'flex', gap: '10px', width: '100%', alignItems: 'flex-end' }}>
                        
                        {/* 🏢 5. SECTION NAME */}
                        <div style={{ flex: '0 0 22%', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <label style={{ color: '#a0aec0', fontWeight: 'bold', fontSize: '10px' }}>5. SECTION NAME:</label>
                            <select 
                                name="sectionName" 
                                value={formData.sectionName} 
                                onChange={handleSectionChange} 
                                disabled={currentMode === 'ENQUIRY' || currentMode === 'DELETE'} 
                                style={{ backgroundColor: '#0b1437', color: '#fff', height: '24px', border: '1px solid #243068', fontSize: '11px', width: '100%' }} 
                                required
                            >
                                <option value="">-- SELECT --</option>
                                {businessSections.map(sec => <option key={sec.id} value={sec.id}>{sec.id}</option>)}
                            </select>
                        </div>

                        {/* 🚉 6. STN CODE */}
                        <div style={{ flex: '0 0 13%', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <label style={{ color: '#ecc94b', fontWeight: 'bold', fontSize: '10px' }}>6. STN CODE:</label>
                            <select 
                                name="stationCode" 
                                value={formData.stationCode} 
                                onChange={handleStationChange} 
                                disabled={currentMode === 'ENQUIRY' || currentMode === 'DELETE'} 
                                style={{ backgroundColor: '#0b1437', color: '#ecc94b', height: '24px', border: '1px solid #243068', fontWeight: 'bold', fontSize: '11px', width: '100%' }} 
                                required
                            >
                                <option value="">SELECT</option>
                                {filteredStations.map((st, i) => (
                                    <option key={i} value={st.stationCode}>
                                        {st.stationCode}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 🚉 7. STATION NAME (AUTO) */}
                        <div style={{ flex: '0 0 35%', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <label style={{ color: '#a0aec0', fontWeight: 'bold', fontSize: '10px' }}>7. STATION NAME (AUTO):</label>
                            <input type="text" name="stationName" value={formData.stationName} readOnly style={{ backgroundColor: '#0f172a', color: '#48bb78', height: '22px', border: '1px solid #243068', padding: '0 8px', fontWeight: 'bold', width: '100%', fontSize: '11px', textTransform: 'uppercase' }} />
                        </div>

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <label style={{ color: '#ecc94b', fontWeight: 'bold', fontSize: '10px' }}>8. PHONE / MOBILE NO:</label>
                            <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} readOnly={currentMode === 'ENQUIRY' || currentMode === 'DELETE'} placeholder="10 Digit Mobile" maxLength="10" style={{ backgroundColor: '#0b1437', color: '#fff', height: '22px', border: '1px solid #243068', padding: '0 8px', width: '100%', fontSize: '11px' }} required />
                        </div>
                    </div>

                    {/* Financial Data Row Line 3 */}
                    <div style={{ display: 'flex', gap: '10px', width: '100%', alignItems: 'flex-end', backgroundColor: '#16224f', padding: '6px', borderRadius: '4px', border: '1px solid #243068' }}>
                        <div style={{ flex: '0 0 22%', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <label style={{ color: '#00d2ff', fontWeight: 'bold', fontSize: '10px' }}>9. A/C TYPE:</label>
                            <select name="ac_type" value={formData.ac_type} onChange={handleInputChange} disabled={currentMode === 'ENQUIRY' || currentMode === 'DELETE'} style={{ backgroundColor: '#0b1437', color: '#00d2ff', height: '24px', border: '1px solid #243068', fontWeight: 'bold', fontSize: '11px', width: '100%' }}>
                                <option value="PL">PROFIT & LOSS A/C (P&L)</option>
                                <option value="BS">BALANCE SHEET (B/S)</option>
                            </select>
                        </div>

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <label style={{ color: '#48bb78', fontWeight: 'bold', fontSize: '10px' }}>10. OPENING DR (Rs.):</label>
                            <input type="number" step="0.01" name="ope_dr" value={formData.ope_dr} onChange={handleInputChange} readOnly={currentMode === 'ENQUIRY' || currentMode === 'DELETE'} style={{ backgroundColor: '#0b1437', color: '#48bb78', height: '22px', border: '1px solid #243068', padding: '0 8px', fontWeight: 'bold', fontSize: '11px', width: '100%' }} />
                        </div>

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <label style={{ color: '#f56565', fontWeight: 'bold', fontSize: '10px' }}>11. OPENING CR (Rs.):</label>
                            <input type="number" step="0.01" name="ope_cr" value={formData.ope_cr} onChange={handleInputChange} readOnly={currentMode === 'ENQUIRY' || currentMode === 'DELETE'} style={{ backgroundColor: '#0b1437', color: '#f56565', height: '22px', border: '1px solid #243068', padding: '0 8px', fontWeight: 'bold', fontSize: '11px', width: '100%' }} />
                        </div>
                    </div>

                    {/* Operational Action Submitter Control */}
                    {currentMode !== 'ENQUIRY' && (
                        <div style={{ marginTop: '4px' }}>
                            <button type="submit" disabled={loading} style={{ 
                                backgroundColor: loading ? '#4a5568' : (currentMode === 'ADD' ? '#48bb78' : currentMode === 'UPDATE' ? '#ecc94b' : '#f56565'), 
                                color: '#000', border: 'none', width: '100%', height: '30px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px', fontSize: '12px' 
                            }}>
                                ✓ EXECUTE {currentMode} OPERATION
                            </button>
                        </div>
                    )}

                </form>
            </div>
        </div>
    );
};

export default MasterEntry;
