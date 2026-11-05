'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Home, Users, Music2, Play, BookOpen, Mic2, Search } from 'lucide-react';

import HomeSection from '@/components/sections/HomeSection';
import ArtistsSection from '@/components/sections/ArtistsSection';
import MusicSection from '@/components/sections/MusicSection';
import VideosSection from '@/components/sections/VideosSection';
import StoriesSection from '@/components/sections/StoriesSection';
import JoinSection from '@/components/sections/JoinSection';

/* ── Nav config — hash is what appears in the URL ── */
const NAV = [
  { id: 'home', label: 'Discover', Icon: Home, hash: '' },
  { id: 'artists', label: 'Artists', Icon: Users, hash: 'artists' },
  { id: 'music', label: 'Music', Icon: Music2, hash: 'music' },
  { id: 'videos', label: 'Videos', Icon: Play, hash: 'videos' },
  { id: 'stories', label: 'Stories', Icon: BookOpen, hash: 'stories' },
  { id: 'join', label: 'Join', Icon: Mic2, hash: 'join' },
] as const;

type SectionId = (typeof NAV)[number]['id'];

function hashToSection(hash: string): SectionId {
  const clean = hash.replace('#', '');
  return (NAV.find((n) => n.hash === clean)?.id ?? 'home') as SectionId;
}

export default function AppShell() {
  const [active, setActive] = useState<SectionId>('home');
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = React.useRef<HTMLDivElement>(null);

  /* Close search when clicking outside */
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    }
    if (searchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [searchOpen]);

  /* On first load, read the hash so a shared/bookmarked URL works */
  useEffect(() => {
    setActive(hashToSection(window.location.hash));
  }, []);

  /* Keep in sync when the user hits back / forward in the browser */
  useEffect(() => {
    const fn = () => setActive(hashToSection(window.location.hash));
    window.addEventListener('hashchange', fn);
    return () => window.removeEventListener('hashchange', fn);
  }, []);

  /* Navigate: update URL hash + active state */
  function navigate(id: SectionId) {
    const nav = NAV.find((n) => n.id === id)!;
    window.location.hash = nav.hash;   /* updates URL → e.g. /#artists */
    setActive(id);
  }

  function renderSection() {
    switch (active) {
      case 'home': return <HomeSection onNav={navigate} />;
      case 'artists': return <ArtistsSection />;
      case 'music': return <MusicSection />;
      case 'videos': return <VideosSection />;
      case 'stories': return <StoriesSection />;
      case 'join': return <JoinSection />;
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        overflow: 'hidden',
        background: 'var(--bg)',
      }}
    >
      {/* ══ TOP BAR ══ */}
      <header
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          height: 'var(--topbar)',
          padding: '0 16px',
          background: 'var(--bg)',
          zIndex: 40,
        }}
      >
        {/* Logo */}
        <button
          onClick={() => navigate('home')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0,
          }}
          aria-label="Home"
        >
          <div style={{ position: 'relative', width: 30, height: 30, flexShrink: 0 }}>
            <Image src="/FOMO VIBEZ  Logo.png" alt="atbriz" fill sizes="30px" className="object-contain" priority />
          </div>
          <span style={{ fontWeight: 900, fontSize: 13, letterSpacing: '2.2px', color: 'var(--t1)', whiteSpace: 'nowrap' }}>
            atbriz
          </span>
        </button>

        {/* Spacer to push search and join to the right */}
        <div style={{ flex: 1 }} />

        {/* Search icon button - expands when clicked */}
        <div ref={searchRef} className="search-container" style={{ position: 'relative', marginRight: 14 }}>
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--r2)',
              border: 'none',
              background: 'var(--surface)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 180ms',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'var(--surface)';
            }}
          >
            <Search size={16} style={{ color: 'var(--t2)' }} />
          </button>

          {/* Expandable search input */}
          {searchOpen && (
            <div
              className="search-dropdown"
              style={{
                position: 'absolute',
                top: 44,
                right: 0,
                zIndex: 50,
              }}
            >
              <input
                className="search-input"
                type="search"
                placeholder="Search artists, songs, genres…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
                style={{
                  width: '280px',
                  paddingLeft: 12,
                  paddingRight: 12,
                  paddingTop: 10,
                  paddingBottom: 10,
                  background: '#FFFFFF',
                  color: 'var(--t1)',
                  border: 'none',
                  borderRadius: 'var(--r2)',
                  fontSize: 13,
                  outline: 'none',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                }}
              />
            </div>
          )}
        </div>

        {/* Page indicator - shows current section (hidden on desktop) */}
        <div className="page-indicator" style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            {NAV.find((n) => n.id === active)?.label || 'Discover'}
          </span>
        </div>

        {/* Join button */}
        <button
          onClick={() => navigate('join')}
          className="btn btn-terracotta btn-sm"
          style={{ flexShrink: 0 }}
        >
          <Mic2 size={12} />
          Join
        </button>
      </header>

      {/* ══ MAIN CONTENT ══ */}
      <main id="main-content" style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
        <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
          {renderSection()}
        </div>
      </main>

      {/* ══ BOTTOM NAV ══ */}
      <nav
        className="bottom-nav"
        aria-label="Main navigation"
        style={{
          flexShrink: 0,
          display: 'flex',
          width: '100%',
          height: 'var(--nav-h)',
          background: 'var(--bg)',
          zIndex: 40,
        }}
      >
        {NAV.map(({ id, label, Icon }) => {
          const on = active === id;
          return (
            <button
              key={id}
              onClick={() => navigate(id)}
              aria-current={on ? 'page' : undefined}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: on ? 'var(--gold)' : 'var(--t3)',
                padding: '6px 4px',
                transition: 'color 180ms',
                position: 'relative',
              }}
            >
              {on && (
                <span
                  style={{
                    position: 'absolute',
                    top: 0, left: '50%',
                    transform: 'translateX(-50%)',
                    width: 28, height: 2,
                    borderRadius: '0 0 2px 2px',
                    background: 'var(--gold)',
                  }}
                />
              )}
              <Icon size={20} />
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.4px', lineHeight: 1 }}>
                {label.toUpperCase()}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
