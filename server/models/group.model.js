import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user-message',
      },
    ],
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user-message',
      },
    ],
    avatar: {
      type: String,
      default: '',
    },
    isGroup: {
      type: Boolean,
      default: true,
    },
    messages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'messages',
      },
    ],
  },
  {
    timestamps: true,
  }
);

const GroupModel = mongoose.model('groups', groupSchema);
export default GroupModel;
