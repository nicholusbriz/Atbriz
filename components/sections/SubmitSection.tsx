'use client';

import { useState, useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle, MapPin, Mail, ChevronDown, Loader, Search, ImagePlus, Video, X } from 'lucide-react';
import {
  MAX_REPORT_ATTACHMENTS,
  MAX_REPORT_IMAGE_BYTES,
  MAX_REPORT_VIDEO_DURATION_SECONDS,
  type ReportAttachmentResourceType,
} from '@/lib/report-attachments';

// ─── Types ────────────────────────────────────────────────────────────────────
interface LocationOption {
  apiId: string;
  name: string;
}

interface FormState {
  title: string;
  district: LocationOption | null;
  subcounty: LocationOption | null;
  parish: LocationOption | null;
  village: LocationOption | null;
  description: string;
  email: string;
}

const CATEGORIES = ['Health', 'Education', 'Roads', 'Water', 'Corruption', 'Other'];

const EMPTY_FORM: FormState = {
  title: '',
  district: null,
  subcounty: null,
  parish: null,
  village: null,
  description: '',
  email: '',
};

interface UploadAuthorization {
  blobName: string;
  uploadUrl: string;
  resourceType: ReportAttachmentResourceType;
}

interface UploadedAttachment {
  publicId: string;
  resourceType: ReportAttachmentResourceType;
}

// ─── API Helpers (Unchanged) ──────────────────────────────────────────────────
function uploadToAzure(
  url: string,
  file: File,
  onProgress: (progress: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('PUT', url);
    request.setRequestHeader('x-ms-blob-type', 'BlockBlob');
    request.setRequestHeader('x-ms-blob-content-type', file.type);

    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)));
      }
    };
    request.onerror = () => reject(new Error('Network error while uploading the file to Azure'));
    request.onabort = () => reject(new Error('The Azure upload was cancelled'));
    request.onload = () => {
      if (request.status < 200 || request.status >= 300) {
        const errorCode = request.getResponseHeader('x-ms-error-code');
        reject(new Error(
          `Azure upload failed (${request.status}${errorCode ? `: ${errorCode}` : ''}). Check the storage CORS rule and upload authorization.`,
        ));
        return;
      }
      onProgress(100);
      resolve();
    };
    request.send(file);
  });
}

async function uploadAttachment(
  file: File,
  onProgress: (progress: number) => void,
): Promise<UploadedAttachment> {
  const signatureResponse = await fetch('/api/uploads/azure-sas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contentType: file.type, size: file.size }),
  });
  const signature = await signatureResponse.json() as UploadAuthorization & { error?: string };
  if (!signatureResponse.ok) {
    throw new Error(signature.error ?? 'Could not prepare the media upload');
  }
  const expectedResourceType: ReportAttachmentResourceType = file.type.startsWith('video/') ? 'video' : 'image';
  if (signature.resourceType !== expectedResourceType || !signature.blobName.startsWith('report_attachments/')) {
    throw new Error('Azure returned an unexpected upload authorization');
  }

  await uploadToAzure(signature.uploadUrl, file, onProgress);
  return { publicId: signature.blobName, resourceType: signature.resourceType };
}

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const objectUrl = URL.createObjectURL(file);
    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
      video.removeAttribute('src');
      video.load();
    };

    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      const { duration } = video;
      cleanup();
      if (!Number.isFinite(duration)) {
        reject(new Error(`Could not read the duration of ${file.name}. Choose a standard video file and try again.`));
        return;
      }
      resolve(duration);
    };
    video.onerror = () => {
      cleanup();
      reject(new Error(`Could not read the duration of ${file.name}. Choose a standard video file and try again.`));
    };
    video.src = objectUrl;
  });
}

async function fetchDistricts(): Promise<LocationOption[]> {
  const res = await fetch('/api/locations/districts');
  const data = await res.json();
  return data.map((d: { _id: string; name: string }) => ({ apiId: d._id, name: d.name }));
}

async function fetchChildren(parentId: string, level: string): Promise<LocationOption[]> {
  const res = await fetch(
    `/api/locations/children?parentId=${encodeURIComponent(parentId)}&level=${level}`,
  );
  const data = await res.json();
  return data.map((d: { _id: string; name: string }) => ({ apiId: d._id, name: d.name }));
}

