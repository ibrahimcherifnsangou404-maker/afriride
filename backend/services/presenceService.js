const onlineCounters = new Map();

const markOnline = (userId) => {
  if (!userId) return 0;
  const current = onlineCounters.get(userId) || 0;
  const next = current + 1;
  onlineCounters.set(userId, next);
  return next;
};

const markOffline = (userId) => {
  if (!userId) return 0;
  const current = onlineCounters.get(userId) || 0;
  const next = Math.max(0, current - 1);
  if (next === 0) {
    onlineCounters.delete(userId);
    return 0;
  }
  onlineCounters.set(userId, next);
  return next;
};

const isUserOnline = (userId) => {
  if (!userId) return false;
  return (onlineCounters.get(userId) || 0) > 0;
};

module.exports = {
  markOnline,
  markOffline,
  isUserOnline
};
