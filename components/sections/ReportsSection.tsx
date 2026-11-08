'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Clock, Filter, Inbox, MapPin } from 'lucide-react';
import ReportAttachmentGallery from '@/components/ReportAttachmentGallery';
import type { ReportStatus } from '@/models/Report';

interface PublicAttachment {
  secureUrl: string;
  resourceType: 'image' | 'video';
  format: string;
  bytes: number;
}

interface PublicReport {
  _id: string;
  referenceCode: string;
  title: string;
  category: string;
  description: string;
  districtName: string;
  subcountyName?: string;
  parishName?: string;
  villageName?: string;
  attachments?: PublicAttachment[];
  status: ReportStatus;
  createdAt: string;
}

interface ReportsResponse {
  reports: PublicReport[];
  total: number;
  error?: string;
}

interface HeroStatsResponse {
  publicStats: {
    totalReports: number;
    districtCount: number;
  };
  error?: string;
}

interface OverviewStatsResponse {
  totalReports: number;
  resolvedReports: number;
  averageResolutionDays: number | null;
  error?: string;
}

const categories = ['All', 'Health', 'Education', 'Roads', 'Water', 'Corruption', 'Other'];
const reportStatuses: ReportStatus[] = ['pending', 'under_review', 'resolved', 'rejected'];

const statusLabels: Record<ReportStatus, string> = {
  pending: 'Pending',
  under_review: 'Under review',
  resolved: 'Resolved',
  rejected: 'Rejected',
};