// ─── Location Select Component (Unchanged Logic, Enhanced UI) ─────────────────
function LocationSelect({
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

// ─── Main Component (Scrolling Fixed, Space Reduced) ──────────────────────────
export default function SubmitSection() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [category, setCategory] = useState<LocationOption | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refCode, setRefCode] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [attachmentProgress, setAttachmentProgress] = useState<{ fileIndex: number; percent: number } | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  const [districts, setDistricts] = useState<LocationOption[]>([]);
  const [subcounties, setSubcounties] = useState<LocationOption[]>([]);
  const [parishes, setParishes] = useState<LocationOption[]>([]);
  const [villages, setVillages] = useState<LocationOption[]>([]);

  const [loadingDistricts, setLoadingDistricts] = useState(true);
  const [loadingSubcounties, setLoadingSubcounties] = useState(false);
  const [loadingParishes, setLoadingParishes] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);

  useEffect(() => {
    fetchDistricts()
      .then(setDistricts)
      .catch(() => setDistricts([]))
      .finally(() => setLoadingDistricts(false));
  }, []);

  useEffect(() => {
    if (!form.district) return;
    let active = true;
    fetchChildren(form.district.apiId, 'subcounty')
      .then((items) => { if (active) setSubcounties(items); })
      .catch(() => { if (active) setSubcounties([]); })
      .finally(() => { if (active) setLoadingSubcounties(false); });
    return () => { active = false; };
  }, [form.district]);

  useEffect(() => {
    if (!form.subcounty) return;
    let active = true;
    fetchChildren(form.subcounty.apiId, 'parish')
      .then((items) => { if (active) setParishes(items); })
      .catch(() => { if (active) setParishes([]); })
      .finally(() => { if (active) setLoadingParishes(false); });
    return () => { active = false; };
  }, [form.subcounty]);

  useEffect(() => {
    if (!form.parish) return;
    let active = true;
    fetchChildren(form.parish.apiId, 'village')
      .then((items) => { if (active) setVillages(items); })
      .catch(() => { if (active) setVillages([]); })
      .finally(() => { if (active) setLoadingVillages(false); });
    return () => { active = false; };
  }, [form.parish]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const missingFields = [
      !form.title.trim() ? 'title' : '',
      !category?.name ? 'category' : '',
      !form.district?.apiId ? 'district' : '',
      !form.description.trim() ? 'description' : '',
    ].filter(Boolean);

    if (missingFields.length > 0) {
      setSubmitError(`Please complete required fields: ${missingFields.join(', ')}.`);
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    setAttachmentProgress(null);
    try {
      const attachments: UploadedAttachment[] = [];
      for (const [index, file] of selectedFiles.entries()) {
        setAttachmentProgress({ fileIndex: index, percent: 0 });
        attachments.push(await uploadAttachment(file, (percent) => {
          setAttachmentProgress({ fileIndex: index, percent });
        }));
      }
      setAttachmentProgress(null);

      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          category: category?.name,
          districtId: form.district?.apiId,
          subcountyId: form.subcounty?.apiId,
          parishId: form.parish?.apiId,
          villageId: form.village?.apiId,
          description: form.description,
          email: form.email,
          attachments,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? 'Could not submit report');
      setRefCode(result.referenceCode);
      setSubmitted(true);
    } catch (error) {
      setAttachmentProgress(null);
      setSubmitError(error instanceof Error ? error.message : 'Could not submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setForm(EMPTY_FORM);
    setCategory(null);
    setSubmitted(false);
    setRefCode('');
    setSubmitError('');
    setSelectedFiles([]);
    setAttachmentProgress(null);
  }

  async function handleAttachmentSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const incomingFiles = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (incomingFiles.length === 0) return;

    const nextFiles = [...selectedFiles];
    for (const file of incomingFiles) {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      if (!isImage && !isVideo) {
        setSubmitError(`${file.name} is not a supported image or video.`);
        continue;
      }
      if (isImage && file.size > MAX_REPORT_IMAGE_BYTES) {
        setSubmitError(`${file.name} exceeds the 10 MB limit.`);
        continue;
      }
      if (isVideo) {
        try {
          const duration = await getVideoDuration(file);
          if (duration > MAX_REPORT_VIDEO_DURATION_SECONDS) {
            setSubmitError(`${file.name} is too long (Max 3 minutes).`);
            continue;
          }
        } catch (error) {
          setSubmitError(error instanceof Error ? error.message : `Could not check video duration.`);
          continue;
        }
      }
      if (nextFiles.length >= MAX_REPORT_ATTACHMENTS) {
        setSubmitError(`Maximum ${MAX_REPORT_ATTACHMENTS} files allowed.`);
        break;
      }
      nextFiles.push(file);
    }
    setSelectedFiles(nextFiles);
  }

  // ── Success Screen ──
  if (submitted) {
    return (
      <div style={{ height: '100%', minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '16px' }}>
        <div style={{ background: '#ffffff', padding: '32px 24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '50%', background: '#ecfdf5', marginBottom: '16px' }}>
            <CheckCircle size={28} style={{ color: '#059669' }} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>Report Submitted</h2>
          <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.5, marginBottom: '20px' }}>
            Your report has been saved. Keep your reference code below.
          </p>
          {form.title && (
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '12px' }}>
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Title</p>
              <p style={{ fontSize: '14px', color: '#0f172a', fontWeight: 600, margin: 0 }}>{form.title}</p>
            </div>
          )}
          <div style={{ marginBottom: '24px' }}>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Reference Code</p>
            <strong style={{ fontSize: '16px', color: '#0f172a', letterSpacing: '1px', fontFamily: 'monospace' }}>{refCode}</strong>
          </div>
          <button onClick={handleReset} style={{ padding: '10px 16px', background: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', width: '100%' }}>
            Submit Another Report
          </button>
        </div>
      </div>
    );
  }

  // ── Main Form ──
  return (
    <div style={{ height: '100%', minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', background: '#f8fafc', padding: '24px 16px' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
            File a Report
          </h1>
          <p style={{ fontSize: '14px', color: '#475569', margin: 0 }}>
            Your voice reaches the right official directly.
          </p>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Category */}
          <LocationSelect
            label="Category"
            placeholder="Select a category…"
            options={CATEGORIES.map((name) => ({ apiId: name, name }))}
            value={category}
            onChange={(option) => {
              setCategory(option);
              setSubmitError('');
            }}
          />

          {/* Location Section */}
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
              <MapPin size={16} style={{ color: '#2563eb' }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                Location Details <span style={{ color: '#ef4444' }}>*</span>
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <LocationSelect
                label="District"
                placeholder="Select district…"
                options={districts}
                value={form.district}
                onChange={(v) => {
                  setForm((f) => ({ ...f, district: v, subcounty: null, parish: null, village: null }));
                  setSubcounties([]);
                  setParishes([]);
                  setVillages([]);
                  setLoadingSubcounties(!!v);
                  setLoadingParishes(false);
                  setLoadingVillages(false);
                }}
                loading={loadingDistricts}
              />

              {form.district && (
                <LocationSelect
                  label="Subcounty"
                  placeholder="Select subcounty…"
                  options={subcounties}
                  value={form.subcounty}
                  onChange={(v) => {
                    setForm((f) => ({ ...f, subcounty: v, parish: null, village: null }));
                    setParishes([]);
                    setVillages([]);
                    setLoadingParishes(!!v);
                    setLoadingVillages(false);
                  }}
                  loading={loadingSubcounties}
                />
              )}

              {form.subcounty && (
                <LocationSelect
                  label="Parish"
                  placeholder="Select parish…"
                  options={parishes}
                  value={form.parish}
                  onChange={(v) => {
                    setForm((f) => ({ ...f, parish: v, village: null }));
                    setVillages([]);
                    setLoadingVillages(!!v);
                  }}
                  loading={loadingParishes}
                />
              )}

              {form.parish && (
                <LocationSelect
                  label="Village"
                  placeholder="Select village…"
                  options={villages}
                  value={form.village}
                  onChange={(v) => setForm((f) => ({ ...f, village: v }))}
                  loading={loadingVillages}
                />
              )}
            </div>
          </div>

          {/* Title */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label htmlFor="report-title" style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
              Report Title <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id="report-title"
              type="text"
              required
              maxLength={120}
              placeholder="Briefly summarize your report"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: '6px',
                border: '1px solid #cbd5e1', fontSize: '14px', color: '#0f172a',
                background: '#ffffff', outline: 'none', transition: 'all 0.2s'
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </div>

          {/* Description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label htmlFor="report-desc" style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
              What happened? <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              id="report-desc"
              required 
              rows={4}
              placeholder="Describe the problem clearly."
              value={form.description}
              onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: '6px',
                border: '1px solid #cbd5e1', fontSize: '14px', color: '#0f172a',
                background: '#ffffff', outline: 'none', resize: 'vertical',
                fontFamily: 'inherit', transition: 'all 0.2s'
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </div>

          {/* Email */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label htmlFor="report-email" style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Mail size={14} style={{ color: '#64748b' }} /> Email <span style={{ fontWeight: 400, color: '#64748b' }}>(Optional)</span>
            </label>
            <input
              id="report-email"
              type="email"
              placeholder="your@email.com"
              value={form.email}
              onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: '6px',
                border: '1px solid #cbd5e1', fontSize: '14px', color: '#0f172a',
                background: '#ffffff', outline: 'none', transition: 'all 0.2s'
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </div>

          {/* Attachments */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '4px' }}>
              Attachments <span style={{ fontWeight: 400, color: '#64748b' }}>(Optional)</span>
            </label>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
              Images up to 10MB, videos up to 3 minutes.
            </p>
            
            <input
              id="report-attachments"
              type="file"
              accept="image/*,video/*"
              multiple
              ref={attachmentInputRef}
              disabled={submitting}
              onChange={handleAttachmentSelection}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              disabled={submitting}
              onClick={() => attachmentInputRef.current?.click()}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px',
                border: '1px dashed #cbd5e1', borderRadius: '6px',
                background: '#f8fafc', color: '#334155', fontSize: '13px', fontWeight: 500,
                cursor: submitting ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                width: '100%', justifyContent: 'center'
              }}
            >
              <ImagePlus size={16} style={{ color: '#64748b' }} /> Select files
            </button>

            {selectedFiles.length > 0 && (
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '6px', listStyle: 'none', padding: 0, marginTop: '12px' }}>
                {selectedFiles.map((file, index) => (
                  <li key={`${file.name}-${file.lastModified}-${index}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '8px 12px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, color: '#334155', fontSize: '12px' }}>
                      {file.type.startsWith('video/') ? <Video size={14} style={{ color: '#64748b' }} /> : <ImagePlus size={14} style={{ color: '#64748b' }} />}
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{file.name}</span>
                      <span style={{ flexShrink: 0, color: '#94a3b8' }}>({(file.size / (1024 * 1024)).toFixed(1)} MB)</span>
                    </span>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => setSelectedFiles((current) => current.filter((_, i) => i !== index))}
                      style={{ display: 'inline-flex', border: 0, padding: '4px', background: '#f1f5f9', borderRadius: '50%', color: '#64748b', cursor: 'pointer' }}
                    >
                      <X size={12} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            
            {attachmentProgress && (
              <div style={{ marginTop: '12px', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#334155', fontSize: '12px' }}>
                  <span>Uploading file {attachmentProgress.fileIndex + 1} of {selectedFiles.length}</span>
                  <strong>{attachmentProgress.percent}%</strong>
                </div>
                <div style={{ width: '100%', height: '6px', overflow: 'hidden', borderRadius: '999px', background: '#e2e8f0' }}>
                  <div style={{ width: `${attachmentProgress.percent}%`, height: '100%', background: '#2563eb', transition: 'width 200ms' }} />
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {submitError && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px' }}>
              <AlertCircle size={16} style={{ color: '#dc2626', flexShrink: 0, marginTop: '2px' }} />
              <p style={{ margin: 0, color: '#991b1b', fontSize: '13px' }}>
                {submitError}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '12px', borderRadius: '6px', width: '100%',
              background: '#0f172a', color: '#ffffff', border: 'none',
              fontSize: '15px', fontWeight: 600, cursor: submitting ? 'wait' : 'pointer',
              opacity: submitting ? 0.8 : 1, transition: 'background 0.2s',
              marginTop: '8px'
            }}
            onMouseEnter={(e) => { if(!submitting) e.currentTarget.style.background = '#1e293b'; }}
            onMouseLeave={(e) => { if(!submitting) e.currentTarget.style.background = '#0f172a'; }}
          >
            {submitting
              ? attachmentProgress
                ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Uploading… {attachmentProgress.percent}%</>
                : <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Submitting…</>
              : 'Send Report'}
          </button>

        </form>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}