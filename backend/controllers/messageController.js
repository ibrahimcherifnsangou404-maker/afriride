const { Op } = require('sequelize');
const { Conversation, Message, User, Agency } = require('../models');
const { getSocketServer } = require('../services/socketService');

const normalizeParticipants = (idA, idB) => {
  return [idA, idB].sort((a, b) => a.localeCompare(b));
};

const isConversationMember = (conversation, userId) => {
  return conversation.participantOneId === userId || conversation.participantTwoId === userId;
};

const formatConversation = async (conversation, currentUserId) => {
  const otherParticipant = conversation.participantOneId === currentUserId
    ? conversation.participantTwo
    : conversation.participantOne;

  const lastMessage = await Message.findOne({
    where: { conversationId: conversation.id },
    order: [['createdAt', 'DESC']],
    include: [{ model: User, as: 'sender', attributes: ['id', 'firstName', 'lastName'] }]
  });

  const unreadCount = await Message.count({
    where: {
      conversationId: conversation.id,
      isRead: false,
      senderId: { [Op.ne]: currentUserId }
    }
  });

  return {
    id: conversation.id,
    lastMessageAt: conversation.lastMessageAt,
    updatedAt: conversation.updatedAt,
    otherParticipant: otherParticipant ? {
      id: otherParticipant.id,
      firstName: otherParticipant.firstName,
      lastName: otherParticipant.lastName,
      email: otherParticipant.email,
      role: otherParticipant.role,
      agency: otherParticipant.agency ? {
        id: otherParticipant.agency.id,
        name: otherParticipant.agency.name
      } : null
    } : null,
    lastMessage: lastMessage ? {
      id: lastMessage.id,
      content: lastMessage.content,
      createdAt: lastMessage.createdAt,
      sender: lastMessage.sender
    } : null,
    unreadCount
  };
};

// @desc    Rechercher des contacts pour démarrer une conversation
// @route   GET /api/messages/users
// @access  Private
const searchUsers = async (req, res) => {
  try {
    const { q = '' } = req.query;
    const where = {
      id: { [Op.ne]: req.user.id }
    };

    if (req.user.role === 'client') {
      where.role = { [Op.in]: ['manager', 'admin'] };
    }

    if (q.trim()) {
      const pattern = `%${q.trim()}%`;
      where[Op.or] = [
        { firstName: { [Op.like]: pattern } },
        { lastName: { [Op.like]: pattern } },
        { email: { [Op.like]: pattern } }
      ];
    }

    const users = await User.findAll({
      where,
      attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
      include: [{ model: Agency, as: 'agency', attributes: ['id', 'name'], required: false }],
      order: [['firstName', 'ASC']],
      limit: 30
    });

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Erreur recherche contacts:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche des contacts',
      error: error.message
    });
  }
};

// @desc    Récupérer mes conversations
// @route   GET /api/messages/conversations
// @access  Private
const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.findAll({
      where: {
        [Op.or]: [
          { participantOneId: req.user.id },
          { participantTwoId: req.user.id }
        ]
      },
      include: [
        {
          model: User,
          as: 'participantOne',
          attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
          include: [{ model: Agency, as: 'agency', attributes: ['id', 'name'], required: false }]
        },
        {
          model: User,
          as: 'participantTwo',
          attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
          include: [{ model: Agency, as: 'agency', attributes: ['id', 'name'], required: false }]
        }
      ],
      order: [['lastMessageAt', 'DESC']]
    });

    const data = await Promise.all(
      conversations.map((conversation) => formatConversation(conversation, req.user.id))
    );

    res.status(200).json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    console.error('Erreur récupération conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des conversations',
      error: error.message
    });
  }
};

