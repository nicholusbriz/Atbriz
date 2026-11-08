'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, RefreshCw, FileText, Trash2, MoreVertical, Search } from 'lucide-react';
import ReportAttachmentGallery from '@/components/ReportAttachmentGallery';

interface AdminAttachment {
  secureUrl: string;
  resourceType: 'image' | 'video';
  format: string;
  bytes: number;
}

interface AdminReport {
  _id: string;
  referenceCode: string;
  title?: string;
  category: string;
  description: string;
  email?: string;
  attachments?: AdminAttachment[];
  districtName: string;
  subcountyName?: string;
  parishName?: string;
  villageName?: string;
  villageType?: 'village' | 'cell';
  status: 'pending' | 'under_review' | 'resolved' | 'rejected';
  isDemo?: boolean;
  createdAt: string;
}

interface ReportsResponse {
  reports: AdminReport[];
  total: number;
}

const STATUS_LABELS: Record<AdminReport['status'], string> = {
  pending: 'Pending',
  under_review: 'Under review',
  resolved: 'Resolved',
  rejected: 'Rejected',
};

const STATUS_ORDER: AdminReport['status'][] = ['pending', 'under_review', 'resolved', 'rejected'];

const STATUS_STYLES: Record<AdminReport['status'], { bg: string; color: string; accent: string }> = {
  pending:      { bg: 'rgba(212,168,75,0.10)', color: 'var(--gold)',    accent: 'var(--gold)' },
  under_review: { bg: 'rgba(91,141,217,0.10)', color: '#3b72b8',        accent: '#5b8dd9' },
  resolved:     { bg: 'rgba(45,90,61,0.10)',   color: 'var(--forest)',  accent: 'var(--forest)' },
  rejected:     { bg: 'rgba(184,72,74,0.10)',  color: 'var(--crimson)', accent: 'var(--crimson)' },
};

