'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, ArrowRight, Home, List, MapPin, TreePine } from 'lucide-react';

type SectionId = 'home' | 'reports' | 'districts' | 'updates' | 'stories' | 'submit';

interface ReportStats {
  totalReports: number;
  resolvedReports: number;
  averageResolutionDays: number | null;
  topDistricts: Array<{
    name: string;
    reports: number;
    resolved: number;
    pending: number;
  }>;
}

interface RecentReport {
  _id: string;
  title: string;
  category: string;
  districtName: string;
  status: 'pending' | 'under_review' | 'resolved';
  createdAt: string;
}

interface LocationCounts {
  districts: number;
  subcounties: number;
  parishes: number;
  villages: number;
}

const statusStyle = (s: string) => {
  if (s === 'resolved') return { color: 'var(--forest)', bg: 'rgba(45,90,61,0.10)', border: 'rgba(45,90,61,0.22)' };
  if (s === 'under_review') return { color: 'var(--gold)', bg: 'rgba(212,168,75,0.10)', border: 'rgba(212,168,75,0.25)' };
  return { color: 'var(--t3)', bg: 'var(--surface-2)', border: 'var(--border-2)' };
};

function formatTimeAgo(value: string) {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return 'Date unavailable';
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function statusLabel(status: RecentReport['status']) {
  return {
    pending: 'Pending',
    under_review: 'Under review',
    resolved: 'Resolved',
    rejected: 'Rejected',
  }[status];
}

interface Props { onNav: (id: SectionId) => void; }

export default function HomeSection({ onNav }: Props) {
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const [reportStats, setReportStats] = useState<ReportStats | null>(null);
  const [statsError, setStatsError] = useState('');
  const [locationCounts, setLocationCounts] = useState<LocationCounts | null>(null);
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsError, setReportsError] = useState('');

  useEffect(() => {
    if (heroVideoRef.current) heroVideoRef.current.playbackRate = 0.75;
  }, []);

  useEffect(() => {
    let active = true;
    fetch('/api/admin/sync/status', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json() as { ok?: boolean; counts?: LocationCounts; error?: string };
        if (!response.ok || !data.ok || !data.counts) {
          throw new Error(data.error ?? 'Could not load location totals');
        }
        return data.counts;
      })
      .then((counts) => {
        if (active) setLocationCounts(counts);
      })
      .catch((error: unknown) => {
        if (active) {
          console.error('[HomeSection] Could not load location totals', error);
        }
      });

    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    fetch('/api/reports/stats', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json() as ReportStats & { error?: string };
        if (!response.ok) throw new Error(data.error ?? 'Could not load report statistics');
        return data;
      })
      .then((data) => {
        if (active) setReportStats(data);
      })
      .catch((error: unknown) => {
        if (active) setStatsError(error instanceof Error ? error.message : 'Could not load report statistics');
      });

    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    fetch('/api/reports', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json() as { reports?: RecentReport[]; error?: string };
        if (!response.ok) throw new Error(data.error ?? 'Could not load reports');
        if (!Array.isArray(data.reports)) throw new Error('The reports response was invalid');
        return data.reports.slice(0, 5);
      })
      .then((items) => {
        if (active) setRecentReports(items);
      })
      .catch((error: unknown) => {
        if (active) setReportsError(error instanceof Error ? error.message : 'Could not load reports');
      })
      .finally(() => {
        if (active) setReportsLoading(false);
      });

    return () => { active = false; };
  }, []);

  // Unified stat band data
  const statBand = [
    {
      value: reportStats ? reportStats.totalReports.toLocaleString('en-UG') : '—',
      label: 'Reports filed',
      color: 'var(--crimson)',
    },
    {
      value: reportStats ? reportStats.resolvedReports.toLocaleString('en-UG') : '—',
      label: 'Resolved',
      color: 'var(--forest)',
    },
    {
      value: reportStats?.averageResolutionDays == null
        ? '—'
        : `${reportStats.averageResolutionDays.toFixed(1)}d`,
      label: 'Avg resolution',
      color: 'var(--gold)',
    },
    {
      value: locationCounts ? locationCounts.districts.toLocaleString('en-UG') : '—',
      label: 'Districts covered',
      color: '#5b8dd9',
    },
  ];

  return (
    <div
      style={{
        height: '100%',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        overscrollBehaviorY: 'contain',
      }}
    >
      {/* ── Hero (unchanged) ── */}
      <div
        style={{
          padding: '40px 24px 32px',
          background: 'linear-gradient(160deg, #0d1117 0%, #1a0505 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <video
          ref={heroVideoRef}
          aria-hidden="true"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            opacity: 0.85,
            filter: 'blur(2px)',
            transform: 'scale(1.02)',
            pointerEvents: 'none',
          }}
        >
          <source src="/uganda%20video.mp4" type="video/mp4" />
        </video>

        <div aria-hidden="true" style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, rgba(13,17,23,0.98) 0%, rgba(13,17,23,0.85) 45%, rgba(13,17,23,0.30) 100%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(184,72,74,0.08)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(212,168,75,0.05)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '480px' }}>

          <p
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'rgba(255,255,255,0.85)',
              marginBottom: '16px',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              textShadow: '0 2px 4px rgba(0,0,0,0.5)',
            }}
          >
            Uganda Citizen Voice Platform
          </p>

          <h1 style={{
            fontSize: '36px',
            fontWeight: 900,
            color: '#ffffff',
            lineHeight: 1.15,
            letterSpacing: '-0.5px',
            marginBottom: '16px',
            textShadow: '0 4px 12px rgba(0,0,0,0.6)'
          }}>
            Report. Track.<br />
            <span style={{ color: 'var(--crimson)' }}>Get it Fixed.</span>
          </h1>

          <p style={{
            fontSize: '15px',
            color: 'rgba(255,255,255,0.85)',
            lineHeight: 1.6,
            marginBottom: '28px',
            maxWidth: '400px',
            textShadow: '0 2px 6px rgba(0,0,0,0.5)'
          }}>
            Submit a complaint about health workers, roads, schools, or corruption — directly to your district office.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            <button
              onClick={() => onNav('submit')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                height: '48px', padding: '0 24px',
                background: 'var(--crimson)', color: '#fff',
                border: 'none', borderRadius: 'var(--rf)',
                fontSize: '15px', fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 6px 18px rgba(184,72,74,0.40)',
                transition: 'transform 120ms ease, box-shadow 180ms ease',
                flex: '1 1 auto',
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <AlertCircle size={18} /> File a Report
            </button>

            <button
              onClick={() => onNav('reports')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                height: '48px', padding: '0 24px',
                background: 'rgba(255,255,255,0.1)', color: '#fff',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: 'var(--rf)',
                fontSize: '15px', fontWeight: 700, cursor: 'pointer',
                WebkitBackdropFilter: 'blur(4px)',
                backdropFilter: 'blur(4px)',
                transition: 'transform 120ms ease, background 180ms ease',
                flex: '1 1 auto',
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              View Reports <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Unified stat band (outside hero, own surface) ── */}
      <div
        aria-label="Platform statistics"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        {statBand.map((stat, i) => (
          <div
            key={stat.label}
            style={{
              padding: '16px 8px',
              textAlign: 'center',
              borderRight: i < statBand.length - 1 ? '1px solid var(--border)' : 'none',
            }}
          >
            <div
              style={{
                fontSize: 'clamp(20px, 3vw, 26px)',
                fontWeight: 900,
                color: stat.color,
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '-0.3px',
              }}
            >
              {stat.value}
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 10,
                color: 'var(--t3)',
                fontWeight: 700,
                letterSpacing: 0.3,
                textTransform: 'uppercase',
              }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>
      {statsError && (
        <p role="status" style={{ margin: '6px 12px 0', color: 'var(--t3)', fontSize: 11, textAlign: 'center' }}>
          Some statistics are temporarily unavailable.
        </p>
      )}

      {/* ── Recent Reports ── */}
      <div className="inner" style={{ paddingTop: 20, paddingBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span className="sec-label">Recent Reports</span>
          <button
            onClick={() => onNav('reports')}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 12, fontWeight: 700, color: 'var(--crimson)',
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 4, margin: -4,
              transition: 'opacity 120ms',
            }}
            onMouseDown={(e) => (e.currentTarget.style.opacity = '0.7')}
            onMouseUp={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            See all <ArrowRight size={11} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {recentReports.map((c, i) => {
            const ss = statusStyle(c.status);
            return (
              <div
                key={c._id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 6px',
                  margin: '0 -6px',
                  borderRadius: 'var(--r2)',
                  borderBottom: i < recentReports.length - 1 ? '1px solid var(--border)' : 'none',
                  cursor: 'pointer',
                  transition: 'background 150ms',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div
                  style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    background:
                      c.category === 'Health' ? 'var(--terracotta)' :
                      c.category === 'Roads' ? 'var(--gold)' :
                      c.category === 'Corruption' ? 'var(--crimson)' :
                      c.category === 'Water' ? '#4A90D9' :
                      'var(--forest)',
                    boxShadow: '0 0 0 3px rgba(0,0,0,0.02)',
                  }}
                />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: 13, fontWeight: 600, color: 'var(--t1)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    marginBottom: 3,
                  }}>
                    {c.title}
                  </p>
                  <span style={{ fontSize: 11, color: 'var(--t3)' }}>
                    {c.districtName} · {formatTimeAgo(c.createdAt)}
                  </span>
                </div>

                <span
                  style={{
                    fontSize: 10, fontWeight: 700,
                    padding: '3px 9px', borderRadius: 'var(--rf)',
                    flexShrink: 0,
                    minWidth: 78, textAlign: 'center',
                    color: ss.color, background: ss.bg,
                    border: `1px solid ${ss.border}`,
                    letterSpacing: 0.2,
                  }}
                >
                  {statusLabel(c.status)}
                </span>
              </div>
            );
          })}
          {reportsLoading && (
            <p role="status" style={{ padding: '12px 0', color: 'var(--t3)', fontSize: 12 }}>
              Loading recent reports…
            </p>
          )}
          {!reportsLoading && !reportsError && recentReports.length === 0 && (
            <p style={{ padding: '12px 0', color: 'var(--t3)', fontSize: 12 }}>
              No citizen reports have been submitted yet.
            </p>
          )}
          {reportsError && (
            <p role="alert" style={{ padding: '12px 0', color: 'var(--t3)', fontSize: 12 }}>
              Recent reports are temporarily unavailable.
            </p>
          )}
        </div>
      </div>

      {/* ── Districts with Reports ── */}
      <div className="inner" style={{ paddingTop: 20, paddingBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span className="sec-label">Districts with Reports</span>
          <button
            onClick={() => onNav('districts')}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 12, fontWeight: 700, color: 'var(--crimson)',
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 4, margin: -4,
              transition: 'opacity 120ms',
            }}
            onMouseDown={(e) => (e.currentTarget.style.opacity = '0.7')}
            onMouseUp={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            All <ArrowRight size={11} />
          </button>
        </div>

        <div
          style={{
            display: 'flex', gap: 10,
            overflowX: 'auto',
            paddingBottom: 6,
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            overscrollBehaviorX: 'contain',
          }}
        >
          {reportStats?.topDistricts.map((d) => {
            const pct = Math.round((d.resolved / d.reports) * 100);
            const good = pct >= 70;
            return (
              <div
                key={d.name}
                style={{
                  flexShrink: 0, width: 152,
                  background: 'var(--surface)',
                  borderRadius: 'var(--r3)',
                  border: '1px solid var(--border)',
                  overflow: 'hidden', cursor: 'pointer',
                  transition: 'transform 150ms ease, box-shadow 180ms ease, border-color 180ms ease',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = 'translateY(-1px)';
                  el.style.boxShadow = '0 6px 18px rgba(0,0,0,0.06)';
                  el.style.borderColor = 'var(--border-2)';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.transform = 'translateY(0)';
                  el.style.boxShadow = 'none';
                  el.style.borderColor = 'var(--border)';
                }}
              >
                <div style={{ height: 3, background: 'var(--surface-2)' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: good
                        ? 'linear-gradient(90deg, var(--forest) 0%, rgba(45,90,61,0.75) 100%)'
                        : 'linear-gradient(90deg, var(--gold) 0%, rgba(212,168,75,0.75) 100%)',
                      transition: 'width 400ms ease',
                    }}
                  />
                </div>

                <div style={{ padding: '12px 13px 13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
                    <MapPin size={11} style={{ color: 'var(--crimson)', flexShrink: 0 }} />
                    <span style={{
                      fontSize: 14, fontWeight: 800, color: 'var(--t1)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {d.name}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[
                      { label: 'Total', value: d.reports, color: 'var(--t1)' },
                      { label: 'Resolved', value: d.resolved, color: 'var(--forest)' },
                      { label: 'Pending', value: d.pending, color: 'var(--gold)' },
                    ].map(row => (
                      <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 10, color: 'var(--t3)' }}>{row.label}</span>
                        <span style={{
                          fontSize: 13, fontWeight: 900, color: row.color,
                          fontVariantNumeric: 'tabular-nums',
                        }}>
                          {row.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      marginTop: 10,
                      display: 'inline-block',
                      fontSize: 10, fontWeight: 800,
                      padding: '2px 8px', borderRadius: 'var(--rf)',
                      color: good ? 'var(--forest)' : 'var(--gold)',
                      background: good ? 'rgba(45,90,61,0.10)' : 'rgba(212,168,75,0.10)',
                      border: `1px solid ${good ? 'rgba(45,90,61,0.22)' : 'rgba(212,168,75,0.25)'}`,
                      letterSpacing: 0.2,
                    }}
                  >
                    {pct}% resolved
                  </div>
                </div>
              </div>
            );
          })}
          {reportStats && reportStats.topDistricts.length === 0 && (
            <p style={{ padding: '12px 0', color: 'var(--t3)', fontSize: 12 }}>
              District report statistics will appear here as reports are submitted.
            </p>
          )}
        </div>
      </div>

      {/* ── Coverage footer ── */}
      {locationCounts && (
        <div
          aria-label="Uganda coverage"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '6px 14px',
            padding: '16px 24px 24px',
            borderTop: '1px solid var(--border)',
            fontSize: 11,
            color: 'var(--t3)',
            fontWeight: 600,
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <MapPin size={12} style={{ color: 'var(--crimson)' }} />
            {locationCounts.districts.toLocaleString('en-UG')} districts
          </span>
          <span aria-hidden="true" style={{ opacity: 0.4 }}>·</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <List size={12} style={{ color: 'var(--gold)' }} />
            {locationCounts.subcounties.toLocaleString('en-UG')} subcounties
          </span>
          <span aria-hidden="true" style={{ opacity: 0.4 }}>·</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <TreePine size={12} style={{ color: 'var(--forest)' }} />
            {locationCounts.parishes.toLocaleString('en-UG')} parishes
          </span>
          <span aria-hidden="true" style={{ opacity: 0.4 }}>·</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <Home size={12} style={{ color: '#5b8dd9' }} />
            {locationCounts.villages.toLocaleString('en-UG')} villages
          </span>
        </div>
      )}
    </div>
  );
}