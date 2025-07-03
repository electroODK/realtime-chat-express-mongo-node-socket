import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'groups',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user-message',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const MessageModel = mongoose.model('messages', messageSchema);
export default MessageModel;
