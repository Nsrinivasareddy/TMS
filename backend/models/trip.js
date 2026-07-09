import mongoose from 'mongoose';

const tripSchema = new mongoose.Schema({
    invoiceNo: { type: String, required: true }, // మీ కోరిక మేరకు కేవలం నెంబర్లు ఇక్కడ సేవ్ అవుతాయి
    lorryAcCode: { type: Number, required: true },
    lorryNo: { type: String, required: true },
    driverAcCode: { type: Number, required: true },
    driverName: { type: String, required: true },
    cleanerAcCode: { type: String, default: "N/A" },
    cleanerName: { type: String, default: "No Cleaner" },
    dispatchDate: { type: String, required: true },
    dispatchTime: { type: String, required: true },
    openingMeterReading: { type: Number, required: true },
    operatorId: { type: String, required: true },
    status: { type: String, default: "ROUTE-ACTIVE" },
    type: { type: String, default: "SHED-OUT" },
    loadingWeight: { type: Number, default: 0 },
    unloadingWeight: { type: Number, default: 0 },
    hamaliLoadCharges: { type: Number, default: 0 },
    hamaliUnloadCharges: { type: Number, default: 0 },
    materialType: { type: String, default: "GENERAL GOODS" },
    currentSection: { type: String, default: "SHED" }
}, { timestamps: true }); // ఇది ఆటోమేటిక్ గా ఎప్పుడు సేవ్ అయిందో (createdAt) రికార్డ్ చేస్తుంది

export default mongoose.model('Trip', tripSchema);