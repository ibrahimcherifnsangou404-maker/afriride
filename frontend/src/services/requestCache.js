const cacheStore = new Map();
const inflightStore = new Map();

const normalizeKey = (key) => {
  if (typeof key === 'string') return key;
  return JSON.stringify(key);
};

export const getCachedData = (key) => {
  const normalizedKey = normalizeKey(key);
  const entry = cacheStore.get(normalizedKey);

  if (!entry) return undefined;
  if (entry.expiresAt <= Date.now()) {
    cacheStore.delete(normalizedKey);
    return undefined;
  }

  return entry.data;
};

export const setCachedData = (key, data, ttl = 30000) => {
  const normalizedKey = normalizeKey(key);
  cacheStore.set(normalizedKey, {
    data,
    expiresAt: Date.now() + ttl
  });
  return data;
};

export const fetchCachedData = async ({ key, queryFn, ttl = 30000, force = false }) => {
  const normalizedKey = normalizeKey(key);

  if (!force) {
    const cached = getCachedData(normalizedKey);
    if (typeof cached !== 'undefined') {
      return cached;
    }
  }

  if (inflightStore.has(normalizedKey)) {
    return inflightStore.get(normalizedKey);
  }

  const request = Promise.resolve()
    .then(queryFn)
    .then((data) => {
      setCachedData(normalizedKey, data, ttl);
      return data;
    })
    .finally(() => {
      inflightStore.delete(normalizedKey);
    });

  inflightStore.set(normalizedKey, request);
  return request;
};

export const prefetchCachedData = async (options) => {
  try {
    await fetchCachedData(options);
  } catch {
    // Prefetch should stay silent and never block navigation.
  }
};

export const invalidateCachedData = (matcher) => {
  if (!matcher) {
    cacheStore.clear();
    inflightStore.clear();
    return;
  }

  for (const key of cacheStore.keys()) {
    if (typeof matcher === 'string' ? key.startsWith(matcher) : matcher(key)) {
      cacheStore.delete(key);
    }
  }

  for (const key of inflightStore.keys()) {
    if (typeof matcher === 'string' ? key.startsWith(matcher) : matcher(key)) {
      inflightStore.delete(key);
    }
  }
};
