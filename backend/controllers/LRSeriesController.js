import LRSeries from '../models/LRSeriesModel.js';
import Bill from '../models/billModel.js';

const GST_RANGES = {
    'FOC':   { start: 1,      end: 10000,   slotSize: 25 },
    'PAID':  { start: 10001,  end: 150000, slotSize: 100 },
    'ONAC':  { start: 150001, end: 500000, slotSize: 100 },
    'TOPAY': { start: 500001, end: 999950, slotSize: 100 }
};

export const getNextLR = async (req, res) => {
    try {
        const { stationCode, lrtype, state } = req.body; 
        const group = (state === 'AP') ? 'AP' : 'OS';
        const config = GST_RANGES[lrtype];

        // 1. ఉన్న సిరీస్ కోసం వెతకడం (fyear లేకుండా)
        let series = await LRSeries.findOne({ 
            stationCode: stationCode.toUpperCase(), 
            lrtype: lrtype.toUpperCase(), 
            stateGroup: group, 
            isActive: true 
        });

        // 2. ఒకవేళ సిరీస్ లేకపోయినా లేదా నంబర్లు అయిపోతే కొత్తది కేటాయించడం
        if (!series || series.currentNo > series.toNo) {
            if (series) {
                series.isActive = false;
                await series.save();
            }

            // చివరిగా కేటాయించిన నంబర్ ఎంతో చూడటం (fyear లేకుండా)
            const lastAllocated = await LRSeries.findOne({ 
                stateGroup: group, 
                lrtype: lrtype 
            }).sort({ toNo: -1 });

            let newFrom = lastAllocated ? lastAllocated.toNo + 1 : config.start;
            let newTo = newFrom + config.slotSize - 1;

            if (newTo > config.end) {
                return res.status(400).json({ message: "GST సిరీస్ లిమిట్ పూర్తయింది!" });
            }

            series = new LRSeries({
                stateGroup: group, 
                stationCode: stationCode.toUpperCase(), 
                lrtype: lrtype,
                fromNo: newFrom, 
                toNo: newTo, 
                currentNo: newFrom,
                isActive: true
            });
            await series.save();
        }

        // 6 అంకెలుగా నంబర్ పంపడం
        const formattedNo = String(series.currentNo).padStart(6, '0');
        res.status(200).json({ nextNo: formattedNo });

    } catch (err) {
        console.error("LR Error:", err.message);
        res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
};

export const saveBill = async (req, res) => {
    try {
        const newBill = new Bill(req.body);
        await newBill.save();

        await LRSeries.updateOne(
            { stationCode: req.body.fstn, lrtype: req.body.lrtype, isActive: true },
            { $inc: { currentNo: 1 } }
        );

        res.status(201).json({ message: "బిల్ సేవ్ చేయబడింది" });
    } catch (err) {
        res.status(400).json({ message: "Save Error", error: err.message });
    }
};


export default {
    getNextLR,
    saveBill
};