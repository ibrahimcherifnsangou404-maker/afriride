import api from './api';

export const messageService = {
  searchUsers: async (query = '') => {
    const response = await api.get('/messages/users', {
      params: { q: query }
    });
    return response.data;
  },

  getConversations: async () => {
    const response = await api.get('/messages/conversations');
    return response.data;
  },

  createOrGetConversation: async (participantId) => {
    const response = await api.post('/messages/conversations', { participantId });
    return response.data;
  },

  getConversationMessages: async (conversationId, params = {}) => {
    const response = await api.get(`/messages/conversations/${conversationId}/messages`, { params });
    return response.data;
  },

  markConversationAsRead: async (conversationId, messageIds = null) => {
    const payload = Array.isArray(messageIds) ? { messageIds } : {};
    const response = await api.post(`/messages/conversations/${conversationId}/read`, payload);
    return response.data;
  },

  sendMessage: async (conversationId, payload) => {
    if (payload instanceof FormData) {
      const response = await api.post(`/messages/conversations/${conversationId}/messages`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    }

    const response = await api.post(`/messages/conversations/${conversationId}/messages`, { content: payload });
    return response.data;
  },

  deleteMessage: async (messageId, mode = 'me') => {
    const response = await api.delete(`/messages/${messageId}`, {
      params: { mode }
    });
    return response.data;
  },

  reportMessage: async ({ conversationId, messageId = null, reason, details = '' }) => {
    const response = await api.post('/messages/reports', {
      conversationId,
      messageId,
      reason,
      details
    });
    return response.data;
  },

  getBlockedUsers: async () => {
    const response = await api.get('/messages/blocks');
    return response.data;
  },

  blockUser: async (userId) => {
    const response = await api.post('/messages/blocks', { userId });
    return response.data;
  },

  unblockUser: async (userId) => {
    const response = await api.delete(`/messages/blocks/${userId}`);
    return response.data;
  }
};

export default messageService;
