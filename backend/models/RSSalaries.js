const mongoose = require('mongoose');

const RSSalariesSchema = new mongoose.Schema({
    driverAcCode: { 
        type: Number, 
        required: true 
    }, // డ్రైవర్ కోడ్ (3401)
    monthYear: { 
        type: String, 
        required: true 
    }, // ఏ నెలకు సంబంధించింది (ఉదా: "05-2026")
    
    totalWorkingDays: { 
        type: Number, 
        required: true 
    }, // ఆ నెలలో చేసిన మొత్తం రోజులు (Shifts లేదా Days ఆధారంగా)
    totalKmsDone: { 
        type: Number, 
        required: true 
    }, // ఆ నెలలో తిరిగిన మొత్తం కిలోమీటర్లు
    allowedKmsLimit: { 
        type: Number, 
        required: true 
    }, // రోజుకు 250 చొప్పున వచ్చే పరిమితి (Days * 250)
    
    extraKms: { 
        type: Number, 
        default: 0 
    }, // ఒకవేళ totalKmsDone > allowedKmsLimit అయితే వచ్చే వ్యత్యాసం
    extraAmount: { 
        type: Number, 
        default: 0 
    }, // ఎక్స్‌ట్రా కిలోమీటర్లకు ఇచ్చే మొత్తం పేమెంట్
    
    isSettled: { 
        type: Boolean, 
        default: false 
    }, // ఈ నెల సెటిల్మెంట్ వోచర్ జనరేట్ అయిందా లేదా?
    settledVoucherNo: { 
        type: Number, 
        default: null 
    } // జనరేట్ అయిన వోచర్ నంబర్ లింక్
}, { timestamps: true });

// ఒక డ్రైవర్‌కు ఒక నెలకు ఒకే రికార్డ్ ఉండేలా ఇండెక్స్
RSSalariesSchema.index({ driverAcCode: 1, monthYear: 1 }, { unique: true });

module.exports = mongoose.model('RSSalaries', RSSalariesSchema);