// @desc    Créer une conversation ou renvoyer l'existante
// @route   POST /api/messages/conversations
// @access  Private
const createOrGetConversation = async (req, res) => {
  try {
    const { participantId } = req.body;

    if (!participantId) {
      return res.status(400).json({
        success: false,
        message: 'participantId est requis'
      });
    }

    if (participantId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas démarrer une conversation avec vous-même'
      });
    }

    const targetUser = await User.findByPk(participantId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur introuvable'
      });
    }

    const [participantOneId, participantTwoId] = normalizeParticipants(req.user.id, participantId);

    const [conversation, created] = await Conversation.findOrCreate({
      where: {
        participantOneId,
        participantTwoId
      },
      defaults: {
        participantOneId,
        participantTwoId,
        lastMessageAt: new Date()
      }
    });

    const hydratedConversation = await Conversation.findByPk(conversation.id, {
      include: [
        {
          model: User,
          as: 'participantOne',
          attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
          include: [{ model: Agency, as: 'agency', attributes: ['id', 'name'], required: false }]
        },
        {
          model: User,
          as: 'participantTwo',
          attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
          include: [{ model: Agency, as: 'agency', attributes: ['id', 'name'], required: false }]
        }
      ]
    });

    const data = await formatConversation(hydratedConversation, req.user.id);

    res.status(created ? 201 : 200).json({
      success: true,
      message: created ? 'Conversation créée' : 'Conversation existante',
      data
    });
  } catch (error) {
    console.error('Erreur création conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la conversation',
      error: error.message
    });
  }
};

// @desc    Récupérer les messages d'une conversation
// @route   GET /api/messages/conversations/:id/messages
// @access  Private
const getConversationMessages = async (req, res) => {
  try {
    const conversation = await Conversation.findByPk(req.params.id);
    if (!conversation || !isConversationMember(conversation, req.user.id)) {
      return res.status(404).json({
        success: false,
        message: 'Conversation introuvable'
      });
    }

    const unreadIncoming = await Message.findAll({
      where: {
        conversationId: conversation.id,
        senderId: { [Op.ne]: req.user.id },
        isRead: false
      },
      attributes: ['id']
    });

    const readAt = new Date();
    if (unreadIncoming.length > 0) {
      await Message.update(
        { isRead: true, readAt },
        {
          where: {
            id: unreadIncoming.map((item) => item.id)
          }
        }
      );

      const io = getSocketServer();
      if (io) {
        io.to(`conversation:${conversation.id}`).emit('message:read', {
          conversationId: conversation.id,
          readerId: req.user.id,
          messageIds: unreadIncoming.map((item) => item.id),
          readAt: readAt.toISOString()
        });
      }
    }

    const messages = await Message.findAll({
      where: { conversationId: conversation.id },
      include: [{ model: User, as: 'sender', attributes: ['id', 'firstName', 'lastName', 'role'] }],
      order: [['createdAt', 'ASC']]
    });

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    console.error('Erreur récupération messages:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des messages',
      error: error.message
    });
  }
};

// @desc    Envoyer un message
// @route   POST /api/messages/conversations/:id/messages
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { content } = req.body;
    const trimmedContent = (content || '').trim();

    if (!trimmedContent) {
      return res.status(400).json({
        success: false,
        message: 'Le contenu du message est requis'
      });
    }

    const conversation = await Conversation.findByPk(req.params.id);
    if (!conversation || !isConversationMember(conversation, req.user.id)) {
      return res.status(404).json({
        success: false,
        message: 'Conversation introuvable'
      });
    }

    const message = await Message.create({
      conversationId: conversation.id,
      senderId: req.user.id,
      content: trimmedContent
    });

    conversation.lastMessageAt = new Date();
    await conversation.save();

    const hydratedMessage = await Message.findByPk(message.id, {
      include: [{ model: User, as: 'sender', attributes: ['id', 'firstName', 'lastName', 'role'] }]
    });

    const io = getSocketServer();
    if (io) {
      io.to(`conversation:${conversation.id}`).emit('message:new', hydratedMessage);
      io.to(`user:${conversation.participantOneId}`).emit('conversation:updated', { conversationId: conversation.id });
      io.to(`user:${conversation.participantTwoId}`).emit('conversation:updated', { conversationId: conversation.id });
    }

    res.status(201).json({
      success: true,
      message: 'Message envoyé',
      data: hydratedMessage
    });
  } catch (error) {
    console.error('Erreur envoi message:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi du message',
      error: error.message
    });
  }
};

module.exports = {
  searchUsers,
  getConversations,
  createOrGetConversation,
  getConversationMessages,
  sendMessage
};
