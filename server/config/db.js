import mongoose from 'mongoose';
import dns from 'dns';

// Ensure reliable SRV resolution on Windows networks when using mongodb+srv://
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Use system default if restricted
}

/**
 * ============================================================================
 * Database Connection Manager
 * ============================================================================
 * Connects to MongoDB Atlas / Local with connection pooling, automatic reconnection,
 * and graceful error logging.
 */
export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/budget_buddy';

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000
    });

    console.log(`✅ MongoDB Live Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.warn(`💡 Tip: Ensure MongoDB daemon is running locally or supply a valid MONGO_URI in server/.env`);
    return null;
  }
};

export default connectDB;
