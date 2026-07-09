import mongoose from 'mongoose';

// మోడల్స్ సేఫ్ లోడింగ్
import '../models/AdminMaster.js';
import '../models/Masters.js';
import '../models/User.js';

const AdminMaster = mongoose.model('AdminMaster');
const Master = mongoose.model('Master'); 
const User = mongoose.model('User');

// 🌟 ఇంటర్నల్ గా ఫోన్ నెంబర్ కి పాస్‌వర్డ్ పంపే డమ్మీ ఫంక్షన్ (ఇక్కడ మీ SMS API లింక్ చేసుకోవచ్చు)
const sendPasswordToPhone = async (phoneNumber, userId, password) => {
    try {
        console.log(`📱 [SMS SYSTEM] Sending details to ${phoneNumber} -> UserID: ${userId}, Password: ${password}`);
        // ఇక్కడ మీ Twilio లేదా మరేదైనా SMS Gateway కోడ్ వస్తుంది.
        return true;
    } catch (err) {
        console.error("SMS పంపడంలో లోపం:", err);
        return false;
    }
};

// =========================================================================
// 🎯 1. అడ్మిన్ మాస్టర్ ప్యాకేజ్ (Saves to 3 Files with Mandatory Email & Phone)
// =========================================================================
export const saveAdminMasterPackage = async (req, res) => {
    const { 
        ac_status, input_value, stationCode, stationName,
        allow_erp_login, userId, sectionName, password, 
        phone, email, // 🌟 మీ రూల్ ప్రకారం ఇవి ఇప్పుడు తప్పనిసరి (Mandatory)
        login_station, login_id 
    } = req.body;

    // 1. బేసిక్ వాలిడేషన్స్
    if (!login_station || !login_id) {
        return res.status(400).json({ success: false, message: "సెషన్ లోపం: లాగిన్ ఆపరేటర్ వివరాలు అందలేదు!" });
    }
    if (!input_value || input_value.trim() === "") {
        return res.status(400).json({ success: false, message: "❌ అకౌంట్ పేరు (A/C Name) తప్పనిసరి!" });
    }
    if (!stationCode || stationCode.trim() === "") {
        return res.status(400).json({ success: false, message: "❌ STATION CODE తప్పనిసరి!" });
    }

    // 🌟 2. ఫోన్ మరియు ఈమెయిల్ ఖచ్చితంగా ఉండాలనే కండిషన్
    if (!phone || phone.trim().length !== 10) {
        return res.status(400).json({ success: false, message: "❌ 10 అంకెల మొబైల్ నెంబర్ ఖచ్చితంగా ఇవ్వాలి!" });
    }
    if (!email || !email.includes('@')) {
        return res.status(400).json({ success: false, message: "❌ సరైన ఈమెయిల్ ఐడీ (Email ID) ఖచ్చితంగా ఇవ్వాలి!" });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        let final_ac_name = input_value.toUpperCase().trim();
        if (['OWN_LORRY', 'CONTRACT_1', 'CONTRACT_2'].includes(ac_status)) {
            final_ac_name = final_ac_name.replace(/\s+/g, '');
        }

        // ఆటో కోడ్ జనరేషన్ లాజిక్
        let startCodeRange = 5000; 
        let pureGroupStatus = "5000S"; 
        
        if (ac_status === "STAFF") { startCodeRange = 6000; pureGroupStatus = "6000S"; }
        else if (ac_status === "RSTAFF") { startCodeRange = 7000; pureGroupStatus = "7000S"; }
        else if (ac_status === "AGENT") { startCodeRange = 8000; pureGroupStatus = "8000S"; }

        const lastAccount = await Master.findOne({
            ac_code: { $gte: startCodeRange + 1, $lt: startCodeRange + 1000 }
        }).sort({ ac_code: -1 }).session(session);

        let nextAcCode = lastAccount && lastAccount.ac_code ? lastAccount.ac_code + 1 : startCodeRange + 1;

        // 📁 ఫైల్ 1: Masters (Financial Ledger)
        const newAccountLedger = new Master({
            ac_code: nextAcCode,
            ac_name: ['OWN_LORRY', 'CONTRACT_1', 'CONTRACT_2'].includes(ac_status) 
                ? final_ac_name 
                : `${final_ac_name} (${ac_status})`,
            ac_status: pureGroupStatus, 
            ac_type: 'BS',
            created_station: login_station.toUpperCase(),
            created_section: "ADMIN",
            created_by: login_id
        });
        
        newAccountLedger.adminMasterId = new mongoose.Types.ObjectId();
        const savedLedger = await newAccountLedger.save({ session });

        // 📁 ఫైల్ 2: AdminMasters (Operational Document)
        const newAdminMaster = new AdminMaster({
            ac_status, 
            ac_code: nextAcCode,
            ac_name: final_ac_name,
            phone: phone.trim(), 
            stationCode: stationCode.toUpperCase(),
            stationName: stationName ? stationName.toUpperCase() : 'VIJAYAWADA',
            ac_code_link: savedLedger._id
        });
        const savedAdminMaster = await newAdminMaster.save({ session });

        savedLedger.adminMasterId = savedAdminMaster._id;
        await savedLedger.save({ session });

        // 📁 ఫైల్ 3: Users (ERP Login Control)
        if (['STAFF', 'RSTAFF', 'AGENT'].includes(ac_status) && allow_erp_login) {
            if (!userId || !password) {
                throw new Error("ఈఆర్పీ లాగిన్ ఎనేబుల్ చేశారు కానీ USER ID లేదా PASSWORD ఇవ్వలేదు!");
            }

            const existingUser = await User.findOne({ userId: userId.trim() }).session(session);
            if (existingUser) {
                throw new Error(`❌ USER ID '${userId}' ఆల్రెడీ సిస్టమ్ లో ఉంది!`);
            }

            const newLoginUser = new User({
                userId: userId.trim(), 
                password: password,   // డెవలప్‌మెంట్‌లో ప్లెయిన్ టెక్స్ట్ పాస్‌వర్డ్
                email: email.trim().toLowerCase(), 
                mobile: phone.trim(),
                stationCode: stationCode.toUpperCase(),
                stationName: stationName ? stationName.toUpperCase() : 'VIJAYAWADA',
                sectionName: sectionName || 'TMENT',
                isActive: true, 
                adminMasterId: savedAdminMaster._id
            });
            const savedUser = await newLoginUser.save({ session });

            savedAdminMaster.userId_link = savedUser._id;
            await savedAdminMaster.save({ session });

            // 🌟 ట్రాన్సాక్షన్ సేవ్ అయ్యే ముందే ఇంటర్నల్ గా ఫోన్ నెంబర్ కి పాస్‌వర్డ్ ఎస్ఎమ్మెస్ ట్రిగ్గర్ అవుతుంది
            await sendPasswordToPhone(phone.trim(), userId.trim(), password);
        }

        await session.commitTransaction();
        session.endSession();

        return res.status(201).json({
            success: true,
            message: `✓ శ్రీనివాస రోడ్ ట్రాన్స్‌పోర్ట్ మాస్టర్ సేవ్ అయింది. లాగిన్ వివరాలు ఫోన్ నెంబర్ కి పంపబడ్డాయి!`,
            data: { ac_code: nextAcCode, ac_name: final_ac_name }
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ success: false, message: error.message });
    }
};
// =========================================================================
// 🎯 2. అకౌంట్స్ మాస్టర్ ఫంక్షన్ (Saves to ONLY 1 File: masters)
// =========================================================================
export const saveAccountsDirectMaster = async (req, res) => {
    const { 
        login_section, // 'ADMIN' లేదా 'MAINACS'
        ac_status,     // ఇది ఫ్రంటెండ్ నుండి సెలెక్ట్ చేయబడిన గ్రూప్ (ఉదా: 5000S, 6000S, etc.)
        input_value, 
        ac_type, 
        ope_cr, 
        ope_dr, 
        login_station, 
        login_id, 
        allow_erp_login, 
        userId, 
        password, 
        phone, 
        email, 
        sectionName 
    } = req.body;

    try {
        const clean_ac_name = input_value.toUpperCase().trim();
        
        // 1. అకౌంట్ కోడ్ జనరేషన్ (ఇప్పటికే ఉన్న ac_status/group ని బట్టి)
        const lastAccount = await Master.findOne({ ac_status: ac_status }).sort({ ac_code: -1 });
        
        // ఒకవేళ ఆ గ్రూప్ లో అకౌంట్స్ లేకపోతే, బేస్ కోడ్ నుండి స్టార్ట్ చేయాలి
        // ac_status లో ఉండే 'S' ని తీసేసి నెంబర్ తీసుకుంటున్నాం
        let baseCode = Number(ac_status.replace('S', ''));
        let nextAcCode = lastAccount ? lastAccount.ac_code + 1 : baseCode + 1;

        // 2. AdminMaster క్రియేషన్ (ADMIN అయితేనే)
        let savedAdminMaster = null;
        if (login_section === 'ADMIN') {
            const newAdminMaster = new AdminMaster({
                ac_status: ac_status,
                ac_code: nextAcCode,
                ac_name: clean_ac_name,
                phone: phone || '',
                stationCode: login_station.toUpperCase()
            });
            savedAdminMaster = await newAdminMaster.save();
        }

        // 3. Master (Ledger) ఫైల్‌లో ఎంట్రీ
        const newAccount = new Master({
            ac_code: nextAcCode,
            ac_name: clean_ac_name,
            ac_type: ac_type || 'PL',
            ac_status: ac_status, // ఫ్రంటెండ్ నుండి వచ్చిన గ్రూప్ ని వాడుతున్నాం
            ope_dr: Number(ope_dr) || 0,
            ope_cr: Number(ope_cr) || 0,
            created_station: login_station.toUpperCase(),
            created_section: login_section,
            created_by: login_id,
            adminMasterId: savedAdminMaster ? savedAdminMaster._id : null 
        });
        await newAccount.save();

        // 4. ERP Login క్రియేషన్
        if (login_section === 'ADMIN' && allow_erp_login && userId && password && savedAdminMaster) {
            const newUser = new User({
                userId: userId.trim(),
                password: password,
                email: email,
                mobile: phone,
                stationCode: login_station.toUpperCase(),
                sectionName: sectionName || 'MAINACS',
                isActive: true,
                ac_code: nextAcCode,
                adminMasterId: savedAdminMaster._id 
            });
            await newUser.save();
        }

        return res.status(201).json({ 
            success: true, 
            message: "అకౌంట్ సక్సెస్‌గా క్రియేట్ అయ్యింది.",
            data: { ac_code: nextAcCode }
        });

    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: "ఎర్రర్: " + error.message 
        });
    }
};
