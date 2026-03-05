const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  searchUsers,
  getConversations,
  createOrGetConversation,
  getConversationMessages,
  sendMessage
} = require('../controllers/messageController');

router.use(protect);

router.get('/users', searchUsers);
router.get('/conversations', getConversations);
router.post('/conversations', createOrGetConversation);
router.get('/conversations/:id/messages', getConversationMessages);
router.post('/conversations/:id/messages', sendMessage);

module.exports = router;
