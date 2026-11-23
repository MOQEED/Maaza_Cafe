import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const seed = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/maaza_cafe';
    await mongoose.connect(uri);
    console.log('Connected to MongoDB for seeding...');

    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123';

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      console.log(`✅ Admin user "${username}" already exists.`);
    } else {
      await User.create({
        username,
        password,
        role: 'admin',
      });
      console.log(`🎉 Default admin created: ${username} / ${password}`);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error.message);
    process.exit(1);
  }
};

seed();
