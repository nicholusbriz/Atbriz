'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Check, CheckCircle, Copy, Loader, Search, Users, X } from 'lucide-react';

interface AdminUser {
  id: string;
  username: string;
  email: string;
  emailVerified: boolean;
  role: string;
  location: string | null;
  createdAt: string;
}

interface RoleItem {
  name: string;
  description?: string;
}

export default function UsersSection() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [draftRoles, setDraftRoles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [savedId, setSavedId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch('/api/admin/users', { cache: 'no-store' }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Could not load users');
        return data.users as AdminUser[];
      }),
      fetch('/api/admin/roles', { cache: 'no-store' }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Could not load roles');
        return data.roles as RoleItem[];
      }),
    ])
      .then(([userList, roleList]) => {
        if (!active) return;
        setUsers(userList);
        setRoles(roleList);
        setDraftRoles(Object.fromEntries(userList.map((u) => [u.id, u.role])));
      })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : 'Could not load users'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const [district, setDistrict] = useState('');
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState(false);

  const districtCounts = users.reduce<Record<string, number>>((acc, u) => {
    const d = u.location?.split(',')[0];
    if (d) acc[d] = (acc[d] ?? 0) + 1;
    return acc;
  }, {});
  const districts = Object.keys(districtCounts).sort();
  const q = query.trim().toLowerCase();
  const searchedUsers = searched && q
    ? users.filter((u) => u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    : null;
  const visibleUsers = searchedUsers ?? (district ? users.filter((u) => u.location?.startsWith(district)) : users);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  function copyUsername(id: string, name: string) {
    navigator.clipboard.writeText(name).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  function searchUsername(name: string) {
    setQuery(name);
    setSearched(true);
  }

  async function saveRole(user: AdminUser) {
    const role = draftRoles[user.id];
    if (!role || role === user.role) return;
    setSavingId(user.id);
    setError('');
    setSavedId(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not update role');
      setUsers((current) => current.map((u) => (u.id === user.id ? { ...u, role } : u)));
      setSavedId(user.id);
      setTimeout(() => setSavedId((id) => (id === user.id ? null : id)), 2500);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update role');
      setDraftRoles((current) => ({ ...current, [user.id]: user.role }));
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div style={{ height: '100%', minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', background: '#f8fafc', padding: '16px' }}>
      <div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '48px', color: '#64748b', fontSize: '14px' }}>
            <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading users…
          </div>
        ) : (
          <>
          {/* Search */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSearched(false); }}
                onKeyDown={(e) => { if (e.key === 'Enter') setSearched(true); }}
                placeholder="Paste username or email…"
                style={{
                  width: '100%', padding: '8px 30px 8px 10px', fontSize: '13px', boxSizing: 'border-box',
                  border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none',
                }}
              />
              {query && (
                <button
                  onClick={() => { setQuery(''); setSearched(false); }}
                  style={{
                    position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                    display: 'flex', padding: '2px', border: 'none', background: 'transparent',
                    cursor: 'pointer', color: '#94a3b8',
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              onClick={() => setSearched(true)}
              disabled={!query.trim()}
              style={{
                padding: '8px 16px', fontSize: '13px', fontWeight: 700, borderRadius: '6px', border: 'none',
                background: '#0f172a', color: '#fff', cursor: query.trim() ? 'pointer' : 'not-allowed',
                opacity: query.trim() ? 1 : 0.5,
              }}
            >
              Search
            </button>
          </div>

          {/* District filter */}
          {districts.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
              <button
                onClick={() => setDistrict('')}
                style={{
                  padding: '5px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                  border: !district ? '1px solid #0f172a' : '1px solid #e2e8f0',
                  background: !district ? '#0f172a' : '#fff', color: !district ? '#fff' : '#475569',
                }}
              >
                All
              </button>
              {districts.map((d) => (
                <button
                  key={d}
                  onClick={() => setDistrict(d === district ? '' : d)}
                  style={{
                    padding: '5px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                    border: district === d ? '1px solid #2563eb' : '1px solid #e2e8f0',
                    background: district === d ? '#eff6ff' : '#fff', color: district === d ? '#1d4ed8' : '#475569',
                  }}
                >
                  {d} ({districtCounts[d]})
                </button>
              ))}
            </div>
          )}

          <div>
            {visibleUsers.map((user) => {
              const draft = draftRoles[user.id] ?? user.role;
              const dirty = draft !== user.role;
              return (
                <div
                  key={user.id}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}
                >
                  <span
                    onClick={() => searchUsername(user.username)}
                    title="Click to search"
                    style={{ fontSize: '14px', color: '#0f172a', fontWeight: 600, cursor: 'pointer' }}
                  >
                    {user.username}
                  </span>
                  <button
                    onClick={() => copyUsername(user.id, user.username)}
                    title="Copy username"
                    style={{
                      display: 'flex', alignItems: 'center', padding: '3px',
                      border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8',
                    }}
                  >
                    {copiedId === user.id ? <Check size={13} style={{ color: '#059669' }} /> : <Copy size={13} />}
                  </button>
                  {searched && user.location && (
                    <span style={{ fontSize: '12px', color: '#64748b' }}>{user.location}</span>
                  )}

                  <select
                    value={draft}
                    disabled={user.role === 'dev'}
                    onChange={(e) => {
                      setSavedId(null);
                      setDraftRoles((current) => ({ ...current, [user.id]: e.target.value }));
                    }}
                    style={{
                      padding: '4px 6px', fontSize: '13px',
                      border: dirty ? '1px solid #d97706' : '1px solid #cbd5e1',
                      color: '#0f172a', background: 'transparent', outline: 'none',
                      cursor: user.role === 'dev' ? 'not-allowed' : 'pointer',
                      opacity: user.role === 'dev' ? 0.6 : 1,
                    }}
                  >
                    {roles.map((role) => (
                      <option key={role.name} value={role.name}>{role.name}</option>
                    ))}
                  </select>

                  <button
                    onClick={() => saveRole(user)}
                    disabled={!dirty || savingId === user.id}
                    style={{
                      padding: '4px 8px', fontSize: '12px', fontWeight: 600,
                      border: 'none', background: 'transparent',
                      color: dirty ? '#0f172a' : '#cbd5e1',
                      cursor: !dirty || savingId === user.id ? 'default' : 'pointer',
                      textDecoration: dirty ? 'underline' : 'none',
                    }}
                  >
                    {savingId === user.id ? 'Saving…' : savedId === user.id ? 'Saved' : 'Save'}
                  </button>
                </div>
              );
            })}
            {visibleUsers.length === 0 && !loading && (
              <p style={{ margin: 0, padding: '32px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                {searched ? 'No users match that search.' : 'No users in this district.'}
              </p>
            )}
          </div>
          </>
        )}

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', padding: '10px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px' }}>
            <AlertCircle size={15} style={{ color: '#dc2626', flexShrink: 0 }} />
            <p style={{ margin: 0, color: '#991b1b', fontSize: '13px' }}>{error}</p>
          </div>
        )}
        {savedId && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', padding: '10px 12px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '6px' }}>
            <CheckCircle size={15} style={{ color: '#059669', flexShrink: 0 }} />
            <p style={{ margin: 0, color: '#065f46', fontSize: '13px' }}>Role updated — that user will be asked to sign in again.</p>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
