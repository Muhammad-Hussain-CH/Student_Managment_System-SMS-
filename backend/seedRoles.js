import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Role from './src/models/Role.model.js';

dotenv.config();

const roles = [
  {
    name: 'Administrator',
    key: 'admin',
    permissions: ['*'],
    homeRoute: '/dashboard',
  },
  {
    name: 'Teacher',
    key: 'teacher',
    permissions: [
      'can_view_students',
      'can_mark_attendance',
      'can_view_attendance',
      'can_create_exams',
      'can_enter_results',
    ],
    homeRoute: '/dashboard',
  },
  {
    name: 'Student',
    key: 'student',
    permissions: [
      'can_view_own_profile',
      'can_view_own_attendance',
      'can_view_own_results',
      'can_view_own_fees',
    ],
    homeRoute: '/my-profile',
  },
];

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  for (const roleData of roles) {
    const updated = await Role.findOneAndUpdate(
      { key: roleData.key },
      { $set: roleData },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`✅ Role ready: ${updated.key}`);
  }

  process.exit(0);
};

run().catch((error) => {
  console.error('❌ Failed to seed roles:', error);
  process.exit(1);
});