const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User, Conversation, Message } = require('./models');
const { setSocketServer } = require('./services/socketService');
const { markOnline, markOffline, isUserOnline } = require('./services/presenceService');

// Origines autorisées (mêmes que le CORS HTTP de server.js)
const ALLOWED_ORIGINS = [
  'https://afriride-frontend.onrender.com',
  'http://localhost:5173',
  ...(process.env.FRONTEND_URLS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)
];

const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: ALLOWED_ORIGINS,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.use(async (socket, next) => {
    try {
      const authToken = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!authToken) {
        return next(new Error('Authentication token missing'));
      }

      const token = String(authToken).replace('Bearer ', '');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id, {
        attributes: ['id', 'firstName', 'lastName', 'role']
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    socket.join(`user:${userId}`);
    const onlineSessions = markOnline(userId);
    if (onlineSessions === 1) {
      io.emit('presence:update', { userId, isOnline: true });
    }

    socket.on('join_conversation', async ({ conversationId }) => {
      if (!conversationId) return;
      const conversation = await Conversation.findByPk(conversationId);
      if (!conversation) return;

      const isMember = conversation.participantOneId === userId || conversation.participantTwoId === userId;
      if (!isMember) return;

      socket.join(`conversation:${conversationId}`);

      const pendingDelivered = await Message.findAll({
        where: {
          conversationId,
          senderId: { [Op.ne]: userId },
          deliveredAt: { [Op.is]: null }
        },
        attributes: ['id']
      });

      if (pendingDelivered.length > 0) {
        const deliveredAt = new Date();
        const ids = pendingDelivered.map((item) => item.id);
        await Message.update({ deliveredAt }, { where: { id: ids } });
        io.to(`conversation:${conversationId}`).emit('message:delivered', {
          conversationId,
          messageIds: ids,
          deliveredAt: deliveredAt.toISOString()
        });
      }
    });

    socket.on('leave_conversation', ({ conversationId }) => {
      if (!conversationId) return;
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on('typing:start', async ({ conversationId }) => {
      if (!conversationId) return;
      const conversation = await Conversation.findByPk(conversationId);
      if (!conversation) return;
      const isMember = conversation.participantOneId === userId || conversation.participantTwoId === userId;
      if (!isMember) return;

      socket.to(`conversation:${conversationId}`).emit('typing:update', {
        conversationId,
        userId,
        isTyping: true
      });
    });

    socket.on('typing:stop', async ({ conversationId }) => {
      if (!conversationId) return;
      const conversation = await Conversation.findByPk(conversationId);
      if (!conversation) return;
      const isMember = conversation.participantOneId === userId || conversation.participantTwoId === userId;
      if (!isMember) return;

      socket.to(`conversation:${conversationId}`).emit('typing:update', {
        conversationId,
        userId,
        isTyping: false
      });
    });

    socket.on('disconnect', () => {
      const remainingSessions = markOffline(userId);
      if (remainingSessions === 0 && !isUserOnline(userId)) {
        io.emit('presence:update', { userId, isOnline: false });
      }
    });
  });

  setSocketServer(io);
  return io;
};

module.exports = { initSocket };
