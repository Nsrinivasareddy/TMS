
// E:/tms/backend/models/Quotation.js
import mongoose from 'mongoose'; // require కి బదులు import వాడండి

const quotationsSchema = new mongoose.Schema({
  quotno: { type: String, required: true },
  qfreit: { type: Number, required: true },
  qstn: { type: String, required: true },
  qsurchg: { type: Number, required: true },
  qartchg: { type: Number, required: true },
  qlrval: { type: Number, required: true },
  qvalchg: { type: Number, required: true },
  qcnorname: {type: String, required: true },
  qcnorgstno: {type: String, required: true},
  qcnoraddrs1: {type: String, required: true},
  qcnoraddrs2: {type: String, required: true},
  qcnorphno: {type: Number, required: true},
  qwpchg: { type: Number, required: true },
  qddchg: { type: Number, required: true }
});

// 🎯 module.exports కి బదులు కింద ఉన్నట్లుగా export default వాడండి
const Quotation = mongoose.model('Quotations', quotationsSchema);
export default Quotation;