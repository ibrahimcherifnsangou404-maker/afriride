const { Op } = require('sequelize');
const { Conversation, Message, User, Agency, MessageReport, UserBlock } = require('../models');
const { getSocketServer } = require('../services/socketService');
const { uploadMessageAttachment } = require('../services/cloudinaryService');
const { isUserOnline } = require('../services/presenceService');

const SEND_RATE_LIMIT_WINDOW_MS = 10 * 1000;
const SEND_RATE_LIMIT_MAX = 12;
const DELETE_FOR_EVERYONE_WINDOW_MS = 15 * 60 * 1000;
const sendRateLimiter = new Map();

const normalizeParticipants = (idA, idB) => [idA, idB].sort((a, b) => a.localeCompare(b));

const isConversationMember = (conversation, userId) => (
  conversation.participantOneId === userId || conversation.participantTwoId === userId
);

const trimContent = (value) => String(value || '').trim();
const REPORT_REASONS = ['spam', 'abuse', 'harassment', 'fraud', 'other'];
const AUDIO_EXTENSIONS = ['.webm', '.ogg', '.mp3', '.wav', '.m4a', '.aac'];
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg'];

const getBlockedUserIds = async (userId) => {
  const rows = await UserBlock.findAll({
    where: { blockerId: userId },
    attributes: ['blockedId']
  });
  return rows.map((row) => row.blockedId);
};

const isCommunicationBlocked = async (userIdA, userIdB) => {
  const row = await UserBlock.findOne({
    where: {
      [Op.or]: [
        { blockerId: userIdA, blockedId: userIdB },
        { blockerId: userIdB, blockedId: userIdA }
      ]
    }
  });
  return Boolean(row);
};

const canSendMessage = (userId) => {
  const now = Date.now();
  const history = sendRateLimiter.get(userId) || [];
  const recent = history.filter((timestamp) => (now - timestamp) <= SEND_RATE_LIMIT_WINDOW_MS);

  if (recent.length >= SEND_RATE_LIMIT_MAX) {
    sendRateLimiter.set(userId, recent);
    return false;
  }

  recent.push(now);
  sendRateLimiter.set(userId, recent);
  return true;
};

const buildFilenameOrUrlConditions = (field, extensions) => (
  extensions.map((ext) => ({ [field]: { [Op.iLike]: `%${ext}` } }))
);

const buildAttachmentTypeFilter = (rawType) => {
  const type = trimContent(rawType).toLowerCase();
  if (!type || type === 'all') return null;

  if (type === 'text') {
    return {
      [Op.or]: [
        { attachmentUrl: { [Op.is]: null } },
        { attachmentUrl: '' }
      ]
    };
  }

  if (type === 'audio') {
    return {
      [Op.or]: [
        { attachmentType: { [Op.iLike]: 'audio/%' } },
        ...buildFilenameOrUrlConditions('attachmentName', AUDIO_EXTENSIONS),
        ...buildFilenameOrUrlConditions('attachmentUrl', AUDIO_EXTENSIONS)
      ]
    };
  }

  if (type === 'image') {
    return {
      [Op.or]: [
        { attachmentType: { [Op.iLike]: 'image/%' } },
        ...buildFilenameOrUrlConditions('attachmentName', IMAGE_EXTENSIONS),
        ...buildFilenameOrUrlConditions('attachmentUrl', IMAGE_EXTENSIONS)
      ]
    };
  }

  if (type === 'file') {
    return {
      [Op.and]: [
        {
          [Op.or]: [
            { attachmentUrl: { [Op.not]: null } },
            { attachmentName: { [Op.not]: null } }
          ]
        },
        { attachmentType: { [Op.notILike]: 'audio/%' } },
        { attachmentType: { [Op.notILike]: 'image/%' } }
      ]
    };
  }

  return null;
};

