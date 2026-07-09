// File Name: backend/config/db.js
import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        // ఇక్కడ మీ MongoDB URL ని ఇవ్వాలి (లేదా .env ఫైల్ నుండి తెచ్చుకోవచ్చు)
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/TMS_Database');
        
        console.log(`📡 MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1); // కనెక్షన్ ఫెయిల్ అయితే సర్వర్ ఆగిపోతుంది
    }
};

export default connectDB;