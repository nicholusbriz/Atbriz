'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Play, Eye, Clock } from 'lucide-react';

const genres = ['All', 'Afrobeats', 'Hip-Hop', 'Dancehall', 'Afro-pop', 'R&B'];

const videos = [
  { id: '1', title: 'Neon Dreams (Official Video)', artist: 'Zara K',  genre: 'Afrobeats', thumb: '/images/video-cover-01.svg', duration: '3:42', views: '12K' },
  { id: '2', title: 'Kampala Nights',               artist: 'Blaq J',  genre: 'Hip-Hop',   thumb: '/images/video-cover-02.svg', duration: '4:15', views: '8K'  },
  { id: '3', title: 'Golden Era (Lyric Video)',      artist: 'Xtra P',  genre: 'Dancehall', thumb: '/images/video-cover-01.svg', duration: '3:58', views: '5K'  },
];

export default function VideosSection() {
  const [genre, setGenre] = useState('All');
  const [feat, ...rest] = videos;
  const list = genre === 'All' ? rest : rest.filter((v) => v.genre === genre);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header (Matched to other sections) */}
      <div className="inner" style={{ paddingTop: 12, paddingBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 4, height: 20, background: 'var(--gold)', borderRadius: 2 }} />
        <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--t1)', letterSpacing: '-0.5px', margin: 0 }}>Videos</h1>
      </div>

      {/* ── Cinematic Featured Video (at top) ── */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', marginBottom: 12, cursor: 'pointer' }}>
        <Image src={feat.thumb} alt={feat.title} fill sizes="100vw" className="object-cover" priority />

        {/* Gradient to blend the video into the page background */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(8,8,8,1) 0%, rgba(8,8,8,0.3) 60%, rgba(0,0,0,0) 100%)' }} />

        {/* Glassmorphism Play Button */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            style={{
              width: 64, height: 64, borderRadius: '50%', background: 'rgba(212, 175, 55, 0.2)',
              backdropFilter: 'blur(8px)', border: '1px solid rgba(212, 175, 55, 0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'transform 200ms'
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.transform = 'scale(1.1)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.transform = 'scale(1)')}
          >
            <Play size={28} fill="var(--gold)" color="var(--gold)" style={{ marginLeft: 4 }} />
          </div>
        </div>

        {/* Featured Video Details (Overlaid on the image) */}
        <div style={{ position: 'absolute', bottom: 16, left: 20, right: 20 }}>
          <span className="chip chip-terracotta" style={{ marginBottom: 8, display: 'inline-flex' }}>Premiere</span>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: '#FAFAFA', lineHeight: 1.1, marginBottom: 6, textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
            {feat.title}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: '#ccc' }}>
            <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{feat.artist}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Eye size={14} /> {feat.views}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={14} /> {feat.duration}</span>
          </div>
        </div>
      </div>

      {/* Genre Filters */}
      <div className="inner" style={{ paddingBottom: 12, flex: 1, overflowY: 'auto', minHeight: 0 }}>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none' }}>
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

      {/* ── List of Videos - Horizontal Scroll ── */}
      <div className="inner" style={{ paddingBottom: 16 }}>
        <div
          style={{
            display: 'flex',
            gap: 12,
            overflowX: 'auto',
            paddingBottom: 4,
            scrollbarWidth: 'none',
            marginTop: 8,
          }}
        >
          {list.map((v) => (
            <div
              key={v.id}
              style={{
                flexShrink: 0,
                width: 200,
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
              {/* Thumbnail */}
              <div style={{ position: 'relative', aspectRatio: '16/9', background: 'var(--surface-2)' }}>
                <Image src={v.thumb} alt={v.title} fill sizes="200px" className="object-cover" />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,8,8,0.3)' }} />

                {/* Duration Badge */}
                <div style={{ position: 'absolute', bottom: 4, right: 4, padding: '2px 6px', background: 'rgba(8,8,8,0.85)', borderRadius: 4, fontSize: 10, fontWeight: 700, color: '#FAFAFA' }}>
                  {v.duration}
                </div>
              </div>

              {/* Text Details */}
              <div style={{ padding: '10px 12px 12px' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', lineHeight: 1.3, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {v.title}
                </p>
                <p style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 600, marginBottom: 4 }}>{v.artist}</p>
                <p style={{ fontSize: 11, color: 'var(--t3)' }}>{v.views} views · {v.genre}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}