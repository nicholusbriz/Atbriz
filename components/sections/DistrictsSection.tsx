'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Loader, Search } from 'lucide-react';
import Image from 'next/image';

interface LocationOption {
  _id: string;
  name: string;
  parentId?: string;
  parentName?: string;
  type?: 'village' | 'cell';
}

interface District extends LocationOption {
  region: string;
}

interface DistrictLocations {
  subcounties: LocationOption[];
  parishes: LocationOption[];
  localities: LocationOption[];
}

interface AllDistrictStats {
  districts: number;
  subcounties: number;
  parishes: number;
  villages: number;
}

const EMPTY_LOCATIONS: DistrictLocations = {
  subcounties: [],
  parishes: [],
  localities: [],
};

function LocationPicker({
  districts,
  value,
  loading,
  onChange,
}: {
  districts: District[];
  value: string;
  loading: boolean;
  onChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedDistrict = districts.find((district) => district._id === value);
  const filteredDistricts = districts.filter((district) =>
    !query.trim()
    || `${district.name} ${district.region}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  );

  useEffect(() => {
    if (!isOpen) return;

    function handleOutsideClick(event: MouseEvent) {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  return (
    <div ref={rootRef} style={{ flex: '1 1 280px', minWidth: 0, maxWidth: 480 }}>
      <label style={{ display: 'block', marginBottom: 8, color: '#334155', fontSize: 14, fontWeight: 600 }}>
        Select District
      </label>
      <div style={{ position: 'relative' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          minHeight: 48,
          padding: '0 14px',
          border: isOpen ? '2px solid #2563eb' : '1px solid #cbd5e1',
          borderRadius: 8,
          background: '#ffffff',
          boxShadow: isOpen ? '0 0 0 3px rgba(37, 99, 235, 0.1)' : 'none',
          transition: 'all 0.2s ease',
        }}>
          <Search size={18} aria-hidden="true" style={{ flexShrink: 0, color: '#64748b' }} />
          <input
            type="search"
            value={query}
            disabled={loading || districts.length === 0}
            onFocus={() => setIsOpen(true)}
            onChange={(event) => {
              setQuery(event.target.value);
              setIsOpen(true);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setIsOpen(false);
            }}
            placeholder={loading ? 'Loading districts…' : selectedDistrict?.name ?? 'Search districts…'}
            role="combobox"
            aria-autocomplete="list"
            aria-label="Search and select a district"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-controls="district-options"
            style={{
              flex: '1 1 auto',
              width: 0,
              minWidth: 0,
              padding: '12px 0',
              border: 0,
              outline: 'none',
              background: 'transparent',
              color: '#0f172a',
              font: 'inherit',
              fontSize: 16,
              opacity: loading || districts.length === 0 ? 0.55 : 1,
            }}
          />
          {loading ? (
            <Loader size={18} aria-hidden="true" style={{ flexShrink: 0, color: '#64748b', animation: 'spin 1s linear infinite' }} />
          ) : (
            <button
              type="button"
              aria-label={isOpen ? 'Close district options' : 'Show district options'}
              aria-haspopup="listbox"
              aria-expanded={isOpen}
              disabled={districts.length === 0}
              onClick={() => setIsOpen((open) => !open)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                border: 0,
                background: 'transparent',
                color: '#64748b',
                cursor: districts.length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              <ChevronDown size={20} aria-hidden="true" />
            </button>
          )}
        </div>
        {isOpen && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            left: 0,
            zIndex: 50,
            padding: 8,
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            background: '#ffffff',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
          }}>
            <div id="district-options" role="listbox" aria-label="Districts" style={{
              maxHeight: 260,
              overflowY: 'auto',
              overscrollBehavior: 'contain',
            }}>
              {filteredDistricts.length > 0 ? filteredDistricts.map((district) => (
                <button
                  key={district._id}
                  type="button"
                  role="option"
                  aria-selected={value === district._id}
                  onClick={() => {
                    onChange(district._id);
                    setIsOpen(false);
                    setQuery('');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '10px 12px',
                    border: 0,
                    borderRadius: 6,
                    background: value === district._id ? '#eff6ff' : 'transparent',
                    color: value === district._id ? '#1d4ed8' : '#334155',
                    font: 'inherit',
                    fontSize: 15,
                    fontWeight: value === district._id ? 600 : 500,
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <span>{district.name}</span>
                  <span style={{ color: '#64748b', fontSize: 13 }}>{district.region}</span>
                </button>
              )) : (
                <p style={{ margin: 0, padding: 12, color: '#64748b', fontSize: 14, textAlign: 'center' }}>
                  No matching districts.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const data = await response.json() as T | { error?: string };
  if (!response.ok) {
    const message = data && typeof data === 'object' && 'error' in data
      ? data.error
      : undefined;
    throw new Error(message ?? 'Could not load district locations');
  }
  return data as T;
}

async function fetchDistrictLocations(districtId: string): Promise<DistrictLocations> {
  const levels = ['subcounty', 'parish', 'village'] as const;
  const results = await Promise.all(levels.map((level) =>
    fetchJson<LocationOption[]>(
      `/api/locations/children?districtId=${encodeURIComponent(districtId)}&level=${level}`,
    ),
  ));

  return {
    subcounties: results[0],
    parishes: results[1],
    localities: results[2],
  };
}

export default function DistrictsSection() {
  const [districts, setDistricts] = useState<District[]>([]);
  const [districtId, setDistrictId] = useState('');
  const [selectedSubcountyId, setSelectedSubcountyId] = useState('');
  const [locations, setLocations] = useState<DistrictLocations>(EMPTY_LOCATIONS);
  const [loadingDistricts, setLoadingDistricts] = useState(true);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [allDistrictStats, setAllDistrictStats] = useState<AllDistrictStats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    fetch('/api/admin/sync/status', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json() as { ok?: boolean; counts?: AllDistrictStats; error?: string };
        if (!response.ok || !data.ok || !data.counts) {
          throw new Error(data.error ?? 'Could not load all-district statistics');
        }
        return data.counts;
      })
      .then((counts) => {
        if (active) setAllDistrictStats(counts);
      })
      .catch((cause: unknown) => {
        if (active) {
          console.error('[DistrictsSection] Could not load all-district statistics', cause);
        }
      });

    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;

    fetchJson<District[]>('/api/locations/districts')
      .then((items) => {
        if (!active) return;
        setDistricts(items);
        const defaultDistrict = items.find((district) => district.name.toLocaleLowerCase() === 'kampala')
          ?? items[0];
        const defaultDistrictId = defaultDistrict?._id ?? '';
        setDistrictId(defaultDistrictId);
        setLoadingLocations(Boolean(defaultDistrictId));
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Could not load districts');
      })
      .finally(() => {
        if (active) setLoadingDistricts(false);
      });

    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!districtId) return;
    let active = true;

    fetchDistrictLocations(districtId)
      .then((items) => {
        if (!active) return;
        setLocations(items);
        setSelectedSubcountyId((current) =>
          items.subcounties.some((subcounty) => subcounty._id === current)
            ? current
            : items.subcounties[0]?._id ?? '',
        );
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Could not load district locations');
      })
      .finally(() => {
        if (active) setLoadingLocations(false);
      });

    return () => { active = false; };
  }, [districtId]);

  const selectedDistrict = districts.find((district) => district._id === districtId);
  const parishesBySubcounty = useMemo(() => {
    const groups = new Map<string, LocationOption[]>();
    for (const parish of locations.parishes) {
      const parentId = parish.parentId ?? '';
      groups.set(parentId, [...(groups.get(parentId) ?? []), parish]);
    }
    return groups;
  }, [locations.parishes]);

  const localitiesByParish = useMemo(() => {
    const groups = new Map<string, LocationOption[]>();
    for (const locality of locations.localities) {
      const parentId = locality.parentId ?? '';
      groups.set(parentId, [...(groups.get(parentId) ?? []), locality]);
    }
    return groups;
  }, [locations.localities]);

  const selectedSubcounty = locations.subcounties.find((subcounty) => subcounty._id === selectedSubcountyId);
  const selectedParishes = selectedSubcounty
    ? parishesBySubcounty.get(selectedSubcounty._id) ?? []
    : [];

  // Hero stat band: national coverage on the left, selected district on the right
  const nationalStats = [
    {
      value: allDistrictStats ? allDistrictStats.districts.toLocaleString('en-UG') : '—',
      label: 'Districts',
      color: '#fca5a5',
    },
    {
      value: allDistrictStats ? allDistrictStats.subcounties.toLocaleString('en-UG') : '—',
      label: 'Subcounties',
      color: '#fcd34d',
    },
    {
      value: allDistrictStats ? allDistrictStats.parishes.toLocaleString('en-UG') : '—',
      label: 'Parishes',
      color: '#86efac',
    },
    {
      value: allDistrictStats ? allDistrictStats.villages.toLocaleString('en-UG') : '—',
      label: 'Villages & cells',
      color: '#93c5fd',
    },
  ];

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#f8fafc' }}>

      {/* ── Header ── */}
      <header style={{
        padding: 'clamp(24px, 5vw, 48px) clamp(20px, 6vw, 72px)',
        color: '#ffffff',
        background: '#0f172a',
        borderBottom: '1px solid #e2e8f0',
        overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
          <div style={{ minWidth: 0, flex: '1 1 auto' }}>
            <h1 style={{ margin: 0, fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, letterSpacing: '-0.5px' }}>
              Explore a district
            </h1>
            <p style={{ maxWidth: 600, margin: '12px 0 0', color: 'rgba(255,255,255,0.65)', fontSize: 15, lineHeight: 1.6 }}>
              Select a district to browse its subcounties, parishes and villages.
            </p>
          </div>

          {/* Flag Image */}
          <div style={{
            position: 'relative',
            flex: '0 0 clamp(80px, 16vw, 140px)',
            height: 'clamp(80px, 16vw, 140px)',
            opacity: 0.9,
          }}>
            <Image
              src="/uganda%20flag.png"
              alt="Uganda flag"
              fill
              priority
              sizes="(max-width: 480px) 80px, 140px"
              style={{ objectFit: 'contain' }}
            />
          </div>
        </div>
      </header>

      {/* ── National coverage stat band (outside hero, own surface) ── */}
      <div
        aria-label="Uganda national coverage"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        {nationalStats.map((stat, i) => (
          <div
            key={stat.label}
            style={{
              padding: '16px 8px',
              textAlign: 'center',
              borderRight: i < nationalStats.length - 1 ? '1px solid #e2e8f0' : 'none',
            }}
          >
            <div
              style={{
                fontSize: 'clamp(20px, 3vw, 26px)',
                fontWeight: 900,
                color: '#0f172a',
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
                color: '#64748b',
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

      {/* ── Main Content ── */}
      <main style={{ width: '100%', maxWidth: 1000, margin: '0 auto', padding: '32px 16px 64px' }}>

        {/* Picker Section */}
        <div style={{
          background: '#ffffff',
          padding: '24px',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          marginBottom: '32px',
        }}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: '16px 24px',
          }}>
            <LocationPicker
              districts={districts}
              value={districtId}
              loading={loadingDistricts}
              onChange={(nextId) => {
                setDistrictId(nextId);
                setSelectedSubcountyId('');
                setLocations(EMPTY_LOCATIONS);
                setError('');
                setLoadingLocations(Boolean(nextId));
              }}
            />
            {selectedDistrict && (
              <h2 style={{
                flex: '0 1 auto',
                minWidth: 0,
                margin: 0,
                color: '#0f172a',
                fontSize: 18,
                fontWeight: 700,
                overflowWrap: 'anywhere',
              }}>
                {selectedDistrict.name} Locations
              </h2>
            )}
          </div>

          {/* Selected district mini-stats strip (inline, inside the picker card) */}
          {selectedDistrict && (
            <div
              aria-label={`Location totals for ${selectedDistrict.name}`}
              style={{
                marginTop: 20,
                paddingTop: 16,
                borderTop: '1px solid #f1f5f9',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 8,
              }}
            >
              {[
                { label: 'Subcounties', count: locations.subcounties.length, color: 'var(--crimson)' },
                { label: 'Parishes', count: locations.parishes.length, color: 'var(--forest)' },
                { label: 'Villages & cells', count: locations.localities.length, color: '#5b8dd9' },
              ].map(({ label, count, color }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      color,
                      fontSize: 'clamp(18px, 2.5vw, 22px)',
                      fontWeight: 900,
                      lineHeight: 1,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {loadingLocations ? '—' : count.toLocaleString('en-UG')}
                  </div>
                  <div
                    style={{
                      marginTop: 4,
                      color: '#64748b',
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: 0.3,
                      textTransform: 'uppercase',
                    }}
                  >
                    {label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div role="alert" style={{
            margin: '0 0 24px',
            padding: '16px',
            borderRadius: '8px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            fontSize: 14,
            fontWeight: 500,
          }}>
            {error}
          </div>
        )}

        {/* Data Tree */}
        {districtId && (loadingLocations ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#64748b', fontSize: 15 }}>
            <Loader size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
            Loading locations in {selectedDistrict?.name ?? 'district'}…
          </div>
        ) : locations.subcounties.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#64748b', fontSize: 15 }}>
            No subcounties are available for this district.
          </div>
        ) : (
          <section aria-label={`Location tree for ${selectedDistrict?.name ?? 'selected district'}`}>

            {/* Subcounty Navigation (Horizontal Pills) */}
            <nav aria-label={`Subcounties in ${selectedDistrict?.name ?? 'selected district'}`} style={{
              display: 'flex',
              overflowX: 'auto',
              gap: 8,
              paddingBottom: 16,
              marginBottom: 24,
              borderBottom: '1px solid #e2e8f0',
              scrollbarWidth: 'none',
            }}>
              {locations.subcounties.map((subcounty) => {
                const active = subcounty._id === selectedSubcountyId;
                const parishCount = parishesBySubcounty.get(subcounty._id)?.length ?? 0;
                return (
                  <button
                    key={subcounty._id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelectedSubcountyId(subcounty._id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      flexShrink: 0,
                      padding: '8px 16px',
                      border: active ? '1px solid #2563eb' : '1px solid #e2e8f0',
                      borderRadius: '999px',
                      background: active ? '#eff6ff' : '#ffffff',
                      color: active ? '#1d4ed8' : '#475569',
                      font: 'inherit',
                      fontSize: 14,
                      fontWeight: active ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {subcounty.name}
                    <span style={{
                      background: active ? '#dbeafe' : '#f1f5f9',
                      color: active ? '#1e40af' : '#64748b',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      fontSize: 12,
                      fontWeight: 700,
                    }}>
                      {parishCount}
                    </span>
                  </button>
                );
              })}
            </nav>

            {/* Parishes & Villages Grid */}
            {selectedSubcounty && (
              <div>
                <h3 style={{
                  margin: '0 0 16px',
                  color: '#0f172a',
                  fontSize: 18,
                  fontWeight: 700,
                }}>
                  Parishes in {selectedSubcounty.name}
                </h3>

                {selectedParishes.length > 0 ? (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
                    gap: '16px',
                  }}>
                    {selectedParishes.map((parish) => {
                      const villages = (localitiesByParish.get(parish._id) ?? [])
                        .filter((locality) => locality.type !== 'cell');
                      return (
                        <div key={parish._id} style={{
                          background: '#ffffff',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          padding: '16px',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                        }}>
                          <h4 style={{
                            margin: '0 0 12px',
                            color: '#0f172a',
                            fontSize: 16,
                            fontWeight: 700,
                            paddingBottom: 8,
                            borderBottom: '1px solid #f1f5f9',
                          }}>
                            {parish.name}
                          </h4>

                          <div>
                            <p style={{
                              margin: '0 0 8px',
                              color: '#059669',
                              fontSize: 12,
                              fontWeight: 700,
                              letterSpacing: '0.5px',
                              textTransform: 'uppercase',
                            }}>
                              Villages ({villages.length})
                            </p>
                            {villages.length > 0 ? (
                              <ul style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 6,
                                margin: 0,
                                padding: 0,
                                listStyle: 'none',
                              }}>
                                {villages.map((village) => (
                                  <li key={village._id} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    color: '#334155',
                                    fontSize: 14,
                                    lineHeight: 1.4,
                                  }}>
                                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#cbd5e1', flexShrink: 0 }} />
                                    {village.name}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p style={{ margin: 0, color: '#94a3b8', fontSize: 13, fontStyle: 'italic' }}>
                                No villages recorded.
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{
                    padding: '32px',
                    textAlign: 'center',
                    background: '#ffffff',
                    borderRadius: '12px',
                    border: '1px dashed #cbd5e1',
                    color: '#64748b',
                    fontSize: 15,
                  }}>
                    No parishes recorded for this subcounty.
                  </div>
                )}
              </div>
            )}
          </section>
        ))}
      </main>
    </div>
  );
}