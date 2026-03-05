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

  getConversationMessages: async (conversationId) => {
    const response = await api.get(`/messages/conversations/${conversationId}/messages`);
    return response.data;
  },

  sendMessage: async (conversationId, content) => {
    const response = await api.post(`/messages/conversations/${conversationId}/messages`, { content });
    return response.data;
  }
};

export default messageService;
