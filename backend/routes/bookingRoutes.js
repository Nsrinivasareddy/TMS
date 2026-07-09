import express from 'express';
import { saveBooking, getPendingBookings } from '../controllers/bookingController.js';

const router = express.Router();

router.post('/save', saveBooking); // ఇక్కడ కంట్రోలర్ ఫంక్షన్ ని కనెక్ట్ చేయాలి
router.get('/pending', getPendingBookings);

export default router;