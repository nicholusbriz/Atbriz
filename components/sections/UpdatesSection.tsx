'use client';

export default function UpdatesSection() {
  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <div className="inner" style={{ paddingTop: 16, paddingBottom: 12 }}>
        <h1 style={{ fontSize: 20, fontWeight: 900, color: 'var(--t1)', margin: 0 }}>
          Official Updates
        </h1>
      </div>
      <div className="inner" style={{ paddingTop: 16, paddingBottom: 24 }}>
        <p style={{ color: 'var(--t2)', fontSize: 13, lineHeight: 1.6 }}>
          No verified official updates have been published yet.
        </p>
      </div>
    </div>
  );
}
