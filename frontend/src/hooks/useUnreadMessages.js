import { useCallback, useEffect, useMemo, useState } from 'react';
import { messageService } from '../services/messageService';

export function useUnreadMessages({ enabled = true, intervalMs = 15000 } = {}) {
  const [conversations, setConversations] = useState([]);

  const refreshUnread = useCallback(async () => {
    if (!enabled) return;
    try {
      const response = await messageService.getConversations();
      setConversations(response.data || []);
    } catch {
      // Silent fail for nav notification badge
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return undefined;

    const timeoutId = setTimeout(() => {
      refreshUnread();
    }, 0);
    const intervalId = setInterval(refreshUnread, intervalMs);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [enabled, intervalMs, refreshUnread]);

  const unreadCount = useMemo(
    () => conversations.reduce((sum, item) => sum + (item.unreadCount || 0), 0),
    [conversations]
  );

  return { unreadCount, refreshUnread };
}

export default useUnreadMessages;
