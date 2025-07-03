import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Provide name'],
    },
    email: {
      type: String,
      required: [true, 'Provide email'],
      unique: true,
    },
    password: {
      type: String,
      required: [true, 'Provide password'],
      select: false,
    },
    avatar: {
      type: String,
      default: '',
    },
    groups: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'groups',
      },
    ],
  },
  {
    timestamps: true,
  }
);


const UserModel = mongoose.model('user-message', userSchema);
export default UserModel;
