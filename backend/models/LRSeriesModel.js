import mongoose from 'mongoose';

const lrSeriesSchema = new mongoose.Schema({
    stateGroup: { type: String, required: true },
    seriesChar: { type: String, default: "" },
    stationCode: { type: String, required: true },
    lrType: { type: String, required: true }, // PAID, TOPAY, etc.
    fromNo: { type: Number, required: true },
    toNo: { type: Number, required: true },
    currentNo: { type: Number, required: true },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// ఇక్కడ మార్పు చేయండి:
const LRSeries = mongoose.models.LRSeries || mongoose.model('LRSeries', lrSeriesSchema);

export default LRSeries;