const MESSAGE_SAFE_ATTRIBUTES = [
  'id',
  'conversationId',
  'senderId',
  'content',
  'attachmentUrl',
  'attachmentName',
  'attachmentType',
  'attachmentSize',
  'deliveredAt',
  'isDeletedForEveryone',
  'deletedForUserIds',
  'deletedAt',
  'deletedBy',
  'isRead',
  'readAt',
  'createdAt',
  'updatedAt'
];

const isDeletedForUser = (message, userId) => (
  Array.isArray(message?.deletedForUserIds) && message.deletedForUserIds.includes(userId)
);

const canDeleteForEveryone = (message, userId) => {
  if (!message || message.senderId !== userId || message.isDeletedForEveryone) return false;
  const age = Date.now() - new Date(message.createdAt).getTime();
  return age >= 0 && age <= DELETE_FOR_EVERYONE_WINDOW_MS;
};

const mapMessageForUser = (message, userId) => {
  if (!message || isDeletedForUser(message, userId)) return null;

  const payload = message.toJSON ? message.toJSON() : { ...message };
  payload.isDeletedForMe = false;
  payload.canDeleteForEveryone = canDeleteForEveryone(message, userId);

  if (payload.isDeletedForEveryone) {
    payload.content = 'Ce message a ete supprime';
    payload.attachmentUrl = null;
    payload.attachmentName = null;
    payload.attachmentType = null;
    payload.attachmentSize = null;
  }

  return payload;
};

const formatConversation = async (conversation, currentUserId) => {
  const otherParticipant = conversation.participantOneId === currentUserId
    ? conversation.participantTwo
    : conversation.participantOne;

  let lastMessage = null;
  try {
    const rows = await Message.findAll({
      where: { conversationId: conversation.id },
      limit: 30,
      order: [['createdAt', 'DESC']],
      include: [{ model: User, as: 'sender', attributes: ['id', 'firstName', 'lastName'] }]
    });
    lastMessage = rows.find((item) => !isDeletedForUser(item, currentUserId)) || null;
  } catch (_error) {
    const rows = await Message.findAll({
      where: { conversationId: conversation.id },
      attributes: MESSAGE_SAFE_ATTRIBUTES,
      limit: 30,
      order: [['createdAt', 'DESC']],
      include: [{ model: User, as: 'sender', attributes: ['id', 'firstName', 'lastName'] }]
    });
    lastMessage = rows.find((item) => !isDeletedForUser(item, currentUserId)) || null;
  }

  const unreadCount = await Message.count({
    where: {
      conversationId: conversation.id,
      isRead: false,
      isDeletedForEveryone: false,
      senderId: { [Op.ne]: currentUserId }
    }
  });

  const lastMessagePayload = mapMessageForUser(lastMessage, currentUserId);

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
      isOnline: isUserOnline(otherParticipant.id),
      agency: otherParticipant.agency ? {
        id: otherParticipant.agency.id,
        name: otherParticipant.agency.name
      } : null
    } : null,
    lastMessage: lastMessagePayload ? {
      id: lastMessagePayload.id,
      content: lastMessagePayload.content,
      createdAt: lastMessagePayload.createdAt,
      deliveredAt: lastMessagePayload.deliveredAt,
      isRead: lastMessagePayload.isRead,
      readAt: lastMessagePayload.readAt,
      hasAttachment: Boolean(lastMessagePayload.attachmentUrl),
      isDeletedForEveryone: Boolean(lastMessagePayload.isDeletedForEveryone),
      sender: lastMessagePayload.sender
    } : null,
    unreadCount
  };
};

const markMessagesDelivered = async (conversation, receiverId) => {
  const messageIds = await Message.findAll({
    where: {
      conversationId: conversation.id,
      senderId: { [Op.ne]: receiverId },
      isDeletedForEveryone: false,
      deliveredAt: { [Op.is]: null }
    },
    attributes: ['id']
  });

  if (!messageIds.length) {
    return { ids: [], deliveredAt: null };
  }

  const deliveredAt = new Date();
  const ids = messageIds.map((item) => item.id);

  await Message.update(
    { deliveredAt },
    { where: { id: ids } }
  );

  return { ids, deliveredAt };
};

