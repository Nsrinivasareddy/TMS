import express from 'express';
const router = express.Router();
import { getAllHolders, addHolder } from '../controllers/holderController.js';

router.get('/all', getAllHolders);
router.post('/add', addHolder);

export default router;