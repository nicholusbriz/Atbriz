'use client';

import { useState } from 'react';
import { CheckCircle, X, Mic2, Music } from 'lucide-react';

const features = [
  'Create your artist profile with brand identity',
  'Upload photos, songs and music videos',
  'Display real management contact information',
  'Build your following and gain real exposure',
  'Get discovered by industry professionals',
  'SEO-optimized profiles for Google visibility',
];

export default function JoinSection() {
  const [modal, setModal] = useState(false);

  return (
    <>
      <div style={{ paddingBottom: 24 }}>
        {/* Header */}
        <div className="inner" style={{ paddingTop: 20, paddingBottom: 16 }}>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: 'var(--t1)', letterSpacing: '-0.3px' }}>Join</h1>
          <p style={{ fontSize: 13, color: 'var(--t3)', marginTop: 2 }}>For upcoming Ugandan artists</p>
        </div>

        <div className="inner" style={{ paddingTop: 20, maxWidth: 520 }}>
          {/* Headline */}
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 38px)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.5px', color: 'var(--t1)', marginBottom: 12 }}>
            Your name.<br />Your sound.<br /><span style={{ color: 'var(--gold)' }}>Your movement.</span>
          </h2>
          <p style={{ fontSize: 14, color: 'var(--t2)', lineHeight: 1.65, marginBottom: 24 }}>
            Every great music journey starts somewhere. atbriz gives upcoming Ugandan artists a real digital home with SEO-optimized profiles that appear in Google search results.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 28 }}>
            <button onClick={() => setModal(true)} className="btn btn-terracotta btn-lg">
              <Mic2 size={15} /> Join as an Artist
            </button>
            <button onClick={() => setModal(true)} className="btn btn-ghost btn-lg">
              <Music size={15} /> Get Featured
            </button>
          </div>

          {/* Feature list */}
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--r3)', padding: '18px 18px' }}>
            <p className="sec-label" style={{ marginBottom: 14 }}>What&apos;s coming for artists</p>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {features.map((f) => (
                <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <CheckCircle size={14} style={{ color: 'var(--forest)', flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.5 }}>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(10,11,15,0.9)' }}
          onClick={() => setModal(false)}
        >
          <div
            style={{ position: 'relative', maxWidth: 380, width: '100%', background: 'var(--surface-2)', borderRadius: 'var(--r4)', padding: '28px 24px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setModal(false)} style={{ position: 'absolute', top: 14, right: 14, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--t3)' }}>
              <X size={17} />
            </button>
            <h3 style={{ fontSize: 20, fontWeight: 900, color: 'var(--t1)', marginBottom: 10 }}>Coming Soon</h3>
            <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.6, marginBottom: 22 }}>
              Artist registration is in development. atbriz is being built to give upcoming Ugandan artists a real digital home with SEO-optimized profiles.
            </p>
            <button onClick={() => setModal(false)} className="btn btn-gold btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
