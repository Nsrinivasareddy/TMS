import express from 'express';
const router = express.Router();

import Master from '../models/Masters.js'; 
import AdminMaster from '../models/AdminMaster.js'; // కొత్తది
import User from '../models/User.js';             // కొత్తది

// మన సరికొత్త సింగిల్ కంట్రోలర్ నుండి రెండు ఫంక్షన్లను ఇంపోర్ట్ చేసుకుంటున్నాం
import { saveAdminMasterPackage, saveAccountsDirectMaster } from '../controllers/masterController.js';

// =========================================================================
// 1. చివరన 'S' లేని అన్ని మెయిన్ హెడ్స్ ని లాగే API (Main Heads)
// =========================================================================
router.get('/main-heads', async (req, res) => {
    try {
        const mainHeads = await Master.find({ 
            ac_status: { $regex: /^[^S]*$/i } 
        }).sort({ ac_code: 1 });

        return res.status(200).json({ success: true, data: mainHeads });
    } catch (error) {
        console.error("మెయిన్ హెడ్స్ Fetch ఎర్రర్:", error);
        return res.status(500).json({ 
            success: false, 
            message: "మెయిన్ హెడ్స్ లోడ్ చేయడంలో సర్వర్ లోపం!", 
            error: error.message 
        });
    }
});

// =========================================================================
// 2. అడ్మిన్ మాస్టర్ ఎంట్రీ (లారీలు, స్టాఫ్ కోసం - 3 ఫైల్స్ లో సేవ్ అవుతుంది)
// =========================================================================
router.post('/admin/masters-save', saveAdminMasterPackage);

// =========================================================================
// 3. అకౌంట్స్ మాస్టర్ ఎంట్రీ (ఖర్చులు, కలెక్షన్ల కోసం - కేవలం 1 ఫైల్ లో సేవ్ అవుతుంది)
// =========================================================================
router.post('/accounts/master-save', saveAccountsDirectMaster);

// =========================================================================
// 4. ఒకే ఒక్క అకౌంట్ వివరాలు చూడటం (Read Single Master)
// =========================================================================
router.get('/details/:ac_code', async (req, res) => {
    try {
        const { ac_code } = req.params;
        const masterData = await Master.findOne({ ac_code: Number(ac_code) });
        
        if (!masterData) {
            return res.status(404).json({ success: false, message: "అకౌంట్ వివరాలు దొరకలేదు!" });
        }
        return res.status(200).json({ success: true, data: masterData });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

// =========================================================================
// 5. మాస్టర్ వివరాలు అప్‌డేట్ చేయడం (Update Master)
// =========================================================================
router.put('/update/:ac_code', async (req, res) => {
    try {
        const { ac_code } = req.params;
        const { ac_name, ac_type, ac_status, closingDate, isActive } = req.body;

        const updatedMaster = await Master.findOneAndUpdate(
            { ac_code: Number(ac_code) },
            { 
                ac_name: ac_name ? String(ac_name).toUpperCase().trim() : undefined, 
                ac_type, 
                ac_status: ac_status ? String(ac_status) : undefined,
                closingDate: closingDate || null,
                isActive: isActive || undefined 
            },
            { new: true, runValidators: true }
        );

        if (!updatedMaster) {
            return res.status(404).json({ success: false, message: "అప్‌డేట్ చేయడానికి అకౌంట్ దొరకలేదు!" });
        }

        return res.status(200).json({ success: true, message: "వివరాలు విజయవంతంగా అప్‌డేట్ చేయబడ్డాయి.", data: updatedMaster });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

// =========================================================================
// 🌟 6. శ్రీనివాస ట్రాన్స్‌పోర్ట్ - కేటగిరీ మారగానే నెక్స్ట్ కోడ్ లాగే API (New Endpoint)
// =========================================================================
router.get('/next-code/:category', async (req, res) => {
    try {
        const { category } = req.params;
        
        // గ్రూప్ సిరీస్ ల ఆటో సెటప్ రూల్స్
        let startCodeRange = 5000; // OWN_LORRY, CONTRACT LORRIES కి డిఫాల్ట్
        if (category === "STAFF") startCodeRange = 6000;
        else if (category === "RSTAFF") startCodeRange = 7000;
        else if (category === "AGENT") startCodeRange = 8000;

        // ఆ నిర్దేశిత సిరీస్ లో చివరగా ఉన్న అకౌంట్ కోడ్ ని వెతకడం
        const lastAccount = await Master.findOne({
            ac_code: { $gte: startCodeRange + 1, $lt: startCodeRange + 1000 }
        }).sort({ ac_code: -1 });

        // ఒకవేళ పాత రికార్డ్స్ ఉంటే దానికి +1 చేస్తాం, లేకపోతే సిరీస్ యొక్క మొదటి నెంబర్ ఇస్తాం
        let nextCode = lastAccount && lastAccount.ac_code ? lastAccount.ac_code + 1 : startCodeRange + 1;
        
        return res.status(200).json({ success: true, nextCode });
    } catch (error) {
        console.error("Next Code Generation Error:", error);
        return res.status(500).json({ success: false, message: "సర్వర్ నుండి కోడ్ లాడ్ చేయడంలో లోపం!" });
    }
});

export default router;
