import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.model.js';

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const exists = await User.findOne({ email: 'admin@sms.com' });
  if (exists) {
    console.log('Admin already exists.');
    process.exit(0);
  }

  const admin = await User.create({
    name: 'Hussain Admin',
    email: 'admin@sms.com',
    password: 'Admin@12345',
    role: 'admin',
  });

  console.log('✅ Admin created:', admin.email);
  process.exit(0);
};

run();