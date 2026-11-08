'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Loader, ScrollText } from 'lucide-react';

interface LogEntry {
  _id: string;
  type: string;
  action: string;
  actorName?: string;
  details?: Record<string, unknown>;
  ip?: string;
  createdAt: string;
}

export default function LogsSection() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [typeCounts, setTypeCounts] = useState<Record<string, number>>({});
  const [deleting, setDeleting] = useState(false);
  const [type, setType] = useState('');
  const [quickFilter, setQuickFilter] = useState<'logins' | 'registers'>('logins');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function currentParams() {
    const params = new URLSearchParams();
    if (quickFilter === 'logins') params.set('type', 'auth.login,auth.login_failed');
    else if (quickFilter === 'registers') params.set('type', 'auth.register');
    else if (type) params.set('type', type);
    return params;
  }

  function loadLogs() {
    setLoading(true);
    setError('');
    const qs = currentParams().toString();
    const url = qs ? `/api/admin/logs?${qs}` : '/api/admin/logs';
    fetch(url, { cache: 'no-store' })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Could not load logs');
        return data;
      })
      .then((data) => {
        setLogs(data.logs);
        setTypes(data.types ?? []);
        setTypeCounts(data.typeCounts ?? {});
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Could not load logs'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadLogs(); }, [type, quickFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  async function deleteLogs() {
    const label = quickFilter === 'logins' ? 'login' : quickFilter === 'registers' ? 'register' : type || 'all';
    if (!window.confirm(`Delete all ${label} logs? This cannot be undone.`)) return;
    setDeleting(true);
    setError('');
    try {
      const qs = currentParams().toString();
      const res = await fetch(`/api/admin/logs${qs ? `?${qs}` : ''}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not delete logs');
      loadLogs();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not delete logs');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div style={{ height: '100%', minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', background: '#f8fafc', padding: '16px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ScrollText size={20} style={{ color: '#2563eb' }} /> Activity Logs
          </h1>
          <button
            onClick={deleteLogs}
            disabled={deleting || logs.length === 0}
            style={{
              padding: '6px 14px', fontSize: '12px', fontWeight: 700, borderRadius: '6px',
              border: '1px solid #fecaca', background: '#fff', color: '#dc2626',
              cursor: deleting || logs.length === 0 ? 'not-allowed' : 'pointer',
              opacity: deleting || logs.length === 0 ? 0.5 : 1,
            }}
          >
            {deleting ? 'Deleting…' : 'Delete logs'}
          </button>
        </div>

        {/* Quick filters */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
          {([
            ['logins', 'Login', (typeCounts['auth.login'] ?? 0) + (typeCounts['auth.login_failed'] ?? 0)],
            ['registers', 'Register', typeCounts['auth.register'] ?? 0],
          ] as const).map(([id, label, count]) => (
            <button
              key={id}
              onClick={() => { setQuickFilter(id); setType(''); }}
              style={{
                padding: '7px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                border: quickFilter === id && !type ? '1px solid #0f172a' : '1px solid #e2e8f0',
                background: quickFilter === id && !type ? '#0f172a' : '#fff',
                color: quickFilter === id && !type ? '#fff' : '#475569',
              }}
            >
              {label} ({count})
            </button>
          ))}
        </div>

        {/* Type filter */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
          <button
            onClick={() => setType('')}
            style={{
              padding: '6px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
              border: !type ? '1px solid #0f172a' : '1px solid #e2e8f0',
              background: !type ? '#0f172a' : '#fff', color: !type ? '#fff' : '#475569',
            }}
          >
            All
          </button>
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              style={{
                padding: '6px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                border: type === t ? '1px solid #2563eb' : '1px solid #e2e8f0',
                background: type === t ? '#eff6ff' : '#fff', color: type === t ? '#1d4ed8' : '#475569',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '13px' }}>
            <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Loading logs…
          </p>
        ) : error ? (
          <p style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626', fontSize: '13px' }}>
            <AlertCircle size={14} /> {error}
          </p>
        ) : logs.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>No logs yet.</p>
        ) : (
          <div>
            {logs.map((log) => (
              <div key={log._id} style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'baseline', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#2563eb', background: '#eff6ff', padding: '2px 8px', borderRadius: '4px' }}>{log.type}</span>
                  <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: 600, flex: 1 }}>{log.action}</span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>{new Date(log.createdAt).toLocaleString()}</span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#64748b' }}>
                  {log.actorName && <>by {log.actorName} · </>}
                  {log.ip && <span style={{ fontFamily: 'monospace' }}>{log.ip}</span>}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
