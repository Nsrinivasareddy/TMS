// E:/tms/backend/controllers/quotationController.js
import QuotationModel from '../models/QuotationModel.js';

export const getAllQuotations = async (req, res) => {
    // ఫ్రంటెండ్ నుండి స్టేషన్ కోడ్ ని query ద్వారా తెచ్చుకోండి
    const { sCode } = req.query; 

    try {
        // "GEN" OR "Current Station" మాత్రమే వచ్చేలా క్వెరీ రాయండి
        const query = {
            $or: [
                { quotno: "GEN" },
                { stationCode: sCode }
            ]
        };

        const quotations = await QuotationModel.find(query);
        res.status(200).json(quotations);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
