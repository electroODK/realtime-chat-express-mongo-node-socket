import mongoose from 'mongoose';
import dotenv from 'dotenv';
import GroupModel from './models/group.model.js';
import UserModel from './models/user.model.js';

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to DB');

    //ID существующего пользователя
    const userId = '6865834b745fad7af3fc1a57';
    const userId2 = "6867a63db498413b570868b8"

    const user = await UserModel.findById(userId);
    const user2 = await UserModel.findById(userId2);
    if (!user) throw new Error('User not found');

    const group = await GroupModel.create({
      name: 'Test Gr',
      users: [userId, userId2,],
      admins: [userId, userId2],
      avatar: '',
    });

    if (!user.groups.includes(group._id)) {
      user.groups.push(group._id);
      await user.save();
    }
        if (!user2.groups.includes(group._id)) {
      user2.groups.push(group._id);
      await user2.save();
    }


    console.log('✅ Group created and user updated');
    console.log('🆔 Group ID:', group._id.toString());

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

run();
