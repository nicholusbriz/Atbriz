'use client';

export default function StoriesSection() {
  return (
    <div style={{ height: '100%', overflowY: 'auto', paddingBottom: 24 }}>
      <div className="inner" style={{ paddingTop: 18, paddingBottom: 14 }}>
        <h1 style={{ fontSize: 20, fontWeight: 900, color: 'var(--t1)', letterSpacing: '-0.3px' }}>
          Stories
        </h1>
        <p style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>
          Verified stories will appear here after publication.
        </p>
      </div>
      <div className="inner">
        <p style={{ color: 'var(--t2)', fontSize: 13, lineHeight: 1.6 }}>
          No verified stories have been published yet.
        </p>
      </div>
    </div>
  );
}
