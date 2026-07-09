import express from 'express';
const router = express.Router();
import { getAllHolders, addHolder } from '../controllers/holderController.js';

// GET http://localhost:5001/api/holders/all
router.get('/all', getAllHolders);
router.post('/add', addHolder);

export default router;