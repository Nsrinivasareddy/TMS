// E:/tms/backend/routes/quotationRoutes.js

import express from 'express';
const router = express.Router();
import { getAllQuotations } from '../controllers/quotationController.js'; // పేరు గమనించండి

// రూట్ సెట్ చేయడం
router.get('/all', getAllQuotations);

// 🎯 ఇది చాలా ముఖ్యం! ఎర్రర్ పోవాలంటే ఇలాగే ఉండాలి:
export default router;