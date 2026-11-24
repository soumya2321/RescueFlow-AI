import { useEffect, useState, useCallback, useRef } from 'react';
import { notificationApi, type RescueNotification } from '../api/notifications';
import { extractErrorMessage } from '../api/client';
export function NotificationsPage() {
  const [items, setItems] = useState<RescueNotification[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const running = useRef(false);
  const refresh = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    try { const rows = await notificationApi.list(); setItems(rows); setMore(rows.length === 50); setError(''); }
    catch (e) { setError(extractErrorMessage(e)); }
    finally { running.current = false; setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); const timer = window.setInterval(refresh, 30000); return () => window.clearInterval(timer); }, [refresh]);
  async function act(id?: number) {
    if (running.current) return;
    running.current = true; setBusy(true);
    try { if (id === undefined) await notificationApi.readAll(); else await notificationApi.read(id); setItems(old => old.map(n => id === undefined || n.notificationId === id ? {...n, isRead:true} : n)); setError(''); window.dispatchEvent(new Event('rescueflow-notifications-changed')); }
    catch(e) { setError(extractErrorMessage(e)); }
    finally { running.current = false; setBusy(false); }
  }
  async function older() {
    if (running.current || !items.length) return;
    running.current = true; setBusy(true);
    try { const rows = await notificationApi.list(items[items.length-1].notificationId); setItems(old => [...old, ...rows]); setMore(rows.length === 50); setError(''); }
    catch(e) { setError(extractErrorMessage(e)); }
    finally { running.current = false; setBusy(false); }
  }
  return <section className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold text-slate-900">Notifications</h1><button disabled={busy || loading} onClick={() => void act()} className="bg-emerald-600 text-white rounded-lg px-4 py-2 disabled:opacity-50">Mark all as read</button></div>
  {error && <p role="alert" className="text-rose-700">{error} <button onClick={() => void refresh()} className="underline">Retry</button></p>}
  {loading ? <p>Loading notifications...</p> : !items.length && !error ? <p>No notifications yet.</p> : items.map(n => <article key={n.notificationId} className={`border rounded-xl p-4 ${n.isRead ? 'bg-white border-slate-200' : 'bg-emerald-50 border-emerald-200'}`}><h2 className="font-semibold">{n.title}{!n.isRead && <span className="ml-2 text-xs text-emerald-700">Unread</span>}</h2><p className="text-slate-700">{n.message}</p><div className="flex justify-between gap-2 mt-2 text-xs text-slate-500"><time>{new Date(n.createdAt.endsWith('Z') || /[+-]\d\d:\d\d$/.test(n.createdAt) ? n.createdAt : n.createdAt+'Z').toLocaleString()}</time>{!n.isRead && <button disabled={busy} onClick={() => void act(n.notificationId)} className="text-emerald-700 underline">Mark as read</button>}</div></article>)}
  {more && <button disabled={busy} onClick={() => void older()} className="border rounded-lg px-4 py-2">Load older notifications</button>}</section>;
}
