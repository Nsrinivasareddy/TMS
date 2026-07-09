import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// @desc    Register a new user
// @route   POST /api/users/register
router.post('/register', async (req, res) => {
    const { userId, email, mobile, stationName, stationCode, sectionName, password } = req.body;

    try {
        const userExists = await User.findOne({ $or: [{ userId }, { email }] });

        if (userExists) {
            return res.status(400).json({ 
                message: 'ఈ యూజర్ ఐడీ లేదా ఈమెయిల్ ఇంతకుముందే రిజిస్టర్ అయ్యి ఉంది!' 
            });
        }

        const user = await User.create({
            userId,
            email,
            mobile,
            stationName,
            stationCode,
            sectionName,
            password, 
            status: 'Active' 
        });

        if (user) {
            console.log(`✅ User ${userId} created successfully!`);

            res.status(201).json({
                message: 'యూజర్ విజయవంతంగా రిజిస్టర్ అయ్యారు!',
                data: {
                    userId: user.userId,
                    email: user.email,
                    stationName: user.stationName
                }
            });
        } else {
            res.status(400).json({ message: 'రిజిస్ట్రేషన్ ప్రాసెస్ లో తప్పు జరిగింది' });
        }
    } catch (error) {
        console.error("Registration Error:", error.message);
        res.status(500).json({ message: 'సర్వర్ ఎర్రర్ వచ్చింది!', error: error.message });
    }
});

// ⭐ ఇందాక మనం ఇది రాయడం మర్చిపోయాం. ఇది తప్పనిసరి!
export default router;