// File Name: backend/models/User.js
import mongoose from 'mongoose';

// 1. ముందుగా Schema ను డిఫైన్ చేయండి
const UserSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: String,
    mobile: String,
    stationCode: String,
    stationName: String,
    sectionName: String,
    isActive: { type: Boolean, default: true },
    adminMasterId: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminMaster' }
});

// 2. Schema డిఫైన్ చేసిన తర్వాత మాత్రమే ఇండెక్స్ రాయాలి
UserSchema.index({ userId: 1 });
UserSchema.index({ mobile: 1 });

// 3. చివరగా మోడల్ ని ఎగుమతి (Export) చేయండి
const User = mongoose.model('User', UserSchema);
export default User;
