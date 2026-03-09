const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const messageUpload = require('../middleware/messageUpload');
const {
  searchUsers,
  getConversations,
  createOrGetConversation,
  getConversationMessages,
  markConversationAsRead,
  sendMessage,
  deleteMessage,
  createMessageReport,
  getBlockedUsers,
  blockUser,
  unblockUser
} = require('../controllers/messageController');

router.use(protect);

router.get('/users', searchUsers);
router.get('/conversations', getConversations);
router.post('/conversations', createOrGetConversation);
router.get('/conversations/:id/messages', getConversationMessages);
router.post('/conversations/:id/read', markConversationAsRead);
router.post('/conversations/:id/messages', messageUpload.single('attachment'), sendMessage);
router.delete('/:messageId', deleteMessage);
router.post('/reports', createMessageReport);
router.get('/blocks', getBlockedUsers);
router.post('/blocks', blockUser);
router.delete('/blocks/:userId', unblockUser);

module.exports = router;
