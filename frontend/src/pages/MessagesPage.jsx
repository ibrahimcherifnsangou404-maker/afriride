import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Archive, Ban, MessageCircle, Mic, MoreVertical, Paperclip, Search, Send, SlidersHorizontal, Square, Star, Trash2, UserRound, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Button, Card, EmptyState, Loading } from '../components/UI';
import ErrorBoundary from '../components/ErrorBoundary';
import { messageService } from '../services/messageService';
import { API_BASE_URL } from '../services/api';
import { connectSocket } from '../services/socket';

const PINNED_STORAGE_KEY = 'messages:pinned_conversations';
const ARCHIVED_STORAGE_KEY = 'messages:archived_conversations';

const formatDateTime = (date) => (date ? new Date(date).toLocaleString() : '');
const formatTime = (date) => (date ? new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');
const safeText = (value) => (value == null ? '' : String(value));
const getInitials = (firstName, lastName) => {
  const first = safeText(firstName).trim().charAt(0);
  const last = safeText(lastName).trim().charAt(0);
  return `${first}${last}`.toUpperCase() || '?';
};
const getAttachmentUrl = (path) => {
  if (!path) return '';
  return path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
};
const isAudioAttachment = (message) => {
  const mime = String(message?.attachmentType || '').toLowerCase();
  const name = String(message?.attachmentName || message?.attachmentUrl || '').toLowerCase();
  return mime.startsWith('audio/') || /\.(webm|ogg|mp3|wav|m4a|aac)$/.test(name);
};
const mergeUniqueMessages = (list) => {
  const seen = new Set();
  const result = [];
  list.forEach((item) => {
    if (!item?.id || seen.has(item.id)) return;
    seen.add(item.id);
    result.push(item);
  });
  return result;
};
const REPORT_REASON_OPTIONS = ['spam', 'abuse', 'harassment', 'fraud', 'other'];

function MessagesPage() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeConversationId, setActiveConversationId] = useState('');
  const [messages, setMessages] = useState([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [draft, setDraft] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [sending, setSending] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState('');
  const [openMessageMenuId, setOpenMessageMenuId] = useState('');
  const [openConversationMenu, setOpenConversationMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState('');
  const [messageLoading, setMessageLoading] = useState(false);
  const [conversationSearch, setConversationSearch] = useState('');
  const [messageSearch, setMessageSearch] = useState('');
  const [messageTypeFilter, setMessageTypeFilter] = useState('all');
  const [messageDateFrom, setMessageDateFrom] = useState('');
  const [messageDateTo, setMessageDateTo] = useState('');
  const [showMessageFilters, setShowMessageFilters] = useState(false);
  const [blockedUserIds, setBlockedUserIds] = useState([]);
  const [conversationFilter, setConversationFilter] = useState(searchParams.get('filter') === 'unread' ? 'unread' : 'all');
  const [typingByConversation, setTypingByConversation] = useState({});
  const [incomingNotice, setIncomingNotice] = useState('');
  const [pinnedConversationIds, setPinnedConversationIds] = useState(() => {
    try {
      const raw = localStorage.getItem(PINNED_STORAGE_KEY);
      const parsed = JSON.parse(raw || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [archivedConversationIds, setArchivedConversationIds] = useState(() => {
    try {
      const raw = localStorage.getItem(ARCHIVED_STORAGE_KEY);
      const parsed = JSON.parse(raw || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingStreamRef = useRef(null);
  const recordingChunksRef = useRef([]);
  const messagesContainerRef = useRef(null);
  const endRef = useRef(null);
  const socketRef = useRef(null);
  const joinedConversationRef = useRef('');
  const deepLinkHandledRef = useRef(false);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

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
  const activeOtherUserId = activeConversation?.otherParticipant?.id || '';
  const isActiveUserBlocked = Boolean(activeOtherUserId && blockedUserIds.includes(activeOtherUserId));

  const typingUsers = useMemo(() => {
    const bucket = typingByConversation[activeConversationId] || {};
    return Object.keys(bucket).filter((id) => bucket[id] && id !== currentUserId);
  }, [typingByConversation, activeConversationId, currentUserId]);
  const typingLabel = useMemo(() => {
    if (typingUsers.length === 0) return '';
    const firstName = safeText(activeConversation?.otherParticipant?.firstName);
    const lastName = safeText(activeConversation?.otherParticipant?.lastName);
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || 'Votre correspondant';
  }, [typingUsers, activeConversation]);

  const totalUnread = useMemo(
    () => conversations.reduce((sum, conversation) => sum + (conversation.unreadCount || 0), 0),
    [conversations]
  );
  const activeMessageFilterCount = useMemo(() => (
    (messageTypeFilter !== 'all' ? 1 : 0)
    + (messageDateFrom ? 1 : 0)
    + (messageDateTo ? 1 : 0)
  ), [messageTypeFilter, messageDateFrom, messageDateTo]);

  const filteredConversations = useMemo(() => {
    const query = conversationSearch.trim().toLowerCase();

    return [...conversations]
      .filter((conversation) => {
        const isArchived = archivedConversationIds.includes(conversation.id);
        if (conversationFilter !== 'archived' && isArchived) return false;
        if (conversationFilter === 'archived' && !isArchived) return false;
        if (conversationFilter === 'unread' && (conversation.unreadCount || 0) === 0) return false;
        if (conversationFilter === 'pinned' && !pinnedConversationIds.includes(conversation.id)) return false;
        if (!query) return true;

        const fullName = `${conversation.otherParticipant?.firstName || ''} ${conversation.otherParticipant?.lastName || ''}`.toLowerCase();
        const preview = (conversation.lastMessage?.content || '').toLowerCase();
        return fullName.includes(query) || preview.includes(query);
      })
      .sort((a, b) => {
        const aPinned = pinnedConversationIds.includes(a.id) ? 1 : 0;
        const bPinned = pinnedConversationIds.includes(b.id) ? 1 : 0;
        if (aPinned !== bPinned) return bPinned - aPinned;
        return new Date(b.lastMessageAt || b.updatedAt).getTime() - new Date(a.lastMessageAt || a.updatedAt).getTime();
      });
  }, [conversations, conversationFilter, conversationSearch, pinnedConversationIds, archivedConversationIds]);

  useEffect(() => {
    localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(pinnedConversationIds));
  }, [pinnedConversationIds]);
  useEffect(() => {
    localStorage.setItem(ARCHIVED_STORAGE_KEY, JSON.stringify(archivedConversationIds));
  }, [archivedConversationIds]);

  useEffect(() => {
    if (!incomingNotice) return undefined;
    const timer = setTimeout(() => setIncomingNotice(''), 4000);
    return () => clearTimeout(timer);
  }, [incomingNotice]);

  useEffect(() => {
    if (!openMessageMenuId && !openConversationMenu) return undefined;
    const onDocumentClick = () => {
      setOpenMessageMenuId('');
      setOpenConversationMenu(false);
    };
    document.addEventListener('click', onDocumentClick);
    return () => document.removeEventListener('click', onDocumentClick);
  }, [openMessageMenuId, openConversationMenu]);

  const scrollToBottom = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const stopTyping = useCallback(() => {
    const socket = socketRef.current;
    if (socket && activeConversationId && isTypingRef.current) {
      socket.emit('typing:stop', { conversationId: activeConversationId });
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    isTypingRef.current = false;
  }, [activeConversationId]);

  const startTyping = useCallback(() => {
    const socket = socketRef.current;
    if (!socket || !activeConversationId) return;

    if (!isTypingRef.current) {
      socket.emit('typing:start', { conversationId: activeConversationId });
      isTypingRef.current = true;
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => stopTyping(), 1200);
  }, [activeConversationId, stopTyping]);

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

  const loadBlockedUsers = useCallback(async () => {
    const response = await messageService.getBlockedUsers();
    setBlockedUserIds((response.data || []).map((item) => item.id));
  }, []);

  const buildMessageQueryParams = useCallback(() => {
    const params = {};
    if (messageSearch.trim()) params.q = messageSearch.trim();
    if (messageTypeFilter && messageTypeFilter !== 'all') params.type = messageTypeFilter;
    if (messageDateFrom) params.from = `${messageDateFrom}T00:00:00.000Z`;
    if (messageDateTo) params.to = `${messageDateTo}T23:59:59.999Z`;
    return params;
  }, [messageSearch, messageTypeFilter, messageDateFrom, messageDateTo]);

  const loadMessages = useCallback(async (conversationId, options = {}) => {
    if (!conversationId) {
      setMessages([]);
      setHasMoreMessages(false);
      setNextCursor(null);
      return;
    }

    const { appendOlder = false, before = null } = options;
    if (appendOlder) setLoadingMore(true);
    else setMessageLoading(true);

    try {
      const response = await messageService.getConversationMessages(conversationId, {
        limit: 40,
        before: before || undefined,
        ...buildMessageQueryParams()
      });

      const batch = response.data || [];
      const pagination = response.pagination || {};

      if (appendOlder) {
        setMessages((prev) => mergeUniqueMessages([...batch, ...prev]));
      } else {
        setMessages(mergeUniqueMessages(batch));
        setTimeout(scrollToBottom, 50);
      }

      setHasMoreMessages(Boolean(pagination.hasMore));
      setNextCursor(pagination.nextCursor || null);
      await messageService.markConversationAsRead(conversationId);
      await loadConversations();
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de charger les messages');
    } finally {
      if (appendOlder) setLoadingMore(false);
      else setMessageLoading(false);
    }
  }, [buildMessageQueryParams, loadConversations, scrollToBottom]);

  const initialize = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await Promise.all([loadConversations(), loadContacts(''), loadBlockedUsers()]);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de chargement de la messagerie');
    } finally {
      setLoading(false);
    }
  }, [loadConversations, loadContacts, loadBlockedUsers]);

  useEffect(() => { initialize(); }, [initialize]);

  useEffect(() => {
    const timer = setTimeout(() => loadContacts(searchTerm), 250);
    return () => clearTimeout(timer);
  }, [searchTerm, loadContacts]);

  useEffect(() => {
    if (!activeConversationId) return undefined;
    const timer = setTimeout(() => {
      loadMessages(activeConversationId);
    }, 200);
    return () => clearTimeout(timer);
  }, [activeConversationId, messageSearch, messageTypeFilter, messageDateFrom, messageDateTo, loadMessages]);

  useEffect(() => {
    if (loading || deepLinkHandledRef.current) return;

    const conversationId = searchParams.get('conversationId');
    const participantId = searchParams.get('participantId');
    const agencyId = searchParams.get('agencyId');
    const prefill = searchParams.get('prefill');

    const openByParticipantId = async (targetParticipantId) => {
      try {
        const response = await messageService.createOrGetConversation(targetParticipantId);
        const conversation = response.data;
        await loadConversations();
        setActiveConversationId(conversation.id);
        if (prefill) setDraft((prev) => prev || prefill);
      } catch (err) {
        setError(err.response?.data?.message || 'Impossible de demarrer la conversation');
      } finally {
        deepLinkHandledRef.current = true;
      }
    };

    if (conversationId) {
      setActiveConversationId(conversationId);
      if (prefill) setDraft((prev) => prev || prefill);
      deepLinkHandledRef.current = true;
      return;
    }

    if (participantId) {
      openByParticipantId(participantId);
      return;
    }

    if (agencyId) {
      const agencyContacts = contacts.filter((contact) => contact?.agency?.id === agencyId);
      const managerContact = agencyContacts.find((contact) => contact.role === 'manager');
      const targetContact = managerContact || agencyContacts[0];

      if (targetContact?.id) {
        openByParticipantId(targetContact.id);
      } else {
        setError('Aucun contact de cette agence n est disponible pour le moment');
        deepLinkHandledRef.current = true;
      }
      return;
    }

    deepLinkHandledRef.current = true;
  }, [loading, searchParams, contacts, loadConversations]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return undefined;

    const socket = connectSocket(token);
    socketRef.current = socket;
    if (!socket) return undefined;

    const onNewMessage = async (incomingMessage) => {
      if (incomingMessage.conversationId === activeConversationId) {
        setMessages((prev) => mergeUniqueMessages([...prev, incomingMessage]));
        setTimeout(scrollToBottom, 50);
        if (incomingMessage.senderId !== currentUserId) {
          await messageService.markConversationAsRead(activeConversationId);
        }
      } else if (incomingMessage.senderId !== currentUserId) {
        setIncomingNotice('Nouveau message recu');
        if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('AfriRide - Nouveau message', {
            body: incomingMessage.content || 'Piece jointe recue'
          });
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

    const onMessageDelivered = ({ messageIds = [], deliveredAt }) => {
      if (!Array.isArray(messageIds) || messageIds.length === 0) return;
      setMessages((prev) => prev.map((message) => (
        messageIds.includes(message.id)
          ? { ...message, deliveredAt: deliveredAt || message.deliveredAt }
          : message
      )));
    };

    const onMessageDeleted = ({ messageId, mode, userId }) => {
      if (!messageId) return;
      setMessages((prev) => {
        if (mode === 'me' && userId === currentUserId) {
          return prev.filter((item) => item.id !== messageId);
        }
        if (mode === 'everyone') {
          return prev.map((item) => (
            item.id === messageId
              ? {
                ...item,
                content: 'Ce message a ete supprime',
                attachmentUrl: null,
                attachmentName: null,
                attachmentType: null,
                attachmentSize: null,
                isDeletedForEveryone: true,
                canDeleteForEveryone: false
              }
              : item
          ));
        }
        return prev;
      });
      loadConversations();
    };

    const onTypingUpdate = ({ conversationId, userId, isTyping }) => {
      setTypingByConversation((prev) => ({
        ...prev,
        [conversationId]: {
          ...(prev[conversationId] || {}),
          [userId]: Boolean(isTyping)
        }
      }));
    };

    const onPresenceUpdate = ({ userId, isOnline }) => {
      setConversations((prev) => prev.map((conversation) => (
        conversation.otherParticipant?.id === userId
          ? { ...conversation, otherParticipant: { ...conversation.otherParticipant, isOnline: Boolean(isOnline) } }
          : conversation
      )));
    };

    const onConversationUpdated = () => loadConversations();

    socket.on('message:new', onNewMessage);
    socket.on('message:read', onMessageRead);
    socket.on('message:delivered', onMessageDelivered);
    socket.on('message:deleted', onMessageDeleted);
    socket.on('typing:update', onTypingUpdate);
    socket.on('presence:update', onPresenceUpdate);
    socket.on('conversation:updated', onConversationUpdated);
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => { });
    }

    return () => {
      socket.off('message:new', onNewMessage);
      socket.off('message:read', onMessageRead);
      socket.off('message:delivered', onMessageDelivered);
      socket.off('message:deleted', onMessageDeleted);
      socket.off('typing:update', onTypingUpdate);
      socket.off('presence:update', onPresenceUpdate);
      socket.off('conversation:updated', onConversationUpdated);
      socketRef.current = null;
    };
  }, [activeConversationId, currentUserId, loadConversations, scrollToBottom]);

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

  useEffect(() => () => stopTyping(), [stopTyping]);
  useEffect(() => () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recordingStreamRef.current) {
      recordingStreamRef.current.getTracks().forEach((track) => track.stop());
      recordingStreamRef.current = null;
    }
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!draft.trim() && !attachment) || !activeConversationId || sending) return;

    setSending(true);
    setError('');

    try {
      let response;
      if (attachment) {
        const formData = new FormData();
        formData.append('content', draft.trim());
        formData.append('attachment', attachment);
        response = await messageService.sendMessage(activeConversationId, formData);
      } else {
        response = await messageService.sendMessage(activeConversationId, draft.trim());
      }

      const newMessage = response.data;
      setDraft('');
      setAttachment(null);
      stopTyping();
      setMessages((prev) => mergeUniqueMessages([...prev, newMessage]));
      setTimeout(scrollToBottom, 50);
      await loadConversations();
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible d envoyer le message');
    } finally {
      setSending(false);
    }
  };

  const handleTextareaKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleStartConversation = async (participantId) => {
    try {
      setError('');
      const response = await messageService.createOrGetConversation(participantId);
      const conversation = response.data;
      await loadConversations();
      setActiveConversationId(conversation.id);
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de demarrer la conversation');
    }
  };

  const handleAttachmentChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setAttachment(file);
  };

  const startVoiceRecording = async () => {
    if (isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStreamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      recordingChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordingChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordingChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        if (blob.size > 0) {
          const extension = blob.type.includes('ogg') ? 'ogg' : blob.type.includes('mp4') ? 'm4a' : 'webm';
          const file = new File([blob], `voice-${Date.now()}.${extension}`, { type: blob.type || 'audio/webm' });
          setAttachment(file);
        }

        if (recordingStreamRef.current) {
          recordingStreamRef.current.getTracks().forEach((track) => track.stop());
          recordingStreamRef.current = null;
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setError('');
    } catch {
      setError('Impossible de demarrer l enregistrement audio');
    }
  };

  const stopVoiceRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;
    recorder.stop();
    setIsRecording(false);
  };

  const handleLoadOlder = async () => {
    if (!activeConversationId || !hasMoreMessages || loadingMore) return;
    const container = messagesContainerRef.current;
    const previousHeight = container?.scrollHeight || 0;
    await loadMessages(activeConversationId, { appendOlder: true, before: nextCursor });
    setTimeout(() => {
      if (!container) return;
      const newHeight = container.scrollHeight;
      container.scrollTop += Math.max(0, newHeight - previousHeight);
    }, 0);
  };

  const handleDeleteMessage = async (messageId, mode) => {
    if (!messageId || deletingMessageId) return;
    if (mode === 'everyone') {
      const confirmed = window.confirm('Supprimer ce message pour tout le monde ?');
      if (!confirmed) return;
    }
    try {
      setDeletingMessageId(messageId);
      setOpenMessageMenuId('');
      await messageService.deleteMessage(messageId, mode);
      if (mode === 'me') {
        setMessages((prev) => prev.filter((item) => item.id !== messageId));
      } else {
        setMessages((prev) => prev.map((item) => (
          item.id === messageId
            ? {
              ...item,
              content: 'Ce message a ete supprime',
              attachmentUrl: null,
              attachmentName: null,
              attachmentType: null,
              attachmentSize: null,
              isDeletedForEveryone: true,
              canDeleteForEveryone: false
            }
            : item
        )));
      }
      await loadConversations();
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de supprimer ce message');
    } finally {
      setDeletingMessageId('');
    }
  };

  const handleBlockToggle = async () => {
    if (!activeOtherUserId) return;
    try {
      if (isActiveUserBlocked) {
        await messageService.unblockUser(activeOtherUserId);
        setIncomingNotice('Utilisateur debloque');
      } else {
        const confirmed = window.confirm('Bloquer cet utilisateur ? Vous ne pourrez plus echanger de messages.');
        if (!confirmed) return;
        await messageService.blockUser(activeOtherUserId);
        setIncomingNotice('Utilisateur bloque');
      }
      await loadBlockedUsers();
      await loadConversations();
    } catch (err) {
      setError(err.response?.data?.message || 'Action de blocage impossible');
    }
  };

  const askReportReason = () => {
    const input = window.prompt(`Raison (${REPORT_REASON_OPTIONS.join(', ')}):`, 'spam');
    if (!input) return null;
    const normalized = String(input).trim().toLowerCase();
    return REPORT_REASON_OPTIONS.includes(normalized) ? normalized : null;
  };

  const handleReport = async ({ conversationId, messageId = null }) => {
    const reason = askReportReason();
    if (!reason) {
      setError('Raison invalide. Utilisez: spam, abuse, harassment, fraud, other');
      return;
    }
    const details = window.prompt('Details (optionnel):', '') || '';
    try {
      await messageService.reportMessage({ conversationId, messageId, reason, details });
      setIncomingNotice('Signalement envoye. Merci.');
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible d envoyer le signalement');
    }
  };

  const handleMessagesScroll = (event) => {
    const container = event.currentTarget;
    if (container.scrollTop < 80 && hasMoreMessages && !loadingMore) {
      handleLoadOlder();
    }
  };

  const togglePinConversation = (conversationId) => {
    setPinnedConversationIds((prev) => (
      prev.includes(conversationId)
        ? prev.filter((id) => id !== conversationId)
        : [...prev, conversationId]
    ));
  };

  const toggleArchiveConversation = (conversationId) => {
    setArchivedConversationIds((prev) => (
      prev.includes(conversationId)
        ? prev.filter((id) => id !== conversationId)
        : [...prev, conversationId]
    ));

    if (activeConversationId === conversationId && conversationFilter !== 'archived') {
      const nextVisible = filteredConversations.find((item) => item.id !== conversationId);
      setActiveConversationId(nextVisible?.id || '');
    }
  };

  const clearMessageFilters = () => {
    setMessageSearch('');
    setMessageTypeFilter('all');
    setMessageDateFrom('');
    setMessageDateTo('');
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 notranslate" translate="no">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Messagerie interne</h1>
          <p className="mt-2 text-slate-600">Echangez directement entre clients, agences et administration.</p>
        </div>

        {incomingNotice && (
          <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
            {incomingNotice}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>
        )}

        {loading ? (
          <Card className="p-10"><Loading /></Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-4 p-4 md:p-5 h-[75vh] overflow-hidden flex flex-col" hover={false}>
              <div className="mb-4">
                <label htmlFor="contact-search" className="text-sm font-semibold text-slate-700">Demarrer une conversation</label>
                <div className="relative mt-2">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input id="contact-search" type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Rechercher un contact..." className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Contacts</p>
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {contacts.length === 0 && (<p className="text-sm text-slate-500">Aucun contact trouve</p>)}
                  {contacts.map((contact) => (
                    <button key={contact.id} type="button" onClick={() => handleStartConversation(contact.id)} className="w-full text-left px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50">
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
                    <input type="text" value={conversationSearch} onChange={(e) => setConversationSearch(e.target.value)} placeholder="Rechercher une conversation..." className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div className="flex gap-2">
                    {['all', 'unread', 'pinned', 'archived'].map((value) => (
                      <button key={value} type="button" onClick={() => setConversationFilter(value)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${conversationFilter === value ? 'bg-primary-50 text-primary-700 border-primary-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                        {value === 'all' ? 'Toutes' : value === 'unread' ? 'Non lues' : value === 'pinned' ? 'Epinglees' : 'Archivees'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2 h-full overflow-y-auto pr-1">
                  {filteredConversations.length === 0 ? (
                    <p className="text-sm text-slate-500">Aucune conversation</p>
                  ) : filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setActiveConversationId(conversation.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setActiveConversationId(conversation.id);
                        }
                      }}
                      className={`w-full text-left px-3 py-3 rounded-xl border transition-colors cursor-pointer ${activeConversationId === conversation.id ? 'border-primary-300 bg-primary-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                            {safeText(conversation.otherParticipant?.firstName)} {safeText(conversation.otherParticipant?.lastName)}
                            <span className={`inline-flex w-2 h-2 rounded-full ${conversation.otherParticipant?.isOnline ? 'bg-green-500' : 'bg-slate-300'}`} />
                          </p>
                          <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">{safeText(conversation.lastMessage?.content) || (conversation.lastMessage?.hasAttachment ? 'Piece jointe' : 'Conversation creee')}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={(e) => { e.stopPropagation(); togglePinConversation(conversation.id); }} className="p-1 rounded-md hover:bg-slate-100" aria-label="Epingler la conversation">
                            <Star className={`w-4 h-4 ${pinnedConversationIds.includes(conversation.id) ? 'text-amber-500 fill-current' : 'text-slate-400'}`} />
                          </button>
                          <button type="button" onClick={(e) => { e.stopPropagation(); toggleArchiveConversation(conversation.id); }} className="p-1 rounded-md hover:bg-slate-100" aria-label="Archiver la conversation">
                            <Archive className={`w-4 h-4 ${archivedConversationIds.includes(conversation.id) ? 'text-blue-600' : 'text-slate-400'}`} />
                          </button>
                          {conversation.unreadCount > 0 && (<span className="min-w-6 h-6 px-1 rounded-full bg-primary-600 text-white text-xs font-semibold inline-flex items-center justify-center">{conversation.unreadCount}</span>)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <Card className="lg:col-span-8 p-0 h-[75vh] overflow-hidden flex flex-col" hover={false}>
              {!activeConversation ? (
                <div className="h-full flex items-center justify-center p-8">
                  <EmptyState icon={MessageCircle} title="Selectionnez une conversation" message="Choisissez un contact ou une conversation existante pour demarrer." />
                </div>
              ) : (
                <>
                  <div className="px-5 py-4 border-b border-slate-200 bg-white">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center"><UserRound className="w-5 h-5" /></div>
                      <div>
                        <p className="font-semibold text-slate-900">{safeText(activeConversation.otherParticipant?.firstName)} {safeText(activeConversation.otherParticipant?.lastName)}</p>
                        <p className="text-xs text-slate-600">
                          {activeConversation.otherParticipant?.role}
                          {activeConversation.otherParticipant?.agency?.name ? ` - ${activeConversation.otherParticipant.agency.name}` : ''}
                          {activeConversation.otherParticipant?.isOnline ? ' - En ligne' : ' - Hors ligne'}
                        </p>
                      </div>
                      </div>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenConversationMenu((prev) => !prev);
                          }}
                          className="h-9 w-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 inline-flex items-center justify-center text-slate-600"
                          aria-label="Actions conversation"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {openConversationMenu && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white shadow-xl py-1 z-30"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setOpenConversationMenu(false);
                                handleReport({ conversationId: activeConversation.id });
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-amber-700 hover:bg-slate-50 inline-flex items-center gap-2"
                            >
                              <AlertTriangle className="w-4 h-4" />
                              Signaler conversation
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenConversationMenu(false);
                                handleBlockToggle();
                              }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 inline-flex items-center gap-2 ${
                                isActiveUserBlocked ? 'text-emerald-700' : 'text-red-700'
                              }`}
                            >
                              <Ban className="w-4 h-4" />
                              {isActiveUserBlocked ? 'Debloquer' : 'Bloquer'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={messageSearch}
                          onChange={(e) => setMessageSearch(e.target.value)}
                          placeholder="Rechercher dans les messages..."
                          className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowMessageFilters((prev) => !prev)}
                          className={`h-10 px-3 rounded-xl border inline-flex items-center gap-2 text-sm ${
                            showMessageFilters || activeMessageFilterCount > 0
                              ? 'border-primary-300 bg-primary-50 text-primary-700'
                              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <SlidersHorizontal className="w-4 h-4" />
                          Filtres
                          {activeMessageFilterCount > 0 && (
                            <span className="min-w-5 h-5 px-1 rounded-full bg-primary-600 text-white text-[11px] font-semibold inline-flex items-center justify-center">
                              {activeMessageFilterCount}
                            </span>
                          )}
                        </button>
                      </div>
                      {showMessageFilters && (
                        <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
                          <div className="flex flex-wrap gap-2">
                            {[
                              ['all', 'Tous'],
                              ['text', 'Texte'],
                              ['audio', 'Audio'],
                              ['image', 'Image'],
                              ['file', 'Fichier']
                            ].map(([value, label]) => (
                              <button
                                key={value}
                                type="button"
                                onClick={() => setMessageTypeFilter(value)}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                                  messageTypeFilter === value
                                    ? 'bg-primary-600 text-white border-primary-600'
                                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                                }`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <input
                              type="date"
                              value={messageDateFrom}
                              onChange={(e) => setMessageDateFrom(e.target.value)}
                              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                              aria-label="Date debut"
                            />
                            <input
                              type="date"
                              value={messageDateTo}
                              onChange={(e) => setMessageDateTo(e.target.value)}
                              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                              aria-label="Date fin"
                            />
                          </div>
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={clearMessageFilters}
                              className="text-xs text-slate-600 hover:text-slate-800"
                            >
                              Reinitialiser les filtres
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    ref={messagesContainerRef}
                    onScroll={handleMessagesScroll}
                    className="flex-1 overflow-y-auto bg-slate-50 px-5 py-4 space-y-3"
                  >
                    {hasMoreMessages && (
                      <div className="flex justify-center">
                        <Button size="sm" variant="secondary" onClick={handleLoadOlder} disabled={loadingMore}>{loadingMore ? 'Chargement...' : 'Charger plus'}</Button>
                      </div>
                    )}

                    {messageLoading ? (
                      <Loading size="sm" />
                    ) : messages.length === 0 ? (
                      <p className="text-sm text-slate-500">Aucun message pour le moment.</p>
                    ) : messages.map((message) => {
                      const mine = message.senderId === currentUserId;
                      const deletedForEveryone = Boolean(message.isDeletedForEveryone);
                      const attachmentUrl = getAttachmentUrl(message.attachmentUrl);
                      const otherInitials = getInitials(
                        activeConversation?.otherParticipant?.firstName,
                        activeConversation?.otherParticipant?.lastName
                      );
                      return (
                        <div key={message.id} className={`flex items-end gap-2 ${mine ? 'justify-end' : 'justify-start'}`}>
                          {!mine && (
                            <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 text-[11px] font-semibold inline-flex items-center justify-center shrink-0">
                              {otherInitials}
                            </div>
                          )}
                          <div className={`max-w-[82%] rounded-2xl px-3.5 py-2 shadow-sm ${
                            mine
                              ? 'bg-emerald-100 border border-emerald-200 text-slate-900 rounded-br-md'
                              : 'bg-white border border-slate-200 text-slate-900 rounded-bl-md'
                          }`}>
                            <div className="relative pr-4">
                              {mine && !deletedForEveryone && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMessageMenuId((prev) => (prev === message.id ? '' : message.id));
                                  }}
                                  className={`absolute -top-1 -right-1 p-1 rounded-md ${mine ? 'hover:bg-emerald-200 text-emerald-800' : 'hover:bg-slate-100 text-slate-500'}`}
                                  aria-label="Actions message"
                                >
                                  <MoreVertical className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {mine && !deletedForEveryone && openMessageMenuId === message.id && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute right-0 top-6 z-20 min-w-52 rounded-xl border border-slate-200 bg-white shadow-xl py-1 text-slate-700"
                                >
                                  <button
                                    type="button"
                                    disabled={Boolean(deletingMessageId)}
                                    onClick={() => handleDeleteMessage(message.id, 'me')}
                                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 disabled:opacity-60"
                                  >
                                    Supprimer pour moi
                                  </button>
                                  {message.canDeleteForEveryone && (
                                    <button
                                      type="button"
                                      disabled={Boolean(deletingMessageId)}
                                      onClick={() => handleDeleteMessage(message.id, 'everyone')}
                                      className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 disabled:opacity-60 text-red-600"
                                    >
                                      Supprimer pour tout le monde
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>

                            {deletedForEveryone ? (
                              <p className="text-sm italic flex items-center gap-2 text-slate-500">
                                <Trash2 className="w-3.5 h-3.5" />
                                Ce message a ete supprime
                              </p>
                            ) : message.content != null ? (
                              <p className="text-sm whitespace-pre-wrap break-words">{safeText(message.content)}</p>
                            ) : null}

                            {message.attachmentUrl && !deletedForEveryone && (
                              isAudioAttachment(message) ? (
                                <div className="mt-2">
                                  <audio controls className="max-w-full h-9">
                                    <source src={attachmentUrl} type={message.attachmentType || 'audio/webm'} />
                                    Votre navigateur ne supporte pas la lecture audio.
                                  </audio>
                                </div>
                              ) : (
                                <a href={attachmentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 mt-2 text-xs underline text-primary-700">
                                  <Paperclip className="w-3 h-3" />
                                  {safeText(message.attachmentName) || 'Piece jointe'}
                                </a>
                              )
                            )}
                            <div className="mt-1 text-[11px] text-slate-500 text-right">
                              <span>{formatDateTime(message.createdAt)}</span>
                              {mine && (
                                <span className="ml-2 font-semibold">
                                  {message.isRead
                                    ? `Lu${message.readAt ? ` a ${formatTime(message.readAt)}` : ''}`
                                    : message.deliveredAt
                                      ? `Recu${message.deliveredAt ? ` a ${formatTime(message.deliveredAt)}` : ''}`
                                    : 'Envoye'}
                                </span>
                              )}
                            </div>
                            {!mine && !deletedForEveryone && (
                              <button
                                type="button"
                                onClick={() => handleReport({ conversationId: activeConversation.id, messageId: message.id })}
                                className="mt-1 inline-flex items-center gap-1 text-[11px] text-amber-700 hover:text-amber-800"
                              >
                                <AlertTriangle className="w-3 h-3" />
                                Signaler
                              </button>
                            )}
                          </div>
                          {mine && (
                            <div className="w-7 h-7 rounded-full bg-emerald-200 text-emerald-800 text-[11px] font-semibold inline-flex items-center justify-center shrink-0">
                              Moi
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {typingUsers.length > 0 && (
                      <p className="text-xs text-slate-500 italic">{typingLabel} est en train d ecrire...</p>
                    )}
                    <div ref={endRef} />
                  </div>

                  <form onSubmit={handleSendMessage} className="border-t border-slate-200 bg-white p-4">
                    {isActiveUserBlocked && (
                      <div className="mb-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                        Cet utilisateur est bloque. Debloquez-le pour reprendre la messagerie.
                      </div>
                    )}
                    {attachment && (
                      <div className="mb-2 inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs text-slate-700">
                        <Paperclip className="w-3 h-3" />
                        <span>{attachment.name}</span>
                        <button type="button" onClick={() => setAttachment(null)} aria-label="Retirer la piece jointe"><X className="w-3 h-3" /></button>
                      </div>
                    )}
                    <div className="flex items-end gap-3">
                      <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf,.webm,.ogg,.mp3,.wav,.m4a,.aac,audio/*" className="hidden" onChange={handleAttachmentChange} />
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="h-11 w-11 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 inline-flex items-center justify-center text-slate-600" aria-label="Ajouter une piece jointe"><Paperclip className="w-4 h-4" /></button>
                      <button
                        type="button"
                        onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                        className={`h-11 w-11 rounded-xl border inline-flex items-center justify-center ${isRecording ? 'bg-red-50 border-red-300 text-red-600' : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-600'}`}
                        aria-label={isRecording ? 'Arreter enregistrement' : 'Enregistrer un vocal'}
                      >
                        {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </button>

                      <textarea value={draft} disabled={isActiveUserBlocked} onChange={(e) => { setDraft(e.target.value); if (e.target.value.trim()) startTyping(); else stopTyping(); }} onKeyDown={handleTextareaKeyDown} placeholder={isActiveUserBlocked ? 'Messagerie desactivee (utilisateur bloque)' : 'Ecrivez votre message... (Entree pour envoyer, Shift+Entree pour ligne)'} rows={2} className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none disabled:bg-slate-100 disabled:text-slate-500" />
                      <Button type="submit" disabled={isActiveUserBlocked || sending || (!draft.trim() && !attachment)} className="h-11 px-5"><Send className="w-4 h-4 mr-2" />{sending ? 'Envoi...' : 'Envoyer'}</Button>
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

function MessagesPageWithBoundary() {
  return (
    <ErrorBoundary>
      <MessagesPage />
    </ErrorBoundary>
  );
}

export default MessagesPageWithBoundary;
