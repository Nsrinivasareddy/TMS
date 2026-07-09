import mongoose from 'mongoose';

const billSchema = new mongoose.Schema({
    stateGroup: {  type: String,  required: true,  enum: ['AP', 'OS'],  default: 'AP'  },
    actualState: {  type: String, uppercase: true  },
    seriesChar: { type: String, default: "" },
    lrno: { type: Number, required: true },
    lrtype: { type: String, required: true },
    bdate: { type: Date, default: Date.now },
    fstn: { type: String, required: true },
    tstn: { type: String, required: true },
    quotno: { type: String, required: true },
    cnorname: { type: String, required: true },
    cnorgstno: String,
    cnorphno: String,
    cnoraddr1: String,
    cneename: { type: String, required: true },
    cneegstno: String,
    cneephno: String,
    cneeaddr1: String,
    arts: { type: Number, required: true },
    weight: { type: Number, required: true },
    cdm: Number,
    cmentval: { type: Number, required: true },
    freight: Number,
    lrchg: Number,
    surchg: Number,
    artchg: Number,
    valchg: Number,
    wpchg: Number,
    ddchg: Number,
    hweitChg: Number,
    gst: Number,
    desc1: { type: String, required: true },
    desc2: String,
    userId: { type: String, required: true },
    total: { type: Number, required: true },
    ddctype: String,
    rcm: String,
    wpass: String,
    remarks: String, 
    isPrinted: { type: Boolean, default: false },
    toState: { type: String, uppercase: true },
    ipAddress: { type: String, default: "" }
}, { timestamps: true }); // timestamps వల్ల ఎప్పుడు సేవ్ అయిందో ఆటోమేటిక్ గా తెలుస్తుంది

const Bill = mongoose.models.Bill || mongoose.model('Bill', billSchema);

export default Bill;
