import Holder from '../models/holderModel.js';

export const getAllHolders = async (req, res) => {
    try {
        console.log("Holders Fetch Request Received..."); // 1. రిక్వెస్ట్ వచ్చిందని తెలుస్తుంది
        const holders = await Holder.find({ isActive: true });
        console.log("Data from DB:", holders); // 2. DB నుండి ఏమి వస్తుందో టెర్మినల్‌లో కనిపిస్తుంది
        console.log("Total Records Count:", holders.length); // 3. ఎన్ని రికార్డులు ఉన్నాయో తెలుస్తుంది        
        res.status(200).json(holders);
    } catch (error) {
        console.error("Database Fetch Error:", error.message); // 4. ఎర్రర్ ఉంటే ఇక్కడ కనిపిస్తుంది        
        res.status(500).json({ message: "Holders డేటా తీసుకురావడంలో లోపం!", error });
    }
};



// కొత్త హోల్డర్‌ని యాడ్ చేయడానికి (కావాలంటే వాడుకోవచ్చు)
export const addHolder = async (req, res) => {
    try {
        const newHolder = new Holder(req.body);
        await newHolder.save();
        res.status(201).json(newHolder);
    } catch (error) {
        res.status(400).json({ message: "హోల్డర్ సేవ్ కాలేదు!" });
    }
};