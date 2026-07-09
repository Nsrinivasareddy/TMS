import mongoose from 'mongoose';

const KilometersSchema = new mongoose.Schema({
  fromStation: { type: String, required: true },
  toStation: { type: String, required: true },
  kilometers: { type: Number, required: true }
});

const Kilometers = mongoose.model('Kilometers', KilometersSchema);
export default Kilometers;