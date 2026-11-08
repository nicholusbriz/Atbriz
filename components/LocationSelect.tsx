'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Loader, Search } from 'lucide-react';
import type { LocationOption } from '@/lib/locations-client';

export default function LocationSelect({
  label, placeholder, options, value, onChange, disabled, loading, className,
}: {
  label: string;
  placeholder: string;
  options: LocationOption[];
  value: LocationOption | null;
  onChange: (v: LocationOption | null) => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const filteredOptions = options.filter((option) =>
    option.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  );

  useEffect(() => {
    if (!isOpen) return;

    function handleOutsideClick(event: MouseEvent) {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);
    inputRef.current?.focus();
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  return (
    <div ref={rootRef} className={className} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          disabled={disabled || loading}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          onClick={() => {
            setIsOpen((open) => !open);
            setQuery('');
          }}
          style={{
            width: '100%', padding: '8px 32px 8px 12px', textAlign: 'left',
            borderRadius: '6px', border: isOpen ? '1px solid #2563eb' : '1px solid #cbd5e1',
            fontSize: '13px', color: value ? '#0f172a' : '#64748b',
            background: '#ffffff', appearance: 'none', outline: 'none',
            transition: 'all 0.2s ease', boxShadow: isOpen ? '0 0 0 3px rgba(37, 99, 235, 0.1)' : 'none',
            opacity: disabled || loading ? 0.6 : 1,
            cursor: disabled || loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Loading…' : value?.name ?? placeholder}
        </button>
        <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748b' }}>
          {loading
            ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
            : <ChevronDown size={14} />}
        </div>
        {isOpen && (
          <div
            style={{
              position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
              zIndex: 50, padding: '6px', border: '1px solid #e2e8f0',
              borderRadius: '6px', background: '#ffffff',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div style={{ position: 'relative', marginBottom: '4px' }}>
              <Search size={14} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') setIsOpen(false);
                }}
                placeholder={`Search…`}
                aria-label={`Search ${label.toLowerCase()}`}
                style={{
                  width: '100%', boxSizing: 'border-box', padding: '6px 8px 6px 28px',
                  border: '1px solid #cbd5e1', borderRadius: '4px',
                  background: '#f8fafc', color: '#0f172a', fontSize: '12px', outline: 'none',
                }}
              />
            </div>
            <div
              role="listbox"
              aria-label={label}
              style={{ maxHeight: '180px', overflowY: 'auto', overscrollBehavior: 'contain' }}
            >
              {filteredOptions.length > 0 ? filteredOptions.map((option) => (
                <button
                  type="button"
                  role="option"
                  aria-selected={value?.apiId === option.apiId}
                  key={option.apiId}
                  onClick={() => {
                    onChange(option);
                    setIsOpen(false);
                    setQuery('');
                  }}
                  style={{
                    display: 'block', width: '100%', padding: '8px', textAlign: 'left',
                    border: 0, borderRadius: '4px', background: value?.apiId === option.apiId ? '#eff6ff' : 'transparent',
                    color: value?.apiId === option.apiId ? '#1d4ed8' : '#334155',
                    fontWeight: value?.apiId === option.apiId ? 600 : 400,
                    fontSize: '12px', cursor: 'pointer', transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => { if(value?.apiId !== option.apiId) e.currentTarget.style.background = '#f1f5f9' }}
                  onMouseLeave={(e) => { if(value?.apiId !== option.apiId) e.currentTarget.style.background = 'transparent' }}
                >
                  {option.name}
                </button>
              )) : (
                <p style={{ margin: 0, padding: '8px', color: '#64748b', fontSize: '12px', textAlign: 'center' }}>
                  No results.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
