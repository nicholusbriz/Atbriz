'use client';

import Image from 'next/image';
import { Clock } from 'lucide-react';

const stories = [
  { id: '1', cat: 'Rising Talent', chipClass: 'chip-gold', title: "Zara K: From Kampala's streets to Uganda's stages", excerpt: "How she developed her sound and became one of the most exciting voices on Uganda's music scene.", image: '/images/artist-01.svg', readTime: '5 min', featured: true },
  { id: '2', cat: 'Interview',     chipClass: 'chip-terracotta',  title: "Blaq J: 'Every bar is a chapter of my life'",     excerpt: "Uganda's most authentic hip-hop lyricist talks craft and why Ugandan rap deserves global attention.", image: '/images/artist-02.svg', readTime: '4 min', featured: false },
  { id: '3', cat: 'New Release',   chipClass: 'chip-gold', title: "Nadia M drops 'Rise Up' — Uganda's gospel anthem", excerpt: "We explore the inspiration and the message behind the spiritually charged anthem.", image: '/images/artist-03.svg', readTime: '3 min', featured: false },
];

export default function StoriesSection() {
  const [feat, ...rest] = stories;
  return (
    <div style={{ paddingBottom: 24 }}>
      {/* Header */}
      <div className="inner" style={{ paddingTop: 20, paddingBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 900, color: 'var(--t1)', letterSpacing: '-0.3px' }}>Stories</h1>
      </div>

      <div className="inner" style={{ paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Featured */}
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--r3)', overflow: 'hidden', cursor: 'pointer' }}>
          <div style={{ position: 'relative', aspectRatio: '16/8', background: 'var(--surface-2)' }}>
            <Image src={feat.image} alt={feat.title} fill sizes="100vw" className="object-cover" />
          </div>
          <div style={{ padding: '14px 16px 16px' }}>
            <span className={`chip ${feat.chipClass}`} style={{ marginBottom: 8, display: 'inline-flex' }}>{feat.cat}</span>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: 'var(--t1)', lineHeight: 1.35, marginBottom: 8 }}>{feat.title}</h2>
            <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.55, marginBottom: 10 }}>{feat.excerpt}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Clock size={11} style={{ color: 'var(--t3)' }} />
              <span style={{ fontSize: 11, color: 'var(--t3)' }}>{feat.readTime} read</span>
            </div>
          </div>
        </div>

        {/* Other */}
        {rest.map((s) => (
          <div
            key={s.id}
            style={{ display: 'flex', gap: 12, padding: 12, background: 'var(--surface)', borderRadius: 'var(--r2)', cursor: 'pointer', transition: 'background 180ms' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'var(--surface)';
            }}
          >
            <div style={{ position: 'relative', width: 72, height: 72, borderRadius: 'var(--r2)', overflow: 'hidden', flexShrink: 0, background: 'var(--surface-2)' }}>
              <Image src={s.image} alt={s.title} fill sizes="72px" className="object-cover" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span className={`chip ${s.chipClass}`} style={{ marginBottom: 5, display: 'inline-flex' }}>{s.cat}</span>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', lineHeight: 1.3 }}>{s.title}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 5 }}>
                <Clock size={10} style={{ color: 'var(--t3)' }} />
                <span style={{ fontSize: 11, color: 'var(--t3)' }}>{s.readTime} read</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