// GET /api/messages/users
const searchUsers = async (req, res) => {
  try {
    const { q = '' } = req.query;
    const blockedUserIds = await getBlockedUserIds(req.user.id);
    const where = { id: { [Op.ne]: req.user.id } };
    if (blockedUserIds.length > 0) {
      where.id = {
        [Op.ne]: req.user.id,
        [Op.notIn]: blockedUserIds
      };
    }

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

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error('Erreur recherche contacts:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche des contacts',
      error: error.message
    });
  }
};

// GET /api/messages/conversations
const getConversations = async (req, res) => {
  try {
    const blockedUserIds = await getBlockedUserIds(req.user.id);
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

    const visibleConversations = conversations.filter((item) => {
      const otherId = item.participantOneId === req.user.id ? item.participantTwoId : item.participantOneId;
      return !blockedUserIds.includes(otherId);
    });

    const data = await Promise.all(visibleConversations.map((item) => formatConversation(item, req.user.id)));
    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    console.error('Erreur recuperation conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recuperation des conversations',
      error: error.message
    });
  }
};

// POST /api/messages/conversations
const createOrGetConversation = async (req, res) => {
  try {
    const { participantId } = req.body;

    if (!participantId) {
      return res.status(400).json({ success: false, message: 'participantId est requis' });
    }

    if (participantId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas demarrer une conversation avec vous-meme'
      });
    }

    const targetUser = await User.findByPk(participantId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
    }

    const blocked = await isCommunicationBlocked(req.user.id, participantId);
    if (blocked) {
      return res.status(403).json({
        success: false,
        message: 'Impossible de demarrer la conversation (utilisateur bloque)'
      });
    }

    const [participantOneId, participantTwoId] = normalizeParticipants(req.user.id, participantId);

    const [conversation, created] = await Conversation.findOrCreate({
      where: { participantOneId, participantTwoId },
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
      message: created ? 'Conversation creee' : 'Conversation existante',
      data
    });
  } catch (error) {
    console.error('Erreur creation conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la creation de la conversation',
      error: error.message
    });
  }
};

// GET /api/messages/conversations/:id/messages?before=<ISO>&limit=25&q=
const getConversationMessages = async (req, res) => {
  try {
    const conversation = await Conversation.findByPk(req.params.id);
    if (!conversation || !isConversationMember(conversation, req.user.id)) {
      return res.status(404).json({ success: false, message: 'Conversation introuvable' });
    }

    const limitRaw = Number.parseInt(req.query.limit, 10);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 50) : 25;

    const filters = [{ conversationId: conversation.id }];
    const before = req.query.before ? new Date(req.query.before) : null;
    const from = req.query.from ? new Date(req.query.from) : null;
    const to = req.query.to ? new Date(req.query.to) : null;
    const createdAt = {};
    if (before && !Number.isNaN(before.getTime())) {
      createdAt[Op.lt] = before;
    }
    if (from && !Number.isNaN(from.getTime())) {
      createdAt[Op.gte] = from;
    }
    if (to && !Number.isNaN(to.getTime())) {
      createdAt[Op.lte] = to;
    }
    if (Object.keys(createdAt).length > 0) {
      filters.push({ createdAt });
    }

    const query = trimContent(req.query.q);
    if (query) {
      filters.push({ content: { [Op.iLike]: `%${query}%` } });
    }

    const attachmentTypeFilter = buildAttachmentTypeFilter(req.query.type);
    if (attachmentTypeFilter) {
      filters.push(attachmentTypeFilter);
    }

    const where = { [Op.and]: filters };

    let rows = [];
    try {
      rows = await Message.findAll({
        where,
        include: [{ model: User, as: 'sender', attributes: ['id', 'firstName', 'lastName', 'role'] }],
        order: [['createdAt', 'DESC']],
        limit
      });
    } catch (_error) {
      rows = await Message.findAll({
        where,
        attributes: MESSAGE_SAFE_ATTRIBUTES,
        include: [{ model: User, as: 'sender', attributes: ['id', 'firstName', 'lastName', 'role'] }],
        order: [['createdAt', 'DESC']],
        limit
      });
    }

    const data = rows
      .reverse()
      .map((item) => mapMessageForUser(item, req.user.id))
      .filter(Boolean);
    const hasMore = rows.length === limit;
    const nextCursor = hasMore && data.length ? data[0].createdAt : null;

    try {
      const delivered = await markMessagesDelivered(conversation, req.user.id);
      if (Array.isArray(delivered?.ids) && delivered.ids.length > 0 && delivered.deliveredAt) {
        const io = getSocketServer();
        if (io) {
          io.to(`conversation:${conversation.id}`).emit('message:delivered', {
            conversationId: conversation.id,
            messageIds: delivered.ids,
            deliveredAt: delivered.deliveredAt.toISOString()
          });
        }
      }
    } catch (deliveryError) {
      // Non bloquant: la conversation doit rester lisible même si la mise à jour de livraison échoue.
      console.warn('Avertissement marquage livraison:', deliveryError.message);
    }

    res.status(200).json({
      success: true,
      count: data.length,
      data,
      pagination: {
        limit,
        hasMore,
        nextCursor
      }
    });
  } catch (error) {
    console.error('Erreur recuperation messages:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recuperation des messages',
      error: error.message
    });
  }
};

