import VideoChatModel from '../models/videochat.model.js';

export const startVideoChat = async (req, res) => {
  try {
    const { groupId, userId } = req.body;

    const newSession = await VideoChatModel.create({
      group: groupId,
      initiator: userId,
      participants: [userId],
    });

    res.status(201).json(newSession);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка запуска видеочата', error: err.message });
  }
};

export const joinVideoChat = async (req, res) => {
  try {
    const { chatId, userId } = req.body;

    const chat = await VideoChatModel.findById(chatId);
    if (!chat || chat.status === 'ended') {
      return res.status(404).json({ message: 'Чат не найден или завершён' });
    }

    if (!chat.participants.includes(userId)) {
      chat.participants.push(userId);
      await chat.save();
    }

    res.json(chat);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка при входе в видеочат', error: err.message });
  }
};

export const endVideoChat = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await VideoChatModel.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Чат не найден' });

    chat.status = 'ended';
    chat.endedAt = new Date();
    await chat.save();

    res.json({ message: 'Чат завершён', chat });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка завершения видеочата', error: err.message });
  }
};

export const getGroupChats = async (req, res) => {
  try {
    const { groupId } = req.params;

    const chats = await VideoChatModel.find({ group: groupId }).sort({ createdAt: -1 });

    res.json(chats);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка получения чатов', error: err.message });
  }
};
