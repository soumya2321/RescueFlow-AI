import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { notificationApi } from '../api/notifications';
import { useAuth } from '../context/AuthContext';
export function NotificationBell() {
  const { user } = useAuth();
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    let active = true;
    setCount(null);
    if (!user) return;
    const refresh = async () => { try { const n = await notificationApi.count(); if (active) setCount(n); } catch { if (active) setCount(null); } };
    void refresh();
    const timer = window.setInterval(refresh, 30000);
    window.addEventListener('rescueflow-notifications-changed', refresh);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener('rescueflow-notifications-changed', refresh); };
  }, [user?.userId]);
  return <Link to="/notifications" aria-label={`Notifications${count === null ? '' : `, ${count} unread`}`} className="flex items-center gap-2 p-2 rounded-xl hover:bg-emerald-50 text-slate-700"><Bell className="w-5 h-5"/><span className="hidden lg:inline">Notifications</span>{count !== null && count > 0 && <span className="bg-emerald-600 text-white text-xs rounded-full px-2 py-1">{count > 99 ? '99+' : count}</span>}</Link>;
}