// POST /api/messages/conversations/:id/read
const markConversationAsRead = async (req, res) => {
  try {
    const conversation = await Conversation.findByPk(req.params.id);
    if (!conversation || !isConversationMember(conversation, req.user.id)) {
      return res.status(404).json({ success: false, message: 'Conversation introuvable' });
    }

    const { messageIds } = req.body || {};
    const where = {
      conversationId: conversation.id,
      senderId: { [Op.ne]: req.user.id },
      isDeletedForEveryone: false,
      isRead: false
    };

    if (Array.isArray(messageIds) && messageIds.length > 0) {
      where.id = { [Op.in]: messageIds };
    }

    const unreadIncoming = await Message.findAll({ where, attributes: ['id'] });
    if (unreadIncoming.length === 0) {
      return res.status(200).json({ success: true, count: 0, messageIds: [] });
    }

    const ids = unreadIncoming.map((item) => item.id);
    const readAt = new Date();
    await Message.update(
      {
        isRead: true,
        readAt,
        deliveredAt: readAt
      },
      { where: { id: ids } }
    );

    const io = getSocketServer();
    if (io) {
      io.to(`conversation:${conversation.id}`).emit('message:read', {
        conversationId: conversation.id,
        readerId: req.user.id,
        messageIds: ids,
        readAt: readAt.toISOString()
      });
    }

    res.status(200).json({
      success: true,
      count: ids.length,
      messageIds: ids,
      readAt
    });
  } catch (error) {
    console.error('Erreur marquage lu conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du marquage des messages',
      error: error.message
    });
  }
};

