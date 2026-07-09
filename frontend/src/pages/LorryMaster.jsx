import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const LorryMaster = () => {
    const navigate = useNavigate();
    const inputRef = useRef(null);
    const [mode, setMode] = useState('ADD'); 
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [lorryList, setLorryList] = useState([]);

    const [formData, setFormData] = useState({
        lorry_no: '',
        lorry_category: 'CO',
        current_status: 'IN_SHED',
        has_hire_prep: false,
        has_driver_expenses: true,
        repair_ledger_type: 'VEHICLE_REPAIR',
        permits_fitness_expiry: ''
    });

    const handleCategoryChange = (category) => {
        let updates = { lorry_category: category };
        if (category === 'CO') {
            updates.has_hire_prep = false;
            updates.has_driver_expenses = true;
            updates.repair_ledger_type = 'VEHICLE_REPAIR';
        } else if (category === 'OWN_MGMT') {
            updates.has_hire_prep = true;
            updates.has_driver_expenses = true;
            updates.repair_ledger_type = 'SHED_REPAIR';
        } else if (category === 'ATTACHED') {
            updates.has_hire_prep = true;
            updates.has_driver_expenses = false;
            updates.repair_ledger_type = 'NONE';
        }
        setFormData({ ...formData, ...updates });
    };

    const fetchLorries = async () => {
        try {
            const res = await axios.get('https://tms-crh2.onrender.com/api/admin/lorries');
            if (res.data.success) setLorryList(res.data.data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => { 
        fetchLorries(); 
        if(inputRef.current) inputRef.current.focus();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            const res = await axios.post('https://tms-crh2.onrender.com/api/admin/lorry-save', formData);
            if (res.data.success) {
                setMessage({ type: 'success', text: res.data.message });
                setFormData({
                    lorry_no: '', lorry_category: 'CO', current_status: 'IN_SHED',
                    has_hire_prep: false, has_driver_expenses: true, repair_ledger_type: 'VEHICLE_REPAIR',
                    permits_fitness_expiry: ''
                });
                fetchLorries();
                if(inputRef.current) inputRef.current.focus();
            }
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'సేవ్ చేయడం విఫలమైంది!' });
        } finally { setLoading(false); }
    };

    return (
        <div style={{ padding: '20px', backgroundColor: '#0b1437', minHeight: '100vh', color: '#fff', fontFamily: 'monospace' }}>
            <div style={{ backgroundColor: '#111c44', padding: '25px', borderRadius: '8px', border: '1px solid #243068' }}>
                
                <h3 style={{ color: '#ecc94b', margin: '0 0 15px 0', fontSize: '18px', borderBottom: '2px solid #243068', paddingBottom: '10px' }}>
                    SRINIVASA ROAD TRANSPORT - LORRY / VEHICLE MASTER SETUP
                </h3>

                {/* Option Header */}
                <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center', fontSize: '13px' }}>
                    <span style={{ color: '#a0aec0', fontWeight: 'bold' }}>OPTION :</span>
                    {['ADD', 'ENQUIRY', 'UPDATE'].map(m => (
                        <button key={m} type="button" onClick={() => setMode(m)} style={{
                            padding: '3px 12px', backgroundColor: mode === m ? '#ecc94b' : '#1b254b',
                            color: mode === m ? '#000' : '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold'
                        }}>{m}</button>
                    ))}
                    <button type="button" onClick={() => navigate('/home')} style={{ padding: '3px 12px', backgroundColor: '#e53e3e', color: '#fff', border: 'none', cursor: 'pointer', marginLeft: 'auto', fontWeight: 'bold' }}>MENU EXIT</button>
                </div>

                {message.text && (
                    <div style={{ padding: '10px', backgroundColor: message.type === 'success' ? '#1c4532' : '#6b2020', borderLeft: `4px solid ${message.type === 'success' ? '#48bb78' : '#f56565'}`, marginBottom: '15px', fontSize: '13px' }}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    
                    {/* దొంతర 1: లారీ నెంబర్, కేటగిరీ, స్టేటస్ */}
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', width: '180px', gap: '5px' }}>
                            <label style={{ color: '#4a5568', fontSize: '12px', fontWeight: 'bold' }}>LORRY NUMBER:</label>
                            <input ref={inputRef} type="text" value={formData.lorry_no} onChange={(e) => setFormData({ ...formData, lorry_no: e.target.value.toUpperCase().replace(/\s+/g, '') })} placeholder="AP16TB1122" style={{ backgroundColor: '#0b1437', border: '1px solid #243068', color: '#fff', height: '28px', padding: '2px 8px' }} required disabled={mode !== 'ADD'} />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', width: '250px', gap: '5px' }}>
                            <label style={{ color: '#4a5568', fontSize: '12px', fontWeight: 'bold' }}>LORRY CATEGORY TYPE:</label>
                            <select value={formData.lorry_category} onChange={(e) => handleCategoryChange(e.target.value)} style={{ backgroundColor: '#0b1437', border: '1px solid #243068', color: '#ecc94b', height: '28px', padding: '2px 5px', fontWeight: 'bold' }} required>
                                <option value="CO">CO - COMPANY OWNER LORRY</option>
                                <option value="OWN_MGMT">OWN_MGMT - MANAGED LORRY</option>
                                <option value="ATTACHED">ATTACHED - OUTSIDE HIRE LORRY</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', width: '180px', gap: '5px' }}>
                            <label style={{ color: '#4a5568', fontSize: '12px', fontWeight: 'bold' }}>CURRENT ERP STATUS:</label>
                            <select value={formData.current_status} onChange={(e) => setFormData({ ...formData, current_status: e.target.value })} style={{ backgroundColor: '#0b1437', border: '1px solid #243068', color: '#fff', height: '28px', padding: '2px 5px' }} required>
                                <option value="IN_SHED">IN SHED (AVAILABLE)</option>
                                <option value="ON_TRIP">ON TRIP (DISPATCHED)</option>
                                <option value="UNDER_REPAIR">UNDER REPAIR</option>
                            </select>
                        </div>
                    </div>

                    {/* దొంతర 2: కంట్రోల్ ఇండికేటర్లు (Read-Only) */}
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', backgroundColor: '#1b254b', padding: '12px', borderRadius: '4px', border: '1px solid #243068' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', width: '200px', gap: '4px' }}>
                            <span style={{ color: '#a0aec0', fontSize: '11px' }}>TMENT HIRE PREP:</span>
                            <span style={{ color: formData.has_hire_prep ? '#48bb78' : '#f56565', fontWeight: 'bold', fontSize: '13px' }}>{formData.has_hire_prep ? "✓ REQUIRED" : "✕ BLOCKED"}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', width: '220px', gap: '4px' }}>
                            <span style={{ color: '#a0aec0', fontSize: '11px' }}>MAINACS DRIVER EXPENSES:</span>
                            <span style={{ color: formData.has_driver_expenses ? '#48bb78' : '#f56565', fontWeight: 'bold', fontSize: '13px' }}>{formData.has_driver_expenses ? "✓ ALLOWED" : "✕ BLOCKED"}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', width: '200px', gap: '4px' }}>
                            <span style={{ color: '#a0aec0', fontSize: '11px' }}>REPAIR LEDGER LINK:</span>
                            <span style={{ color: '#38bdf8', fontWeight: 'bold', fontSize: '13px' }}>{formData.repair_ledger_type}</span>
                        </div>
                    </div>

                    {/* దొంతర 3: డాక్యుమెంట్ ఎక్స్‌పైరీ */}
                    <div style={{ display: 'flex', flexDirection: 'column', width: '220px', gap: '5px' }}>
                        <label style={{ color: '#4a5568', fontSize: '12px', fontWeight: 'bold' }}>FITNESS / PERMIT EXPIRY:</label>
                        <input type="date" value={formData.permits_fitness_expiry} onChange={(e) => setFormData({ ...formData, permits_fitness_expiry: e.target.value })} style={{ backgroundColor: '#0b1437', border: '1px solid #243068', color: '#fff', height: '28px', padding: '2px 8px' }} />
                    </div>

                    {mode === 'ADD' && (
                        <div style={{ marginTop: '10px' }}>
                            <button type="submit" disabled={loading} style={{ backgroundColor: '#2b6cb0', color: '#fff', border: 'none', padding: '6px 20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                                {loading ? "SAVING REGISTRATION..." : "ADD VEHICLE TO MASTER"}
                            </button>
                        </div>
                    )}
                </form>

                {/* మాస్టర్ రికార్డుల లైవ్ గ్రిడ్ వ్యూ */}
                <div style={{ marginTop: '30px' }}>
                    <h4 style={{ color: '#ecc94b', margin: '0 0 10px 0', fontSize: '14px' }}>REGISTERED VEHICLES LIST ({lorryList.length})</h4>
                    <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid #243068' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#1b254b', color: '#a0aec0', position: 'sticky', top: '0' }}>
                                    <th style={{ padding: '8px', border: '1px solid #243068' }}>LORRY NO</th>
                                    <th style={{ padding: '8px', border: '1px solid #243068' }}>CATEGORY</th>
                                    <th style={{ padding: '8px', border: '1px solid #243068' }}>CURRENT STATUS</th>
                                    <th style={{ padding: '8px', border: '1px solid #243068' }}>REPAIR ACCOUNT</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lorryList.map(l => (
                                    <tr key={l.lorry_no} style={{ borderBottom: '1px solid #243068', backgroundColor: '#111c44' }}>
                                        <td style={{ padding: '8px', fontWeight: 'bold', color: '#38bdf8' }}>{l.lorry_no}</td>
                                        <td style={{ padding: '8px' }}>{l.lorry_category}</td>
                                        <td style={{ padding: '8px', color: l.current_status === 'IN_SHED' ? '#48bb78' : '#ecc94b' }}>{l.current_status}</td>
                                        <td style={{ padding: '8px', color: '#a0aec0' }}>{l.repair_ledger_type}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default LorryMaster;