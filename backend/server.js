import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Routes ఇంపోర్ట్ చేయడం
import stationRoutes from './routes/stationRoutes.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import lrRoutes from './routes/lrseriesRoutes.js'; 
import quotationRoutes from './routes/quotationRoutes.js';
import holderRoutes from './routes/holderRoutes.js';
import kilometersRoutes from './routes/kilometersRoutes.js';
import mastersRoutes from './routes/mastersRoute.js';
import shedRoutes from './routes/shedRoutes.js'; // 🎯 కొత్తగా యాడ్ చేసిన షెడ్ రౌట్ ఇంపోర్ట్ 

dotenv.config();
const app = express();

// Middlewares


app.use(cors({
    origin: 'https://nsr-tms.vercel.app',
  //origin: ["*"],
  //origin: ["http://localhost:5173", "http://localhost:5174", "https://nsrtms.vercel.app"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));
app.use(express.json()); 

// ==========================================
// 1. DATABASE CONNECTION
// ==========================================
const dbURI = process.env.MONGO_URI;


mongoose.connect(dbURI)
    .then(() => {
        console.log("=========================================");
        // ఇది ఏ డేటాబేస్‌కి కనెక్ట్ అయిందో ఆ పేరును చూపిస్తుంది
        console.log(`✅ Success: Connected to Database: ${mongoose.connection.db.databaseName}`);
        console.log("=========================================");
    })
    .catch(err => {
        console.error("❌ MongoDB Connection Failed!", err.message);
    });

// ==========================================
// 2. API ROUTES
// ==========================================
app.use('/api/holders', holderRoutes); 
app.use('/api/auth', authRoutes); 
app.use('/api/stations', stationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/lrseries', lrRoutes); 
app.use('/api/quotations', quotationRoutes);
app.use('/api/kilometers', kilometersRoutes);
app.use('/api/masters', mastersRoutes);
app.use('/api/shed', shedRoutes); // 🎯 కొత్తగా యాడ్ చేసిన షెడ్ API ఎండ్‌పాయింట్

// Basic Root Route
app.get('/', (req, res) => {
    res.send('Backend Server is Running Smoothly...');
});



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server for TMS NSR is running on port ${PORT}`);
});