// POST /api/messages/conversations/:id/messages
const sendMessage = async (req, res) => {
  try {
    if (!canSendMessage(req.user.id)) {
      return res.status(429).json({
        success: false,
        message: 'Trop de messages envoyes en peu de temps. Reessayez dans quelques secondes.'
      });
    }

    const content = trimContent(req.body.content);
    const attachment = req.file;

    if (!content && !attachment) {
      return res.status(400).json({
        success: false,
        message: 'Le contenu du message ou une piece jointe est requis'
      });
    }

    if (content.length > 4000) {
      return res.status(400).json({
        success: false,
        message: 'Le message est trop long (max 4000 caracteres)'
      });
    }

    const conversation = await Conversation.findByPk(req.params.id);
    if (!conversation || !isConversationMember(conversation, req.user.id)) {
      return res.status(404).json({ success: false, message: 'Conversation introuvable' });
    }

    const recipientId = conversation.participantOneId === req.user.id
      ? conversation.participantTwoId
      : conversation.participantOneId;
    const blocked = await isCommunicationBlocked(req.user.id, recipientId);
    if (blocked) {
      return res.status(403).json({
        success: false,
        message: 'Message bloque: cette communication est desactivee'
      });
    }
    const deliveredAt = isUserOnline(recipientId) ? new Date() : null;

    let uploadedAttachment = null;
    if (attachment) {
      try {
        uploadedAttachment = await uploadMessageAttachment(attachment);
      } catch (err) {
        console.error('Erreur upload Cloudinary:', err);
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de l upload du fichier'
        });
      }
    }

    const message = await Message.create({
      conversationId: conversation.id,
      senderId: req.user.id,
      content: content || null,
      attachmentUrl: uploadedAttachment ? uploadedAttachment.secure_url : null,
      attachmentName: attachment ? attachment.originalname : null,
      attachmentType: attachment ? attachment.mimetype : null,
      attachmentSize: attachment ? attachment.size : null,
      deliveredAt
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

      if (deliveredAt) {
        io.to(`conversation:${conversation.id}`).emit('message:delivered', {
          conversationId: conversation.id,
          messageIds: [hydratedMessage.id],
          deliveredAt: deliveredAt.toISOString()
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Message envoye',
      data: mapMessageForUser(hydratedMessage, req.user.id)
    });
  } catch (error) {
    console.error('Erreur envoi message:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l envoi du message',
      error: error.message
    });
  }
};

// DELETE /api/messages/:messageId?mode=me|everyone
const deleteMessage = async (req, res) => {
  try {
    const mode = String(req.query.mode || req.body?.mode || 'me').toLowerCase();
    if (!['me', 'everyone'].includes(mode)) {
      return res.status(400).json({ success: false, message: 'Mode de suppression invalide' });
    }

    const message = await Message.findByPk(req.params.messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message introuvable' });
    }

    const conversation = await Conversation.findByPk(message.conversationId);
    if (!conversation || !isConversationMember(conversation, req.user.id)) {
      return res.status(404).json({ success: false, message: 'Conversation introuvable' });
    }

    const io = getSocketServer();

    if (mode === 'me') {
      const currentDeletedForUserIds = Array.isArray(message.deletedForUserIds)
        ? message.deletedForUserIds
        : [];
      if (!currentDeletedForUserIds.includes(req.user.id)) {
        message.deletedForUserIds = [...currentDeletedForUserIds, req.user.id];
        await message.save();
      }

      if (io) {
        io.to(`user:${req.user.id}`).emit('message:deleted', {
          conversationId: message.conversationId,
          messageId: message.id,
          mode: 'me',
          userId: req.user.id
        });
      }

      return res.status(200).json({ success: true, message: 'Message supprime pour vous' });
    }

    if (!canDeleteForEveryone(message, req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Suppression pour tout le monde non autorisee'
      });
    }

    message.isDeletedForEveryone = true;
    message.deletedAt = new Date();
    message.deletedBy = req.user.id;
    message.content = null;
    message.attachmentUrl = null;
    message.attachmentName = null;
    message.attachmentType = null;
    message.attachmentSize = null;
    await message.save();

    if (io) {
      io.to(`conversation:${message.conversationId}`).emit('message:deleted', {
        conversationId: message.conversationId,
        messageId: message.id,
        mode: 'everyone',
        deletedAt: message.deletedAt.toISOString(),
        deletedBy: req.user.id
      });
      io.to(`user:${conversation.participantOneId}`).emit('conversation:updated', { conversationId: message.conversationId });
      io.to(`user:${conversation.participantTwoId}`).emit('conversation:updated', { conversationId: message.conversationId });
    }

    return res.status(200).json({ success: true, message: 'Message supprime pour tout le monde' });
  } catch (error) {
    console.error('Erreur suppression message:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du message',
      error: error.message
    });
  }
};

