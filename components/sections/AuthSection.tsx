'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Eye, EyeOff, Loader, Lock, MapPin, User } from 'lucide-react';
import LocationSelect from '@/components/LocationSelect';
import { fetchChildren, fetchDistricts, type LocationOption } from '@/lib/locations-client';
import { signIn, signOut, useAuth } from '@/lib/auth-client';

interface LocationState {
  district: LocationOption | null;
  subcounty: LocationOption | null;
  parish: LocationOption | null;
  village: LocationOption | null;
}

const EMPTY_LOCATION: LocationState = {
  district: null,
  subcounty: null,
  parish: null,
  village: null,
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: '6px',
  border: '1px solid #cbd5e1', fontSize: '14px', color: '#0f172a',
  background: '#ffffff', outline: 'none', transition: 'all 0.2s',
};

function PasswordInput({
  value, onChange, placeholder, minLength, autoComplete,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minLength?: number;
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <Lock size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', zIndex: 1 }} />
      <input
        type={visible ? 'text' : 'password'}
        required
        minLength={minLength}
        placeholder={placeholder}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...inputStyle, paddingLeft: '30px', paddingRight: '36px' }}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        style={{
          position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '24px', height: '24px', border: 'none', background: 'transparent',
          color: '#94a3b8', cursor: 'pointer', borderRadius: '4px',
        }}
      >
        {visible ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}

function Field({
  label, children, hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>{label}</label>
      {children}
      {hint && <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>{hint}</p>}
    </div>
  );
}

