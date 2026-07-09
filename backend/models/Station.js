// File Name: backend/models/Station.js
import mongoose from 'mongoose';

const stationSchema = mongoose.Schema({
    stationName: { type: String, required: true, unique: true },
    stationCode: { type: String, required: true, unique: true },
    district: { type: String, required: true },
    state: { type: String, required: true  },
    pincode: { type: String, required: true },
    stationPhone: { type: String, required: true }

}, { timestamps: true });

const Station = mongoose.model('Station', stationSchema);
export default Station;