const router = require('express').Router();
const LorryMaster = require('../models/LorryMaster');

// 🌟 1. SAVE / UPDATE LORRY MASTER API
router.post('/lorry-save', async (req, res) => {
    try {
        const { lorry_no, lorry_category, current_status, permits_fitness_expiry } = req.body;

        if (!lorry_no || !lorry_category) {
            return res.status(400).json({ success: false, message: "లారీ నెంబర్ మరియు కేటగిరీ తప్పనిసరి!" });
        }

        let setup = {
            lorry_no: lorry_no.toUpperCase().replace(/\s+/g, ''),
            lorry_category,
            current_status,
            permits_fitness_expiry: permits_fitness_expiry || null
        };

        // 🛠️ మీ బిజినెస్ రూల్స్ కనెక్షన్ల లాజిక్
        if (lorry_category === 'CO') {
            setup.has_hire_prep = false;
            setup.has_driver_expenses = true;
            setup.repair_ledger_type = 'VEHICLE_REPAIR';
        } else if (lorry_category === 'OWN_MGMT') {
            setup.has_hire_prep = true;
            setup.has_driver_expenses = true;
            setup.repair_ledger_type = 'SHED_REPAIR';
        } else if (lorry_category === 'ATTACHED') {
            setup.has_hire_prep = true;
            setup.has_driver_expenses = false;
            setup.repair_ledger_type = 'NONE';
        }

        // Upsert లాజిక్: లారీ నెంబర్ ఆల్రెడీ ఉంటే అప్‌డేట్ అవుతుంది, లేకపోతే కొత్తది క్రియేట్ అవుతుంది
        const savedLorry = await LorryMaster.findOneAndUpdate(
            { lorry_no: setup.lorry_no },
            { $set: setup },
            { new: true, upsert: true }
        );

        res.status(200).json({
            success: true,
            message: `లారీ ${setup.lorry_no} మాస్టర్ లో పక్కాగా సెట్ చేయబడింది!`,
            data: savedLorry
        });

    } catch (error) {
        console.error("Lorry Save Error:", error);
        res.status(500).json({ success: false, message: "సర్వర్ ఎర్రర్: " + error.message });
    }
});

// 🌟 2. GET ALL LORRIES LIST API
router.get('/lorries', async (req, res) => {
    try {
        const lorries = await LorryMaster.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: lorries });
    } catch (error) {
        res.status(500).json({ success: false, message: "డేటా సర్వర్ నుండి రాలేదు!" });
    }
});

module.exports = router;