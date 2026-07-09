// File Name: backend/controllers/registrationController.js
const User = require('../models/User');

const registerUser = async (req, res) => {
    const { userId, email, phone, stationName, sectionName } = req.body;

    try {
        console.log("Registration Request received for ID:", userId);
        // Point 14: User ID Unique గా ఉందో లేదో చూడటం
        const existingUser = await User.findOne({ userId });
        if (existingUser) return res.status(400).json({ message: 'User ID already exists!' });

        // Point 15: Generate Simple Random Password (Ex: NSR1234)
        const autoPassword = "NSR" + Math.floor(1000 + Math.random() * 9000);

        // Station Code ని ఇక్కడ మీ Logic ప్రకారం సెట్ చేయవచ్చు
        const stationCode = stationName.substring(0, 3).toUpperCase(); 

        const newUser = new User({
            userId,
            email,
            phone,
            password: autoPassword, // సాదా పాస్‌వర్డ్ సేవ్ అవుతుంది
            stationName,
            stationCode,
            sectionName,
            status: 'Active' // Point 16: మొదట Active లో ఉండాలి
        });

        await newUser.save();
        
        // ఇక్కడ మనం Nodemailer ద్వారా email పంపవచ్చు (Point 20)
        res.status(201).json({ 
            message: 'User Registered Successfully',
            generatedPassword: autoPassword 
        });

    } catch (error) {
        res.status(500).json({ message: 'Registration Failed' });
    }
};