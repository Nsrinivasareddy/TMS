const express = require('express');
const router = express.Router();
const Trip = require('../models/trip');
const Master = require('../models/Masters');

// =========================================================================
// 1. SHED DISPATCH API (లారీని డ్యూటీకి పంపేటప్పుడు)
// =========================================================================
router.post('/dispatch', async (req, res) => {
    try {
        const { lorryAcCode, driverAcCode, startDate, startTime, startKm } = req.body;

        // Masters లో లారీ, డ్రైవర్ యాక్టివ్ గా ఉన్నారో లేదో చెక్ చేయడం
        const lorryMaster = await Master.findOne({ ac_code: lorryAcCode });
        const driverMaster = await Master.findOne({ ac_code: driverAcCode });

        if (!lorryMaster || lorryMaster.isActive === 'N') {
            return res.status(400).json({ success: false, message: "ఈ లారీ అకౌంట్ క్లోజ్ చేయబడింది లేదా అందుబాటులో లేదు!" });
        }
        if (!driverMaster || driverMaster.isActive === 'N') {
            return res.status(400).json({ success: false, message: "ఈ డ్రైవర్ అకౌంట్ క్లోజ్ చేయబడింది లేదా అందుబాటులో లేదు!" });
        }

        // Clash Checking: లారీ లేదా డ్రైవర్ ఆల్రెడీ డ్యూటీలో గాని, రిపేర్ లో గాని ఉన్నారా?
        const lorryBusy = await Trip.findOne({ lorryAcCode, status: { $in: ['ON_DUTY', 'UNDER_REPAIR'] } });
        if (lorryBusy) {
            return res.status(400).json({ success: false, message: `లారీ ${lorryAcCode} ఆల్రెడీ డ్యూటీలో లేదా రిపేర్ లో ఉంది!` });
        }

        const driverBusy = await Trip.findOne({ driverAcCode, status: { $in: ['ON_DUTY', 'UNDER_REPAIR'] } });
        if (driverBusy) {
            return res.status(400).json({ success: false, message: `డ్రైవర్ ${driverAcCode} ఆల్రెడీ డ్యూటీలో ఉన్నారు!` });
        }

        const newTrip = new Trip({
            lorryAcCode,
            startDate,
            startTime,
            startKm,
            status: 'ON_DUTY',
            driversHistory: [{
                driverAcCode,
                assignedDate: startDate,
                assignedTime: startTime,
                assignedKm: startKm,
                isCurrent: 'Y'
            }]
        });

        await newTrip.save();
        res.status(201).json({ success: true, message: "Shed nundi lorry dispatch ayindi.", tripId: newTrip._id });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// =========================================================================
// 2. MID-TRIP DRIVER CHANGE API (మధ్యలో డ్రైవర్ మారితే)
// =========================================================================
router.put('/change-driver/:tripId', async (req, res) => {
    try {
        const { tripId } = req.params;
        const { oldDriverReleaseDate, oldDriverReleaseTime, currentKm, newDriverAcCode, newDriverStartDate, newDriverStartTime } = req.body;

        const currentTrip = await Trip.findById(tripId);
        if (!currentTrip || currentTrip.status !== 'ON_DUTY') {
            return res.status(400).json({ success: false, message: "ట్రిప్ రన్ అవ్వడం లేదు లేదా దొరకలేదు!" });
        }

        const activeDriverIndex = currentTrip.driversHistory.findIndex(d => d.isCurrent === 'Y');
        if (activeDriverIndex === -1) return res.status(400).json({ success: false, message: "Active driver leru!" });

        const activeDriver = currentTrip.driversHistory[activeDriverIndex];
        if (currentKm < activeDriver.assignedKm) {
            return res.status(400).json({ success: false, message: "Current KM assigned KM kante thakkuva undakoodadu!" });
        }

        // Shift Calculation Helper
        const convertTimeToDecimal = (t) => { const [h, m] = t.split(':').map(Number); return h + (m / 60); };
        const startDecimal = convertTimeToDecimal(activeDriver.startTime);
        const releaseDecimal = convertTimeToDecimal(oldDriverReleaseTime);
        
        let oldDriverShifts = 1;
        if (releaseDecimal >= 22.0 || new Date(oldDriverReleaseDate) > new Date(activeDriver.assignedDate)) {
            oldDriverShifts = 2;
        }

        // Release Old Driver
        activeDriver.releasedDate = oldDriverReleaseDate;
        activeDriver.releasedTime = oldDriverReleaseTime;
        activeDriver.releasedKm = currentKm;
        activeDriver.kmsDone = currentKm - activeDriver.assignedKm;
        activeDriver.shiftsEarned = oldDriverShifts;
        activeDriver.isCurrent = 'N';

        // Add New Driver
        currentTrip.driversHistory.push({
            driverAcCode: newDriverAcCode,
            assignedDate: newDriverStartDate,
            assignedTime: newDriverStartTime,
            assignedKm: currentKm,
            isCurrent: 'Y'
        });

        await currentTrip.save();
        res.status(200).json({ success: true, message: "Driver change completed successfully." });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// =========================================================================
// 3. TRIP CLOSE & INVOICE SETTLEMENT (Shed ku vachhi complete cheసే విధానం)
// =========================================================================
router.put('/close-trip-direct/:tripId', async (req, res) => {
    try {
        const { tripId } = req.params;
        const { endDate, endTime, endKm } = req.body;

        const currentTrip = await Trip.findById(tripId);
        if (!currentTrip || currentTrip.status !== 'ON_DUTY') {
            return res.status(400).json({ success: false, message: "Active trip dorakaledu!" });
        }

        if (endKm < currentTrip.startKm) {
            return res.status(400).json({ success: false, message: "End KM start KM kante thakkuva undకూడదు." });
        }

        // కరెంట్ డ్రైవర్ షిఫ్ట్ & కిలోమీటర్ల క్లోజర్
        const activeDriver = currentTrip.driversHistory.find(d => d.isCurrent === 'Y');
        if (activeDriver) {
            activeDriver.releasedDate = endDate;
            activeDriver.releasedTime = endTime;
            activeDriver.releasedKm = endKm;
            activeDriver.kmsDone = endKm - activeDriver.assignedKm;
            
            // Shift check logic
            const [hours] = endTime.split(':').map(Number);
            activeDriver.shiftsEarned = (hours >= 22 || new Date(endDate) > new Date(activeDriver.assignedDate)) ? 2 : 1;
            activeDriver.isCurrent = 'N';
        }

        currentTrip.endDate = endDate;
        currentTrip.endTime = endTime;
        currentTrip.endKm = endKm;
        currentTrip.status = 'COMPLETED'; // ట్రిప్ మరియు ఇన్వాయిస్ రెండు క్లోజ్ అయిపోయినట్లు

        await currentTrip.save();
        res.status(200).json({ 
            success: true, 
            message: "Lorry Shed ku vachhindi, Trip & Invoice successfully closed.",
            totalKms: endKm - currentTrip.startKm 
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// =========================================================================
// 4. SEND TO REPAIR (షెడ్ కి వచ్చాక రిపేర్ కి పంపడం)
// =========================================================================
router.put('/send-to-repair/:tripId', async (req, res) => {
    try {
        const { tripId } = req.params;
        const { repairStartDate, repairStartTime, currentKm, repairDetails } = req.body;

        const currentTrip = await Trip.findById(tripId);
        if (!currentTrip || currentTrip.status !== 'ON_DUTY') {
            return res.status(400).json({ success: false, message: "ట్రిప్ రన్నింగ్ లో లేదు!" });
        }

        // డ్రైవర్‌ను రిలీజ్ చేసి అతని కిలోమీటర్లు, పూటల లెక్క ఇక్కడే లాక్ చేస్తాం
        const activeDriver = currentTrip.driversHistory.find(d => d.isCurrent === 'Y');
        if (activeDriver) {
            activeDriver.releasedDate = repairStartDate;
            activeDriver.releasedTime = repairStartTime;
            activeDriver.releasedKm = currentKm;
            activeDriver.kmsDone = currentKm - activeDriver.assignedKm;
            const [hours] = repairStartTime.split(':').map(Number);
            activeDriver.shiftsEarned = (hours >= 22) ? 2 : 1;
            activeDriver.isCurrent = 'N'; // డ్రైవర్ ఫ్రీ అయిపోతాడు, లారీ రిపేర్ లో ఉంటుంది
        }

        // లారీని రిపేర్ స్టేటస్ లోకి మారుస్తున్నాం
        currentTrip.status = 'UNDER_REPAIR';
        
        // Schema లో ఒకవేళ repairLog ఆబ్జెక్ట్ ఉంటే అందులో సేవ్ చేయడానికి:
        currentTrip.repairLog = {
            repairStartDate,
            repairStartTime,
            repairDetails,
            estimatedCost: req.body.estimatedCost || 0
        };

        await currentTrip.save();
        res.status(200).json({ success: true, message: "Lorry Shed ku vachhindi. Driver released, lorry moved to UNDER_REPAIR." });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// =========================================================================
// 5. CLOSE TRIP AFTER REPAIR (రిపేర్ పూర్తయిన తదుపరి ట్రిప్ క్లోజ్ చేయడం)
// =========================================================================
router.put('/close-after-repair/:tripId', async (req, res) => {
    try {
        const { tripId } = req.params;
        const { repairEndDate, repairEndTime, finalEndKm, actualRepairCost, mechanicDetails } = req.body;

        const currentTrip = await Trip.findById(tripId);
        if (!currentTrip || currentTrip.status !== 'UNDER_REPAIR') {
            return res.status(400).json({ success: false, message: "ఈ లారీ రిపేర్ స్టేటస్ లో లేదు!" });
        }

        // రిపేర్ హిస్టరీ అప్‌డేట్
        currentTrip.repairLog.repairEndDate = repairEndDate;
        currentTrip.repairLog.repairEndTime = repairEndTime;
        currentTrip.repairLog.actualRepairCost = actualRepairCost;
        currentTrip.repairLog.mechanicDetails = mechanicDetails;

        // లారీ ట్రిప్ పూర్తిగా క్లోజ్ అవుతుంది
        currentTrip.endDate = repairEndDate;
        currentTrip.endTime = repairEndTime;
        currentTrip.endKm = finalEndKm;
        currentTrip.status = 'COMPLETED'; // లారీ పూర్తిగా ఫ్రీ అయిపోయింది (Next dispatch కి రెడీ)

        await currentTrip.save();
        res.status(200).json({ success: true, message: "Repair completed. Trip closed completely and lorry is free now." });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;