import mongoose from 'mongoose';

// 1. మొదట Schema ను డిఫైన్ చేయండి
const MasterSchema = new mongoose.Schema({
    ac_code: { type: Number, required: true },
    ac_name: String,
    ac_type: { type: String, default: 'BS' },
    
    ac_status: String,
    created_station: String,
    created_section: String,
    created_by: String,
    ope_dr: { type: Number, default: 0 },
    ope_cr: { type: Number, default: 0 },
    adminMasterId: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminMaster' }
});

// 2. Schema డిఫైన్ చేసిన తర్వాత మాత్రమే ఇండెక్స్ రాయండి (ఇప్పుడు ఇది పనిచేస్తుంది)
MasterSchema.index({ ac_code: 1 });
MasterSchema.index({ ac_status: 1 });

// 3. చివరగా మోడల్ ని ఎగుమతి (Export) చేయండి
const Master = mongoose.model('Master', MasterSchema);
export default Master;
