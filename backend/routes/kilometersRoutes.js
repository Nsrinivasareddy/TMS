import express from 'express';
import Kilometers from '../models/KilometersModel.js';

const router = express.Router();

router.get('/all', async (req, res) => {
  try {
    console.log("Fetching Data...")
    const data = await Kilometers.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;