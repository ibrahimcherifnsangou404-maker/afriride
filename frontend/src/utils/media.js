import { API_BASE_URL } from '../services/api';

export const resolveMediaUrl = (path) => {
  if (!path) return null;
  return /^https?:\/\//i.test(path) ? path : `${API_BASE_URL}${path}`;
};
