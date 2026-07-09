import express from 'express';
import { getAvailableResources, saveShedOutDispatch } from '../controllers/shedOutController.js';

const router = express.Router();

router.get('/available-resources', getAvailableResources);
router.post('/save-dispatch', saveShedOutDispatch); // 🎯 ఈ పోస్ట్ రౌట్ ద్వారానే డేటా సేవ్ అవుతుంది

export default router;
