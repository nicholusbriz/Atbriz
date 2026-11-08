'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle, Loader, LogOut, Search, UserX } from 'lucide-react';

interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
}

export default function SessionsPanel() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<AdminUser[]>([]);
  const [searched, setSearched] = useState(false);
  const [busy, setBusy] = useState<'all' | string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function handleSearch() {
    const q = query.trim().toLowerCase();
    if (!q) return;
    setError('');
    setSearched(true);
    setMatches([]);
    try {
      // load the user list once, then filter client-side
      let list = users;
      if (!list) {
        const res = await fetch('/api/admin/users', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Could not load users');
        list = data.users as AdminUser[];
        setUsers(list);
      }
      setMatches(list.filter((u) => u.email.toLowerCase().includes(q) || u.username.toLowerCase().includes(q)));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Search failed');
    }
  }

  async function invalidateAll() {
    if (!window.confirm('Sign out ALL users immediately? Everyone except dev will need to log in again.')) return;
    setBusy('all');
    setError('');
    setNotice('');
    try {
      const res = await fetch('/api/admin/auth/invalidate-all', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      setNotice('All users signed out — dev stays logged in.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed');
    } finally {
      setBusy(null);
    }
  }

  async function invalidateUser(u: AdminUser) {
    setBusy(u.id);
    setError('');
    setNotice('');
    try {
      const res = await fetch('/api/admin/users/invalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: u.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      setNotice(`${u.username} was signed out.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Sign out all */}
      <div>
        <p style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Sign out everyone</p>
        <button
          onClick={invalidateAll}
          disabled={busy === 'all'}
          style={{
            width: '100%', padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: 700,
            background: '#dc2626', color: '#fff', border: 'none',
            cursor: busy === 'all' ? 'wait' : 'pointer',
          }}
        >
          {busy === 'all' ? 'Signing out…' : 'Log out all users'}
        </button>
        <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#94a3b8' }}>dev stays logged in.</p>
      </div>

      {/* Find & sign out one user */}
      <div>
        <p style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Sign out one user</p>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSearched(false); setMatches([]); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
              placeholder="Enter email or username…"
              style={{
                width: '100%', padding: '9px 10px 9px 30px', borderRadius: '6px',
                border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={!query.trim()}
            style={{
              padding: '9px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 700,
              background: '#0f172a', color: '#fff', border: 'none',
              cursor: query.trim() ? 'pointer' : 'not-allowed',
              opacity: query.trim() ? 1 : 0.5,
            }}
          >
            Search
          </button>
        </div>

        {searched && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '220px', overflowY: 'auto' }}>
            {matches.length === 0 && (
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>No users match.</p>
            )}
            {matches.map((u) => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', border: '1px solid #f1f5f9', borderRadius: '6px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{u.username}</p>
                  <p style={{ margin: 0, fontSize: '11px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email} · {u.role}</p>
                </div>
                <button
                  onClick={() => invalidateUser(u)}
                  disabled={busy === u.id || u.role === 'dev'}
                  title={u.role === 'dev' ? 'dev cannot be signed out' : 'Sign out this user'}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px',
                    borderRadius: '6px', fontSize: '11px', fontWeight: 700, border: 'none',
                    background: u.role === 'dev' ? '#e2e8f0' : '#fff1f2',
                    color: u.role === 'dev' ? '#94a3b8' : '#be123c',
                    cursor: busy === u.id || u.role === 'dev' ? 'not-allowed' : 'pointer',
                  }}
                >
                  {busy === u.id ? <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <UserX size={12} />}
                  Sign out
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px' }}>
          <AlertCircle size={15} style={{ color: '#dc2626', flexShrink: 0 }} />
          <p style={{ margin: 0, color: '#991b1b', fontSize: '13px' }}>{error}</p>
        </div>
      )}
      {notice && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '6px' }}>
          <CheckCircle size={15} style={{ color: '#059669', flexShrink: 0 }} />
          <p style={{ margin: 0, color: '#065f46', fontSize: '13px' }}>{notice}</p>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
