// File Name: backend/controllers/authController.js

// 1. 'require' బదులు 'import' వాడుతున్నాం (చివరన .js మర్చిపోవద్దు)
import User from '../models/User.js';

// 2. 'const loginUser' ని నేరుగా 'export' చేస్తున్నాం
export const loginUser = async (req, res) => {
    try {
        const { userId, password } = req.body;
        
        console.log("Login Request received for ID:", userId);

        // డేటాబేస్ లో యూజర్ ఐడీ కోసం వెతకడం
        const user = await User.findOne({ userId: userId });

        // ఒకవేళ యూజర్ ఐడీ దొరకకపోతే
        if (!user) {
            return res.status(401).json({ message: 'User ID కనుగొనబడలేదు!' });
        }

        // పాస్‌వర్డ్ సరిపోల్చడం (Direct String Comparison)
        if (user.password !== password) {
            return res.status(401).json({ message: 'తప్పుడు పాస్‌వర్డ్!' });
        }

        // యూజర్ స్టేటస్ చెక్ చేయడం
       if (user.isActive !== true) { 
            return res.status(403).json({ message: 'మీ ఖాతా ప్రస్తుతం Active లో లేదు!' });
        } 


        // సక్సెస్ రెస్పాన్స్
        console.log("Login Success: ", user.userId);
        res.status(200).json({
            message: "Login Successful",
            user: {
                userId: user.userId,
                userName: user.userName,
                stationName: user.stationName,
                stationCode: user.stationCode,
                sectionName: user.sectionName
            }
        });

    } catch (error) {
        console.error("Internal Server Error:", error.message);
        res.status(500).json({ message: 'సర్వర్ ఎర్రర్: ' + error.message });
    }
};

// ❌ పాత 'module.exports' ని తీసేశాము.