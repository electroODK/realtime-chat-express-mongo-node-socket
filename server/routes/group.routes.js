import express from 'express';
import {
  createGroup,
  getGroup,
  getUserGroups,
  deleteGroup,
  addUserToGroup,
  removeUserFromGroup,
  updateGroupInfo,
} from '../controllers/group.controller.js';

const router = express.Router();

router.post('/', createGroup);
router.get('/:groupId/user/:userId', getGroup);

router.get('/by-user/:userId', getUserGroups);

router.delete('/:groupId', deleteGroup);

router.put('/:groupId/add-user', addUserToGroup);

router.delete('/:groupId/remove-user/:userId', removeUserFromGroup);

router.put('/:groupId', updateGroupInfo);

export default router;
