import MessageModel from '../models/message.model.js';
import GroupModel from '../models/group.model.js';
import UserModel from '../models/user.model.js';
import { getIO } from '../utils/socket.js';

export const createMessage = async (req, res) => {
  try {
    const { text, groupId, sender } = req.body;

    if (!text || !groupId || !sender)
      return res
        .status(400)
        .json({ message: 'Text, groupId and sender required' });

    const group = await GroupModel.findById(groupId);
    const user = await UserModel.findById(sender);

    if (!group || !user)
      return res.status(404).json({ message: 'Group or sender not found' });

    const isInGroup = group.users.some((id) => id.toString() === sender);
    if (!isInGroup)
      return res
        .status(403)
        .json({ message: 'User is not a member of this group' });

    const newMessage = await MessageModel.create({
      text,
      groupId,
      sender,
    });

    group.messages.push(newMessage._id);
    await group.save();

    const io = getIO();
    const populated = await newMessage.populate('sender', 'name');
    io.to(groupId).emit('newMessage', populated);

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await GroupModel.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const messages = await MessageModel.find({ groupId })
      .sort({ createdAt: 1 })
      .populate('sender', 'name email');

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
