'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Play, TrendingUp, Music2 } from 'lucide-react';

const genres = ['All', 'Afrobeats', 'Hip-Hop', 'Gospel', 'Dancehall', 'Afro-pop', 'R&B'];

const tracks = [
  { id: '1', title: 'Neon Nights',    artist: 'Zara K',  genre: 'Afrobeats', image: '/images/artist-01.svg', isNew: true,  featured: true },
  { id: '2', title: 'Kampala Waves',  artist: 'Blaq J',  genre: 'Hip-Hop',   image: '/images/artist-02.svg', isNew: true,  featured: false },
  { id: '3', title: 'Rise Up',        artist: 'Nadia M', genre: 'Gospel',    image: '/images/artist-03.svg', isNew: false, featured: false },
  { id: '4', title: 'Golden Era',     artist: 'Xtra P',  genre: 'Dancehall', image: '/images/artist-04.svg', isNew: false, featured: false },
  { id: '5', title: 'Frequencies',    artist: 'Lyra D',  genre: 'Afro-pop',  image: '/images/artist-05.svg', isNew: false, featured: false },
  { id: '6', title: 'Street Vibes',   artist: 'King B',  genre: 'R&B',       image: '/images/artist-06.svg', isNew: false, featured: false },
];

export default function MusicSection() {
  const [genre, setGenre] = useState('All');
  
  // 1. Separate the featured track
  const featuredTrack = tracks.find(t => t.featured) || tracks[0];
  
  // 2. The rest of the list
  const remainingTracks = tracks.filter(t => t.id !== featuredTrack.id);
  const list = genre === 'All' ? remainingTracks : remainingTracks.filter((t) => t.genre === genre);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Injected Animations for the Music Bars & Pulsing Play */}
      <style>{`
        @keyframes bounceBar {
          0%, 100% { transform: scaleY(0.3); }
          50% { transform: scaleY(1); }
        }
        @keyframes pulseGold {
          0% { box-shadow: 0 0 0 0 rgba(212, 175, 55, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(212, 175, 55, 0); }
          100% { box-shadow: 0 0 0 0 rgba(212, 175, 55, 0); }
        }
        .music-bar {
          width: 3px;
          background-color: var(--gold);
          border-radius: 2px;
          transform-origin: bottom;
          animation: bounceBar 1.2s ease-in-out infinite;
        }
        .music-bar:nth-child(1) { animation-delay: 0.0s; height: 12px; }
        .music-bar:nth-child(2) { animation-delay: 0.2s; height: 16px; }
        .music-bar:nth-child(3) { animation-delay: 0.4s; height: 10px; }
        .music-bar:nth-child(4) { animation-delay: 0.1s; height: 14px; }
        .music-bar:nth-child(5) { animation-delay: 0.3s; height: 8px; }

        .play-btn-pulse {
          animation: pulseGold 2s infinite;
        }
      `}</style>

      {/* ── HERO: Featured Top Song (at top) ── */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          padding: '32px 20px',
          background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(8, 8, 8, 1) 100%)',
          borderBottom: '1px solid var(--border-2)',
          display: 'flex',
          alignItems: 'center',
          gap: 20,
        }}
      >
        {/* Rotating or Glowing Album Art */}
        <div style={{ position: 'relative', width: 100, height: 100, flexShrink: 0, borderRadius: 'var(--r3)', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
          <Image src={featuredTrack.image} alt={featuredTrack.title} fill sizes="100px" className="object-cover" />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <TrendingUp size={14} style={{ color: 'var(--gold)' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: 1 }}>
              Top Song Right Now
            </span>
          </div>

          <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 4 }}>
            {featuredTrack.title}
          </h2>
          <p style={{ fontSize: 13, color: 'var(--t3)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            {featuredTrack.artist}
            <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--t3)' }} />
            {featuredTrack.genre}
          </p>

          {/* Animated Play Button & Equalizer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              className="play-btn-pulse"
              style={{
                width: 48, height: 48, borderRadius: '50%', background: 'var(--gold)',
                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'transform 180ms'
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.transform = 'scale(1.1)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.transform = 'scale(1)')}
            >
              <Play size={20} fill="#080808" color="#080808" style={{ marginLeft: 2 }} />
            </button>

            {/* The bouncing music bars */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 16 }}>
              <div className="music-bar" />
              <div className="music-bar" />
              <div className="music-bar" />
              <div className="music-bar" />
              <div className="music-bar" />
            </div>
            <span style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 600 }}>Playing Now</span>
          </div>
        </div>
      </div>

      {/* ── Genre Filters ── */}
      <div className="inner" style={{ paddingTop: 12, paddingBottom: 8 }}>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
          {genres.map((g) => {
            const on = genre === g;
            return (
              <button
                key={g}
                onClick={() => setGenre(g)}
                style={{
                  flexShrink: 0, padding: '8px 16px', borderRadius: 'var(--rf)',
                  border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                  background: on ? 'var(--gold)' : 'var(--surface-2)',
                  color: on ? '#080808' : 'var(--t2)',
                  transition: 'all 180ms',
                }}
              >
                {g}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Track List - Horizontal Scroll ── */}
      <div className="inner" style={{ paddingTop: 4, paddingBottom: 12, flex: 1, overflowY: 'auto', minHeight: 0 }}>
        <div
          style={{
            display: 'flex',
            gap: 12,
            overflowX: 'auto',
            paddingBottom: 4,
            scrollbarWidth: 'none',
          }}
        >
          {list.map((t) => (
            <div
              key={t.id}
              style={{
                flexShrink: 0,
                width: 160,
                background: 'var(--surface)',
                borderRadius: 'var(--r3)',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'transform 180ms, background 180ms',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'var(--surface)';
              }}
            >
              <div style={{ position: 'relative', aspectRatio: '1/1', background: 'var(--surface-2)' }}>
                <Image src={t.image} alt={t.title} fill sizes="160px" className="object-cover" />
              </div>
              <div style={{ padding: '10px 12px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</p>
                  {t.isNew && <span className="chip chip-forest" style={{ fontSize: 9, flexShrink: 0 }}>New</span>}
                </div>
                <p style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{t.artist} · {t.genre}</p>
              </div>
            </div>
          ))}
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--t3)', marginTop: 24 }}>
          Demo tracks · Real music coming when artists upload their profiles
        </p>
      </div>
    </div>
  );
}