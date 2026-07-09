import mongoose from 'mongoose';

// models/holderModel.js
const holderSchema = new mongoose.Schema({
    stationCode: String,
    firmName: String,
    gst_number: String,
    panNo: String,
    address: String,
    phone: String,
    // ఇక్కడ default పెట్టడం వల్ల ఆటోమేటిక్ గా true అవుతుంది
    isActive: { type: Boolean, default: true } 
}, { timestamps: true });

export default mongoose.model('Holders', holderSchema);