const statusColors: Record<ReportStatus, string> = {
  pending: 'var(--t3, #6B7268)',
  under_review: 'var(--gold, #B68A36)',
  resolved: 'var(--forest, #55705B)',
  rejected: 'var(--crimson, #B8484A)',
};

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : new Intl.DateTimeFormat('en-UG', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

export default function ReportsSection() {
  const [reports, setReports] = useState<PublicReport[]>([]);
  const [category, setCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('all');
  const [selectedId, setSelectedId] = useState('');
  const [reportSelected, setReportSelected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [overviewStats, setOverviewStats] = useState<OverviewStatsResponse | null>(null);
  const [overviewStatsError, setOverviewStatsError] = useState('');
  const [heroStatsResult, setHeroStatsResult] = useState<{
    filterKey: string;
    stats?: HeroStatsResponse['publicStats'];
    error?: string;
  } | null>(null);
  const listScrollPosition = useRef(0);
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const returnToReport = useRef<{ id: string; topOffset: number } | null>(null);
  const restoreListPosition = useRef(false);

  useEffect(() => {
    let active = true;

    fetch('/api/reports')
      .then(async (response) => {
        const data = await response.json() as ReportsResponse;
        if (!response.ok) throw new Error(data.error ?? 'Could not load reports');
        if (!Array.isArray(data.reports)) throw new Error('The reports response was invalid');

        if (active) {
          setReports(data.reports);
          setSelectedId((current) =>
            data.reports.some((report) => report._id === current)
              ? current
              : data.reports[0]?._id ?? '',
          );
        }
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Could not load reports');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    fetch('/api/reports/stats', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json() as OverviewStatsResponse;
        if (!response.ok) throw new Error(data.error ?? 'Could not load report statistics');
        if (typeof data.totalReports !== 'number'
          || typeof data.resolvedReports !== 'number'
          || (data.averageResolutionDays !== null && typeof data.averageResolutionDays !== 'number')) {
          throw new Error('The report statistics response was invalid');
        }
        return data;
      })
      .then((data) => {
        if (active) setOverviewStats(data);
      })
      .catch((cause: unknown) => {
        if (active) setOverviewStatsError(cause instanceof Error ? cause.message : 'Could not load report statistics');
      });

    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams();
    if (category !== 'All') params.set('category', category);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    const query = params.size > 0 ? `?${params.toString()}` : '';
    const filterKey = `${category}:${statusFilter}`;

    fetch(`/api/reports/stats${query}`, { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json() as HeroStatsResponse;
        if (!response.ok) throw new Error(data.error ?? 'Could not load report statistics');
        if (!data.publicStats
          || typeof data.publicStats.totalReports !== 'number'
          || typeof data.publicStats.districtCount !== 'number') {
          throw new Error('The report statistics response was invalid');
        }
        if (active) setHeroStatsResult({ filterKey, stats: data.publicStats });
      })
      .catch((cause: unknown) => {
        if (active) {
          setHeroStatsResult({
            filterKey,
            error: cause instanceof Error ? cause.message : 'Could not load report statistics',
          });
        }
      });

    return () => { active = false; };
  }, [category, statusFilter]);

  useEffect(() => {
    function handlePopState() {
      const state = window.history.state as { reportsDetail?: boolean; reportId?: string } | null;
      setReportSelected(Boolean(state?.reportsDetail));
      setSelectedId(state?.reportsDetail && state.reportId ? state.reportId : '');
      if (!state?.reportsDetail) restoreListPosition.current = true;
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useLayoutEffect(() => {
    if (reportSelected || !restoreListPosition.current || !contentScrollRef.current) return;

    const container = contentScrollRef.current;
    const target = returnToReport.current
      ? container.querySelector<HTMLElement>(`[data-report-id="${returnToReport.current.id}"]`)
      : null;

    if (target && returnToReport.current) {
      const containerTop = container.getBoundingClientRect().top;
      const targetTop = target.getBoundingClientRect().top;
      container.scrollTop += targetTop - containerTop - returnToReport.current.topOffset;
    } else {
      container.scrollTop = listScrollPosition.current;
    }

    restoreListPosition.current = false;
  }, [reportSelected, reports]);

  const selectedReport = reports.find((report) => report._id === selectedId);
  const filteredReports = reports.filter((report) =>
    (category === 'All' || report.category === category)
    && (statusFilter === 'all' || report.status === statusFilter),
  );
  const activeFilterKey = `${category}:${statusFilter}`;
  const heroStatsLoading = heroStatsResult?.filterKey !== activeFilterKey;
  const heroStats = heroStatsResult?.filterKey === activeFilterKey ? heroStatsResult.stats : undefined;
  const heroStatsError = heroStatsResult?.filterKey === activeFilterKey ? heroStatsResult.error : undefined;
  const selectedStatusLabel = statusFilter === 'all' ? '' : statusLabels[statusFilter];
  const categoryDescription = category === 'All' ? '' : ` about ${category.toLowerCase()}`;
  const heroDistrictLabel = category === 'All' && statusFilter === 'all'
    ? 'Districts represented'
    : `Districts with ${[selectedStatusLabel, category === 'All' ? '' : category].filter(Boolean).join(' ').toLowerCase()} reports`;

  function applyFilters(nextCategory: string, nextStatus: ReportStatus | 'all') {
    setCategory(nextCategory);
    setStatusFilter(nextStatus);
    const firstMatch = reports.find((report) =>
      (nextCategory === 'All' || report.category === nextCategory)
      && (nextStatus === 'all' || report.status === nextStatus),
    );
    setSelectedId(firstMatch?._id ?? '');
    setReportSelected(false);
    listScrollPosition.current = 0;
    returnToReport.current = null;
    if (window.history.state?.reportsDetail) {
      const historyState = { ...window.history.state };
      delete historyState.reportsDetail;
      delete historyState.reportId;
      window.history.replaceState(historyState, '', window.location.href);
    }
    contentScrollRef.current?.scrollTo({ top: 0 });
  }

  function chooseCategory(nextCategory: string) {
    applyFilters(nextCategory, statusFilter);
  }

  function chooseStatus(nextStatus: ReportStatus | 'all') {
    applyFilters(category, nextStatus);
  }

  function openReport(report: PublicReport) {
    const container = contentScrollRef.current;
    const reportButton = container?.querySelector<HTMLElement>(`[data-report-id="${report._id}"]`);
    listScrollPosition.current = container?.scrollTop ?? 0;
    returnToReport.current = {
      id: report._id,
      topOffset: container && reportButton
        ? reportButton.getBoundingClientRect().top - container.getBoundingClientRect().top
        : 0,
    };
    setSelectedId(report._id);
    setReportSelected(true);
    // Reset scroll to top when opening the report so the user starts at the title
    contentScrollRef.current?.scrollTo({ top: 0 });
    window.history.pushState(
      { ...(window.history.state ?? {}), reportsDetail: true, reportId: report._id },
      '',
      window.location.href,
    );
  }

  function backToReports() {
    restoreListPosition.current = true;
    if (window.history.state?.reportsDetail) {
      window.history.back();
      return;
    }
    setReportSelected(false);
    if (contentScrollRef.current) {
      contentScrollRef.current.scrollTop = listScrollPosition.current;
    }
  }

  const categoryTabStyle = (active: boolean) => ({
    flexShrink: 0,
    padding: '6px 10px',
    border: 'none',
    borderRadius: 6,
    background: active ? '#eff6ff' : 'transparent',
    color: active ? '#1d4ed8' : '#475569',
    font: 'inherit',
    fontSize: 13,
    fontWeight: active ? 700 : 500,
    cursor: 'pointer',
    transition: 'background 0.15s ease, color 0.15s ease',
  } as const);

  return (
    <section
      id="reports"
      aria-label="Reports"
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
        background: '#f8fafc',
      }}
    >
      <div
        ref={contentScrollRef}
        style={{
          flex: '1 1 auto',
          minHeight: 0,
          overflowY: 'auto',
          overscrollBehaviorY: 'contain',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'thin',
        }}
      >
        {/* ── Filter Navigation (only in list view) ── */}
        {!reportSelected && (
          <nav
            aria-label="Filter reports"
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '4px 12px',
              overflowX: 'auto',
              padding: '8px clamp(20px, 6vw, 72px)',
              background: '#ffffff',
              borderBottom: '1px solid #e2e8f0',
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
            }}
          >
            {categories.map((item) => {
              const active = category === item;
              return (
                <button
                  key={item}
                  type="button"
                  aria-pressed={active}
                  onClick={() => chooseCategory(item)}
                  style={categoryTabStyle(active)}
                >
                  {item}
                </button>
              );
            })}

            <label style={{
              position: 'relative',
              display: 'inline-flex',
              flexShrink: 0,
              alignItems: 'center',
              gap: '6px',
              marginLeft: 'auto',
              padding: '5px 12px',
              borderRadius: '999px',
              border: '1px solid #e2e8f0',
              background: statusFilter === 'all' ? '#ffffff' : '#eff6ff',
              color: statusFilter === 'all' ? '#475569' : '#1d4ed8',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}>
              <Filter size={14} />
              <span style={{ display: 'none' }}>Status</span>
              <select
                aria-label="Filter reports by status"
                value={statusFilter}
                onChange={(event) => {
                  const nextStatus = reportStatuses.find((status) => status === event.target.value) ?? 'all';
                  chooseStatus(nextStatus);
                }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer',
                }}
              >
                <option value="all">All statuses</option>
                {reportStatuses.map((status) => (
                  <option key={status} value={status}>{statusLabels[status]}</option>
                ))}
              </select>
            </label>
          </nav>
        )}

        {/* ── Sticky Back Bar (only in detail view) ── */}
        {selectedReport && reportSelected && (
          <div
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '10px clamp(20px, 6vw, 72px)',
              background: '#ffffff',
              borderBottom: '1px solid #e2e8f0',
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
            }}
          >
            <button
              type="button"
              onClick={backToReports}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                flexShrink: 0,
                padding: '6px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: 6,
                background: '#ffffff',
                color: '#0f172a',
                cursor: 'pointer',
                font: 'inherit',
                fontSize: 13,
                fontWeight: 600,
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; }}
            >
              ← Back to reports
            </button>
            <span style={{
              color: '#64748b',
              fontSize: 12,
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              minWidth: 0,
            }}>
              {selectedReport.referenceCode} · {selectedReport.category}
            </span>
          </div>
        )}

        {/* ── Header / Hero ── */}
        <header
          style={{
            display: reportSelected ? 'flex' : 'block',
            flexDirection: 'column',
            position: 'relative',
            padding: 'clamp(24px, 5vw, 48px) clamp(20px, 6vw, 72px)',
            overflow: 'hidden',
            background: '#0f172a',
            borderBottom: reportSelected ? 0 : '1px solid #e2e8f0',
          }}
        >
          <div style={{ position: 'relative', zIndex: 1 }}>
          {selectedReport && reportSelected ? (
            /* ── Detail view (back button moved to sticky bar above) ── */
            <>
              <p style={{
                margin: '0 0 10px',
                color: '#93c5fd',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '1px',
                textTransform: 'uppercase',
              }}>
                {selectedReport.category} · {selectedReport.referenceCode}
              </p>
              <h1 style={{
                maxWidth: 850,
                margin: '0 0 16px',
                color: '#ffffff',
                fontSize: 'clamp(24px, 4vw, 36px)',
                fontWeight: 800,
                letterSpacing: '-0.5px',
                lineHeight: 1.2,
              }}>
                {selectedReport.title}
              </h1>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px 20px',
                color: 'rgba(255,255,255,0.7)',
                fontSize: 13,
              }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={15} />
                  {[selectedReport.districtName, selectedReport.subcountyName, selectedReport.parishName, selectedReport.villageName]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={15} /> {formatDate(selectedReport.createdAt)}
                </span>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.1)',
                  color: ({
                    pending: '#e2e8f0',
                    under_review: '#fcd34d',
                    resolved: '#86efac',
                    rejected: '#fca5a5',
                  } satisfies Record<ReportStatus, string>)[selectedReport.status],
                  fontWeight: 700,
                }}>
                  {statusLabels[selectedReport.status]}
                </span>
              </div>
              <p style={{
                maxWidth: 850,
                margin: '24px 0 0',
                color: 'rgba(255,255,255,0.85)',
                fontSize: 15,
                lineHeight: 1.7,
                whiteSpace: 'pre-wrap',
                overflowWrap: 'anywhere',
              }}>
                {selectedReport.description}
              </p>
              {selectedReport.attachments && selectedReport.attachments.length > 0 && (
                <section aria-label="Report attachments" style={{ maxWidth: 850, marginTop: 28 }}>
                  <h2 style={{ margin: '0 0 12px', color: '#ffffff', fontSize: 16, fontWeight: 700 }}>
                    Attachments ({selectedReport.attachments.length})
                  </h2>
                  <ReportAttachmentGallery attachments={selectedReport.attachments} dark />
                </section>
              )}
            </>
          ) : (
            /* ── List view hero with unified stats ── */
            <>
              <div style={{ maxWidth: 720 }}>
                <h1 style={{
                  margin: 0,
                  color: '#ffffff',
                  fontSize: 'clamp(28px, 4vw, 40px)',
                  fontWeight: 800,
                  letterSpacing: '-0.5px',
                  lineHeight: 1.15,
                }}>
                  {statusFilter === 'all' && category === 'All'
                    ? <>Reports across <span style={{ color: '#fca5a5' }}>Uganda</span></>
                    : statusFilter === 'all'
                      ? <>Reports about <span style={{ color: '#fca5a5' }}>{category}</span></>
                      : <>{selectedStatusLabel} reports{category !== 'All' && <> about <span style={{ color: '#fca5a5' }}>{category}</span></>}{category === 'All' && <> across <span style={{ color: '#fca5a5' }}>Uganda</span></>}</>}
                </h1>
                <p style={{
                  maxWidth: 600,
                  margin: '12px 0 0',
                  color: 'rgba(255,255,255,0.65)',
                  fontSize: 15,
                  lineHeight: 1.6,
                }}>
                  {statusFilter === 'all' && category === 'All'
                    ? 'Read concerns raised by communities, follow their progress and explore reports from districts across the country.'
                    : statusFilter === 'all'
                      ? `Explore community reports about ${category.toLowerCase()}, follow their progress and see which districts are affected.`
                      : `${selectedStatusLabel} community reports${categoryDescription}, with live counts for the districts represented.`}
                </p>
              </div>

              <div
                aria-label="Report statistics"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: 0,
                  marginTop: 'clamp(20px, 4vw, 32px)',
                  borderTop: '1px solid rgba(255,255,255,0.12)',
                  paddingTop: 'clamp(16px, 3vw, 24px)',
                }}
              >
                {[
                  {
                    label: statusFilter !== 'all'
                      ? `${selectedStatusLabel} reports${category === 'All' ? '' : ` · ${category}`}`
                      : category === 'All' ? 'Published reports' : `${category} reports`,
                    value: loading || heroStatsLoading
                      ? '—'
                      : heroStats?.totalReports.toLocaleString('en-UG') ?? '—',
                    accent: '#fca5a5',
                  },
                  {
                    label: heroDistrictLabel,
                    value: heroStatsLoading
                      ? '—'
                      : heroStats?.districtCount.toLocaleString('en-UG') ?? '—',
                    accent: '#93c5fd',
                  },
                  {
                    label: 'Resolved',
                    value: overviewStats?.resolvedReports.toLocaleString('en-UG') ?? '—',
                    accent: '#86efac',
                  },
                  {
                    label: 'Avg resolution',
                    value: overviewStats?.averageResolutionDays == null
                      ? '—'
                      : `${overviewStats.averageResolutionDays.toFixed(1)} days`,
                    accent: '#fcd34d',
                  },
                ].map((stat, index) => (
                  <div
                    key={stat.label}
                    style={{
                      padding: '0 clamp(12px, 2vw, 20px)',
                      borderLeft: index === 0 ? 'none' : '1px solid rgba(255,255,255,0.12)',
                    }}
                  >
                    <div style={{
                      color: '#ffffff',
                      fontSize: 'clamp(22px, 3vw, 28px)',
                      fontWeight: 800,
                      lineHeight: 1,
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      {stat.value}
                    </div>
                    <div style={{
                      marginTop: 8,
                      color: stat.accent,
                      fontSize: 12,
                      fontWeight: 600,
                    }}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              {(heroStatsError || overviewStatsError) && (
                <p role="alert" style={{ margin: '16px 0 0', color: '#fca5a5', fontSize: 13 }}>
                  Some statistics are temporarily unavailable.
                </p>
              )}
            </>
          )}
          </div>
        </header>

        {/* ── List of Reports ── */}
        {!reportSelected && <div style={{ padding: '24px clamp(20px, 6vw, 72px) 48px' }}>
          {error ? (
            <p role="alert" style={{ padding: '24px 0', color: '#dc2626', fontSize: 14 }}>
              {error}
            </p>
          ) : loading ? (
            <p role="status" style={{ padding: '24px 0', color: '#64748b', fontSize: 14 }}>
              Loading reports…
            </p>
          ) : filteredReports.length === 0 ? (
            <div style={{ padding: '48px 0', color: '#64748b', textAlign: 'center' }}>
              <Inbox size={32} style={{ margin: '0 auto 16px', color: '#cbd5e1' }} />
              <p style={{ margin: '0 0 8px', color: '#0f172a', fontSize: 16, fontWeight: 600 }}>
                {reports.length === 0
                  ? 'No reports have been submitted yet'
                  : `No ${statusFilter === 'all' ? '' : `${statusLabels[statusFilter].toLowerCase()} `}${category === 'All' ? '' : `${category.toLowerCase()} `}reports yet`}
              </p>
              <p style={{ margin: 0, fontSize: 14 }}>Reports in this category will appear here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredReports.map((report) => (
                <div
                  key={report._id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 16,
                    padding: '20px',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                    transition: 'box-shadow 0.2s, border-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05)';
                    e.currentTarget.style.borderColor = '#cbd5e1';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.02)';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <button
                      type="button"
                      data-report-id={report._id}
                      aria-current={reportSelected && report._id === selectedReport?._id ? 'true' : undefined}
                      onClick={() => openReport(report)}
                      style={{
                        display: 'block',
                        maxWidth: '100%',
                        padding: 0,
                        border: 0,
                        background: 'transparent',
                        color: '#0f172a',
                        cursor: 'pointer',
                        font: 'inherit',
                        fontSize: 16,
                        fontWeight: 700,
                        lineHeight: 1.4,
                        textAlign: 'left',
                        marginBottom: '8px',
                      }}
                    >
                      {report.title}
                    </button>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: '6px 12px',
                      color: '#64748b',
                      fontSize: 13,
                      lineHeight: 1.5,
                    }}>
                      <span style={{ fontWeight: 600, color: '#475569' }}>{report.referenceCode}</span>
                      <span>•</span>
                      <span>{report.category}</span>
                      <span>•</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={13} />
                        {report.districtName}
                        {report.subcountyName ? `, ${report.subcountyName}` : ''}
                      </span>
                      <span>•</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={13} />
                        {formatDate(report.createdAt)}
                      </span>
                    </div>
                  </div>
                  <span style={{
                    flexShrink: 0,
                    padding: '4px 12px',
                    borderRadius: '999px',
                    background: `color-mix(in srgb, ${statusColors[report.status]} 10%, transparent)`,
                    color: statusColors[report.status],
                    border: `1px solid color-mix(in srgb, ${statusColors[report.status]} 20%, transparent)`,
                    fontSize: 12,
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                  }}>
                    {statusLabels[report.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>}
      </div>
    </section>
  );
}