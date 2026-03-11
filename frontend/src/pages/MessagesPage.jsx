
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle, Archive, Ban, MessageCircle, Mic, MoreVertical,
  Paperclip, Plus, Search, Send, SlidersHorizontal, Square, Star,
  Trash2, UserRound, X, ArrowLeft, Phone, Video, CheckCheck, Check
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Button, Card, EmptyState, Loading } from '../components/UI';
import ErrorBoundary from '../components/ErrorBoundary';
import { messageService } from '../services/messageService';
import { API_BASE_URL } from '../services/api';
import { connectSocket } from '../services/socket';

/* ─── constants ─── */
const PINNED_STORAGE_KEY = 'messages:pinned_conversations';
const ARCHIVED_STORAGE_KEY = 'messages:archived_conversations';
const REPORT_REASON_OPTIONS = ['spam', 'abuse', 'harassment', 'fraud', 'other'];

/* ─── helpers ─── */
const formatDateTime = (date) => (date ? new Date(date).toLocaleString() : '');
const formatTime = (date) =>
  date ? new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
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

/* ─── Avatar component ─── */
function Avatar({ firstName, lastName, size = 'md', online = false, className = '' }) {
  const initials = getInitials(firstName, lastName);
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' };
  const colors = [
    'from-emerald-400 to-teal-500',
    'from-blue-400 to-indigo-500',
    'from-amber-400 to-orange-500',
    'from-rose-400 to-pink-500',
    'from-violet-400 to-purple-500',
  ];
  const colorIndex = (initials.charCodeAt(0) || 0) % colors.length;
  return (
    <div className={`relative shrink-0 ${className}`}>
      <div className={`${sizes[size]} rounded-2xl bg-gradient-to-br ${colors[colorIndex]} flex items-center justify-center font-bold text-white shadow-sm`}>
        {initials || <UserRound className="w-4 h-4" />}
      </div>
      {online !== undefined && (
        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0f1623] ${online ? 'bg-emerald-400' : 'bg-slate-500'}`} />
      )}
    </div>
  );
}

/* ─── TypingDots ─── */
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.8s' }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════ */
function MessagesPage() {
  const [searchParams] = useSearchParams();

  /* state */
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
  const [conversationFilter, setConversationFilter] = useState(
    searchParams.get('filter') === 'unread' ? 'unread' : 'all'
  );
  const [typingByConversation, setTypingByConversation] = useState({});
  const [incomingNotice, setIncomingNotice] = useState('');
  const [showSidebar, setShowSidebar] = useState(true); // mobile toggle
  const [showNewConvPanel, setShowNewConvPanel] = useState(false);

  const [pinnedConversationIds, setPinnedConversationIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem(PINNED_STORAGE_KEY) || '[]') || []; } catch { return []; }
  });
  const [archivedConversationIds, setArchivedConversationIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem(ARCHIVED_STORAGE_KEY) || '[]') || []; } catch { return []; }
  });

  /* refs */
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

  /* derived */
  const currentUserId = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}')?.id || ''; } catch { return ''; }
  }, []);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId) || null,
    [conversations, activeConversationId]
  );
  const activeOtherUserId = activeConversation?.otherParticipant?.id || '';
  const isActiveUserBlocked = Boolean(activeOtherUserId && blockedUserIds.includes(activeOtherUserId));

  const typingUsers = useMemo(() => {
    const bucket = typingByConversation[activeConversationId] || {};
    return Object.keys(bucket).filter((id) => bucket[id] && id !== currentUserId);
  }, [typingByConversation, activeConversationId, currentUserId]);

  const typingLabel = useMemo(() => {
    if (!typingUsers.length) return '';
    const fn = safeText(activeConversation?.otherParticipant?.firstName);
    const ln = safeText(activeConversation?.otherParticipant?.lastName);
    return `${fn} ${ln}`.trim() || 'Votre correspondant';
  }, [typingUsers, activeConversation]);

  const totalUnread = useMemo(
    () => conversations.reduce((s, c) => s + (c.unreadCount || 0), 0),
    [conversations]
  );

  const activeMessageFilterCount = useMemo(() => (
    (messageTypeFilter !== 'all' ? 1 : 0) + (messageDateFrom ? 1 : 0) + (messageDateTo ? 1 : 0)
  ), [messageTypeFilter, messageDateFrom, messageDateTo]);

  const filteredConversations = useMemo(() => {
    const query = conversationSearch.trim().toLowerCase();
    return [...conversations]
      .filter((c) => {
        const isArchived = archivedConversationIds.includes(c.id);
        if (conversationFilter !== 'archived' && isArchived) return false;
        if (conversationFilter === 'archived' && !isArchived) return false;
        if (conversationFilter === 'unread' && !(c.unreadCount || 0)) return false;
        if (conversationFilter === 'pinned' && !pinnedConversationIds.includes(c.id)) return false;
        if (!query) return true;
        const fullName = `${c.otherParticipant?.firstName || ''} ${c.otherParticipant?.lastName || ''}`.toLowerCase();
        const preview = (c.lastMessage?.content || '').toLowerCase();
        return fullName.includes(query) || preview.includes(query);
      })
      .sort((a, b) => {
        const ap = pinnedConversationIds.includes(a.id) ? 1 : 0;
        const bp = pinnedConversationIds.includes(b.id) ? 1 : 0;
        if (ap !== bp) return bp - ap;
        return new Date(b.lastMessageAt || b.updatedAt).getTime() - new Date(a.lastMessageAt || a.updatedAt).getTime();
      });
  }, [conversations, conversationFilter, conversationSearch, pinnedConversationIds, archivedConversationIds]);

  /* persistence */
  useEffect(() => { localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(pinnedConversationIds)); }, [pinnedConversationIds]);
  useEffect(() => { localStorage.setItem(ARCHIVED_STORAGE_KEY, JSON.stringify(archivedConversationIds)); }, [archivedConversationIds]);

  /* notice auto-clear */
  useEffect(() => {
    if (!incomingNotice) return;
    const t = setTimeout(() => setIncomingNotice(''), 4000);
    return () => clearTimeout(t);
  }, [incomingNotice]);

  /* close menus on doc click */
  useEffect(() => {
    if (!openMessageMenuId && !openConversationMenu) return;
    const fn = () => { setOpenMessageMenuId(''); setOpenConversationMenu(false); };
    document.addEventListener('click', fn);
    return () => document.removeEventListener('click', fn);
  }, [openMessageMenuId, openConversationMenu]);

  const scrollToBottom = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const stopTyping = useCallback(() => {
    if (socketRef.current && activeConversationId && isTypingRef.current) {
      socketRef.current.emit('typing:stop', { conversationId: activeConversationId });
    }
    if (typingTimeoutRef.current) { clearTimeout(typingTimeoutRef.current); typingTimeoutRef.current = null; }
    isTypingRef.current = false;
  }, [activeConversationId]);

  const startTyping = useCallback(() => {
    if (!socketRef.current || !activeConversationId) return;
    if (!isTypingRef.current) { socketRef.current.emit('typing:start', { conversationId: activeConversationId }); isTypingRef.current = true; }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => stopTyping(), 1200);
  }, [activeConversationId, stopTyping]);

  const loadConversations = useCallback(async () => {
    const res = await messageService.getConversations();
    const list = res.data || [];
    setConversations(list);
    if (!activeConversationId && list.length > 0) setActiveConversationId(list[0].id);
  }, [activeConversationId]);

  const loadContacts = useCallback(async (q = '') => {
    const res = await messageService.searchUsers(q);
    setContacts(res.data || []);
  }, []);

  const loadBlockedUsers = useCallback(async () => {
    const res = await messageService.getBlockedUsers();
    setBlockedUserIds((res.data || []).map((u) => u.id));
  }, []);

  const buildMessageQueryParams = useCallback(() => {
    const p = {};
    if (messageSearch.trim()) p.q = messageSearch.trim();
    if (messageTypeFilter && messageTypeFilter !== 'all') p.type = messageTypeFilter;
    if (messageDateFrom) p.from = `${messageDateFrom}T00:00:00.000Z`;
    if (messageDateTo) p.to = `${messageDateTo}T23:59:59.999Z`;
    return p;
  }, [messageSearch, messageTypeFilter, messageDateFrom, messageDateTo]);

  const loadMessages = useCallback(async (conversationId, options = {}) => {
    if (!conversationId) { setMessages([]); setHasMoreMessages(false); setNextCursor(null); return; }
    const { appendOlder = false, before = null } = options;
    if (appendOlder) setLoadingMore(true); else setMessageLoading(true);
    try {
      const res = await messageService.getConversationMessages(conversationId, { limit: 40, before: before || undefined, ...buildMessageQueryParams() });
      const batch = res.data || [];
      const pagination = res.pagination || {};
      if (appendOlder) setMessages((prev) => mergeUniqueMessages([...batch, ...prev]));
      else { setMessages(mergeUniqueMessages(batch)); setTimeout(scrollToBottom, 50); }
      setHasMoreMessages(Boolean(pagination.hasMore));
      setNextCursor(pagination.nextCursor || null);
      await messageService.markConversationAsRead(conversationId);
      await loadConversations();
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de charger les messages');
    } finally {
      if (appendOlder) setLoadingMore(false); else setMessageLoading(false);
    }
  }, [buildMessageQueryParams, loadConversations, scrollToBottom]);

  const initialize = useCallback(async () => {
    setLoading(true); setError('');
    try { await Promise.all([loadConversations(), loadContacts(''), loadBlockedUsers()]); }
    catch (err) { setError(err.response?.data?.message || 'Erreur de chargement de la messagerie'); }
    finally { setLoading(false); }
  }, [loadConversations, loadContacts, loadBlockedUsers]);

  useEffect(() => { initialize(); }, [initialize]);
  useEffect(() => { const t = setTimeout(() => loadContacts(searchTerm), 250); return () => clearTimeout(t); }, [searchTerm, loadContacts]);
  useEffect(() => {
    if (!activeConversationId) return;
    const t = setTimeout(() => loadMessages(activeConversationId), 200);
    return () => clearTimeout(t);
  }, [activeConversationId, messageSearch, messageTypeFilter, messageDateFrom, messageDateTo, loadMessages]);
  /* deep link */
  useEffect(() => {
    if (loading || deepLinkHandledRef.current) return;
    const convId = searchParams.get('conversationId');
    const partId = searchParams.get('participantId');
    const agId = searchParams.get('agencyId');
    const prefill = searchParams.get('prefill');
    const openByParticipant = async (id) => {
      try {
        const res = await messageService.createOrGetConversation(id);
        await loadConversations();
        setActiveConversationId(res.data.id);
        if (prefill) setDraft((prev) => prev || prefill);
      } catch (err) { setError(err.response?.data?.message || 'Impossible de demarrer la conversation'); }
      finally { deepLinkHandledRef.current = true; }
    };
    if (convId) { setActiveConversationId(convId); if (prefill) setDraft((p) => p || prefill); deepLinkHandledRef.current = true; return; }
    if (partId) { openByParticipant(partId); return; }
    if (agId) {
      const ag = contacts.filter((c) => c?.agency?.id === agId);
      const target = ag.find((c) => c.role === 'manager') || ag[0];
      if (target?.id) openByParticipant(target.id);
      else { setError('Aucun contact de cette agence disponible'); deepLinkHandledRef.current = true; }
      return;
    }
    deepLinkHandledRef.current = true;
  }, [loading, searchParams, contacts, loadConversations]);

  /* socket */
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const socket = connectSocket(token);
    socketRef.current = socket;
    if (!socket) return;

    const onNewMessage = async (msg) => {
      if (msg.conversationId === activeConversationId) {
        setMessages((prev) => mergeUniqueMessages([...prev, msg]));
        setTimeout(scrollToBottom, 50);
        if (msg.senderId !== currentUserId) await messageService.markConversationAsRead(activeConversationId);
      } else if (msg.senderId !== currentUserId) {
        setIncomingNotice('Nouveau message recu');
        if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('AfriRide - Nouveau message', { body: msg.content || 'Piece jointe recue' });
        }
      }
      await loadConversations();
    };
    const onRead = ({ messageIds = [], readAt }) => {
      if (!messageIds.length) return;
      setMessages((prev) => prev.map((m) => messageIds.includes(m.id) ? { ...m, isRead: true, readAt: readAt || m.readAt } : m));
      loadConversations();
    };
    const onDelivered = ({ messageIds = [], deliveredAt }) => {
      if (!messageIds.length) return;
      setMessages((prev) => prev.map((m) => messageIds.includes(m.id) ? { ...m, deliveredAt: deliveredAt || m.deliveredAt } : m));
    };
    const onDeleted = ({ messageId, mode, userId }) => {
      if (!messageId) return;
      setMessages((prev) => {
        if (mode === 'me' && userId === currentUserId) return prev.filter((m) => m.id !== messageId);
        if (mode === 'everyone') return prev.map((m) => m.id === messageId ? { ...m, content: 'Ce message a ete supprime', attachmentUrl: null, attachmentName: null, attachmentType: null, attachmentSize: null, isDeletedForEveryone: true, canDeleteForEveryone: false } : m);
        return prev;
      });
      loadConversations();
    };
    const onTyping = ({ conversationId, userId, isTyping }) => {
      setTypingByConversation((prev) => ({ ...prev, [conversationId]: { ...(prev[conversationId] || {}), [userId]: Boolean(isTyping) } }));
    };
    const onPresence = ({ userId, isOnline }) => {
      setConversations((prev) => prev.map((c) => c.otherParticipant?.id === userId ? { ...c, otherParticipant: { ...c.otherParticipant, isOnline: Boolean(isOnline) } } : c));
    };

    socket.on('message:new', onNewMessage);
    socket.on('message:read', onRead);
    socket.on('message:delivered', onDelivered);
    socket.on('message:deleted', onDeleted);
    socket.on('typing:update', onTyping);
    socket.on('presence:update', onPresence);
    socket.on('conversation:updated', loadConversations);
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission().catch(() => { });
    return () => {
      socket.off('message:new', onNewMessage); socket.off('message:read', onRead);
      socket.off('message:delivered', onDelivered); socket.off('message:deleted', onDeleted);
      socket.off('typing:update', onTyping); socket.off('presence:update', onPresence);
      socket.off('conversation:updated', loadConversations);
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
    if (activeConversationId) { socket.emit('join_conversation', { conversationId: activeConversationId }); joinedConversationRef.current = activeConversationId; }
  }, [activeConversationId]);

  useEffect(() => () => stopTyping(), [stopTyping]);
  useEffect(() => () => {
    if (mediaRecorderRef.current?.state !== 'inactive') mediaRecorderRef.current?.stop();
    recordingStreamRef.current?.getTracks().forEach((t) => t.stop());
    recordingStreamRef.current = null;
  }, []);

  /* handlers */
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!draft.trim() && !attachment) || !activeConversationId || sending) return;
    setSending(true); setError('');
    try {
      let res;
      if (attachment) {
        const fd = new FormData();
        fd.append('content', draft.trim());
        fd.append('attachment', attachment);
        res = await messageService.sendMessage(activeConversationId, fd);
      } else {
        res = await messageService.sendMessage(activeConversationId, draft.trim());
      }
      setDraft(''); setAttachment(null); stopTyping();
      setMessages((prev) => mergeUniqueMessages([...prev, res.data]));
      setTimeout(scrollToBottom, 50);
      await loadConversations();
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible d envoyer le message');
    } finally { setSending(false); }
  };

  const handleTextareaKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); }
  };

  const handleStartConversation = async (participantId) => {
    try {
      setError('');
      const res = await messageService.createOrGetConversation(participantId);
      await loadConversations();
      setActiveConversationId(res.data.id);
      setShowSidebar(false);
    } catch (err) { setError(err.response?.data?.message || 'Impossible de demarrer la conversation'); }
  };

  const handleSelectConversation = (id) => {
    setActiveConversationId(id);
    setShowSidebar(false);
  };

  const handleDeleteMessage = async (messageId, mode) => {
    if (!messageId || deletingMessageId) return;
    if (mode === 'everyone' && !window.confirm('Supprimer ce message pour tout le monde ?')) return;
    try {
      setDeletingMessageId(messageId); setOpenMessageMenuId('');
      await messageService.deleteMessage(messageId, mode);
      if (mode === 'me') { setMessages((prev) => prev.filter((m) => m.id !== messageId)); }
      else { setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, content: 'Ce message a ete supprime', attachmentUrl: null, attachmentName: null, attachmentType: null, attachmentSize: null, isDeletedForEveryone: true, canDeleteForEveryone: false } : m)); }
      await loadConversations();
    } catch (err) { setError(err.response?.data?.message || 'Impossible de supprimer ce message'); }
    finally { setDeletingMessageId(''); }
  };

  const handleBlockToggle = async () => {
    if (!activeOtherUserId) return;
    try {
      if (isActiveUserBlocked) { await messageService.unblockUser(activeOtherUserId); setIncomingNotice('Utilisateur debloque'); }
      else {
        if (!window.confirm('Bloquer cet utilisateur ?')) return;
        await messageService.blockUser(activeOtherUserId); setIncomingNotice('Utilisateur bloque');
      }
      await loadBlockedUsers(); await loadConversations();
    } catch (err) { setError(err.response?.data?.message || 'Action impossible'); }
  };

  const askReportReason = () => {
    const input = window.prompt(`Raison (${REPORT_REASON_OPTIONS.join(', ')}):`, 'spam');
    if (!input) return null;
    const n = input.trim().toLowerCase();
    return REPORT_REASON_OPTIONS.includes(n) ? n : null;
  };

  const handleReport = async ({ conversationId, messageId = null }) => {
    const reason = askReportReason();
    if (!reason) { setError('Raison invalide'); return; }
    const details = window.prompt('Details (optionnel):', '') || '';
    try {
      await messageService.reportMessage({ conversationId, messageId, reason, details });
      setIncomingNotice('Signalement envoye. Merci.');
    } catch (err) { setError(err.response?.data?.message || 'Impossible d envoyer le signalement'); }
  };

  const handleMessagesScroll = (e) => {
    if (e.currentTarget.scrollTop < 80 && hasMoreMessages && !loadingMore) handleLoadOlder();
  };

  const handleLoadOlder = async () => {
    if (!activeConversationId || !hasMoreMessages || loadingMore) return;
    const container = messagesContainerRef.current;
    const prevHeight = container?.scrollHeight || 0;
    await loadMessages(activeConversationId, { appendOlder: true, before: nextCursor });
    setTimeout(() => { if (!container) return; container.scrollTop += Math.max(0, container.scrollHeight - prevHeight); }, 0);
  };

  const startVoiceRecording = async () => {
    if (isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStreamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      recordingChunksRef.current = [];
      recorder.ondataavailable = (ev) => { if (ev.data?.size > 0) recordingChunksRef.current.push(ev.data); };
      recorder.onstop = () => {
        const blob = new Blob(recordingChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        if (blob.size > 0) {
          const ext = blob.type.includes('ogg') ? 'ogg' : blob.type.includes('mp4') ? 'm4a' : 'webm';
          setAttachment(new File([blob], `voice-${Date.now()}.${ext}`, { type: blob.type || 'audio/webm' }));
        }
        recordingStreamRef.current?.getTracks().forEach((t) => t.stop());
        recordingStreamRef.current = null;
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true); setError('');
    } catch { setError('Impossible de demarrer l enregistrement audio'); }
  };

  const stopVoiceRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;
    recorder.stop(); setIsRecording(false);
  };

  const togglePin = (id) => setPinnedConversationIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  const toggleArchive = (id) => {
    setArchivedConversationIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    if (activeConversationId === id && conversationFilter !== 'archived') {
      setActiveConversationId(filteredConversations.find((c) => c.id !== id)?.id || '');
    }
  };
  const clearMessageFilters = () => { setMessageSearch(''); setMessageTypeFilter('all'); setMessageDateFrom(''); setMessageDateTo(''); };

  /* ── RENDER ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <p className="text-slate-400 text-sm font-medium">Chargement de la messagerie…</p>
        </div>
      </div>
    );
  }

  const otherParticipant = activeConversation?.otherParticipant;

  return (
    <>
      {/* Global styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');
        * { font-family: 'DM Sans', sans-serif; box-sizing: border-box; }
        h1, h2, h3, .brand { font-family: 'Sora', sans-serif; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 99px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
        .msg-bubble-enter { animation: bubbleIn 0.25s cubic-bezier(0.34,1.56,0.64,1) both; }
        @keyframes bubbleIn { from { opacity:0; transform: scale(0.85) translateY(8px); } to { opacity:1; transform: scale(1) translateY(0); } }
        .slide-down { animation: slideDown 0.3s ease both; }
        @keyframes slideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        .notice-enter { animation: noticeIn 0.4s ease both; }
        @keyframes noticeIn { from { opacity:0; transform:translateY(-100%); } to { opacity:1; transform:translateY(0); } }
        textarea:focus, input:focus { outline: none; }
        .conv-hover { transition: all 0.18s ease; }
        .conv-hover:hover { transform: translateX(2px); }
      `}</style>

      <div className="min-h-screen bg-[#0a0f1a] flex flex-col notranslate" translate="no">

        {/* Top Notice */}
        {incomingNotice && (
          <div className="notice-enter fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-emerald-500 text-white text-sm font-semibold shadow-2xl flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            {incomingNotice}
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="fixed top-4 right-4 z-50 max-w-sm px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium flex items-center gap-2 backdrop-blur-xl shadow-2xl">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError('')} className="shrink-0 hover:text-red-300"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Page header */}
        <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="brand text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Messagerie
                <span className="text-emerald-400">.</span>
              </h1>
              <p className="text-slate-500 text-sm mt-0.5">AfriRide — communication interne</p>
            </div>
            {totalUnread > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 text-sm font-semibold">{totalUnread} non lu{totalUnread > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>

        {/* Main layout */}
        <div className="flex-1 px-4 sm:px-6 lg:px-8 pb-6 max-w-7xl mx-auto w-full">
          <div className="flex gap-4 h-[calc(100vh-160px)] min-h-[500px]">

            {/* ═══ SIDEBAR ═══ */}
            <aside className={`
              flex-col w-full lg:w-[340px] xl:w-[380px] lg:flex shrink-0
              ${showSidebar ? 'flex' : 'hidden'}
              bg-[#111827] rounded-3xl border border-white/5 overflow-hidden shadow-2xl
            `}>
              {/* Search bar + bouton nouvelle conversation */}
              <div className="p-4 pb-2 border-b border-white/5">

                {/* Ligne barre de recherche + bouton + */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={conversationSearch}
                      onChange={(e) => setConversationSearch(e.target.value)}
                      placeholder="Rechercher une conversation…"
                      className="w-full bg-white/5 border border-white/8 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:bg-white/8 focus:border-emerald-500/40 transition-all"
                    />
                  </div>
                  {/* Bouton Nouvelle Conversation */}
                  <button
                    onClick={() => { setShowNewConvPanel((v) => !v); setSearchTerm(''); }}
                    className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-lg ${
                      showNewConvPanel
                        ? 'bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30'
                        : 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-emerald-500/30'
                    }`}
                    aria-label={showNewConvPanel ? 'Fermer' : 'Nouvelle conversation'}
                    title={showNewConvPanel ? 'Fermer' : 'Nouvelle conversation'}
                  >
                    {showNewConvPanel ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </button>
                </div>

                {/* Panneau Nouvelle Conversation (visible quand showNewConvPanel) */}
                {showNewConvPanel && (
                  <div className="mt-3 bg-white/5 rounded-2xl border border-white/8 p-3 slide-down">
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Nouvelle conversation</p>
                    {/* Barre de recherche de contact */}
                    <div className="relative mb-2">
                      <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Rechercher un contact…"
                        className="w-full bg-white/5 border border-white/8 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:border-emerald-500/40 transition-all"
                      />
                    </div>
                    {contacts.length === 0 && searchTerm.length === 0 && (
                      <p className="text-xs text-slate-600 text-center py-3">Tapez un nom pour rechercher un contact</p>
                    )}
                    {contacts.length === 0 && searchTerm.length > 0 && (
                      <p className="text-xs text-slate-500 text-center py-3">Aucun contact trouvé</p>
                    )}
                    {contacts.length > 0 && (
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {contacts.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => { handleStartConversation(c.id); setShowNewConvPanel(false); setSearchTerm(''); }}
                            className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/8 transition-all text-left group"
                          >
                            <Avatar firstName={c.firstName} lastName={c.lastName} size="sm" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-white truncate">{c.firstName} {c.lastName}</p>
                              <p className="text-xs text-slate-500 truncate">{c.role}{c.agency?.name ? ` · ${c.agency.name}` : ''}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Onglets filtre — style WhatsApp */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 mt-3 scrollbar-none">
                  {[['all', 'Toutes'], ['unread', 'Non lues'], ['pinned', 'Épinglées'], ['archived', 'Archives']].map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => setConversationFilter(val)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                        conversationFilter === val
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                          : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Liste des conversations */}
              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
                {filteredConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-center">
                    <MessageCircle className="w-8 h-8 text-slate-700 mb-2" />
                    <p className="text-slate-500 text-sm">Aucune conversation</p>
                  </div>
                ) : filteredConversations.map((conv) => {
                  const isActive = conv.id === activeConversationId;
                  const isPinned = pinnedConversationIds.includes(conv.id);
                  const isArchived = archivedConversationIds.includes(conv.id);
                  const op = conv.otherParticipant;
                  return (
                    <div
                      key={conv.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSelectConversation(conv.id)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelectConversation(conv.id); } }}
                      className={`conv-hover group relative flex items-center gap-3 px-3 py-3 rounded-2xl cursor-pointer transition-all ${
                        isActive
                          ? 'bg-emerald-500/15 border border-emerald-500/25'
                          : 'border border-transparent hover:bg-white/5'
                      }`}
                    >
                      <Avatar firstName={op?.firstName} lastName={op?.lastName} online={op?.isOnline} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className={`text-sm font-semibold truncate ${isActive ? 'text-emerald-300' : 'text-white'}`}>
                            {safeText(op?.firstName)} {safeText(op?.lastName)}
                          </p>
                          <span className="text-[10px] text-slate-600 shrink-0">
                            {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {safeText(conv.lastMessage?.content) || (conv.lastMessage?.hasAttachment ? '📎 Pièce jointe' : 'Conversation créée')}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {conv.unreadCount > 0 && (
                          <span className="min-w-5 h-5 px-1.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">
                            {conv.unreadCount}
                          </span>
                        )}
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); togglePin(conv.id); }}
                            className="p-1 rounded-lg hover:bg-white/10"
                            aria-label="Épingler"
                          >
                            <Star className={`w-3.5 h-3.5 ${isPinned ? 'text-amber-400 fill-current' : 'text-slate-500'}`} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleArchive(conv.id); }}
                            className="p-1 rounded-lg hover:bg-white/10"
                            aria-label="Archiver"
                          >
                            <Archive className={`w-3.5 h-3.5 ${isArchived ? 'text-blue-400' : 'text-slate-500'}`} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </aside>

            {/* ═══ CHAT PANEL ═══ */}
            <main className={`
              flex-col flex-1 min-w-0
              ${showSidebar ? 'hidden lg:flex' : 'flex'}
              bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100
            `}>
              {!activeConversation ? (
                /* Empty state */
                <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mb-6 shadow-xl shadow-emerald-200">
                    <MessageCircle className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="brand text-xl font-bold text-slate-800 mb-2">Aucune conversation sélectionnée</h2>
                  <p className="text-slate-500 text-sm text-center max-w-xs">Choisissez un contact ou une conversation existante pour commencer à échanger.</p>
                </div>
              ) : (
                <>
                  {/* Chat header */}
                  <div className="bg-white border-b border-slate-100 px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      {/* Back button (mobile) */}
                      <button
                        className="lg:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
                        onClick={() => setShowSidebar(true)}
                        aria-label="Retour"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>

                      <Avatar
                        firstName={otherParticipant?.firstName}
                        lastName={otherParticipant?.lastName}
                        online={otherParticipant?.isOnline}
                        size="md"
                      />

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 text-sm">
                          {safeText(otherParticipant?.firstName)} {safeText(otherParticipant?.lastName)}
                        </p>
                        <p className="text-xs text-slate-400 flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${otherParticipant?.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                          {otherParticipant?.isOnline ? 'En ligne' : 'Hors ligne'}
                          {otherParticipant?.role && <span className="text-slate-300 mx-1">·</span>}
                          <span>{otherParticipant?.role}{otherParticipant?.agency?.name ? ` · ${otherParticipant.agency.name}` : ''}</span>
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        {/* Message search */}
                        <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                          <Search className="w-3.5 h-3.5 text-slate-400" />
                          <input
                            type="text"
                            value={messageSearch}
                            onChange={(e) => setMessageSearch(e.target.value)}
                            placeholder="Rechercher…"
                            className="bg-transparent text-sm text-slate-700 placeholder-slate-400 w-36"
                          />
                          {messageSearch && (
                            <button onClick={() => setMessageSearch('')} className="text-slate-400 hover:text-slate-600">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <button
                          onClick={() => setShowMessageFilters((p) => !p)}
                          className={`p-2 rounded-xl transition-colors ${showMessageFilters || activeMessageFilterCount > 0 ? 'bg-emerald-50 text-emerald-600' : 'hover:bg-slate-100 text-slate-500'}`}
                          aria-label="Filtres"
                        >
                          <SlidersHorizontal className="w-4 h-4" />
                          {activeMessageFilterCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center">
                              {activeMessageFilterCount}
                            </span>
                          )}
                        </button>

                        {/* More menu */}
                        <div className="relative">
                          <button
                            onClick={(e) => { e.stopPropagation(); setOpenConversationMenu((p) => !p); }}
                            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
                            aria-label="Options"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {openConversationMenu && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="slide-down absolute right-0 mt-2 w-52 rounded-2xl border border-slate-200 bg-white shadow-2xl py-1.5 z-30"
                            >
                              <button
                                onClick={() => { setOpenConversationMenu(false); handleReport({ conversationId: activeConversation.id }); }}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-amber-700 hover:bg-amber-50 transition-colors"
                              >
                                <AlertTriangle className="w-4 h-4" />
                                Signaler la conversation
                              </button>
                              <button
                                onClick={() => { setOpenConversationMenu(false); handleBlockToggle(); }}
                                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors ${isActiveUserBlocked ? 'text-emerald-700' : 'text-red-600'}`}
                              >
                                <Ban className="w-4 h-4" />
                                {isActiveUserBlocked ? 'Débloquer' : 'Bloquer'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Message filters panel */}
                    {showMessageFilters && (
                      <div className="slide-down mt-3 bg-slate-50 rounded-2xl p-3 border border-slate-200">
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {[['all','Tous'],['text','Texte'],['audio','Audio'],['image','Image'],['file','Fichier']].map(([v, l]) => (
                            <button
                              key={v}
                              onClick={() => setMessageTypeFilter(v)}
                              className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${messageTypeFilter === v ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                            >
                              {l}
                            </button>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <input type="date" value={messageDateFrom} onChange={(e) => setMessageDateFrom(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-emerald-400 transition-colors" aria-label="Date début" />
                          <input type="date" value={messageDateTo} onChange={(e) => setMessageDateTo(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-emerald-400 transition-colors" aria-label="Date fin" />
                        </div>
                        <button onClick={clearMessageFilters} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
                          Réinitialiser les filtres
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Messages area */}
                  <div
                    ref={messagesContainerRef}
                    onScroll={handleMessagesScroll}
                    className="flex-1 overflow-y-auto bg-slate-50 px-4 py-4"
                    style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0)', backgroundSize: '24px 24px' }}
                  >
                    {hasMoreMessages && (
                      <div className="flex justify-center mb-4">
                        <button
                          onClick={handleLoadOlder}
                          disabled={loadingMore}
                          className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm text-slate-600 font-medium hover:bg-slate-50 shadow-sm transition-all disabled:opacity-50"
                        >
                          {loadingMore ? 'Chargement…' : 'Voir les messages précédents'}
                        </button>
                      </div>
                    )}

                    {messageLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="w-6 h-6 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center py-16">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-3">
                          <MessageCircle className="w-7 h-7 text-emerald-400" />
                        </div>
                        <p className="text-slate-600 font-medium">Aucun message</p>
                        <p className="text-slate-400 text-sm mt-1">Démarrez la conversation ci-dessous</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {messages.map((msg, idx) => {
                          const mine = msg.senderId === currentUserId;
                          const deleted = Boolean(msg.isDeletedForEveryone);
                          const attachUrl = getAttachmentUrl(msg.attachmentUrl);
                          const showAvatar = !mine && (idx === 0 || messages[idx - 1]?.senderId === currentUserId);

                          return (
                            <div
                              key={msg.id}
                              className={`msg-bubble-enter flex items-end gap-2 ${mine ? 'justify-end' : 'justify-start'}`}
                            >
                              {/* Other avatar */}
                              {!mine && (
                                <div className="w-7 shrink-0">
                                  {showAvatar && (
                                    <Avatar firstName={otherParticipant?.firstName} lastName={otherParticipant?.lastName} size="sm" />
                                  )}
                                </div>
                              )}

                              <div className={`relative group max-w-[75%] sm:max-w-[65%]`}>
                                {/* Menu button */}
                                {mine && !deleted && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setOpenMessageMenuId((p) => p === msg.id ? '' : msg.id); }}
                                    className="absolute -left-8 top-2 p-1.5 rounded-xl bg-white border border-slate-200 shadow-sm text-slate-400 opacity-0 group-hover:opacity-100 transition-all hover:text-slate-600"
                                    aria-label="Options"
                                  >
                                    <MoreVertical className="w-3 h-3" />
                                  </button>
                                )}

                                {/* Dropdown menu */}
                                {mine && !deleted && openMessageMenuId === msg.id && (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="slide-down absolute left-0 -translate-x-full -ml-2 bottom-0 w-52 rounded-2xl border border-slate-200 bg-white shadow-2xl py-1.5 z-20"
                                  >
                                    <button
                                      disabled={Boolean(deletingMessageId)}
                                      onClick={() => handleDeleteMessage(msg.id, 'me')}
                                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      Supprimer pour moi
                                    </button>
                                    {msg.canDeleteForEveryone && (
                                      <button
                                        disabled={Boolean(deletingMessageId)}
                                        onClick={() => handleDeleteMessage(msg.id, 'everyone')}
                                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                        Supprimer pour tous
                                      </button>
                                    )}
                                  </div>
                                )}

                                {/* Bubble */}
                                <div className={`rounded-2xl px-4 py-2.5 shadow-sm ${
                                  mine
                                    ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white rounded-br-sm'
                                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                                }`}>
                                  {deleted ? (
                                    <p className={`text-sm italic flex items-center gap-1.5 ${mine ? 'text-emerald-100' : 'text-slate-400'}`}>
                                      <Trash2 className="w-3.5 h-3.5" />
                                      Message supprimé
                                    </p>
                                  ) : (
                                    <>
                                      {msg.content != null && (
                                        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                                          {safeText(msg.content)}
                                        </p>
                                      )}
                                      {msg.attachmentUrl && (
                                        isAudioAttachment(msg) ? (
                                          <audio controls className="mt-2 max-w-full h-8 rounded-lg">
                                            <source src={attachUrl} type={msg.attachmentType || 'audio/webm'} />
                                          </audio>
                                        ) : (
                                          <a href={attachUrl} target="_blank" rel="noreferrer"
                                            className={`inline-flex items-center gap-1.5 mt-2 text-xs underline ${mine ? 'text-emerald-100' : 'text-emerald-600'}`}>
                                            <Paperclip className="w-3 h-3" />
                                            {safeText(msg.attachmentName) || 'Pièce jointe'}
                                          </a>
                                        )
                                      )}
                                    </>
                                  )}

                                  {/* Meta row */}
                                  <div className={`flex items-center justify-end gap-1.5 mt-1 ${mine ? 'text-emerald-100' : 'text-slate-400'} text-[10px]`}>
                                    <span>{formatTime(msg.createdAt)}</span>
                                    {mine && (
                                      msg.isRead
                                        ? <CheckCheck className="w-3 h-3 text-white" />
                                        : msg.deliveredAt
                                          ? <CheckCheck className="w-3 h-3 opacity-60" />
                                          : <Check className="w-3 h-3 opacity-50" />
                                    )}
                                  </div>
                                </div>

                                {/* Report button for received messages */}
                                {!mine && !deleted && (
                                  <button
                                    onClick={() => handleReport({ conversationId: activeConversation.id, messageId: msg.id })}
                                    className="mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] text-slate-400 hover:text-amber-600 px-1"
                                  >
                                    <AlertTriangle className="w-2.5 h-2.5" />
                                    Signaler
                                  </button>
                                )}
                              </div>

                              {/* My avatar */}
                              {mine && (
                                <Avatar firstName="Moi" lastName="" size="sm" online={undefined} />
                              )}
                            </div>
                          );
                        })}

                        {/* Typing indicator */}
                        {typingUsers.length > 0 && (
                          <div className="flex items-end gap-2">
                            <Avatar firstName={otherParticipant?.firstName} lastName={otherParticipant?.lastName} size="sm" />
                            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-2 py-1 shadow-sm">
                              <TypingDots />
                              <p className="text-[10px] text-slate-400 px-1">{typingLabel} écrit…</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    <div ref={endRef} />
                  </div>

                  {/* ─── Input bar ─── */}
                  <div className="bg-white border-t border-slate-100 p-3">
                    {isActiveUserBlocked && (
                      <div className="mb-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
                        <Ban className="w-4 h-4 shrink-0" />
                        Cet utilisateur est bloqué. Débloquez-le pour reprendre la messagerie.
                      </div>
                    )}

                    {attachment && (
                      <div className="mb-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
                        <Paperclip className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[200px]">{attachment.name}</span>
                        <button onClick={() => setAttachment(null)} className="text-emerald-500 hover:text-emerald-700">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <div className="flex items-end gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,.pdf,.webm,.ogg,.mp3,.wav,.m4a,.aac,audio/*"
                        className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) setAttachment(f); }}
                      />

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-11 w-11 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors shrink-0"
                        aria-label="Pièce jointe"
                      >
                        <Paperclip className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                        className={`h-11 w-11 rounded-2xl border flex items-center justify-center shrink-0 transition-all ${
                          isRecording
                            ? 'bg-red-50 border-red-200 text-red-500 animate-pulse'
                            : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-500'
                        }`}
                        aria-label={isRecording ? 'Arrêter' : 'Enregistrer un vocal'}
                      >
                        {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </button>

                      <div className="flex-1 relative">
                        <textarea
                          value={draft}
                          disabled={isActiveUserBlocked}
                          onChange={(e) => {
                            setDraft(e.target.value);
                            if (e.target.value.trim()) startTyping(); else stopTyping();
                          }}
                          onKeyDown={handleTextareaKeyDown}
                          placeholder={isActiveUserBlocked ? 'Messagerie désactivée' : 'Votre message… (Entrée pour envoyer)'}
                          rows={1}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 resize-none focus:bg-white focus:border-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ maxHeight: '120px', overflowY: 'auto' }}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleSendMessage}
                        disabled={isActiveUserBlocked || sending || (!draft.trim() && !attachment)}
                        className="h-11 w-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-200 transition-all hover:shadow-emerald-300 hover:scale-105 disabled:opacity-40 disabled:scale-100 disabled:shadow-none shrink-0"
                        aria-label="Envoyer"
                      >
                        {sending
                          ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                          : <Send className="w-4 h-4" />
                        }
                      </button>
                    </div>
                  </div>
                </>
              )}
            </main>
          </div>
        </div>
      </div>
    </>
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
