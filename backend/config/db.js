// File Name: backend/config/db.js
// File Name: backend/config/db.js
import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        // ఇక్కడ కేవలం .env నుండి మాత్రమే తీసుకునేలా మార్చండి
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is not defined in environment variables");
        }

        const conn = await mongoose.connect(process.env.MONGO_URI);
        
        console.log(`📡 MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1); 
    }
};

export default connectDB;