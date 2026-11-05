'use client';

import { useState } from 'react';
import Image from 'next/image';
import { MapPin, Music2, Play } from 'lucide-react';

const genres = ['All', 'Afrobeats', 'Hip-Hop', 'R&B', 'Dancehall', 'Afro-pop', 'Gospel'];

const artists = [
  { id: 'zara-k',  name: 'Zara K',  genre: 'Afrobeats', location: 'Kampala', image: '/images/artist-01.svg',  management: 'Starlight Ent', followers: '12.5K' },
  { id: 'blaq-j',  name: 'Blaq J',  genre: 'Hip-Hop',   location: 'Kampala', image: '/images/artist-02.svg',  management: 'Urban Vibes',   followers: '8.2K' },
  { id: 'nadia-m', name: 'Nadia M', genre: 'R&B',       location: 'Entebbe', image: '/images/artist-03.svg',  management: 'Soul Music',   followers: '15.3K' },
  { id: 'xtra-p',  name: 'Xtra P',  genre: 'Dancehall', location: 'Jinja',   image: '/images/artist-04.svg',  management: 'Fireworks',    followers: '6.7K' },
  { id: 'lyra-d',  name: 'Lyra D',  genre: 'Afro-pop',  location: 'Kampala', image: '/images/artist-05.svg',  management: 'Global Beat',  followers: '9.1K' },
  { id: 'king-b',  name: 'King B',  genre: 'Gospel',    location: 'Gulu',    image: '/images/artist-06.svg',  management: 'Grace Records', followers: '11.4K' },
];

export default function ArtistsSection() {
  const [genre, setGenre] = useState('All');
  
  // 1. Separate the featured artist from the rest
  const featuredArtist = artists[0]; 
  const remainingArtists = artists.slice(1); 
  const list = genre === 'All' ? remainingArtists : remainingArtists.filter((a) => a.genre === genre);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── HERO BANNER (Featured Artist - at top) ── */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          padding: '50px 20px',
          background: 'linear-gradient(135deg, #1f1f1f 0%, #0a0a0a 100%)',
          borderBottom: '2px solid var(--gold)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <div style={{ zIndex: 10 }}>
          <p style={{ color: 'var(--gold)', fontSize: 12, fontWeight: 'bold', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 2 }}>
            Featured Artist
          </p>
          <h1 style={{ fontSize: 36, fontWeight: 900, color: 'white', marginBottom: 12, lineHeight: 1.1 }}>
            {featuredArtist.name}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <span style={{ fontSize: 14, color: '#ccc', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Music2 size={16} style={{ color: 'var(--gold)' }} /> {featuredArtist.genre}
            </span>
            <span style={{ fontSize: 14, color: '#ccc', display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={16} /> {featuredArtist.location}
            </span>
          </div>

          <button style={{
            background: 'var(--gold)', color: '#000', border: 'none', padding: '12px 24px',
            borderRadius: 99, fontWeight: 'bold', fontSize: 15, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
          }}>
            <Play size={18} fill="#000" /> Listen Now
          </button>
        </div>
      </div>

      {/* ── FILTERS & GRID ── */}
      <div className="inner" style={{ paddingTop: 12, paddingBottom: 12, flex: 1, overflowY: 'auto', minHeight: 0 }}>
        
        {/* Genre Filters */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, scrollbarWidth: 'none' }}>
          {genres.map((g) => {
            const on = genre === g;
            return (
              <button
                key={g}
                onClick={() => setGenre(g)}
                style={{
                  flexShrink: 0, padding: '8px 16px', borderRadius: 'var(--rf, 99px)',
                  border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
                  background: on ? 'var(--gold)' : 'var(--surface-2)',
                  color: on ? '#080808' : 'var(--t2)',
                  transition: 'background 180ms',
                }}
              >
                {g}
              </button>
            );
          })}
        </div>

        {/* Horizontal Scroll for Artists */}
        <div
          style={{
            display: 'flex',
            gap: 10,
            overflowX: 'auto',
            paddingBottom: 4,
            scrollbarWidth: 'none',
            marginTop: 8,
          }}
        >
          {list.map((a) => (
            <div
              key={a.id}
              style={{
                flexShrink: 0,
                width: 160,
                background: 'var(--surface)',
                borderRadius: 'var(--r3, 12px)',
                overflow: 'hidden',
                cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.05)',
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
                <Image
                  src={a.image}
                  alt={a.name}
                  fill
                  sizes="160px"
                  className="object-cover"
                />
              </div>

              <div style={{ padding: '10px 12px 12px' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', marginBottom: 5 }}>{a.name}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                  <Music2 size={10} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: 'var(--gold)' }}>{a.genre}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                  <MapPin size={10} style={{ color: 'var(--t3)', flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: 'var(--t3)' }}>{a.location}</span>
                </div>
                <div style={{ marginTop: 4, fontSize: 10, color: 'var(--gold)', fontWeight: 600 }}>
                  {a.followers} followers
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--t3)', marginTop: 24 }}>
        Demo profiles · Real artists coming soon
      </p>
    </div>
  );
}