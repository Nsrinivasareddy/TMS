// File Name: backend/routes/authRoutes.js
import express from 'express';
const router = express.Router();

// ⭐ కంట్రోలర్ నుండి ఇంపోర్ట్ చేసేటప్పుడు చివరన .js మర్చిపోవద్దు
import { loginUser } from '../controllers/authController.js';

router.post('/login', loginUser);

// ⭐ పాత module.exports బదులు ఇది వాడాలి
export default router;