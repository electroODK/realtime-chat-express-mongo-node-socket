import express from 'express';
import { createMessage, getGroupMessages } from '../controllers/message.controller.js';

const router = express.Router();

router.post('/', createMessage);
router.get('/:groupId', getGroupMessages);

export default router;
