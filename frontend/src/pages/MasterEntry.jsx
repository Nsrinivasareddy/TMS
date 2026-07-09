import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

axios.defaults.withCredentials = true;

const MasterEntry = () => {
    const mainInputRef = useRef(null);
    const apiBase = 'https://tms-crh2.onrender.com/api';

    // 1. లాగిన్ యూజర్ వివరాల కోసం స్టేట్ క్రియేట్ చేశాం (డైనమిక్)
    const [loggedInUser, setLoggedInUser] = useState({
        userId: 'LOADING...',
        section: 'LOADING...',
        station: 'LOADING...'
    });

    const [loading, setLoading] = useState(false);
    const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
    const [currentMode, setCurrentMode] = useState('ADD');
    const [dbStations, setDbStations] = useState([]);
    const [filteredStations, setFilteredStations] = useState([]);
    const businessSections = [
        { id: 'ADMIN' }, { id: 'BUSINESS' }, { id: 'MAINACS' }, { id: 'DCRACS' }, { id: 'LCO' },
        { id: 'INVOICE' }, { id: 'TMENT' }, { id: 'LPD' }, { id: 'SHED' }, { id: 'BRANCHES' }
    ];

    const [dbGroups, setDbGroups] = useState([]);
    const [showNewGroupInput, setShowNewGroupInput] = useState(false);
    const [newGroupStatus, setNewGroupStatus] = useState('');
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupType, setNewGroupType] = useState('PL');
    const adminAllowedGroups = [
        'STAFF LEDGER CONTROL A/C', 'AGENTS LEDGER CONTROL A/C',
        'R/STAFF LEDGER CONTROL A/C', 'LORRY OWNERS LEDGER CONTROL A/C',
        'AGENTS SECURITY DEPOSIT CONTROL A/C', 'ONAC LEDGER CONTROL A/C'
    ];
    const initialFormState = {
        selected_group_id: '',
        ac_status_display: '',
        ac_code: '',
        input_value: '',
        sectionName: '',
        stationCode: '',
        stationName: '',
        phone: '',
        ac_type: 'PL',
        allow_erp_login: false,
        email: '',
        ope_dr: '0.00',
        ope_cr: '0.00'
    };
    const [formData, setFormData] = useState(initialFormState);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };


    useEffect(() => {
        const fetchLoggedInUser = async () => {
            try {
                const localUser = localStorage.getItem('user');

                if (localUser) {
                    const parsed = JSON.parse(localUser);
                    setLoggedInUser({
                        // ఇక్కడ మీ authController కి తగ్గట్టుగా పేర్లు మార్చబడ్డాయి
                        userId: parsed.userId || 'UNKNOWN',
                        section: parsed.sectionName || 'UNKNOWN',
                        station: parsed.stationCode || 'UNKNOWN'
                    });
                } else {
                    const res = await axios.get(`${apiBase}/auth/me`);
                    if (res.data?.success && res.data?.user) {
                        setLoggedInUser({
                            userId: res.data.user.userId,
                            section: res.data.user.sectionName,
                            station: res.data.user.stationCode
                        });
                    } else {
                        setLoggedInUser({ userId: 'GUEST', section: 'N/A', station: 'N/A' });
                    }
                }
            } catch (error) {
                console.error("Failed to fetch user details", error);
                setLoggedInUser({ userId: 'ERROR', section: 'ERROR', station: 'ERROR' });
            }
        };

        fetchLoggedInUser();
        fetchGroupsFromDB();
        fetchAllStationsFromDB();
    }, []);

    const fetchGroupsFromDB = async () => {
        try {
            const res = await axios.get(`${apiBase}/masters/main-heads`);
            if (res.data?.success) {
                const allRecords = res.data.data || [];
                const filteredGroups = allRecords.filter(rec => {
                    const status = String(rec.ac_status || '').trim();
                    return status && !status.toUpperCase().endsWith('S');
                });
                setDbGroups(filteredGroups);
            }
        } catch (error) {
            console.error("Error fetching groups", error);
        }
    };

    const fetchAllStationsFromDB = async () => {
        try {
            const res = await axios.get(`${apiBase}/stations/all`);
            setDbStations(Array.isArray(res.data) ? res.data : (res.data.data || []));
        } catch (error) {
            setDbStations([
                { stationCode: 'VZA', stationName: 'VIJAYAWADA' },
                { stationCode: 'GNTTR', stationName: 'GUNTUR TR' }
            ]);
        }
    };

    useEffect(() => {
        if (!formData.sectionName) {
            setFilteredStations([]);
            return;
        }
        const currentSection = formData.sectionName.toUpperCase();
        const vzaOnlySections = ['ADMIN', 'BUSINESS', 'MAINACS', 'DCRACS', 'LCO', 'INVOICE', 'LPD', 'SHED'];

        const normalizedStations = dbStations.map(st => ({
            stationCode: String(st.stationCode || st.station_code || '').toUpperCase().trim(),
            stationName: String(st.stationName || st.station_name || '').toUpperCase().trim()
        }));

        let result = [];
        if (currentSection === 'TMENT') {
            result = normalizedStations.filter(st => st.stationCode.length === 4 && st.stationCode.endsWith('TR'));
        } else if (currentSection === 'BRANCHES') {
            result = normalizedStations.filter(st => !st.stationCode.endsWith('TR'));
        } else if (vzaOnlySections.includes(currentSection)) {
            result = normalizedStations.filter(st => st.stationCode === 'VZA');
        } else {
            result = [...normalizedStations];
        }
        setFilteredStations(result.sort((a, b) => a.stationCode.localeCompare(b.stationCode)));
    }, [formData.sectionName, dbStations]);


    // 2. handleGroupDropdownChange ఫంక్షన్
    const handleGroupDropdownChange = (e) => {
        const selectedStatus = e.target.value;

        if (selectedStatus === 'NEW_GROUP_MODE') {
            setFormData(prev => ({
                ...prev,
                selected_group_id: 'NEW_GROUP_MODE',
                ac_status_display: '',
                ac_type: 'PL'
            }));
        } else {
            const groupObj = dbGroups.find(g => String(g.ac_status) === String(selectedStatus));

            if (groupObj) {
                setFormData(prev => ({
                    ...prev,
                    selected_group_id: selectedStatus,
                    ac_status_display: groupObj.ac_status,
                    ac_type: groupObj.ac_type
                }));
            }
        }
    };

    const handleSetNewGroup = () => {
        const st = newGroupStatus.trim().toUpperCase();
        const nm = newGroupName.trim().toUpperCase();
        if (!st || !nm) {
            alert("దయచేసి AC_STATUS మరియు AC_NAME నమోదు చేయండి!");
            return;
        }

        setFormData(prev => ({
            ...prev,
            selected_group_id: 'NEW_GROUP_MODE',
            ac_status_display: st,
            ac_code: st,
            input_value: nm,
            ac_type: newGroupType
        }));

        setShowNewGroupInput(false);
        setNewGroupStatus('');
        setNewGroupName('');
        setNewGroupType('PL');
    };

    const handleSectionChange = (e) => {
        const selectedSection = e.target.value;
        const hovzaSections = ['ADMIN', 'BUSINESS', 'MAINACS', 'DCRACS', 'INVOICE', 'LCO', 'LPD', 'SHED', 'COMPUTERS'];

        if (hovzaSections.includes(selectedSection)) {
            // ఇక్కడ మీరు అడిగినట్లుగా HOVZA మరియు HO,VIJAYAWADA సెట్ అవుతాయి
            setFormData(prev => ({
                ...prev,
                sectionName: selectedSection,
                stationCode: 'HOVZA',
                stationName: 'HO,VIJAYAWADA'
            }));
        } else {
            // TMENT/BRANCHES కోసం
            setFormData(prev => ({
                ...prev,
                sectionName: selectedSection,
                stationCode: '',
                stationName: ''
            }));
        }
    };
    // మీ ప్రోగ్రామ్‌లో ఈ ఫంక్షన్‌ని యాడ్ చేయండి
    const handleStationChange = (e) => {
        const code = e.target.value;
        // సెలెక్ట్ చేసిన కోడ్ ఆధారంగా స్టేషన్ నేమ్ ఫైండ్ చేయడం
        const selected = dbStations.find(s => String(s.stationCode || s.station_code || '').toUpperCase() === code);

        setFormData(prev => ({
            ...prev,
            stationCode: code,
            stationName: selected ? (selected.stationName || selected.station_name || '') : ''
        }));
    };

    const handleFetchMasterDetails = async (code) => {
        if (!code) return;
        setLoading(true);
        try {
            const res = await axios.get(`${apiBase}/masters/details/${code}`);
            if (res.data?.success) {
                const dbData = res.data.data;
                setFormData({
                    ...initialFormState,
                    ...dbData,
                    selected_group_id: dbData.ac_status?.endsWith('S') ? dbData.ac_status.slice(0, -1) : dbData.ac_status,
                    ac_status_display: dbData.ac_status,
                    input_value: dbData.ac_name
                });
                setStatusMsg({ type: 'success', text: "Data Fetched Successfully." });
            }
        } catch (error) {
            setStatusMsg({ type: 'error', text: "Account Code Not Found!" });
        } finally { setLoading(false); }
    };
    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!formData.ac_code || !formData.input_value || !formData.ac_status_display) {
            alert("A/C CODE, AC_NAME మరియు AC_STATUS తప్పనిసరి!");
            return;
        }

        // 1. సేవ్ చేయాల్సిన రౌట్‌ను డిసైడ్ చేసే లాజిక్
        let targetEndpoint = '/masters/accounts/master-save'; // డీఫాల్ట్: Master Data File

        // Admin సెక్షన్ల కోసం
        if (['STAFF', 'RSTAFF', 'AGENTS', 'LORRIES', 'VEHICLES'].includes(formData.sectionName)) {
            targetEndpoint = '/masters/admin/save-admin';
        }

        // User Login ఆన్ చేసి ఉంటే User File కి
        if (formData.allow_erp_login) {
            targetEndpoint = '/masters/users/save-user';
        }

        const payload = {
            ...formData,
            ac_status: formData.ac_status_display,
            ac_name: formData.input_value,
            ac_type: formData.ac_type || 'BS',
            ope_dr: parseFloat(formData.ope_dr || 0).toFixed(2),
            ope_cr: parseFloat(formData.ope_cr || 0).toFixed(2),
            login_id: loggedInUser.userId,
            operator: loggedInUser.userId,
            operator_id: loggedInUser.userId,
            login_section: loggedInUser.section,
            login_station: loggedInUser.station
        };

        setLoading(true);
        try {
            // 2. డైనమిక్ ఎండ్‌పాయింట్‌కు రిక్వెస్ట్ పంపడం
            const res = await axios.post(`${apiBase}${targetEndpoint}`, payload);

            if (res.data?.success) {
                setStatusMsg({ type: 'success', text: `✓ విజయవంతంగా సేవ్ అయింది` });
                if (currentMode === 'ADD') {
                    setFormData(initialFormState);
                    fetchGroupsFromDB();
                }
            }
        } catch (error) {
            const errorText = error.response?.data?.message || error.message || '';
            if (errorText.includes('E11000') || errorText.includes('duplicate key')) {
                setStatusMsg({ type: 'error', text: `ఎర్రర్: కోడ్ (${formData.ac_code}) ఇప్పటికే ఉంది!` });
            } else {
                setStatusMsg({ type: 'error', text: `ఎర్రర్: ${errorText}` });
            }
        } finally { setLoading(false); }
    };


    const isNameReadOnly = (currentMode === 'ADD' && formData.selected_group_id === 'NEW_GROUP_MODE') || ['ENQUIRY', 'DELETE'].includes(currentMode);

    return (
        <div style={{ color: '#fff', fontFamily: 'monospace', padding: '5px', width: '100%' }}>
            <div style={{ backgroundColor: '#111c44', padding: '12px', borderRadius: '4px', border: '1px solid #243068' }}>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '12px' }}>
                    {['ADD', 'ENQUIRY', 'UPDATE', 'DELETE'].map(mode => (
                        <button
                            key={mode}
                            onClick={() => { setCurrentMode(mode); setFormData(initialFormState); setShowNewGroupInput(false); }}
                            style={{
                                backgroundColor: currentMode === mode ? (mode === 'ADD' ? '#48bb78' : mode === 'UPDATE' ? '#ecc94b' : '#4299e1') : '#1d2854',
                                color: currentMode === mode ? '#000' : '#fff',
                                height: '28px', fontSize: '11px', fontWeight: 'bold', border: '1px solid #243068', cursor: 'pointer'
                            }}
                        >
                            {mode} MODE
                        </button>
                    ))}
                </div>


                {/* కేవలం MAINACS లాగిన్ అయిన వారికి మాత్రమే ఈ ఆప్షన్ కనిపిస్తుంది */}
                {currentMode === 'ADD' && loggedInUser?.section === 'MAINACS' && (
                    <div style={{ backgroundColor: '#16224f', padding: '8px', border: '1px solid #00d2ff', marginBottom: '12px', borderRadius: '4px' }}>
                        {!showNewGroupInput ? (
                            <button onClick={() => setShowNewGroupInput(true)} style={{ background: '#00d2ff', border: 'none', padding: '4px 10px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>
                                ➕ CREATE NEW GROUP (NEW_STATUS)
                            </button>
                        ) : (
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input value={newGroupStatus} onChange={e => setNewGroupStatus(e.target.value)} placeholder="NEW AC_STATUS" style={{ width: '120px', background: '#0b1437', border: '1px solid #243068', color: '#00d2ff', padding: '0 5px' }} />
                                <input value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="NEW AC_NAME" style={{ flex: 1, background: '#0b1437', border: '1px solid #243068', color: '#fff', padding: '0 5px' }} />
                                <select value={newGroupType} onChange={e => setNewGroupType(e.target.value)} style={{ background: '#0b1437', border: '1px solid #243068', color: '#fff', padding: '0 5px' }}>
                                    <option value="BS">BS</option>
                                    <option value="PL">PL</option>
                                </select>
                                <button onClick={handleSetNewGroup} style={{ background: '#48bb78', border: 'none', color: '#000', cursor: 'pointer', padding: '0 15px', fontWeight: 'bold' }}>SET</button>
                                <button onClick={() => setShowNewGroupInput(false)} style={{ background: '#f56565', border: 'none', color: '#fff', cursor: 'pointer', padding: '0 10px' }}>CANCEL</button>
                            </div>
                        )}
                    </div>
                )}



                {statusMsg.text && (
                    <div style={{ padding: '6px', backgroundColor: statusMsg.type === 'success' ? '#1c4532' : '#6b2020', marginBottom: '8px', fontSize: '11px', borderRadius: '2px' }}>
                        {statusMsg.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                        <div style={{ flex: '0 0 25%' }}>
                            <label style={{ fontSize: '10px', color: '#a0aec0', display: 'block' }}>1. DB GROUP HEADS</label>

                           
                            <select onChange={handleGroupDropdownChange} value={formData.selected_group_id}>
                                <option value="">-- SELECT DB GROUP --</option>
                                {dbGroups
                                    .filter(g => {
                                        // ADMIN అయితే లిస్ట్ ఫిల్టర్ అవుతుంది, లేకపోతే మొత్తం కనిపిస్తుంది
                                        if (loggedInUser.section === 'ADMIN') {
                                            const dbName = (g.group_name || g.ac_name || '').trim().toUpperCase();
                                            console.log("DB లో ఉన్న పేరు:", dbName); // బ్రౌజర్ కన్సోల్ (F12) లో చెక్ చేయండి
                                            return adminAllowedGroups.some(allowed =>
                                                allowed.trim().toUpperCase() === dbName
                                            );
                                        }
                                        return true;
                                    })
                                    .map(g => (
                                        <option key={g.ac_status} value={g.ac_status}>
                                            {g.group_name || g.ac_name} - ({g.ac_status})
                                        </option>
                                    ))
                                }
                                <option value="NEW_GROUP_MODE">-- ADD NEW GROUP --</option>
                            </select>
                        </div>
                        <div style={{ flex: '0 0 15%' }}>
                            <label style={{ fontSize: '10px', color: '#ecc94b', display: 'block' }}>2. AC_STATUS (AUTO)</label>
                            <input value={formData.ac_status_display} readOnly style={{ width: '100%', height: '22px', background: '#0f172a', border: '1px solid #243068', color: '#ecc94b', textAlign: 'center', fontWeight: 'bold' }} />
                        </div>
                        <div style={{ flex: '0 0 15%' }}>
                            <label style={{ fontSize: '10px', color: '#00d2ff', display: 'block' }}>3. A/C CODE</label>
                            <input value={formData.ac_code} onChange={e => setFormData({ ...formData, ac_code: e.target.value })} onKeyDown={e => e.key === 'Enter' && currentMode !== 'ADD' && handleFetchMasterDetails(formData.ac_code)} style={{ width: '100%', height: '22px', background: '#0b1437', border: '1px solid #00d2ff', color: '#00d2ff', textAlign: 'center', textTransform: 'uppercase' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '10px', color: isNameReadOnly ? '#a0aec0' : '#48bb78', display: 'block' }}>{isNameReadOnly ? '4. AC_NAME (READONLY)' : '4. AC_NAME (NOTE HERE)'}</label>
                            <input ref={mainInputRef} value={formData.input_value} onChange={e => setFormData({ ...formData, input_value: e.target.value.toUpperCase() })} readOnly={isNameReadOnly} placeholder={!isNameReadOnly ? "Type Account Name here..." : ""} style={{ width: '100%', height: '22px', background: isNameReadOnly ? '#0f172a' : '#0b1437', border: isNameReadOnly ? '1px solid #243068' : '1px solid #48bb78', color: '#fff', padding: '0 8px' }} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{ flex: '0 0 25%' }}>
                            <label style={{ fontSize: '10px', color: '#a0aec0', display: 'block' }}>5. SECTION</label>
                            <select value={formData.sectionName} onChange={handleSectionChange} style={{ width: '100%', height: '24px', background: '#0b1437', color: '#fff', border: '1px solid #243068' }}>
                                <option value="">-- SELECT --</option>
                                {businessSections.map(s => <option key={s.id} value={s.id}>{s.id}</option>)}
                            </select>
                        </div>

                        <div style={{ flex: '0 0 15%' }}>
                            <label style={{ fontSize: '10px', color: '#a0aec0', display: 'block' }}>STATION CODE</label>

                            <select
                                name="stationCode"
                                value={formData.stationCode}
                                onChange={handleStationChange}
                                disabled={['ADMIN', 'BUSINESS', 'MAINACS', 'DCRACS', 'INVOICE', 'LCO', 'LPD', 'SHED', 'COMPUTERS'].includes(formData.sectionName)}
                                style={{
                                    width: '100%',
                                    height: '24px',
                                    background: '#0b1437',
                                    color: '#fff',
                                    border: '1px solid #243068'
                                }}
                            >
                                {['ADMIN', 'BUSINESS', 'MAINACS', 'DCRACS', 'INVOICE', 'LCO', 'LPD', 'SHED', 'COMPUTERS'].includes(formData.sectionName) ? (
                                    <option value="HOVZA">HOVZA</option>
                                ) : (
                                    <>
                                        <option value="">-- SELECT STATION --</option>
                                        {dbStations
                                            .filter(st => {
                                                const code = String(st.stationCode || st.station_code || '').toUpperCase();
                                                if (formData.sectionName === 'TMENT') return code.length === 4 && code.endsWith('TR');
                                                if (formData.sectionName === 'BRANCHES') return !code.endsWith('TR');
                                                return true;
                                            })
                                            .map((st) => (
                                                <option key={st.stationCode || st.station_code} value={st.stationCode || st.station_code}>
                                                    {st.stationCode || st.station_code}
                                                </option>
                                            ))
                                        }
                                    </>
                                )}
                            </select>
                        </div>

                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '10px', color: '#a0aec0', display: 'block' }}>7. STATION NAME (AUTO)</label>
                            <input value={formData.stationName} readOnly placeholder="Station Name will appear here..." style={{ width: '100%', height: '22px', background: '#0f172a', border: '1px solid #243068', color: '#ecc94b', padding: '0 8px', fontWeight: 'bold' }} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                        <div style={{ flex: '0 0 20%' }}>
                            <label style={{ fontSize: '10px', color: '#a0aec0', display: 'block' }}>8. PHONE NO</label>
                            <input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} maxLength="10" placeholder="Enter Phone No" style={{ width: '100%', height: '22px', background: '#0b1437', border: '1px solid #243068', color: '#fff', padding: '0 5px' }} />
                        </div>

                        <div style={{ flex: '0 0 15%' }}>
                            <label style={{ fontSize: '10px', color: '#a0aec0', display: 'block' }}>9. A/C TYPE</label>
                            <select
                                name="ac_type"
                                value={formData.ac_type}
                                onChange={handleInputChange}
                                // 🌟 కండిషన్: కొత్త గ్రూప్ అయితేనే ఎనేబుల్, లేదంటే లాక్ (disabled) అవుతుంది
                                disabled={formData.selected_group_id !== 'NEW_GROUP_MODE'}
                                style={{
                                    width: '100%',
                                    height: '24px',
                                    background: formData.selected_group_id !== 'NEW_GROUP_MODE' ? '#1a2245' : '#0b1437', // లాక్ అయినప్పుడు కొంచెం రంగు మారుతుంది
                                    color: '#fff',
                                    border: '1px solid #243068',
                                    cursor: formData.selected_group_id !== 'NEW_GROUP_MODE' ? 'not-allowed' : 'pointer'
                                }}
                            >
                                <option value="PL">PL (Profit & Loss)</option>
                                <option value="BS">Balance Sheet</option>
                            </select>
                        </div>



                        <div style={{ flex: '0 0 20%', display: 'flex', alignItems: 'center', height: '24px', background: '#16224f', border: '1px solid #243068', padding: '0 8px' }}>
                            <label style={{ fontSize: '10px', color: '#00d2ff', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                                <input type="checkbox" checked={formData.allow_erp_login} onChange={e => setFormData({ ...formData, allow_erp_login: e.target.checked, email: e.target.checked ? formData.email : '' })} />
                                ALLOW ERP LOGIN
                            </label>
                        </div>

                        {/* కండిషనల్ రెండరింగ్: చెక్ బాక్స్ కి టిక్ పెడితేనే ఈమెయిల్ ఫీల్డ్ కనబడుతుంది */}
                        {formData.allow_erp_login && (
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '10px', color: '#48bb78', display: 'block' }}>10. EMAIL ID (LOGIN ID)</label>
                                <input
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="Enter Email Address..."
                                    style={{ width: '100%', height: '22px', background: '#0b1437', border: '1px solid #48bb78', color: '#fff', padding: '0 8px' }}
                                />
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', background: '#16224f', padding: '8px', borderRadius: '4px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '10px', color: '#48bb78' }}>11. OPENING DR (Rs.)</label>
                            <input type="number" step="0.01" value={formData.ope_dr} onChange={e => setFormData({ ...formData, ope_dr: e.target.value })} style={{ width: '100%', height: '22px', background: '#0b1437', border: '1px solid #243068', color: '#48bb78', padding: '0 5px' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '10px', color: '#f56565' }}>12. OPENING CR (Rs.)</label>
                            <input type="number" step="0.01" value={formData.ope_cr} onChange={e => setFormData({ ...formData, ope_cr: e.target.value })} style={{ width: '100%', height: '22px', background: '#0b1437', border: '1px solid #243068', color: '#f56565', padding: '0 5px' }} />
                        </div>
                    </div>

                    {currentMode !== 'ENQUIRY' && (
                        <button type="submit" disabled={loading} style={{ height: '32px', background: loading ? '#4a5568' : '#48bb78', border: 'none', color: '#000', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px', marginTop: '5px' }}>
                            {loading ? 'PROCESSING...' : `✓ EXECUTE ${currentMode}`}
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
};

export default MasterEntry;