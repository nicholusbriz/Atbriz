'use client';

import React, { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import Image from 'next/image';
import {
  Home, MapPin, BarChart2, Bell, BookOpen, AlertCircle,
  Search, X, ShieldCheck, DatabaseZap, ChevronDown, FileText, UserPlus, Layers, Users, ScrollText, LayoutDashboard,
} from 'lucide-react';

import HomeSection from '@/components/sections/HomeSection';
import ReportsSection from '@/components/sections/ReportsSection';
import DistrictsSection from '@/components/sections/DistrictsSection';
import UpdatesSection from '@/components/sections/UpdatesSection';
import StoriesSection from '@/components/sections/StoriesSection';
import SubmitSection from '@/components/sections/SubmitSection';
import AuthSection from '@/components/sections/AuthSection';
import { useAuth } from '@/lib/auth-client';
import SyncSection from '@/components/admin/SyncSection';
import AdminReportsSection from '@/components/admin/ReportsSection';
import UsersSection from '@/components/admin/role/UsersSection';
import LogsSection from '@/components/admin/LogsSection';
import DashboardSection from '@/components/sections/DashboardSection';
import PagesSection from '@/components/admin/role/PagesSection';
import { GATED_SECTIONS, SECTION_ACCESS, type GatedSectionId } from '@/lib/access-map';

// ─── Bottom nav (public sections only) ───────────────────────────────────────
const NAV = [
  { id: 'home', label: 'Home', Icon: Home, hash: '' },
  { id: 'reports', label: 'Reports', Icon: BarChart2, hash: 'reports' },
  { id: 'districts', label: 'Districts', Icon: MapPin, hash: 'districts' },
  { id: 'updates', label: 'Updates', Icon: Bell, hash: 'updates' },
  { id: 'stories', label: 'Stories', Icon: BookOpen, hash: 'stories' },
  { id: 'submit', label: 'Report', Icon: AlertCircle, hash: 'report' },
] as const;

// ─── Gated section icons (which sections exist is driven by lib/sections.ts) ──
const ADMIN_ICONS: Record<GatedSectionId, typeof FileText> = {
  'admin-reports': FileText,
  sync: DatabaseZap,
  roles: Layers,
  users: Users,
  logs: ScrollText,
  dashboard: LayoutDashboard,
};

type PublicSectionId = (typeof NAV)[number]['id'];
type AdminSectionId = GatedSectionId;
type SectionId = PublicSectionId | AdminSectionId | 'register';

const ALL_HASHES: { id: SectionId; hash: string }[] = [
  ...NAV.map((n) => ({ id: n.id as SectionId, hash: n.hash })),
  ...GATED_SECTIONS.map((s) => ({ id: s.id as SectionId, hash: s.hash })),
  { id: 'register' as SectionId, hash: 'register' },
];

function hashToSection(hash: string): SectionId {
  const clean = hash.replace('#', '');
  return (ALL_HASHES.find((n) => n.hash === clean)?.id ?? 'home') as SectionId;
}

function isAdminSection(id: SectionId): id is AdminSectionId {
  return GATED_SECTIONS.some((s) => s.id === id);
}

function subscribeToLocationHash(onChange: () => void) {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

function getLocationHash() {
  return window.location.hash;
}

function getServerLocationHash() {
  return '';
}

export default function AppShell() {
  const active = hashToSection(useSyncExternalStore(
    subscribeToLocationHash,
    getLocationHash,
    getServerLocationHash,
  ));
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, status: authStatus } = useAuth();

  // Section access is hardcoded per role in lib/access-map.ts (SECTION_ACCESS)
  const roleName = user?.role ?? '';
  const canOpen = (id: string) => roleName === 'dev' || (SECTION_ACCESS[roleName] ?? []).includes(id);
  const allowedPages = new Set(GATED_SECTIONS.filter((s) => canOpen(s.id)).map((s) => s.id));
  const accessLoading = authStatus === 'loading';
  const hasGatedAccess = allowedPages.size > 0;

  const searchRef = useRef<HTMLDivElement>(null);
  const adminRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  // Close overlays on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
      if (adminRef.current && !adminRef.current.contains(e.target as Node)) setAdminOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // ── UI-only: shadow under header when the inner scroll is past 4px ──
  useEffect(() => {
    const el = mainRef.current?.firstElementChild as HTMLElement | null;
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 4);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  function navigate(id: SectionId) {
    const found = ALL_HASHES.find((n) => n.id === id);
    const hash = found?.hash ?? '';
    if (window.location.hash !== `#${hash}`) window.location.hash = hash;
    setAdminOpen(false);
  }

  function renderSection() {
    // ── Protected sections: gated by the role's allowed pages ──
    if (isAdminSection(active)) {
      const checking = accessLoading;
      if (checking) {
        return (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t3)', fontSize: 13 }}>
            Checking access…
          </div>
        );
      }
      if (!allowedPages.has(active)) {
        // Role not allowed → show the auth section instead
        return <AuthSection />;
      }
    }

    switch (active) {
      case 'home': return <HomeSection onNav={(id) => navigate(id as SectionId)} />;
      case 'reports': return <ReportsSection />;
      case 'districts': return <DistrictsSection />;
      case 'updates': return <UpdatesSection />;
      case 'stories': return <StoriesSection />;
      case 'submit': return <SubmitSection />;
      case 'register': return <AuthSection />;
      // ── admin sections ──
      case 'sync': return <SyncSection />;
      case 'admin-reports': return <AdminReportsSection />;
      case 'roles': return <PagesSection />;
      case 'users': return <UsersSection />;
      case 'logs': return <LogsSection />;
      case 'dashboard': return <DashboardSection />;
    }
  }

  const adminActive = isAdminSection(active);

  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column',
        height: '100dvh', overflow: 'hidden',
        background: 'var(--bg)',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >

      {/* ══ TOP BAR ══ */}
      <header className="app-topbar" style={{
        flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8,
        height: 'var(--topbar)', padding: '0 14px',
        background: 'var(--bg)',
        borderBottom: '1px solid var(--border)',
        boxShadow: scrolled ? '0 1px 0 rgba(0,0,0,0.03), 0 4px 12px rgba(0,0,0,0.05)' : 'none',
        transition: 'box-shadow 200ms ease',
        zIndex: 40,
      }}>

        {/* Logo */}
        <button
          className="app-brand"
          onClick={() => navigate('home')}
          style={{ display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0, height: 'var(--topbar)' }}
          aria-label="VoiceUG Home"
        >
          <div className="app-brand-logo" style={{ position: 'relative', height: 44, width: 44, flexShrink: 0 }}>
            <Image
              src="/voice uganda logo.png"
              alt="VoiceUG"
              fill
              sizes="44px"
              className="object-contain"
              priority
            />
          </div>
          <div className="app-brand-name" style={{ display: 'flex', flexDirection: 'column', lineHeight: 1, marginLeft: 6 }}>
            <span style={{ fontWeight: 900, fontSize: 15, letterSpacing: '0.3px', color: 'var(--t1)' }}>Voice</span>
            <span style={{ fontWeight: 800, fontSize: 9, letterSpacing: '3px', color: 'var(--crimson)', textTransform: 'uppercase', marginTop: 1 }}>Uganda</span>
          </div>
        </button>

        <div style={{ flex: searchOpen ? 0 : 1 }} />

        {/* Search */}
        <div
          ref={searchRef}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: searchOpen ? 6 : 0,
            flex: searchOpen ? 1 : '0 0 36px',
            minWidth: 36,
            maxWidth: searchOpen ? 420 : undefined,
            marginLeft: searchOpen ? 'auto' : 0,
            transition: 'flex 180ms ease',
          }}
        >
          {searchOpen && (
            <input
              type="search"
              placeholder="Search districts, complaints…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              style={{
                flex: 1,
                minWidth: 0,
                width: '100%',
                padding: '10px 12px',
                background: 'var(--surface)',
                color: 'var(--t1)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r2)',
                fontSize: 13.5,
                outline: 'none',
                boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
              }}
            />
          )}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            aria-label={searchOpen ? 'Close search' : 'Open search'}
            type="button"
            style={{
              width: 36, height: 36, flex: '0 0 36px', borderRadius: 'var(--r2)',
              border: '1px solid var(--border)',
              background: searchOpen ? 'var(--surface-2)' : 'var(--surface)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 180ms, border-color 180ms',
            }}
          >
            {searchOpen ? <X size={15} color="var(--t2)" /> : <Search size={15} color="var(--t2)" />}
          </button>
        </div>

        {/* Follow up / account CTA */}
        <button
          className="app-join-button"
          onClick={() => navigate(user ? 'dashboard' : 'register')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            height: 36, padding: '0 14px',
            background: 'var(--surface)', color: 'var(--t1)',
            border: '1px solid var(--border)', borderRadius: 'var(--rf)',
            fontSize: 12, fontWeight: 700,
            cursor: 'pointer', flexShrink: 0,
            transition: 'background 180ms, border-color 180ms',
          }}
        >
          <FileText size={13} />
          <span>My reports</span>
        </button>

        {/* Report CTA */}
        <button
          className="app-report-button"
          onClick={() => navigate('submit')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            height: 36, padding: '0 14px',
            background: 'var(--crimson)', color: '#fff',
            border: 'none', borderRadius: 'var(--rf)',
            fontSize: 12, fontWeight: 700,
            cursor: 'pointer', flexShrink: 0,
            boxShadow: '0 1px 2px rgba(184,72,74,0.25)',
            transition: 'transform 120ms ease, box-shadow 180ms ease',
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <AlertCircle size={13} />
          <span>Report</span>
        </button>
      </header>

      {/* ══ MAIN ══ */}
      <main style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
        <div
          ref={mainRef}
          style={{
            width: '100%', height: '100%',
            overflow: 'hidden',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {renderSection()}
        </div>
      </main>

      {/* ══ BOTTOM NAV ══ */}
      <nav aria-label="Main navigation" style={{
        flexShrink: 0, display: 'flex', width: '100%', height: 42,
        background: 'var(--bg)',
        borderTop: '1px solid var(--border)',
        zIndex: 40,
      }}>
        {NAV.slice(0, 3).map(({ id, label }) => {
          const on = active === id;
          return (
            <button
              key={id}
              onClick={() => navigate(id)}
              aria-current={on ? 'page' : undefined}
              style={{
                flex: 1, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                border: 'none', background: 'transparent', cursor: 'pointer',
                color: on ? 'var(--crimson)' : 'var(--t3)',
                padding: '4px 2px', transition: 'color 150ms',
                fontSize: 11, fontWeight: on ? 800 : 600,
              }}
            >
              {label}
            </button>
          );
        })}
        {hasGatedAccess && (
        <div ref={adminRef} style={{ position: 'relative', flex: 1, minWidth: 0 }}>
          <button
            type="button"
            className="app-bottom-admin-button"
            onClick={() => setAdminOpen((open) => !open)}
            aria-label="Admin menu"
            aria-haspopup="menu"
            aria-expanded={adminOpen}
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              border: 0,
              background: 'transparent',
              cursor: 'pointer',
              color: adminActive || adminOpen ? 'var(--crimson)' : 'var(--t3)',
              fontSize: 11,
              fontWeight: adminActive || adminOpen ? 800 : 600,
              padding: '4px 2px',
            }}
          >
            <ShieldCheck size={14} />
            <span>Admin</span>
            <ChevronDown size={10} style={{ transform: adminOpen ? 'rotate(180deg)' : undefined }} />
          </button>
          {adminOpen && (
            <div
              role="menu"
              style={{
                position: 'absolute',
                bottom: 'calc(100% + 8px)',
                left: '50%',
                zIndex: 50,
                width: 190,
                transform: 'translateX(-50%)',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r2)',
                boxShadow: '0 10px 28px rgba(0,0,0,0.10)',
                overflow: 'hidden',
              }}
            >
              <p style={{
                fontSize: 10, fontWeight: 800, color: 'var(--t3)',
                letterSpacing: '1.5px', textTransform: 'uppercase',
                padding: '10px 14px 6px',
              }}>
                Admin
              </p>
              {GATED_SECTIONS.filter((s) => allowedPages.has(s.id)).map((s) => {
                const Icon = ADMIN_ICONS[s.id];
                const on = active === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    role="menuitem"
                    onClick={() => navigate(s.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      width: '100%', padding: '10px 14px',
                      background: on ? 'rgba(184,72,74,0.06)' : 'transparent',
                      border: 'none', cursor: 'pointer', textAlign: 'left',
                      borderLeft: on ? '3px solid var(--crimson)' : '3px solid transparent',
                      transition: 'background 150ms',
                    }}
                    onMouseEnter={(event) => { if (!on) event.currentTarget.style.background = 'var(--surface-2)'; }}
                    onMouseLeave={(event) => { if (!on) event.currentTarget.style.background = 'transparent'; }}
                  >
                    <Icon size={14} style={{ color: on ? 'var(--crimson)' : 'var(--t3)', flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: on ? 'var(--crimson)' : 'var(--t1)' }}>{s.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        )}
        {NAV.slice(3).map(({ id, label }) => {
          const on = active === id;
          return (
            <button
              key={id}
              onClick={() => navigate(id)}
              aria-current={on ? 'page' : undefined}
              style={{
                flex: 1, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                border: 'none', background: 'transparent', cursor: 'pointer',
                color: on ? 'var(--crimson)' : 'var(--t3)',
                padding: '4px 2px', transition: 'color 150ms',
                fontSize: 11, fontWeight: on ? 800 : 600,
              }}
            >
              {label}
            </button>
          );
        })}
      </nav>

      <style>{`
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}