import express from 'express'; // require కి బదులు import
const router = express.Router();

// 🎯 Controller ని కూడా import పద్ధతిలోనే పిలవాలి
import * as stationController from '../controllers/stationController.js'; 

// రూట్ సెట్ చేయడం
router.get('/all', stationController.getAllStations);

export default router; // module.exports కి బదులు export default