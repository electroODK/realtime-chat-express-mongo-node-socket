import mongoose from 'mongoose';

const videoChatSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'groups',
      required: true,
    },
    initiator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user-message',
      required: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user-message',
      },
    ],
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: Date,
    status: {
      type: String,
      enum: ['active', 'ended'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

const VideoChatModel = mongoose.model('videochats', videoChatSchema);
export default VideoChatModel;
