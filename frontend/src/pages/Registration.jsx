import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/registration.css';

const Registration = () => {
    const [allStations, setAllStations] = useState([]); // అసలు స్టేషన్ల లిస్ట్
    const [filteredStations, setFilteredStations] = useState([]); // ఫిల్టర్ అయిన స్టేషన్ల లిస్ట్
    
    const [formData, setFormData] = useState({
        userId: '',
        email: '',
        mobile: '',
        sectionName: '', // దీన్ని పైకి తెస్తున్నాం
        stationName: '',
        stationCode: '',
        password: ''
    });

    // 1. స్క్రీన్ లోడ్ అవ్వగానే స్టేషన్లు తెచ్చుకుంటుంది
    useEffect(() => {
        const fetchStations = async () => {
            try {
                const response = await axios.get('https://tms-crh2.onrender.com/api/stations');
                setAllStations(response.data);
            } catch (error) {
                console.error("Error loading stations:", error);
            }
        };
        fetchStations();
    }, []);

    const generatePassword = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$";
        let newPassword = "";
        for (let i = 0; i < 8; i++) {
            newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setFormData({ ...formData, password: newPassword });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // ⭐ కండిషన్ 1 & 2 & 3: సెక్షన్ మారినప్పుడు జరిగే మ్యాజిక్
        if (name === "sectionName") {
            let filtered = [];
            let autoStation = '';
            let autoCode = '';

            if (value === "BRANCHES") {
                // అన్ని స్టేషన్లు చూపిస్తుంది
                filtered = allStations;
            } else if (value === "TMENT") {
                // చివర '-Tment' ఉన్నవి మాత్రమే చూపిస్తుంది
                filtered = allStations.filter(st => st.stationName.endsWith('-Tment'));
            } else if (value !== "") {
                // మిగతా ఏ సెక్షన్ అయినా కేవలం 'Vijayawada' మాత్రమే వస్తుంది
                const vjw = allStations.find(st => st.stationName.toUpperCase() === "VIJAYAWADA");
                if (vjw) {
                    filtered = [vjw];
                    autoStation = vjw.stationName;
                    autoCode = vjw.stationCode;
                }
            }

            setFilteredStations(filtered);
            setFormData({
                ...formData,
                sectionName: value,
                stationName: autoStation, // ఆటోమేటిక్ గా విజయవాడ సెట్ అవుతుంది
                stationCode: autoCode
            });
        } 
        // స్టేషన్ సెలెక్ట్ చేసినప్పుడు కోడ్ మారే లాజిక్
        else if (name === "stationName") {
            const selectedStation = allStations.find(st => st.stationName === value);
            setFormData({
                ...formData,
                stationName: value,
                stationCode: selectedStation ? selectedStation.stationCode : '' 
            });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('https://tms-crh2.onrender.com/api/users/register', formData);
            if (response.status === 201 || response.status === 200) {
                alert(`SUCCESS! User ${formData.userId} Registered.`);
                setFormData({ userId: '', email: '', mobile: '', sectionName: '', stationName: '', stationCode: '', password: '' });
                setFilteredStations([]);
            }
        } catch (error) {
            alert("Registration Failed!");
        }
    };

    return (
        <div className="reg-container">
            <h2 className="reg-title">User Registration</h2>
            
            <form className="reg-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>USER ID</label>
                    <input type="text" name="userId" value={formData.userId} onChange={handleChange} required />
                </div>

                {/* ⭐ 1. SECTION NAME ని ముందుకు తెచ్చాము */}
                <div className="form-group">
                    <label>SECTION NAME</label>
                    <select name="sectionName" value={formData.sectionName} onChange={handleChange} required>
                        <option value="">-- SELECT SECTION --</option>
                        <option value="ADMIN">ADMIN</option>
                        <option value="BUSINESS">BUSINESS</option>
                        <option value="MAINACS">MAINACS</option>
                        <option value="DCRACS">DCRACS</option>
                        <option value="LCO">LCO</option>
                        <option value="INVOICE">INVOICE</option>
                        <option value="TMENT">TMENT</option>
                        <option value="SHED">SHED</option>
                        <option value="LPD">LPD</option>
                        <option value="COMPUTER">COMPUTER</option>
                        <option value="BRANCHES">BRANCHES</option>
                    </select>
                </div>

                {/* ⭐ 2. STATION NAME (ఇది సెక్షన్ ని బట్టి మారుతుంది) */}
                <div className="form-group">
                    <label>STATION NAME</label>
                    <select name="stationName" value={formData.stationName} onChange={handleChange} required>
                        <option value="">-- SELECT STATION --</option>
                        {filteredStations.map(st => (
                            <option key={st._id} value={st.stationName}>{st.stationName}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label>STATION CODE</label>
                    <input type="text" name="stationCode" value={formData.stationCode} readOnly className="readonly-input" />
                </div>

                <div className="form-group">
                    <label>EMAIL ID</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                </div>

                <div className="form-group">
                    <label>MOBILE NO</label>
                    <input type="text" name="mobile" value={formData.mobile} onChange={handleChange} required />
                </div>

                <div className="form-group">
                    <label>PASSWORD</label>
                    <div className="pwd-area">
                        <input type="text" name="password" value={formData.password} readOnly required />
                        <button type="button" className="gen-btn" onClick={generatePassword}>GENERATE</button>
                    </div>
                </div>

                <button type="submit" className="submit-btn">Register User</button>
            </form>
        </div>
    );
};

export default Registration;