import { useCallback } from 'react';

export const useUserHistory = (API_BASE_URL, user) => {
  const fetchUserHistory = useCallback(async () => {
    if (!user) return [];
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/api/user-history/${user.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.ok ? await res.json() : [];
  }, [API_BASE_URL, user]);

  const clearUserHistory = useCallback(async () => {
    if (!user) return;
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE_URL}/api/clear-history/${user.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  }, [API_BASE_URL, user]);

  return { fetchUserHistory, clearUserHistory };
};