export default function ReportsSection() {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [expandedReports, setExpandedReports] = useState<Set<string>>(() => new Set());
  const [districtFilter, setDistrictFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<AdminReport['status'] | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'district'>('newest');
  const [openMenuId, setOpenMenuId] = useState('');
  const menuRefs = useRef(new Map<string, HTMLDivElement>());
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState('');
  const [updatingId, setUpdatingId] = useState('');
  const [error, setError] = useState('');

  async function loadReports() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/reports');
      const data = await response.json() as ReportsResponse & { error?: string };
      if (!response.ok) throw new Error(data.error ?? 'Could not load reports');
      setReports(data.reports);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load reports');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    fetch('/api/admin/reports')
      .then(async (response) => {
        const data = await response.json() as ReportsResponse & { error?: string };
        if (!response.ok) throw new Error(data.error ?? 'Could not load reports');
        if (active) setReports(data.reports);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'Could not load reports');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!openMenuId) return;

    function handleDocumentClick(event: MouseEvent) {
      const menu = menuRefs.current.get(openMenuId);
      if (event.target instanceof Node && menu && !menu.contains(event.target)) {
        setOpenMenuId('');
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpenMenuId('');
    }
    document.addEventListener('mousedown', handleDocumentClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openMenuId]);

  async function deleteReport(report: AdminReport) {
    setOpenMenuId('');
    if (!window.confirm(`Permanently delete report ${report.referenceCode}? This cannot be undone.`)) return;

    setDeletingId(report._id);
    setError('');
    try {
      const response = await fetch('/api/admin/reports', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: report._id }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? 'Could not delete report');
      setReports((current) => current.filter((item) => item._id !== report._id));
      setExpandedReports((current) => {
        const next = new Set(current);
        next.delete(report._id);
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete report');
    } finally {
      setDeletingId('');
    }
  }

  async function changeStatus(report: AdminReport, nextStatus: AdminReport['status']) {
    setOpenMenuId('');
    if (report.status === nextStatus) return;

    setUpdatingId(report._id);
    setError('');
    try {
      const response = await fetch('/api/admin/reports/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: report._id, status: nextStatus }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? 'Could not update status');
      setReports((current) =>
        current.map((r) => (r._id === report._id ? { ...r, status: nextStatus } : r)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update status');
    } finally {
      setUpdatingId('');
    }
  }

  const districts = useMemo(
    () => [...new Set(reports.map((r) => r.districtName).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [reports],
  );
  const availableCategories = useMemo(
    () => [...new Set(reports.map((r) => r.category).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [reports],
  );
  const statusCounts = useMemo(() => {
    const counts: Record<AdminReport['status'], number> = {
      pending: 0, under_review: 0, resolved: 0, rejected: 0,
    };
    for (const report of reports) counts[report.status] += 1;
    return counts;
  }, [reports]);

  const filteredReports = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = reports.filter((report) => {
      if (districtFilter && report.districtName !== districtFilter) return false;
      if (categoryFilter && report.category !== categoryFilter) return false;
      if (statusFilter && report.status !== statusFilter) return false;
      if (q) {
        const haystack = `${report.title ?? ''} ${report.referenceCode} ${report.description} ${report.districtName} ${report.email ?? ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
    return [...list].sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return a.districtName.localeCompare(b.districtName);
    });
  }, [reports, districtFilter, categoryFilter, statusFilter, searchQuery, sortBy]);

  const reportsByStatus = useMemo(() => {
    const groups: Record<string, AdminReport[]> = {};
    for (const report of filteredReports) {
      (groups[report.status] ??= []).push(report);
    }
    return groups;
  }, [filteredReports]);

  const filtersActive = Boolean(districtFilter || categoryFilter || statusFilter || searchQuery);

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>

      {/* ── Page header ── */}
      <div style={{ padding: '24px 20px 18px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={17} style={{ color: 'var(--crimson)' }} />
            <h1 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: 'var(--t1)' }}>All Reports</h1>
          </div>
          <button
            type="button"
            onClick={() => void loadReports()}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
              border: '1px solid var(--border-2)', borderRadius: 'var(--rf)',
              background: 'var(--surface)', color: 'var(--t2)', fontSize: 12,
              fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
            }}
          >
            <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>
        <p style={{ margin: '5px 0 0', color: 'var(--t3)', fontSize: 12 }}>
          Every submitted report, across all statuses.
        </p>
      </div>

      {/* ── Status stat band ── */}
      <div
        aria-label="Report counts by status"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        {STATUS_ORDER.map((status, i) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
            aria-pressed={statusFilter === status}
            style={{
              padding: '14px 8px',
              textAlign: 'center',
              border: 'none',
              borderRight: i < 3 ? '1px solid var(--border)' : 'none',
              background: statusFilter === status ? STATUS_STYLES[status].bg : 'transparent',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
          >
            <div style={{
              fontSize: 'clamp(20px, 2.5vw, 26px)',
              fontWeight: 900,
              color: STATUS_STYLES[status].accent,
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {loading ? '—' : statusCounts[status].toLocaleString()}
            </div>
            <div style={{
              marginTop: 6,
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--t3)',
              letterSpacing: 0.3,
              textTransform: 'uppercase',
            }}>
              {STATUS_LABELS[status]}
            </div>
          </button>
        ))}
      </div>

      {/* ── Filter + sort bar (scrolls with the page) ── */}
      <div
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          padding: '12px 20px',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 200 }}>
            <Search size={14} style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--t3)', pointerEvents: 'none',
            }} />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, code, description…"
              style={{
                width: '100%',
                padding: '9px 12px 9px 34px',
                border: '1px solid var(--border-2)',
                borderRadius: 'var(--r2)',
                background: 'var(--surface)',
                color: 'var(--t1)',
                fontSize: 12,
              }}
            />
          </div>
          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as AdminReport['status'] | '')}
            style={{ padding: '9px 12px', border: '1px solid var(--border-2)', borderRadius: 'var(--r2)', background: 'var(--surface)', color: 'var(--t1)', fontSize: 12 }}
          >
            <option value="">All statuses</option>
            {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
          <select
            aria-label="Filter by district"
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            style={{ padding: '9px 12px', border: '1px solid var(--border-2)', borderRadius: 'var(--r2)', background: 'var(--surface)', color: 'var(--t1)', fontSize: 12 }}
          >
            <option value="">All districts</option>
            {districts.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select
            aria-label="Filter by category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ padding: '9px 12px', border: '1px solid var(--border-2)', borderRadius: 'var(--r2)', background: 'var(--surface)', color: 'var(--t1)', fontSize: 12 }}
          >
            <option value="">All categories</option>
            {availableCategories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <p style={{ margin: 0, marginLeft: 'auto', color: 'var(--t3)', fontSize: 12 }}>
            {filteredReports.length.toLocaleString()} {filteredReports.length === 1 ? 'report' : 'reports'}
            {filtersActive && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery(''); setStatusFilter(''); setDistrictFilter(''); setCategoryFilter('');
                }}
                style={{
                  marginLeft: 10, padding: 0, border: 0, background: 'none',
                  color: 'var(--crimson)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                }}
              >
                Clear
              </button>
            )}
          </p>
        </div>

        {/* Sort tabs */}
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          {([
            { id: 'newest', label: 'Newest first' },
            { id: 'oldest', label: 'Oldest first' },
            { id: 'district', label: 'By district' },
          ] as const).map((opt) => {
            const active = sortBy === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSortBy(opt.id)}
                aria-pressed={active}
                style={{
                  padding: '5px 10px',
                  border: `1px solid ${active ? 'var(--crimson)' : 'var(--border)'}`,
                  borderRadius: 'var(--rf)',
                  background: active ? 'rgba(184,72,74,0.08)' : 'transparent',
                  color: active ? 'var(--crimson)' : 'var(--t2)',
                  fontSize: 11,
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Report list ── */}
      <div className="inner" style={{ paddingTop: 18, paddingBottom: 32 }}>

        {error && (
          <div role="alert" style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: 12, marginBottom: 14,
            border: '1px solid rgba(184,72,74,0.2)', borderRadius: 'var(--r2)',
            color: 'var(--crimson)', fontSize: 13,
          }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {loading ? (
          <p style={{ padding: 24, textAlign: 'center', color: 'var(--t3)', fontSize: 13 }}>Loading reports…</p>
        ) : !error && reports.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--t3)' }}>
            <FileText size={28} style={{ marginBottom: 8, opacity: 0.6 }} />
            <p style={{ margin: 0, fontSize: 13 }}>No reports have been submitted yet.</p>
          </div>
        ) : !error && filteredReports.length === 0 ? (
          <p style={{ padding: 24, textAlign: 'center', color: 'var(--t3)', fontSize: 13 }}>
            No reports match the current filters.
          </p>
        ) : (
          <div style={{ display: 'grid', gap: 22 }}>
            {STATUS_ORDER.filter((status) => reportsByStatus[status]?.length).map((status) => (
              <section key={status} aria-label={`${STATUS_LABELS[status]} reports`}>
                <h2 style={{
                  margin: '0 0 10px',
                  paddingBottom: 8,
                  borderBottom: '1px solid var(--border)',
                  color: 'var(--t1)',
                  fontSize: 13,
                  fontWeight: 800,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                }}>
                  {STATUS_LABELS[status]}{' '}
                  <span style={{ color: 'var(--t3)', fontSize: 11, fontWeight: 600, letterSpacing: 0 }}>
                    ({reportsByStatus[status].length})
                  </span>
                </h2>
                <div style={{ display: 'grid', gap: 10 }}>
                  {reportsByStatus[status].map((report) => {
                    const isExpanded = expandedReports.has(report._id);
                    const location = [
                      report.villageName ? `${report.villageName}${report.villageType ? ` (${report.villageType})` : ''}` : '',
                      report.parishName,
                      report.subcountyName,
                      report.districtName,
                    ].filter(Boolean).join(', ');

                    return (
                      <article key={report._id} style={{
                        padding: '10px 16px',
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--r2)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                          <button
                            type="button"
                            aria-expanded={isExpanded}
                            onClick={() => setExpandedReports((current) => {
                              const next = new Set(current);
                              if (next.has(report._id)) next.delete(report._id);
                              else next.add(report._id);
                              return next;
                            })}
                            style={{
                              flex: 1, minWidth: 0, padding: 0, border: 0, background: 'transparent',
                              textAlign: 'left', cursor: 'pointer', fontSize: 14, fontWeight: 800,
                              color: 'var(--t1)',
                            }}
                          >
                            {report.title || report.referenceCode}
                            {report.isDemo && (
                              <span style={{ marginLeft: 8, color: 'var(--t3)', fontSize: 10, fontWeight: 700 }}>
                                Demo data
                              </span>
                            )}
                          </button>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{
                              padding: '4px 9px',
                              borderRadius: 'var(--rf)',
                              background: STATUS_STYLES[report.status].bg,
                              color: STATUS_STYLES[report.status].color,
                              fontSize: 11,
                              fontWeight: 700,
                            }}>
                              {STATUS_LABELS[report.status] ?? report.status}
                            </span>
                            <div
                              ref={(element) => {
                                if (element) menuRefs.current.set(report._id, element);
                                else menuRefs.current.delete(report._id);
                              }}
                              style={{ position: 'relative' }}
                            >
                              <button
                                type="button"
                                aria-label={`More options for report ${report.referenceCode}`}
                                aria-haspopup="menu"
                                aria-expanded={openMenuId === report._id}
                                disabled={deletingId === report._id || updatingId === report._id}
                                onClick={() => setOpenMenuId((current) => current === report._id ? '' : report._id)}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                  padding: 6, border: '1px solid var(--border-2)', borderRadius: 6,
                                  background: 'var(--surface)', color: 'var(--t2)',
                                  cursor: (deletingId === report._id || updatingId === report._id) ? 'wait' : 'pointer',
                                }}
                              >
                                <MoreVertical size={16} />
                              </button>
                              {openMenuId === report._id && (
                                <div
                                  role="menu"
                                  aria-label={`Options for report ${report.referenceCode}`}
                                  style={{
                                    position: 'absolute', top: 'calc(100% + 4px)', right: 0,
                                    zIndex: 5, minWidth: 160, padding: 4,
                                    background: 'var(--surface)', border: '1px solid var(--border-2)',
                                    borderRadius: 'var(--r2)', boxShadow: '0 6px 18px rgba(0,0,0,0.14)',
                                  }}
                                >
                                  <p style={{
                                    padding: '6px 10px 4px', margin: 0, fontSize: 10, fontWeight: 700,
                                    color: 'var(--t3)', letterSpacing: 0.3, textTransform: 'uppercase',
                                  }}>
                                    Move to
                                  </p>
                                  {STATUS_ORDER
                                    .filter((s) => s !== report.status)
                                    .map((s) => (
                                      <button
                                        key={s}
                                        type="button"
                                        role="menuitem"
                                        onClick={() => void changeStatus(report, s)}
                                        style={{
                                          display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                                          padding: '8px 10px', border: 0, borderRadius: 5,
                                          background: 'transparent', color: 'var(--t1)',
                                          fontSize: 12, textAlign: 'left', cursor: 'pointer',
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                      >
                                        {STATUS_LABELS[s]}
                                      </button>
                                    ))}
                                  <div style={{ height: 1, margin: '4px 6px', background: 'var(--border)' }} />
                                  <button
                                    type="button"
                                    role="menuitem"
                                    onClick={() => void deleteReport(report)}
                                    style={{
                                      display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                                      padding: '8px 10px', border: 0, borderRadius: 5,
                                      background: 'transparent', color: 'var(--crimson)',
                                      fontSize: 12, textAlign: 'left', cursor: 'pointer',
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(184,72,74,0.06)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                  >
                                    <Trash2 size={14} /> Delete report
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {isExpanded && (
                          <>
                            <p style={{ margin: '8px 0 0', color: 'var(--t3)', fontSize: 11 }}>
                              {report.referenceCode} · {report.category} · {new Date(report.createdAt).toLocaleString()}
                            </p>
                            <p style={{
                              margin: '10px 0 0',
                              color: 'var(--t1)',
                              fontSize: 13,
                              lineHeight: 1.55,
                              whiteSpace: 'pre-wrap',
                              overflowWrap: 'anywhere',
                            }}>
                              {report.description}
                            </p>
                            {report.attachments && report.attachments.length > 0 && (
                              <div style={{ marginTop: 10 }}>
                                <ReportAttachmentGallery attachments={report.attachments} />
                              </div>
                            )}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', marginTop: 10, color: 'var(--t3)', fontSize: 11 }}>
                              <span>Location: {location || 'Not specified'}</span>
                              {report.email && <span>Email: {report.email}</span>}
                            </div>
                          </>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}