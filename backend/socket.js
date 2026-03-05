const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { User, Conversation } = require('./models');
const { setSocketServer } = require('./services/socketService');

const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
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

    socket.on('join_conversation', async ({ conversationId }) => {
      if (!conversationId) return;
      const conversation = await Conversation.findByPk(conversationId);
      if (!conversation) return;

      const isMember = conversation.participantOneId === userId || conversation.participantTwoId === userId;
      if (!isMember) return;

      socket.join(`conversation:${conversationId}`);
    });

    socket.on('leave_conversation', ({ conversationId }) => {
      if (!conversationId) return;
      socket.leave(`conversation:${conversationId}`);
    });
  });

  setSocketServer(io);
  return io;
};

module.exports = { initSocket };
