import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.model.js';
import Role from '../src/models/Role.model.js';

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('📡 Connected to MongoDB');

    // Get all roles (keyed by key string)
    const roles = await Role.find({});
    const roleMap = {};
    roles.forEach((role) => {
      roleMap[role.key] = role._id;
    });

    if (Object.keys(roleMap).length === 0) {
      console.error('❌ No roles found. Run seed:roles first.');
      process.exit(1);
    }

    // Find users with string role (old format)
    const oldUsers = await User.find({ role: { $type: 'string' } });
    console.log(`Found ${oldUsers.length} users with string role`);

    let migrated = 0;
    for (const user of oldUsers) {
      const roleId = roleMap[user.role];
      if (roleId) {
        await User.updateOne({ _id: user._id }, { role: roleId });
        migrated++;
        console.log(`✅ Migrated ${user.email}: ${user.role} → ${roleId}`);
      } else {
        console.warn(`⚠️  Could not find role for user ${user.email} with role key: ${user.role}`);
      }
    }

    console.log(`\n✅ Migration complete: ${migrated}/${oldUsers.length} users migrated`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

run();
