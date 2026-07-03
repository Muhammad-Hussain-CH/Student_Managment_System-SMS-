import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.model.js';
import Role from './src/models/Role.model.js';

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const exists = await User.findOne({ email: 'admin@sms.com' });
  if (exists) {
    console.log('Admin already exists.');
    process.exit(0);
  }

  // Find admin role
  const adminRole = await Role.findOne({ key: 'admin' });
  if (!adminRole) {
    console.error('Admin role not found. Run seed:roles first.');
    process.exit(1);
  }

  const admin = await User.create({
    name: 'Hussain Admin',
    email: 'admin@sms.com',
    password: 'Admin@12345',
    role: adminRole._id,
  });

  console.log('✅ Admin created:', admin.email);
  process.exit(0);
};

run();