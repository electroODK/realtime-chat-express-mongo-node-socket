import express from 'express';
import {
  startVideoChat,
  joinVideoChat,
  endVideoChat,
  getGroupChats,
} from '../controllers/video.controller.js';

const router = express.Router();

router.post('/start', startVideoChat);
router.post('/join', joinVideoChat);
router.post('/end/:chatId', endVideoChat);
router.get('/group/:groupId', getGroupChats);

export default router;
