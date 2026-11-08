'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Image as ImageIcon, Maximize, Video, X } from 'lucide-react';
import Image from 'next/image';

interface ReportAttachment {
  secureUrl: string;
  resourceType: 'image' | 'video';
  format: string;
  bytes: number;
}

interface ReportAttachmentGalleryProps {
  attachments: ReportAttachment[];
  dark?: boolean;
}

export default function ReportAttachmentGallery({
  attachments,
  dark = false,
}: ReportAttachmentGalleryProps) {
  const [activeAttachment, setActiveAttachment] = useState<{ attachment: ReportAttachment; index: number } | null>(null);

  useEffect(() => {
    if (!activeAttachment) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setActiveAttachment(null);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeAttachment]);

  const textColor = dark ? 'rgba(255,255,255,0.82)' : 'var(--t2)';
  const cardBackground = dark ? 'rgba(255,255,255,0.06)' : 'var(--surface)';
  const borderColor = dark ? 'rgba(255,255,255,0.2)' : 'var(--border-2)';

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {attachments.map((attachment, index) => (
          <div
            key={`${attachment.secureUrl}-${index}`}
            style={{
              width: 280,
              maxWidth: '100%',
              padding: 8,
              border: `1px solid ${borderColor}`,
              borderRadius: 8,
              background: cardBackground,
            }}
          >
            {attachment.resourceType === 'video' ? (
              <video
                controls
                playsInline
                preload="metadata"
                aria-label={`Play report video attachment ${index + 1}`}
                style={{
                  display: 'block',
                  width: '100%',
                  height: 160,
                  borderRadius: 6,
                  background: '#000',
                  objectFit: 'contain',
                }}
              >
                <source src={attachment.secureUrl} type={attachment.format} />
                Your browser does not support embedded video.
              </video>
            ) : (
              <button
                type="button"
                onClick={() => setActiveAttachment({ attachment, index })}
                aria-label={`View image attachment ${index + 1} full screen`}
                style={{
                  display: 'block',
                  position: 'relative',
                  width: '100%',
                  height: 160,
                  overflow: 'hidden',
                  padding: 0,
                  border: 0,
                  borderRadius: 6,
                  background: '#000',
                  cursor: 'zoom-in',
                }}
              >
                <Image
                  src={attachment.secureUrl}
                  alt={`Report image attachment ${index + 1}`}
                  fill
                  unoptimized
                  loading="lazy"
                  sizes="280px"
                  style={{ objectFit: 'contain' }}
                />
              </button>
            )}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, marginTop: 7,
              color: textColor, fontSize: 11,
            }}>
              {attachment.resourceType === 'video' ? <Video size={13} /> : <ImageIcon size={13} />}
              {attachment.resourceType === 'video' ? 'Video' : 'Image'} {index + 1}
              {' · '}{(attachment.bytes / (1024 * 1024)).toFixed(1)} MB
              {attachment.resourceType === 'video' ? (
                <button
                  type="button"
                  onClick={() => setActiveAttachment({ attachment, index })}
                  aria-label={`View video attachment ${index + 1} full screen`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    marginLeft: 'auto',
                    padding: '4px 6px',
                    border: `1px solid ${borderColor}`,
                    borderRadius: 5,
                    background: 'transparent',
                    color: textColor,
                    font: 'inherit',
                    cursor: 'pointer',
                  }}
                >
                  <Maximize size={13} /> Full screen
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveAttachment({ attachment, index })}
                  aria-label={`View image attachment ${index + 1} full screen`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    marginLeft: 'auto',
                    padding: '4px 6px',
                    border: `1px solid ${borderColor}`,
                    borderRadius: 5,
                    background: 'transparent',
                    color: textColor,
                    font: 'inherit',
                    cursor: 'pointer',
                  }}
                >
                  <Maximize size={13} /> Full screen
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {activeAttachment && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Full-screen ${activeAttachment.attachment.resourceType} attachment`}
          onClick={(event) => {
            if (event.target === event.currentTarget) setActiveAttachment(null);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            padding: '72px 16px 16px',
            background: 'rgba(0,0,0,0.96)',
          }}
        >
          <button
            type="button"
            autoFocus
            onClick={() => setActiveAttachment(null)}
            aria-label="Close full-screen attachment"
            style={{
              position: 'absolute',
              top: 'max(16px, env(safe-area-inset-top))',
              right: 'max(16px, env(safe-area-inset-right))',
              zIndex: 1,
              display: 'grid',
              width: 48,
              height: 48,
              placeItems: 'center',
              border: '1px solid rgba(255,255,255,0.4)',
              borderRadius: 999,
              background: 'rgba(30,30,30,0.9)',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            <X size={26} />
          </button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            color: 'rgba(255,255,255,0.8)',
            fontSize: 13,
          }}>
            {activeAttachment.attachment.resourceType === 'video' ? <Video size={16} /> : <ImageIcon size={16} />}
            {activeAttachment.attachment.resourceType === 'video' ? 'Video' : 'Image'} {activeAttachment.index + 1}
          </div>

          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: 1600,
            height: 'calc(100dvh - 132px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {activeAttachment.attachment.resourceType === 'video' ? (
              <video
                controls
                autoPlay
                playsInline
                preload="metadata"
                aria-label={`Video attachment ${activeAttachment.index + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
              >
                <source
                  src={activeAttachment.attachment.secureUrl}
                  type={activeAttachment.attachment.format}
                />
                Your browser does not support embedded video.
              </video>
            ) : (
              <Image
                src={activeAttachment.attachment.secureUrl}
                alt={`Report image attachment ${activeAttachment.index + 1}`}
                fill
                unoptimized
                sizes="100vw"
                style={{ objectFit: 'contain' }}
              />
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
