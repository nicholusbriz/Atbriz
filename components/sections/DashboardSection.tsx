'use client';

import { useEffect, useState } from 'react';
import { useAuth, signOut } from '@/lib/auth-client';
import { LayoutDashboard, MapPin, Mail, Loader, LogOut } from 'lucide-react';

interface MeAccess {
  role: string;
  email: string | null;
  location: {
    district: string | null;
    subcounty: string | null;
    parish: string | null;
    village: string | null;
    villageType: 'village' | 'cell' | null;
  };
}

export default function DashboardSection() {
  const { user, isLoading } = useAuth();
  const [me, setMe] = useState<MeAccess | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoading || !user) { setLoading(false); return; }
    let active = true;
    fetch('/api/me/pages', { cache: 'no-store' })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Failed');
        return data as MeAccess;
      })
      .then((d) => { if (active) setMe(d); })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user, isLoading]);

  if (isLoading || loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', height: '100%', color: '#64748b', fontSize: '13px' }}>
        <Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: '40px 16px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
        Please sign in to view your dashboard.
      </div>
    );
  }

  const loc = me?.location;
  const locationLine = [
    loc?.village ? `${loc.village}${loc.villageType ? ` (${loc.villageType})` : ''}` : null,
    loc?.parish,
    loc?.subcounty,
    loc?.district,
  ].filter(Boolean).join(', ');

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#f8fafc', padding: '24px 16px' }}>
      <div style={{ maxWidth: '520px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '52px', height: '52px', borderRadius: '50%', background: '#eff6ff' }}>
            <LayoutDashboard size={24} style={{ color: '#2563eb' }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
              Hello, {user.username ?? 'there'}
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748b' }}>
              Role: {me?.role ?? user.role ?? 'user'}
            </p>
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px' }}>
          <p style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Your location
          </p>
          {locationLine ? (
            <p style={{ margin: 0, fontSize: '14px', color: '#0f172a', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <MapPin size={15} style={{ color: '#2563eb', flexShrink: 0, marginTop: 2 }} />
              {locationLine}
            </p>
          ) : (
            <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>No location on record.</p>
          )}
          {me?.email && (
            <p style={{ margin: '10px 0 0', fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail size={12} /> {me.email}
            </p>
          )}
        </div>

        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          style={{
            marginTop: '16px', width: '100%', padding: '11px', borderRadius: '8px',
            background: '#fff', color: '#dc2626', border: '1px solid #fecaca',
            fontSize: '14px', fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}
        >
          <LogOut size={15} /> Sign out
        </button>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
