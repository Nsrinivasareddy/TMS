import mongoose from 'mongoose';

// 1. ముందుగా Schema ను డిఫైన్ చేయండి
const AdminMasterSchema = new mongoose.Schema({
    ac_status: { type: String, required: true },
    ac_code: { type: Number, required: true },
    ac_name: { type: String, required: true },
    phone: String,
    stationCode: String,
    stationName: String,
    ac_code_link: { type: mongoose.Schema.Types.ObjectId, ref: 'Master' },
    userId_link: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

// 2. Schema డిఫైన్ చేసిన తర్వాత మాత్రమే ఇండెక్స్ రాయాలి
AdminMasterSchema.index({ ac_code: 1 });
AdminMasterSchema.index({ phone: 1 });

// 3. చివరగా మోడల్ ని ఎగుమతి (Export) చేయండి
const AdminMaster = mongoose.model('AdminMaster', AdminMasterSchema);
export default AdminMaster;