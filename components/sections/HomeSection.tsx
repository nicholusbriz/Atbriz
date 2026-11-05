'use client';

import Image from 'next/image';
import { Play, ArrowRight, TrendingUp, Music2 } from 'lucide-react';

type SectionId = 'home' | 'artists' | 'music' | 'videos' | 'stories' | 'join';

// Updated to include song details
const trending = [
  { id: 'zara-k', name: 'Zara K', song: 'Neon Nights', genre: 'Afrobeats', image: '/images/artist-01.svg' },
  { id: 'blaq-j', name: 'Blaq J', song: 'Kampala Waves', genre: 'Hip-Hop', image: '/images/artist-02.svg' },
  { id: 'nadia-m', name: 'Nadia M', song: 'Rise Up', genre: 'R&B', image: '/images/artist-03.svg' },
  { id: 'xtra-p', name: 'Xtra P', song: 'Golden Era', genre: 'Dancehall', image: '/images/artist-04.svg' },
  { id: 'lyra-d', name: 'Lyra D', song: 'City Lights', genre: 'Afro-pop', image: '/images/artist-05.svg' },
];

const fresh = [
  { id: '1', title: 'Neon Nights', artist: 'Zara K', genre: 'Afrobeats', image: '/images/artist-01.svg', isNew: true },
  { id: '2', title: 'Kampala Waves', artist: 'Blaq J', genre: 'Hip-Hop', image: '/images/artist-02.svg', isNew: true },
  { id: '3', title: 'Rise Up', artist: 'Nadia M', genre: 'Gospel', image: '/images/artist-03.svg', isNew: false },
  { id: '4', title: 'Golden Era', artist: 'Xtra P', genre: 'Dancehall', image: '/images/artist-04.svg', isNew: false },
];

interface Props { onNav: (id: SectionId) => void; }

export default function HomeSection({ onNav }: Props) {
  // Use the top trending song for the hero
  const featuredSong = trending[0];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* ── Hero Banner (Trending Song) ── */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16/9', 
          maxHeight: 320,
          overflow: 'hidden',
          background: 'var(--surface)',
        }}
      >
        <Image
          src={featuredSong.image}
          alt={featuredSong.song}
          fill
          priority
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: 'center 20%' }}
        />
        {/* Dark gradient overlay */}
        <div
          style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(8,8,8,0.95) 0%, rgba(8,8,8,0.5) 60%, rgba(0,0,0,0) 100%)',
          }}
        />
        
        {/* Content */}
        <div
          style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
            padding: '24px',
          }}
        >
          {/* Top Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <TrendingUp size={16} style={{ color: 'var(--gold)' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: 1 }}>
              #1 Trending Song
            </span>
          </div>
          
          {/* Song Title (Main Headline) */}
          <h1
            style={{
              fontSize: 'clamp(32px, 6vw, 52px)',
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: '-0.5px',
              color: '#FFFFFF',
              marginBottom: 4,
            }}
          >
            {featuredSong.song}
          </h1>

          {/* Artist Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <span style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>
              {featuredSong.name}
            </span>
            <span style={{ color: '#666', fontSize: 16 }}>•</span>
            <span style={{ color: 'var(--gold)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Music2 size={14} /> {featuredSong.genre}
            </span>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => onNav('music')} className="btn btn-gold btn-sm" style={{ padding: '10px 24px', fontSize: 14 }}>
              <Play size={16} fill="#080808" /> Play Now
            </button>
            <button onClick={() => onNav('artists')} className="btn btn-ghost btn-sm" style={{ backdropFilter: 'blur(4px)', padding: '10px 20px', fontSize: 14 }}>
              View Artist <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Content Area (Scrollable) ── */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {/* ── Trending Artists row (Remains the same) ── */}
        <div className="inner" style={{ paddingTop: 12, borderBottom: '1px solid var(--border-2)', paddingBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span className="sec-label">Trending Artists</span>
          <button
            onClick={() => onNav('artists')}
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            See all <ArrowRight size={12} />
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 16,
            overflowX: 'auto',
            paddingBottom: 8,
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {trending.map((a) => (
            <button
              key={a.id}
              onClick={() => onNav('artists')}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0,
                transition: 'transform 180ms',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.transform = 'translateY(0)')}
            >
              <div
                style={{
                  position: 'relative', width: 72, height: 72,
                  borderRadius: '50%', overflow: 'hidden',
                  background: 'var(--surface)', border: '2px solid var(--border-2)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}
              >
                <Image src={a.image} alt={a.name} fill sizes="72px" className="object-cover" />
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--t1)', lineHeight: 1.2 }}>{a.name}</span>
                <span style={{ display: 'block', fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{a.genre}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Fresh Music (Remains the same) ── */}
      <div className="inner" style={{ paddingTop: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span className="sec-label">Fresh Music</span>
          <button
            onClick={() => onNav('music')}
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            See all <ArrowRight size={12} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {fresh.map((t, i) => (
            <div
              key={t.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '10px 12px', borderRadius: 'var(--r2)', cursor: 'pointer',
                transition: 'background 180ms',
                borderBottom: '1px solid rgba(255,255,255,0.02)'
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--surface)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
            >
              <span style={{ width: 16, textAlign: 'center', fontSize: 13, fontWeight: 600, color: 'var(--t3)', flexShrink: 0 }}>{i + 1}</span>
              
              <div style={{ position: 'relative', width: 48, height: 48, borderRadius: 'var(--r2)', overflow: 'hidden', flexShrink: 0, background: 'var(--surface-2)' }}>
                <Image src={t.image} alt={t.title} fill sizes="48px" className="object-cover" />
              </div>
              
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</p>
                  {t.isNew && <span className="chip chip-forest" style={{ fontSize: 9, padding: '2px 6px', flexShrink: 0 }}>NEW</span>}
                </div>
                <p style={{ fontSize: 12, color: 'var(--t3)', marginTop: 3 }}>{t.artist}</p>
              </div>
              
              <button
                aria-label={`Play ${t.title}`}
                style={{ 
                  width: 36, height: 36, borderRadius: '50%', 
                  background: 'transparent', border: '1px solid var(--border-2)', 
                  color: 'var(--t1)', cursor: 'pointer', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  flexShrink: 0, transition: 'all 180ms' 
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'var(--gold)';
                  (e.currentTarget as HTMLElement).style.color = '#080808';
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--gold)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                  (e.currentTarget as HTMLElement).style.color = 'var(--t1)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-2)';
                }}
              >
                <Play size={14} fill="currentColor" style={{ marginLeft: 2 }} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Stats row (Remains the same) ── */}
      <div className="inner" style={{ paddingTop: 8 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { v: '200+', l: 'Artist Profiles' },
            { v: '1K+', l: 'Music Tracks' },
            { v: '100%', l: 'SEO Optimized' },
          ].map((s) => (
            <div
              key={s.l}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '20px 10px', background: 'var(--surface)', borderRadius: 'var(--r3)',
                border: '1px solid var(--border-2)'
              }}
            >
              <span style={{ fontSize: 26, fontWeight: 900, color: 'var(--gold)', lineHeight: 1 }}>{s.v}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--t2)', marginTop: 6 }}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}