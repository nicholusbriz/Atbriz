'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';
import SessionsPanel from '@/components/admin/role/SessionsPanel';
import AnalyticsPanel from '@/components/admin/role/AnalyticsPanel';
import { GATED_SECTIONS, SECTION_ACCESS, PERMISSIONS } from '@/lib/access-map';

interface RoleItem {
  name: string;
  description?: string;
  permissions: string[];
}

const PERM_ACCENT = { on: '#059669', bg: '#ecfdf5', new: '#d97706', newBg: '#fffbeb', removed: '#e11d48', removedBg: '#fff1f2' };

function PermRow({
  label, checked, saved, disabled, onToggle,
}: {
  label: string;
  checked: boolean;
  saved: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  const isNew = checked && !saved;
  const isRemoved = !checked && saved;
  const color = isNew ? PERM_ACCENT.new : isRemoved ? PERM_ACCENT.removed : checked ? PERM_ACCENT.on : '#334155';
  const bg = isNew ? PERM_ACCENT.newBg : isRemoved ? PERM_ACCENT.removedBg : checked ? PERM_ACCENT.bg : 'transparent';

  return (
    <label
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '9px 10px', borderRadius: '6px', cursor: disabled ? 'not-allowed' : 'pointer',
        background: bg, opacity: disabled ? 0.6 : 1, transition: 'background 0.15s',
        userSelect: 'none',
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onToggle}
        style={{ width: 16, height: 16, accentColor: color, cursor: disabled ? 'not-allowed' : 'pointer', flexShrink: 0 }}
      />
      <span style={{ fontSize: '14px', fontWeight: 500, color }}>
        {label}
        {isNew && <span style={{ marginLeft: 8, fontSize: '10px', fontWeight: 700, color: '#b45309', background: '#fef3c7', padding: '2px 6px', borderRadius: '4px' }}>NEW</span>}
        {isRemoved && <span style={{ marginLeft: 8, fontSize: '10px', fontWeight: 700, color: '#be123c', background: '#ffe4e6', padding: '2px 6px', borderRadius: '4px' }}>REMOVED</span>}
      </span>
    </label>
  );
}

export default function PagesSection() {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [tab, setTab] = useState<'sessions' | 'roles' | 'analytics'>('sessions');
  const [checkedPerms, setCheckedPerms] = useState<Set<string>>(new Set());
  const [savedPerms, setSavedPerms] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/admin/roles', { cache: 'no-store' })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Could not load roles');
        return data.roles as RoleItem[];
      })
      .then((items) => {
        if (!active) return;
        setRoles(items);
        if (items.length > 0) selectRole(items[0].name, items);
      })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : 'Could not load roles'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const isDevRole = selectedRole === 'dev';

  function selectRole(name: string, list: RoleItem[] = roles) {
    setSelectedRole(name);
    setSaved(false);
    setError('');
    const role = list.find((r) => r.name === name);
    // dev implicitly has every permission — show all checked and locked
    const perms = name === 'dev' ? PERMISSIONS.map((p) => p.id) : (role?.permissions ?? []);
    setCheckedPerms(new Set(perms));
    setSavedPerms(new Set(perms));
  }

  function togglePerm(id: string) {
    if (isDevRole) return;
    setSaved(false);
    setCheckedPerms((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const hasChanges =
    [...checkedPerms].some((id) => !savedPerms.has(id)) ||
    [...savedPerms].some((id) => !checkedPerms.has(id));

  async function handleSave() {
    if (!selectedRole) return;
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const res = await fetch('/api/admin/pages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole, permissions: [...checkedPerms] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not save permissions');

      setRoles((current) => current.map((r) => (r.name === selectedRole ? { ...r, permissions: data.role.permissions } : r)));
      setSavedPerms(new Set(data.role.permissions ?? []));
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save permissions');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ height: '100%', minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', background: '#f8fafc', padding: '8px' }}>
      <div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '48px', color: '#64748b', fontSize: '14px' }}>
            <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading…
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
              {([['sessions', 'Sessions'], ['roles', 'Roles'], ['analytics', 'Analytics']] as const).map(([id, label]) => {
                const on = tab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTab(id)}
                    style={{
                      padding: '8px 18px', borderRadius: '8px', cursor: 'pointer',
                      border: on ? '1px solid #0f172a' : '1px solid #e2e8f0',
                      background: on ? '#0f172a' : '#ffffff',
                      color: on ? '#ffffff' : '#475569',
                      fontSize: '13px', fontWeight: 700,
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {tab === 'sessions' ? (
              <SessionsPanel />
            ) : tab === 'analytics' ? (
              <AnalyticsPanel />
            ) : (
            <>
            {/* Role tabs */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
              {roles.map((role) => {
                const on = role.name === selectedRole;
                return (
                  <button
                    key={role.name}
                    type="button"
                    onClick={() => selectRole(role.name)}
                    style={{
                      padding: '8px 16px', borderRadius: '999px', cursor: 'pointer',
                      border: on ? '1px solid #0f172a' : '1px solid #e2e8f0',
                      background: on ? '#0f172a' : '#ffffff',
                      color: on ? '#ffffff' : '#475569',
                      fontSize: '13px', fontWeight: 700,
                      transition: 'all 0.15s',
                    }}
                  >
                    {role.name}
                  </button>
                );
              })}
            </div>

            {isDevRole && (
              <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#64748b' }}>
                dev always has full access — locked.
              </p>
            )}

            {/* Permissions grouped by section — plain list, no cards */}
            <div>
              {GATED_SECTIONS.map((section) => {
                // only show permissions for sections this role can actually access
                if (!isDevRole && !(SECTION_ACCESS[selectedRole] ?? []).includes(section.id)) return null;
                const sectionPerms = PERMISSIONS.filter((p) => p.section === section.id);
                if (sectionPerms.length === 0) return null;
                return (
                  <div key={section.id} style={{ marginBottom: '8px' }}>
                    <p style={{
                      margin: '10px 0 2px', fontSize: '11px', fontWeight: 800,
                      color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px',
                    }}>
                      {section.label}
                    </p>
                    {sectionPerms.map((p) => (
                      <PermRow
                        key={p.id}
                        label={p.label}
                        checked={checkedPerms.has(p.id)}
                        saved={savedPerms.has(p.id)}
                        disabled={isDevRole}
                        onToggle={() => togglePerm(p.id)}
                      />
                    ))}
                  </div>
                );
              })}
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', padding: '10px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px' }}>
                <AlertCircle size={15} style={{ color: '#dc2626', flexShrink: 0 }} />
                <p style={{ margin: 0, color: '#991b1b', fontSize: '13px' }}>{error}</p>
              </div>
            )}
            {saved && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', padding: '10px 12px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '6px' }}>
                <CheckCircle size={15} style={{ color: '#059669', flexShrink: 0 }} />
                <p style={{ margin: 0, color: '#065f46', fontSize: '13px' }}>Saved for {selectedRole}.</p>
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving || !selectedRole || isDevRole || !hasChanges}
              style={{
                marginTop: '14px', width: '100%', padding: '11px', borderRadius: '8px',
                background: '#0f172a', color: '#ffffff', border: 'none',
                fontSize: '14px', fontWeight: 700,
                cursor: saving || isDevRole || !hasChanges ? 'not-allowed' : 'pointer',
                opacity: saving || isDevRole || !hasChanges ? 0.5 : 1,
              }}
            >
              {saving ? 'Saving…' : isDevRole ? 'dev is fixed' : hasChanges ? 'Save changes' : 'No changes'}
            </button>
            </>
            )}
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