// POST /api/messages/reports
const createMessageReport = async (req, res) => {
  try {
    const { conversationId, messageId = null, reason, details = '' } = req.body || {};

    if (!conversationId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'conversationId et reason sont requis'
      });
    }

    if (!REPORT_REASONS.includes(reason)) {
      return res.status(400).json({
        success: false,
        message: 'Raison de signalement invalide'
      });
    }

    const conversation = await Conversation.findByPk(conversationId);
    if (!conversation || !isConversationMember(conversation, req.user.id)) {
      return res.status(404).json({ success: false, message: 'Conversation introuvable' });
    }

    let reportedUserId = null;
    let safeMessageId = null;

    if (messageId) {
      const message = await Message.findOne({
        where: { id: messageId, conversationId }
      });
      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Message introuvable dans cette conversation'
        });
      }

      if (message.senderId === req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'Vous ne pouvez pas signaler votre propre message'
        });
      }

      reportedUserId = message.senderId;
      safeMessageId = message.id;
    } else {
      reportedUserId = conversation.participantOneId === req.user.id
        ? conversation.participantTwoId
        : conversation.participantOneId;
    }

    const alreadyPending = await MessageReport.findOne({
      where: {
        reporterId: req.user.id,
        conversationId,
        messageId: safeMessageId,
        reason,
        status: 'pending'
      }
    });

    if (alreadyPending) {
      return res.status(409).json({
        success: false,
        message: 'Un signalement similaire est deja en attente'
      });
    }

    const report = await MessageReport.create({
      reporterId: req.user.id,
      reportedUserId,
      conversationId,
      messageId: safeMessageId,
      reason,
      details: trimContent(details) || null
    });

    return res.status(201).json({
      success: true,
      message: 'Signalement envoye avec succes',
      data: report
    });
  } catch (error) {
    console.error('Erreur creation signalement message:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la creation du signalement',
      error: error.message
    });
  }
};

// GET /api/messages/blocks
const getBlockedUsers = async (req, res) => {
  try {
    const rows = await UserBlock.findAll({
      where: { blockerId: req.user.id },
      include: [{ model: User, as: 'blocked', attributes: ['id', 'firstName', 'lastName', 'email', 'role'] }],
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows.map((row) => ({
        id: row.blocked?.id || row.blockedId,
        firstName: row.blocked?.firstName,
        lastName: row.blocked?.lastName,
        email: row.blocked?.email,
        role: row.blocked?.role,
        blockedAt: row.createdAt
      }))
    });
  } catch (error) {
    console.error('Erreur recuperation blocages:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la recuperation des utilisateurs bloques',
      error: error.message
    });
  }
};

// POST /api/messages/blocks
const blockUser = async (req, res) => {
  try {
    const blockedId = String(req.body?.userId || '').trim();
    if (!blockedId) {
      return res.status(400).json({ success: false, message: 'userId est requis' });
    }

    if (blockedId === req.user.id) {
      return res.status(400).json({ success: false, message: 'Vous ne pouvez pas vous bloquer vous-meme' });
    }

    const user = await User.findByPk(blockedId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
    }

    const [row, created] = await UserBlock.findOrCreate({
      where: { blockerId: req.user.id, blockedId }
    });

    return res.status(created ? 201 : 200).json({
      success: true,
      message: created ? 'Utilisateur bloque' : 'Utilisateur deja bloque',
      data: row
    });
  } catch (error) {
    console.error('Erreur blocage utilisateur:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du blocage utilisateur',
      error: error.message
    });
  }
};

// DELETE /api/messages/blocks/:userId
const unblockUser = async (req, res) => {
  try {
    const blockedId = req.params.userId;
    const row = await UserBlock.findOne({
      where: { blockerId: req.user.id, blockedId }
    });

    if (!row) {
      return res.status(404).json({
        success: false,
        message: 'Blocage introuvable'
      });
    }

    await row.destroy();
    return res.status(200).json({
      success: true,
      message: 'Utilisateur debloque'
    });
  } catch (error) {
    console.error('Erreur deblocage utilisateur:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du deblocage utilisateur',
      error: error.message
    });
  }
};

module.exports = {
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
};