export default function AuthSection() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [mode, setMode] = useState<'register' | 'login'>('login');

  // Register fields
  const [location, setLocation] = useState<LocationState>(EMPTY_LOCATION);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Login fields
  const [identifier, setIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [districts, setDistricts] = useState<LocationOption[]>([]);
  const [subcounties, setSubcounties] = useState<LocationOption[]>([]);
  const [parishes, setParishes] = useState<LocationOption[]>([]);
  const [villages, setVillages] = useState<LocationOption[]>([]);

  const [loadingDistricts, setLoadingDistricts] = useState(true);
  const [loadingSubcounties, setLoadingSubcounties] = useState(false);
  const [loadingParishes, setLoadingParishes] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    fetchDistricts()
      .then(setDistricts)
      .catch(() => setDistricts([]))
      .finally(() => setLoadingDistricts(false));
  }, []);

  useEffect(() => {
    if (!location.district) return;
    let active = true;
    fetchChildren(location.district.apiId, 'subcounty')
      .then((items) => { if (active) setSubcounties(items); })
      .catch(() => { if (active) setSubcounties([]); })
      .finally(() => { if (active) setLoadingSubcounties(false); });
    return () => { active = false; };
  }, [location.district]);

  useEffect(() => {
    if (!location.subcounty) return;
    let active = true;
    fetchChildren(location.subcounty.apiId, 'parish')
      .then((items) => { if (active) setParishes(items); })
      .catch(() => { if (active) setParishes([]); })
      .finally(() => { if (active) setLoadingParishes(false); });
    return () => { active = false; };
  }, [location.subcounty]);

  useEffect(() => {
    if (!location.parish) return;
    let active = true;
    fetchChildren(location.parish.apiId, 'village')
      .then((items) => { if (active) setVillages(items); })
      .catch(() => { if (active) setVillages([]); })
      .finally(() => { if (active) setLoadingVillages(false); });
    return () => { active = false; };
  }, [location.parish]);

  function selectDistrict(v: LocationOption | null) {
    setLocation({ district: v, subcounty: null, parish: null, village: null });
    setSubcounties([]); setParishes([]); setVillages([]);
    setLoadingSubcounties(!!v); setLoadingParishes(false); setLoadingVillages(false);
  }
  function selectSubcounty(v: LocationOption | null) {
    setLocation((l) => ({ ...l, subcounty: v, parish: null, village: null }));
    setParishes([]); setVillages([]);
    setLoadingParishes(!!v); setLoadingVillages(false);
  }
  function selectParish(v: LocationOption | null) {
    setLocation((l) => ({ ...l, parish: v, village: null }));
    setVillages([]); setLoadingVillages(!!v);
  }

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    if (!location.district || !location.subcounty || !location.parish || !location.village) {
      setError('Please complete your full location: district, subcounty, parish, and village/cell.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          email,
          password,
          districtId: location.district.apiId,
          subcountyId: location.subcounty?.apiId,
          parishId: location.parish?.apiId,
          villageId: location.village?.apiId,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? 'Could not create account');

      // Auto sign-in after registration
      const signInResult = await signIn('credentials', {
        identifier: username,
        password,
        redirect: false,
      });
      if (signInResult?.error) {
        setRegistered(true);
        setMode('login');
        setIdentifier(username);
        return;
      }
      setRegistered(true);
      window.location.hash = 'dashboard';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      // Check if this identifier is blocked before attempting sign-in
      const statusRes = await fetch(`/api/auth/login-status?identifier=${encodeURIComponent(identifier)}`);
      const status = await statusRes.json();
      if (status.blocked) {
        const retry = status.retryAt ? new Date(status.retryAt).toLocaleString() : 'later';
        setError(`Too many failed attempts. You are blocked until ${retry}.`);
        return;
      }

      const result = await signIn('credentials', {
        identifier,
        password: loginPassword,
        redirect: false,
      });
      if (result?.error) {
        setError('Invalid username/email or password.');
      } else {
        window.location.hash = 'dashboard';
      }
    } finally {
      setSubmitting(false);
    }
  }

  // ── Signed-in view ──
  if (!isLoading && isAuthenticated && user) {
    return (
      <div style={{ height: '100%', minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', background: '#f8fafc', padding: '24px 16px' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto' }}>
          <div style={{ background: '#ffffff', padding: '28px 24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '50%', background: '#eff6ff', marginBottom: '16px' }}>
              <User size={28} style={{ color: '#2563eb' }} />
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
              {user.username ?? user.email ?? 'Account'}
            </h1>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
              Role: <strong style={{ color: '#0f172a' }}>{user.role}</strong>
              {user.email ? ` · ${user.email}` : ''}
            </p>
            <button
              onClick={() => signOut({ redirect: false })}
              style={{
                padding: '10px 20px', background: '#0f172a', color: '#ffffff',
                border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Register / Login forms ──
  return (
    <div style={{ height: '100%', minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', background: '#f8fafc', padding: '24px 16px' }}>
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>

        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
            {mode === 'register' ? 'Create your account' : 'Welcome back'}
          </h1>
          <p style={{ fontSize: '14px', color: '#475569', margin: 0 }}>
            {mode === 'register'
              ? 'Link your account to your location so reports reach the right office.'
              : 'Sign in with your username or email.'}
          </p>
        </div>

        {/* Mode toggle */}
        <div style={{ display: 'flex', background: '#e2e8f0', borderRadius: '8px', padding: '4px', marginBottom: '16px' }}>
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setError(''); setRegistered(false); }}
              style={{
                flex: 1, padding: '8px', border: 'none', borderRadius: '6px', cursor: 'pointer',
                fontSize: '13px', fontWeight: 700,
                background: mode === m ? '#ffffff' : 'transparent',
                color: mode === m ? '#0f172a' : '#64748b',
                boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {m === 'register' ? 'Register' : 'Sign in'}
            </button>
          ))}
        </div>

        {registered && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '6px', marginBottom: '16px' }}>
            <CheckCircle size={16} style={{ color: '#059669', flexShrink: 0 }} />
            <p style={{ margin: 0, color: '#065f46', fontSize: '13px' }}>
              Account created and signed in. You can now file reports as a registered user.
            </p>
          </div>
        )}

        {mode === 'register' ? (
          <form onSubmit={handleRegister} style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Location */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                <MapPin size={16} style={{ color: '#2563eb' }} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                  Your Location <span style={{ color: '#ef4444' }}>*</span>
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <LocationSelect label="District" placeholder="Select district…" options={districts} value={location.district} onChange={selectDistrict} loading={loadingDistricts} />
                {location.district && (
                  <LocationSelect label="Subcounty" placeholder="Select subcounty…" options={subcounties} value={location.subcounty} onChange={selectSubcounty} loading={loadingSubcounties} />
                )}
                {location.subcounty && (
                  <LocationSelect label="Parish" placeholder="Select parish…" options={parishes} value={location.parish} onChange={selectParish} loading={loadingParishes} />
                )}
                {location.parish && (
                  <LocationSelect label="Village / Cell" placeholder="Select village…" options={villages} value={location.village} onChange={(v) => setLocation((l) => ({ ...l, village: v }))} loading={loadingVillages} />
                )}
              </div>
            </div>

            <Field label="Username" hint="3–50 characters.">
              <div style={{ position: 'relative' }}>
                <User size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input className="auth-input" type="text" required minLength={3} maxLength={50} placeholder="e.g. john_doe" value={username} onChange={(e) => setUsername(e.target.value)} style={{ ...inputStyle, paddingLeft: '30px' }} />
              </div>
            </Field>

            <Field label="Email">
              <input type="email" required maxLength={254} placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
            </Field>

            <Field label="Password" hint="Minimum 6 characters.">
              <PasswordInput value={password} onChange={setPassword} placeholder="••••••••" minLength={6} autoComplete="new-password" />
            </Field>

            {error && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px' }}>
                <AlertCircle size={16} style={{ color: '#dc2626', flexShrink: 0, marginTop: '2px' }} />
                <p style={{ margin: 0, color: '#991b1b', fontSize: '13px' }}>{error}</p>
              </div>
            )}

            <button type="submit" disabled={submitting} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '6px', width: '100%', background: '#0f172a', color: '#ffffff', border: 'none', fontSize: '15px', fontWeight: 600, cursor: submitting ? 'wait' : 'pointer', opacity: submitting ? 0.8 : 1, marginTop: '8px' }}>
              {submitting
                ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Creating account…</>
                : 'Create account'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Field label="Username or email">
              <div style={{ position: 'relative' }}>
                <User size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input type="text" required placeholder="username or email" value={identifier} onChange={(e) => setIdentifier(e.target.value)} style={{ ...inputStyle, paddingLeft: '30px' }} />
              </div>
            </Field>
            <Field label="Password">
              <PasswordInput value={loginPassword} onChange={setLoginPassword} placeholder="••••••••" autoComplete="current-password" />
            </Field>

            {error && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px' }}>
                <AlertCircle size={16} style={{ color: '#dc2626', flexShrink: 0, marginTop: '2px' }} />
                <p style={{ margin: 0, color: '#991b1b', fontSize: '13px' }}>{error}</p>
              </div>
            )}

            <button type="submit" disabled={submitting} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '6px', width: '100%', background: '#0f172a', color: '#ffffff', border: 'none', fontSize: '15px', fontWeight: 600, cursor: submitting ? 'wait' : 'pointer', opacity: submitting ? 0.8 : 1, marginTop: '8px' }}>
              {submitting
                ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Signing in…</>
                : 'Sign in'}
            </button>
          </form>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
