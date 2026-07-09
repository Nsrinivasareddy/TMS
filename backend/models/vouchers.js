const mongoose = require('mongoose');

const VoucherSchema = new mongoose.Schema({
    v_date: { 
        type: Date, 
        required: true 
    }, // వోచర్ తేదీ
    v_no: { 
        type: Number, 
        required: true 
    }, // వోచర్ నంబర్ (ఒకే వోచర్ లోని మల్టిపుల్ లైన్స్ కి ఈ నంబర్ ఒకటే ఉంటుంది)
    sno: { 
        type: Number, 
        required: true 
    }, // సీరియల్ సంఖ్య (1, 2, 3...) ఒకే వోచర్ లోని అకౌంట్ లైన్స్ ఐడెంటిఫికేషన్ కోసం
    
    ac_code: { 
        type: Number, 
        required: true 
    }, // అకౌంట్ కోడ్ (ఉదా: 3401)
    ac_status: { 
        type: String, 
        required: true 
    }, // అకౌంట్ స్టేటస్ / గ్రూప్ (ఉదా: 3400S)
    
    section: { 
        type: String, 
        required: true 
    }, // విభాగం (SHED, LCO, INVOICE, ACCOUNTS)
    stn: { 
        type: String, 
        required: true 
    }, // స్టేషన్ కోడ్ (VZA, HYB, GNT)
    b_code: { 
        type: String, 
        required: true 
    }, // బ్రాంచ్ కోడ్
    
    discription: { 
        type: String, 
        default: "" 
    }, // ప్రధాన వివరణ
    discription1: { 
        type: String, 
        default: "" 
    }, // అదనపు వివరణ
    
    v_mode: { 
        type: String, 
        required: true, 
        enum: ['CASH', 'BANK', 'JOURNAL'] 
    }, // పేమెంట్ మోడ్
    v_type: { 
        type: String, 
        required: true, 
        enum: ['PAYMENT', 'RECEIPT', 'CONTRA', 'JOURNAL'] 
    }, // వోచర్ రకం
    
    amount: { 
        type: Number, 
        required: true 
    }, // ట్రాన్సాక్షన్ అమౌంట్
    userid: { 
        type: String, 
        required: true 
    } // ఎంట్రీ చేసిన ఆపరేటర్ ఐడి
}, { timestamps: true });

// Compound Index: ఒకే వోచర్ నంబర్ (v_no) లో ఒకే సీరియల్ నంబర్ (sno) రెండుసార్లు రాకుండా లాక్ చేస్తుంది
VoucherSchema.index({ v_no: 1, sno: 1 }, { unique: true });

module.exports = mongoose.model('Voucher', VoucherSchema);