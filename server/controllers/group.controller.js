import GroupModel from '../models/group.model.js';
import UserModel from '../models/user.model.js';

export const createGroup = async (req, res) => {
  try {
    const { name, users, admins, avatar } = req.body;

    if (!name || !users || users.length === 0)
      return res.status(400).json({ message: 'Name and users required' });

    const newGroup = await GroupModel.create({
      name,
      users,
      admins: admins || [],
      avatar: avatar || '',
    });

    await Promise.all(
      users.map(async (userId) => {
        const user = await UserModel.findById(userId);
        if (!user) return;
        if (!user.groups.includes(newGroup._id)) {
          user.groups.push(newGroup._id);
          await user.save();
        }
      })
    );

    res.status(201).json(newGroup);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getGroup = async (req, res) => {
  try {
    const { groupId, userId } = req.params;

    const group = await GroupModel.findById(groupId)
      .populate('users', 'name')
      .populate({
        path: 'messages',
        populate: {
          path: 'sender',
          select: 'name',
        },
      });

    const user = await UserModel.findById(userId);

    if (!group || !user)
      return res.status(404).json({ message: 'Group or user not found' });

    const isInGroup = group.users.some((u) => u._id.equals(user._id));
    const isInUserGroups = user.groups.some((gId) => gId.equals(group._id));

    if (!isInGroup || !isInUserGroups) {
      return res.status(403).json({ message: 'Access denied: not in group' });
    }

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


export const getUserGroups = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await UserModel.findById(userId).populate({
      path: 'groups',
      populate: {
        path: 'users',
        select: 'name email',
      },
    });

    if (!user)
      return res.status(404).json({ message: 'User not found' });

    res.json(user.groups);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await GroupModel.findByIdAndDelete(groupId);
    if (!group)
      return res.status(404).json({ message: 'Group not found' });

    await UserModel.updateMany(
      { groups: group._id },
      { $pull: { groups: group._id } }
    );

    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const addUserToGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId, requesterId } = req.body;

    const group = await GroupModel.findById(groupId);
    const user = await UserModel.findById(userId);
    const requester = await UserModel.findById(requesterId);

    if (!group || !user || !requester)
      return res.status(404).json({ message: 'Group or user not found' });

    const isAdmin = group.admins.includes(requesterId);
    if (!isAdmin)
      return res.status(403).json({ message: 'Only admin can add users' });

    if (group.users.includes(userId))
      return res.status(400).json({ message: 'User already in group' });

    group.users.push(userId);
    await group.save();

    user.groups.push(groupId);
    await user.save();

    res.json({ message: 'User added to group' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const removeUserFromGroup = async (req, res) => {
  try {
    const { groupId, userId } = req.params;

    const group = await GroupModel.findById(groupId);
    const user = await UserModel.findById(userId);

    if (!group || !user)
      return res.status(404).json({ message: 'Group or user not found' });

    group.users = group.users.filter((id) => id.toString() !== userId);
    group.admins = group.admins.filter((id) => id.toString() !== userId);
    await group.save();

    user.groups = user.groups.filter((id) => id.toString() !== groupId);
    await user.save();

    res.json({ message: 'User removed from group' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateGroupInfo = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, avatar } = req.body;

    const group = await GroupModel.findById(groupId);
    if (!group)
      return res.status(404).json({ message: 'Group not found' });

    if (name) group.name = name;
    if (avatar !== undefined) group.avatar = avatar;

    await group.save();

    res.json({ message: 'Group updated', group });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
