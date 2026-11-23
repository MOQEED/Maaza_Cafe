import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

let isConnected = false;

export const connectDB = async () => {
  if (process.env.USE_MEMORY_DB === 'true') {
    console.log('⚡ Running with In-Memory Storage mode (USE_MEMORY_DB=true)');
    return true;
  }

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/maaza_cafe';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`☕ MongoDB Connected Successfully: ${conn.connection.host}/${conn.connection.name}`);
    return true;
  } catch (error) {
    console.warn(`⚠️ MongoDB connection error: ${error.message}.`);
    console.log('🔄 Continuing with mock/in-memory resilience.');
    isConnected = false;
    return false;
  }
};

export const getDBStatus = () => isConnected;
