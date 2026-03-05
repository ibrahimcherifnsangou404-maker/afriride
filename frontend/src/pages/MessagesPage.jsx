import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MessageCircle, Search, Send, UserRound } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Button, Card, EmptyState, Loading } from '../components/UI';
import { messageService } from '../services/messageService';
import { connectSocket, disconnectSocket } from '../services/socket';

const formatDateTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleString();
};

const formatTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

function MessagesPage() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeConversationId, setActiveConversationId] = useState('');
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [messageLoading, setMessageLoading] = useState(false);
  const [conversationSearch, setConversationSearch] = useState('');
  const [conversationFilter, setConversationFilter] = useState(searchParams.get('filter') === 'unread' ? 'unread' : 'all');
  const endRef = useRef(null);
  const socketRef = useRef(null);
  const joinedConversationRef = useRef('');
  const currentUserId = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}')?.id || '';
    } catch {
      return '';
    }
  }, []);

  const activeConversation = useMemo(
    () => conversations.find((item) => item.id === activeConversationId) || null,
    [conversations, activeConversationId]
  );

  const totalUnread = useMemo(
    () => conversations.reduce((sum, conversation) => sum + (conversation.unreadCount || 0), 0),
    [conversations]
  );

  const filteredConversations = useMemo(() => {
    const query = conversationSearch.trim().toLowerCase();

    return conversations.filter((conversation) => {
      if (conversationFilter === 'unread' && (conversation.unreadCount || 0) === 0) {
        return false;
      }

      if (!query) return true;

      const fullName = `${conversation.otherParticipant?.firstName || ''} ${conversation.otherParticipant?.lastName || ''}`.toLowerCase();
      const preview = (conversation.lastMessage?.content || '').toLowerCase();
      return fullName.includes(query) || preview.includes(query);
    });
  }, [conversations, conversationFilter, conversationSearch]);

  const scrollToBottom = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const loadConversations = useCallback(async () => {
    const response = await messageService.getConversations();
    const list = response.data || [];
    setConversations(list);
    if (!activeConversationId && list.length > 0) {
      setActiveConversationId(list[0].id);
    }
  }, [activeConversationId]);

  const loadContacts = useCallback(async (query = '') => {
    const response = await messageService.searchUsers(query);
    setContacts(response.data || []);
  }, []);

  const loadMessages = useCallback(async (conversationId) => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    setMessageLoading(true);
    setError('');
    try {
      const response = await messageService.getConversationMessages(conversationId);
      setMessages(response.data || []);
      setTimeout(scrollToBottom, 50);
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de charger les messages');
    } finally {
      setMessageLoading(false);
    }
  }, [scrollToBottom]);

  const initialize = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await Promise.all([loadConversations(), loadContacts('')]);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de chargement de la messagerie');
    } finally {
      setLoading(false);
    }
  }, [loadConversations, loadContacts]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadContacts(searchTerm);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm, loadContacts]);

  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId);
    }
  }, [activeConversationId, loadMessages]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return undefined;

    const socket = connectSocket(token);
    socketRef.current = socket;
    if (!socket) return undefined;

    const onNewMessage = async (incomingMessage) => {
      if (incomingMessage.conversationId === activeConversationId) {
        setMessages((prev) => {
          if (prev.some((item) => item.id === incomingMessage.id)) return prev;
          return [...prev, incomingMessage];
        });
        setTimeout(scrollToBottom, 50);

        // Si la conversation est ouverte et le message vient de l'autre participant,
        // on recharge pour marquer automatiquement en "lu" côté backend.
        if (incomingMessage.senderId !== currentUserId) {
          await loadMessages(activeConversationId);
        }
      }

      await loadConversations();
    };

    const onMessageRead = ({ messageIds = [], readAt }) => {
      if (!Array.isArray(messageIds) || messageIds.length === 0) return;
      setMessages((prev) => prev.map((message) => (
        messageIds.includes(message.id)
          ? { ...message, isRead: true, readAt: readAt || message.readAt }
          : message
      )));
      loadConversations();
    };

    const onConversationUpdated = () => {
      loadConversations();
    };

    socket.on('message:new', onNewMessage);
    socket.on('message:read', onMessageRead);
    socket.on('conversation:updated', onConversationUpdated);

    return () => {
      socket.off('message:new', onNewMessage);
      socket.off('message:read', onMessageRead);
      socket.off('conversation:updated', onConversationUpdated);
      disconnectSocket();
      socketRef.current = null;
    };
  }, [activeConversationId, currentUserId, loadConversations, loadMessages, scrollToBottom]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    if (joinedConversationRef.current && joinedConversationRef.current !== activeConversationId) {
      socket.emit('leave_conversation', { conversationId: joinedConversationRef.current });
      joinedConversationRef.current = '';
    }

    if (activeConversationId) {
      socket.emit('join_conversation', { conversationId: activeConversationId });
      joinedConversationRef.current = activeConversationId;
    }
  }, [activeConversationId]);

  const handleStartConversation = async (participantId) => {
    try {
      setError('');
      const response = await messageService.createOrGetConversation(participantId);
      const conversation = response.data;
      await loadConversations();
      setActiveConversationId(conversation.id);
      await loadMessages(conversation.id);
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de démarrer la conversation');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!draft.trim() || !activeConversationId || sending) return;

    setSending(true);
    setError('');
    try {
      const response = await messageService.sendMessage(activeConversationId, draft.trim());
      const newMessage = response.data;
      setDraft('');
      setMessages((prev) => {
        if (prev.some((item) => item.id === newMessage.id)) return prev;
        return [...prev, newMessage];
      });
      setTimeout(scrollToBottom, 50);
      await loadConversations();
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible d\'envoyer le message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Messagerie interne</h1>
          <p className="mt-2 text-slate-600">Échangez directement entre clients, agences et administration.</p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <Card className="p-10">
            <Loading />
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-4 p-4 md:p-5 h-[70vh] overflow-hidden flex flex-col" hover={false}>
              <div className="mb-4">
                <label htmlFor="contact-search" className="text-sm font-semibold text-slate-700">
                  Démarrer une conversation
                </label>
                <div className="relative mt-2">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="contact-search"
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Rechercher un contact..."
                    className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Contacts</p>
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {contacts.length === 0 && (
                    <p className="text-sm text-slate-500">Aucun contact trouvé</p>
                  )}
                  {contacts.map((contact) => (
                    <button
                      key={contact.id}
                      type="button"
                      onClick={() => handleStartConversation(contact.id)}
                      className="w-full text-left px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50"
                    >
                      <p className="text-sm font-semibold text-slate-900">{contact.firstName} {contact.lastName}</p>
                      <p className="text-xs text-slate-600">{contact.role}{contact.agency?.name ? ` - ${contact.agency.name}` : ''}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="min-h-0 flex-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Conversations</p>
                  <span className="text-xs font-semibold text-slate-600">{totalUnread} non lu(s)</span>
                </div>
                <div className="mb-3 space-y-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={conversationSearch}
                      onChange={(e) => setConversationSearch(e.target.value)}
                      placeholder="Rechercher une conversation..."
                      className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setConversationFilter('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${conversationFilter === 'all' ? 'bg-primary-50 text-primary-700 border-primary-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                    >
                      Toutes
                    </button>
                    <button
                      type="button"
                      onClick={() => setConversationFilter('unread')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${conversationFilter === 'unread' ? 'bg-primary-50 text-primary-700 border-primary-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                    >
                      Non lues
                    </button>
                  </div>
                </div>
                <div className="space-y-2 h-full overflow-y-auto pr-1">
                  {filteredConversations.length === 0 ? (
                    <p className="text-sm text-slate-500">{conversationFilter === 'unread' ? 'Aucune conversation non lue' : 'Aucune conversation'}</p>
                  ) : filteredConversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => setActiveConversationId(conversation.id)}
                      className={`w-full text-left px-3 py-3 rounded-xl border transition-colors ${
                        activeConversationId === conversation.id
                          ? 'border-primary-300 bg-primary-50'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {conversation.otherParticipant?.firstName} {conversation.otherParticipant?.lastName}
                          </p>
                          <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">
                            {conversation.lastMessage?.content || 'Conversation créée'}
                          </p>
                        </div>
                        {conversation.unreadCount > 0 && (
                          <span className="min-w-6 h-6 px-1 rounded-full bg-primary-600 text-white text-xs font-semibold inline-flex items-center justify-center">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            <Card className="lg:col-span-8 p-0 h-[70vh] overflow-hidden flex flex-col" hover={false}>
              {!activeConversation ? (
                <div className="h-full flex items-center justify-center p-8">
                  <EmptyState
                    icon={MessageCircle}
                    title="Sélectionnez une conversation"
                    message="Choisissez un contact ou une conversation existante pour démarrer."
                  />
                </div>
              ) : (
                <>
                  <div className="px-5 py-4 border-b border-slate-200 bg-white">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center">
                        <UserRound className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">
                          {activeConversation.otherParticipant?.firstName} {activeConversation.otherParticipant?.lastName}
                        </p>
                        <p className="text-xs text-slate-600">
                          {activeConversation.otherParticipant?.role}
                          {activeConversation.otherParticipant?.agency?.name
                            ? ` - ${activeConversation.otherParticipant.agency.name}`
                            : ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto bg-slate-50 px-5 py-4 space-y-3">
                    {messageLoading ? (
                      <Loading size="sm" />
                    ) : messages.length === 0 ? (
                      <p className="text-sm text-slate-500">Aucun message pour le moment.</p>
                    ) : messages.map((message) => {
                      const mine = message.senderId === currentUserId;
                      return (
                        <div
                          key={message.id}
                          className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm ${
                              mine ? 'bg-primary-600 text-white' : 'bg-white border border-slate-200 text-slate-900'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                            <div className={`mt-1 text-[11px] ${mine ? 'text-primary-100' : 'text-slate-500'}`}>
                              <span>{formatDateTime(message.createdAt)}</span>
                              {mine && (
                                <span className="ml-2 font-semibold">
                                  {message.isRead
                                    ? `Lu${message.readAt ? ` a ${formatTime(message.readAt)}` : ''}`
                                    : 'Envoye'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={endRef} />
                  </div>

                  <form onSubmit={handleSendMessage} className="border-t border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        placeholder="Écrivez votre message..."
                        className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <Button type="submit" disabled={sending || !draft.trim()} className="h-11 px-5">
                        <Send className="w-4 h-4 mr-2" />
                        Envoyer
                      </Button>
                    </div>
                  </form>
                </>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

export default MessagesPage;
