import express from 'express';
import LRSeries from '../models/LRSeriesModel.js';
import BillModel from '../models/BillModel.js';

const router = express.Router();


// వివిధ LR రకాలకు వేర్వేరు పరిమితులు మరియు స్లాట్ సైజులు
const GST_RANGES = {    
    'FOC':   { start: 1,      end: 10000,   slotSize: 25 },
    'PAID':  { start: 10001,  end: 150000, slotSize: 100 },
    'ONAC':  { start: 150001, end: 500000, slotSize: 100 },
    'TOPAY': { start: 500101, end: 999999, slotSize: 100 }
};


router.post('/next-lr', async (req, res) => {
    try {
        const { stationCode, lrtype, fromState } = req.body;
        const cleanStn = (stationCode || "").toString().trim().toUpperCase();
        const cleanType = (lrtype || "").toString().trim().toUpperCase();
        const inputState = (fromState || "").toString().trim().toUpperCase();

        const stateGroup = (inputState === "ANDHRAPRADESH" || inputState === "AP") ? "AP" : "OS";
        
        // కాన్ఫిగరేషన్ లేదా డిఫాల్ట్ రేంజ్
        const config = GST_RANGES[cleanType] || { start: 500101, end: 999999, slotSize: 100 };

        let queryCondition = { 
            lrtype: cleanType,
            stationCode: cleanStn,
            isActive: true 
        };

        let series = await LRSeries.findOne(queryCondition);

        // సిరీస్ లేకపోతే కొత్తది క్రియేట్ చేయడం
        if (!series) {
            series = new LRSeries({
                stateGroup,
                stationCode: cleanStn,
                lrtype: cleanType,
                seriesChar: "A",
                fromNo: config.start,
                toNo: config.end,
                currentNo: config.start,
                isActive: true
            });
            await series.save();
        }

        // వాడబడిన నంబర్లను స్టేషన్ వారీగా ఫిల్టర్ చేయడం
        const usedNums = await BillModel.find({ 
            lrtype: cleanType, 
            seriesChar: series.seriesChar,
            fstn: cleanStn,
            lrno: { $gte: series.fromNo, $lte: series.toNo }
        }).distinct('lrno');

        const usedSet = new Set(usedNums.map(n => Number(n)));
        let nextAvailable = null;

        for (let i = series.fromNo; i <= series.toNo; i++) {
            if (!usedSet.has(i)) {
                nextAvailable = i;
                break;
            }
        }

        if (nextAvailable) {
            return res.json({ 
                currentNo: String(nextAvailable).padStart(6, '0'), 
                seriesChar: series.seriesChar,
                stateGroup: series.stateGroup 
            });
        } else {
            await LRSeries.findByIdAndUpdate(series._id, { isActive: false });
            return res.status(404).json({ message: "Slot full for this station." });
        }

    } catch (err) {
        console.error("LR Error:", err);
        return res.status(500).json({ error: "Server Error: " + err.message });
    }
});
router.post('/save', async (req, res) => {
    try {
        const data = req.body;
        const cleanStn = (data.fstn || "").trim().toUpperCase();
        const cleanType = (data.lrtype || "").trim().toUpperCase();
        
        // యూజర్ ఎంటర్ చేసిన LR నంబర్ ను తీసుకోవడం
        const enteredLrno = Number(data.lrno); 
        const fromStateName = (data.fromState || "ANDHRAPRADESH").trim().toUpperCase();
        
        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || "0.0.0.0";
        const getStateCode = (name) => (name === "ANDHRAPRADESH" || name === "AP") ? "AP" : "OS";
        const derivedStateGroup = getStateCode(fromStateName);

        // 1. ఆ స్టేషన్ తాలూకా యాక్టివ్ సిరీస్ ను వెతకడం
        const activeSeries = await LRSeries.findOne({
            stationCode: cleanStn,
            lrtype: cleanType,
            isActive: true
        });

        // 2. యూజర్ ఎంటర్ చేసిన LR నంబర్ ఆ సిరీస్ పరిమితిలో ఉందో లేదో చెక్ చేయడం
        if (activeSeries) {
            if (enteredLrno < activeSeries.fromNo || enteredLrno > activeSeries.toNo) {
                return res.status(400).json({ 
                    error: `తప్పు LR నంబర్! ఈ స్టేషన్‌కు కేటాయించిన పరిమితి ${activeSeries.fromNo} నుండి ${activeSeries.toNo} వరకు మాత్రమే.` 
                });
            }
        }

        const currentSeriesChar = activeSeries ? activeSeries.seriesChar : (data.seriesChar || "A");

        // 3. బిల్లును సేవ్ చేయడం
        const newBill = new BillModel({ 
            ...data, 
            fstn: cleanStn, 
            lrtype: cleanType, 
            lrno: enteredLrno, // యూజర్ ఇచ్చిన నంబర్‌ను సేవ్ చేస్తుంది
            seriesChar: currentSeriesChar,
            ipAddress: clientIp,
            stateGroup: derivedStateGroup,
            fromState: fromStateName,
            actualState: derivedStateGroup,
            createdAt: new Date()
        });

        await newBill.save();

        // 4. ఒకవేళ యూజర్ నెక్స్ట్ LR ని ఎంటర్ చేస్తే కరెంట్ నంబర్ అప్‌డేట్ అవ్వడం
        if (activeSeries && enteredLrno >= activeSeries.currentNo) {
            await LRSeries.updateOne(
                { _id: activeSeries._id },
                { $set: { currentNo: enteredLrno + 1 } } // తదుపరి వచ్చే LR నంబర్‌కు అప్‌డేట్ చేస్తుంది
            );
        }

        res.status(201).json({ 
            success: true, 
            message: "బిల్లు విజయవంతంగా సేవ్ చేయబడింది!", 
            data: {
                lrno: enteredLrno,
                seriesChar: currentSeriesChar
            }
        });

    } catch (err) {
        console.error("Save Error:", err);
        res.status(500).json({ error: "సర్వర్ లో సమస్య ఉంది: " + err.message });
    }
});


router.get('/check', async (req, res) => {
    try {
        const { lrno, stn } = req.query;
        const exists = await BillModel.exists({ lrno: Number(lrno), fstn: stn.toUpperCase() });
        res.status(200).json({ exists: !!exists });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/get-all-bills', async (req, res) => {
    try {
        const bills = await BillModel.find().sort({ createdAt: -1 }).limit(100);
        res.status(200).json(bills);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;

