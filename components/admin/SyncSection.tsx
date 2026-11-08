'use client';

import { useEffect, useRef, useState } from 'react';
import { RefreshCw, Database, MapPin, List, TreePine, Home, Plus, Pencil, Check, X, Trash2 } from 'lucide-react';

interface LocationOption {
  apiId: string;
  name: string;
  type?: 'village' | 'cell';
  parentName?: string;
}

type ManagedLevel = 'subcounty' | 'parish' | 'village';

async function fetchLocationOptions(parentId: string, level: string): Promise<LocationOption[]> {
  const res = await fetch(
    `/api/locations/children?parentId=${encodeURIComponent(parentId)}&level=${level}`,
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Could not load locations');
  return data.map((item: { _id: string; name: string; type?: 'village' | 'cell' }) => ({
    apiId: item._id,
    name: item.name,
    type: item.type,
  }));
}

async function fetchDistrictLocations(districtId: string, level: ManagedLevel): Promise<LocationOption[]> {
  const res = await fetch(
    `/api/locations/children?districtId=${encodeURIComponent(districtId)}&level=${level}`,
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Could not load district locations');
  return data.map((item: { _id: string; name: string; type?: 'village' | 'cell'; parentName?: string }) => ({
    apiId: item._id,
    name: item.name,
    type: item.type,
    parentName: item.parentName,
  }));
}

function SearchableLocationSelect({
  label, placeholder, options, value, onChange, disabled,
}: {
  label: string;
  placeholder: string;
  options: LocationOption[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selected = options.find((option) => option.apiId === value);
  const filtered = options.filter((option) =>
    option.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  );

  useEffect(() => {
    if (!open) return;
    function closeOnOutsideClick(event: MouseEvent) {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener('mousedown', closeOnOutsideClick);
    inputRef.current?.focus();
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [open]);

  return (
    <div ref={rootRef}>
      <label style={{ display: 'block', marginBottom: 6, color: 'var(--t2)', fontSize: 12, fontWeight: 700 }}>
        {label}
      </label>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => { setOpen((current) => !current); setQuery(''); }}
        style={{
          width: '100%', padding: '10px 12px', textAlign: 'left', color: selected ? 'var(--t1)' : 'var(--t3)',
          background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: 'var(--r2)',
          fontSize: 13, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.55 : 1,
        }}
      >
        {selected?.name ?? placeholder}
      </button>
      {open && (
        <div style={{
          position: 'relative', zIndex: 10, marginTop: 4, padding: 8, background: 'var(--surface)',
          border: '1px solid var(--border-2)', borderRadius: 'var(--r2)', boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
        }}>
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Escape') setOpen(false); }}
            placeholder={`Search ${label.toLowerCase()}…`}
            aria-label={`Search ${label.toLowerCase()}`}
            style={{
              width: '100%', boxSizing: 'border-box', padding: '8px 10px', marginBottom: 6,
              border: '1px solid var(--border-2)', borderRadius: 'var(--r2)',
              background: 'var(--surface)', color: 'var(--t1)', fontSize: 12,
            }}
          />
          <div role="listbox" aria-label={label} style={{ maxHeight: 180, overflowY: 'auto', overscrollBehavior: 'contain' }}>
            {filtered.length ? filtered.map((option) => (
              <button
                type="button"
                role="option"
                aria-selected={value === option.apiId}
                key={option.apiId}
                onClick={() => { onChange(option.apiId); setOpen(false); setQuery(''); }}
                style={{
                  width: '100%', display: 'block', padding: '8px 10px', textAlign: 'left',
                  color: 'var(--t1)', background: value === option.apiId ? 'rgba(45,90,61,0.1)' : 'transparent',
                  border: 0, borderRadius: 4, fontSize: 12, cursor: 'pointer',
                }}
              >
                {option.name}
              </button>
            )) : (
              <p style={{ margin: 0, padding: 10, color: 'var(--t3)', fontSize: 12 }}>No matching locations.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function LocationManager() {
  const [districts, setDistricts] = useState<LocationOption[]>([]);
  const [districtId, setDistrictId] = useState('');
  const [level, setLevel] = useState<ManagedLevel>('subcounty');
  const [subcounties, setSubcounties] = useState<LocationOption[]>([]);
  const [parishes, setParishes] = useState<LocationOption[]>([]);
  const [subcountyId, setSubcountyId] = useState('');
  const [parishId, setParishId] = useState('');
  const [records, setRecords] = useState<LocationOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'village' | 'cell'>('village');
  const [editingId, setEditingId] = useState('');
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<'village' | 'cell'>('village');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/locations/districts')
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Could not load districts');
        setDistricts(data.map((item: { _id: string; name: string }) => ({ apiId: item._id, name: item.name })));
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!districtId) return;
    fetchLocationOptions(districtId, 'subcounty')
      .then(setSubcounties)
      .catch((err: Error) => setError(err.message));
  }, [districtId]);

  useEffect(() => {
    if (!subcountyId) return;
    fetchLocationOptions(subcountyId, 'parish')
      .then(setParishes)
      .catch((err: Error) => setError(err.message));
  }, [subcountyId]);

  const addParentId = !districtId ? '' : level === 'subcounty'
    ? districtId
    : level === 'parish' ? subcountyId : parishId;

  useEffect(() => {
    let active = true;
    if (!districtId) return;
    fetchDistrictLocations(districtId, level)
      .then((items) => { if (active) setRecords(items); })
      .catch((err: Error) => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [districtId, level]);

  async function saveLocation(method: 'POST' | 'PATCH', id?: string, name = newName, type = newType) {
    if (!districtId || !name.trim() || (method === 'POST' && !addParentId)) {
      setError(method === 'POST'
        ? 'Select a district and the required parent location, then enter a name.'
        : 'Select a district and enter a name.');
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/admin/sync/locations', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          districtId,
          level,
          parentId: addParentId,
          id,
          name,
          type: level === 'village' ? type : undefined,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? 'Could not save location');
      setMessage(method === 'POST' ? 'Location added.' : 'Location updated.');
      setNewName('');
      setEditingId('');
      setRecords(await fetchDistrictLocations(districtId, level));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save location');
    } finally {
      setSaving(false);
    }
  }

  async function deleteLocation(record: LocationOption) {
    const levelName = level === 'village' ? (record.type ?? 'village') : level;
    if (!window.confirm(`Delete "${record.name}" (${levelName})? This cannot be undone.`)) return;

    setSaving(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/admin/sync/locations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ districtId, level, id: record.apiId }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? 'Could not delete location');
      setRecords((current) => current.filter((item) => item.apiId !== record.apiId));
      setMessage('Location deleted.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete location');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section style={{ marginBottom: 24, padding: '16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r2)' }}>
      <h3 style={{ margin: '0 0 5px', color: 'var(--t1)', fontSize: 14, fontWeight: 800 }}>Manage locations by district</h3>
      <p style={{ margin: '0 0 14px', color: 'var(--t3)', fontSize: 12, lineHeight: 1.5 }}>
        Choose a district and location level to add or rename its records. Changes are saved to the location models.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <SearchableLocationSelect
          label="District"
          placeholder="Choose a district…"
          options={districts}
          value={districtId}
          onChange={(id) => {
            setDistrictId(id);
            setSubcountyId('');
            setParishId('');
            setSubcounties([]);
            setParishes([]);
            setRecords([]);
            setError('');
            setMessage('');
          }}
        />
        <div>
          <label htmlFor="managed-level" style={{ display: 'block', marginBottom: 6, color: 'var(--t2)', fontSize: 12, fontWeight: 700 }}>
            Part to manage
          </label>
          <select
            id="managed-level"
            value={level}
            onChange={(event) => {
              setLevel(event.target.value as ManagedLevel);
              setRecords([]);
              setError('');
              setMessage('');
            }}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-2)', borderRadius: 'var(--r2)', background: 'var(--surface)', color: 'var(--t1)', fontSize: 13 }}
          >
            <option value="subcounty">Subcounties</option>
            <option value="parish">Parishes / wards</option>
            <option value="village">Villages / cells</option>
          </select>
        </div>

      </div>

      {districtId && (
        <>
          <form
            onSubmit={(event) => { event.preventDefault(); void saveLocation('POST'); }}
            style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14, alignItems: 'end' }}
          >
            {level === 'parish' && (
              <div style={{ flex: '1 1 200px' }}>
                <SearchableLocationSelect
                  label="Parent subcounty for new parish / ward"
                  placeholder="Choose a subcounty…"
                  options={subcounties}
                  value={subcountyId}
                  onChange={(id) => { setSubcountyId(id); setParishId(''); setParishes([]); }}
                />
              </div>
            )}
            {level === 'village' && (
              <>
                <div style={{ flex: '1 1 180px' }}>
                  <SearchableLocationSelect
                    label="Subcounty for new village / cell"
                    placeholder="Choose a subcounty…"
                    options={subcounties}
                    value={subcountyId}
                    onChange={(id) => { setSubcountyId(id); setParishId(''); setParishes([]); }}
                  />
                </div>
                <div style={{ flex: '1 1 180px' }}>
                  <SearchableLocationSelect
                    label="Parish / ward for new village / cell"
                    placeholder="Choose a parish…"
                    options={parishes}
                    value={parishId}
                    disabled={!subcountyId}
                    onChange={setParishId}
                  />
                </div>
              </>
            )}
            <input
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              maxLength={120}
              placeholder={`New ${level === 'village' ? 'village or cell' : level} name`}
              aria-label="New location name"
              style={{ flex: '1 1 180px', minWidth: 0, padding: '9px 10px', border: '1px solid var(--border-2)', borderRadius: 'var(--r2)', background: 'var(--surface)', color: 'var(--t1)', fontSize: 12 }}
            />
            {level === 'village' && (
              <select
                value={newType}
                onChange={(event) => setNewType(event.target.value as 'village' | 'cell')}
                aria-label="Location type"
                style={{ padding: '9px 10px', border: '1px solid var(--border-2)', borderRadius: 'var(--r2)', background: 'var(--surface)', color: 'var(--t1)', fontSize: 12 }}
              >
                <option value="village">Village</option>
                <option value="cell">Cell</option>
              </select>
            )}
            <button type="submit" disabled={saving || !newName.trim() || !addParentId} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 12px', border: 0, borderRadius: 'var(--r2)', background: 'var(--crimson)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: saving ? 'wait' : 'pointer', opacity: saving || !newName.trim() || !addParentId ? 0.55 : 1 }}>
              <Plus size={14} /> Add
            </button>
          </form>

          <div style={{ marginTop: 14 }}>
            <p style={{ margin: '0 0 7px', color: 'var(--t2)', fontSize: 12, fontWeight: 700 }}>
              Existing records · {records.length}
            </p>
            <div style={{ maxHeight: 280, overflowY: 'auto', overscrollBehavior: 'contain', border: '1px solid var(--border)', borderRadius: 'var(--r2)' }}>
              {records.length ? records.map((record) => (
                <div key={record.apiId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
                  {editingId === record.apiId ? (
                    <>
                      <input value={editName} onChange={(event) => setEditName(event.target.value)} maxLength={120} aria-label="Edit location name" style={{ flex: 1, minWidth: 0, padding: '7px 8px', border: '1px solid var(--border-2)', borderRadius: 6, background: 'var(--surface)', color: 'var(--t1)', fontSize: 12 }} />
                      {level === 'village' && (
                        <select value={editType} onChange={(event) => setEditType(event.target.value as 'village' | 'cell')} aria-label="Edit location type" style={{ padding: '7px', border: '1px solid var(--border-2)', borderRadius: 6, background: 'var(--surface)', color: 'var(--t1)', fontSize: 11 }}>
                          <option value="village">Village</option>
                          <option value="cell">Cell</option>
                        </select>
                      )}
                      <button type="button" aria-label="Save changes" disabled={saving || !editName.trim()} onClick={() => void saveLocation('PATCH', record.apiId, editName, editType)} style={{ padding: 6, border: 0, background: 'transparent', color: 'var(--forest)', cursor: 'pointer' }}><Check size={15} /></button>
                      <button type="button" aria-label="Cancel edit" onClick={() => setEditingId('')} style={{ padding: 6, border: 0, background: 'transparent', color: 'var(--t3)', cursor: 'pointer' }}><X size={15} /></button>
                    </>
                  ) : (
                    <>
                      <span style={{ flex: 1, minWidth: 0, color: 'var(--t1)', fontSize: 12 }}>{record.name}</span>
                      {level !== 'subcounty' && <span style={{ color: 'var(--t3)', fontSize: 10 }}>{record.parentName}</span>}
                      {level === 'village' && <span style={{ color: 'var(--t3)', fontSize: 10, textTransform: 'capitalize' }}>{record.type ?? 'village'}</span>}
                      <button type="button" aria-label={`Edit ${record.name}`} disabled={saving} onClick={() => { setEditingId(record.apiId); setEditName(record.name); setEditType(record.type ?? 'village'); }} style={{ padding: 6, border: 0, background: 'transparent', color: 'var(--t3)', cursor: saving ? 'not-allowed' : 'pointer' }}><Pencil size={14} /></button>
                      <button type="button" aria-label={`Delete ${record.name}`} disabled={saving} onClick={() => void deleteLocation(record)} style={{ padding: 6, border: 0, background: 'transparent', color: 'var(--crimson)', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.5 : 1 }}><Trash2 size={14} /></button>
                    </>
                  )}
                </div>
              )) : (
                <p style={{ margin: 0, padding: 12, color: 'var(--t3)', fontSize: 12 }}>
                  No records here yet. Add the first one above.
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {message && <p role="status" style={{ margin: '10px 0 0', color: 'var(--forest)', fontSize: 12 }}>{message}</p>}
      {error && <p role="alert" style={{ margin: '10px 0 0', color: 'var(--crimson)', fontSize: 12 }}>{error}</p>}
    </section>
  );
}

interface DbCounts {
  ok: boolean;
  lastUpdated: string | null;
  counts: {
    districts: number;
    subcounties: number;
    parishes: number;
    villages: number;
  };
  total: number;
  error?: string;
}

const LEVELS = [
  { key: 'districts', label: 'Districts', icon: MapPin, color: '#e05252' },
  { key: 'subcounties', label: 'Subcounties', icon: List, color: '#d4a84b' },
  { key: 'parishes', label: 'Parishes', icon: TreePine, color: '#4b9b6e' },
  { key: 'villages', label: 'Villages & Cells', icon: Home, color: '#5b8dd9' },
] as const;

export default function SyncSection() {
  const [data, setData] = useState<DbCounts | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/sync/status');
      setData(await res.json());
    } catch {
      setData({ ok: false, error: 'Could not reach server', lastUpdated: null, counts: { districts: 0, subcounties: 0, parishes: 0, villages: 0 }, total: 0 });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetch('/api/admin/sync/status')
      .then((res) => res.json())
      .then(setData)
      .catch(() => setData({ ok: false, error: 'Could not reach server', lastUpdated: null, counts: { districts: 0, subcounties: 0, parishes: 0, villages: 0 }, total: 0 }));
  }, []);

  const fmt = (n: number) => n.toLocaleString();

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>

      {/* ── Header ── */}
      <div style={{ padding: '24px 20px 18px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Database size={16} style={{ color: 'var(--crimson)' }} />
            <h2 style={{ fontSize: 17, fontWeight: 900, color: 'var(--t1)' }}>Locations Database</h2>
          </div>
          <button
            onClick={load}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 'var(--rf)',
              border: '1px solid var(--border-2)', background: 'var(--surface)',
              color: 'var(--t2)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}
          >
            <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>
        <p style={{ fontSize: 12, color: 'var(--t3)', marginTop: 4 }}>
          Your Uganda administrative data — fully owned, no external dependencies.
        </p>
      </div>

      <div className="inner" style={{ paddingTop: 20, paddingBottom: 32 }}>

        {data && !data.ok && (
          <div style={{ padding: '12px 14px', background: 'rgba(184,72,74,0.08)', borderRadius: 'var(--r2)', border: '1px solid rgba(184,72,74,0.2)', color: 'var(--crimson)', fontSize: 13 }}>
            {data.error}
          </div>
        )}

        {data?.ok && (
          <>
            <LocationManager />

            {/* ── Total pill ── */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 18px', borderRadius: 'var(--r2)',
              background: 'var(--surface)', border: '1px solid var(--border)',
              marginBottom: 16,
            }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                  Total Records
                </p>
                <p style={{ fontSize: 32, fontWeight: 900, color: 'var(--t1)', lineHeight: 1 }}>
                  {fmt(data.total)}
                </p>
              </div>
              <Database size={32} style={{ color: 'var(--border-2)' }} />
            </div>

            {/* ── Per-level cards ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {LEVELS.map(({ key, label, icon: Icon, color }) => {
                const count = data.counts[key];
                return (
                  <div key={key} style={{
                    padding: '14px 16px', borderRadius: 'var(--r2)',
                    background: 'var(--surface)', border: '1px solid var(--border)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <Icon size={13} style={{ color }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                        {label}
                      </span>
                    </div>
                    <p style={{ fontSize: 26, fontWeight: 900, color: 'var(--t1)', lineHeight: 1 }}>
                      {fmt(count)}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* ── Last updated ── */}
            {data.lastUpdated && (
              <p style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center' }}>
                Last updated: {new Date(data.lastUpdated).toLocaleString()}
              </p>
            )}

          </>
        )}

      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
