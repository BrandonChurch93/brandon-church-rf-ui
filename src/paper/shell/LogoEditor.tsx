import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { EventLogo } from './EventLogo';
import type { EventLogo as Logo } from '@/store/types';
import rainfocusOriginal from '@/assets/images/event-logo-1820.png';
import s from './logoEditor.module.scss';

const MAX_BYTES = 8 * 1024 * 1024;
const PREVIEW = 280;
const OUTPUT = 512;

interface LogoEditorProps {
  open: boolean;
  onClose: () => void;
  logo: Logo;
  /** What "Reset to default" restores: the bundled badge or a monogram. */
  defaultLogo: Logo;
  onSave: (logo: Logo) => void;
}

/** Choose or drop an image, zoom 1x to 3x, drag to pan, then save a 512 px square PNG. */
export function LogoEditor({ open, onClose, logo, defaultLogo, onSave }: LogoEditorProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [isDefault, setIsDefault] = useState(false);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [error, setError] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setIsDefault(false);
    if (logo.kind === 'custom') setSrc(logo.dataUrl);
    else if (logo.kind === 'bundled') setSrc(rainfocusOriginal);
    else setSrc(null);
  }, [open, logo]);

  useEffect(() => {
    if (!src) return setNatural(null);
    const img = new Image();
    img.onload = () => setNatural({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = src;
  }, [src]);

  const base = natural ? PREVIEW / Math.min(natural.w, natural.h) : 1;
  const dispW = natural ? natural.w * base * zoom : PREVIEW;
  const dispH = natural ? natural.h * base * zoom : PREVIEW;
  const clampPan = (p: { x: number; y: number }, z = zoom) => {
    const w = natural ? natural.w * base * z : PREVIEW;
    const h = natural ? natural.h * base * z : PREVIEW;
    const mx = Math.max(0, (w - PREVIEW) / 2);
    const my = Math.max(0, (h - PREVIEW) / 2);
    return { x: Math.min(mx, Math.max(-mx, p.x)), y: Math.min(my, Math.max(-my, p.y)) };
  };

  const accept = (f: File | undefined) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) return setError('Choose an image file (PNG, JPG, SVG or WebP).');
    if (f.size > MAX_BYTES) return setError('That image is larger than 8 MB. Choose a smaller one.');
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      setSrc(String(reader.result));
      setIsDefault(false);
      setZoom(1);
      setPan({ x: 0, y: 0 });
    };
    reader.readAsDataURL(f);
  };

  const save = () => {
    if (isDefault || !src) {
      onSave(defaultLogo);
      onClose();
      return;
    }
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = OUTPUT;
      canvas.height = OUTPUT;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const scale = OUTPUT / PREVIEW;
      const w = dispW * scale;
      const h = dispH * scale;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, (OUTPUT - w) / 2 + pan.x * scale, (OUTPUT - h) / 2 + pan.y * scale, w, h);
      onSave({ kind: 'custom', dataUrl: canvas.toDataURL('image/png') });
      onClose();
    };
    img.src = src;
  };

  const onDown = (e: RPointerEvent<HTMLDivElement>) => {
    if (!src || isDefault) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
  };
  const onMove = (e: RPointerEvent) => {
    const d = drag.current;
    if (!d) return;
    setPan(clampPan({ x: d.px + e.clientX - d.x, y: d.py + e.clientY - d.y }));
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Change event logo"
      width={520}
      footer={
        <>
          <Button
            variant="ghost"
            icon="rotate-ccw"
            onClick={() => {
              setIsDefault(true);
              setError(null);
            }}
          >
            Reset to default
          </Button>
          <span style={{ flex: 1 }} />
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save}>
            Save logo
          </Button>
        </>
      }
    >
      <div className={s.editor}>
        <div
          className={s.preview}
          data-over={over || undefined}
          data-pannable={src && !isDefault ? 'true' : undefined}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            accept(e.dataTransfer.files[0]);
          }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={() => (drag.current = null)}
          onPointerCancel={() => (drag.current = null)}
        >
          {isDefault ? (
            <EventLogo logo={defaultLogo} size={PREVIEW} radius="lg" />
          ) : src ? (
            <img src={src} alt="Logo preview" draggable={false} style={{ width: dispW, height: dispH, transform: `translate(${pan.x}px, ${pan.y}px)` }} />
          ) : (
            <div className={s.drop}>
              <Icon name="image-plus" size={24} />
              <span>Drop an image here</span>
            </div>
          )}
        </div>
        <div className={s.controls}>
          <Button variant="secondary" icon="upload" onClick={() => file.current?.click()}>
            Choose image
          </Button>
          <input
            ref={file}
            type="file"
            accept="image/*"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => {
              accept(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          <p className={s.help}>PNG, JPG, SVG or WebP up to 8 MB. Drag the image to position it.</p>
          {error && (
            <p className={s.error} role="alert">
              <Icon name="circle-alert" size={14} />
              {error}
            </p>
          )}
          <label className={s.zoom}>
            <span>Zoom</span>
            <Icon name="zoom-out" size={16} />
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              disabled={!src || isDefault}
              aria-valuetext={`${zoom.toFixed(1)} times`}
              style={{ ['--fill' as string]: `${((zoom - 1) / 2) * 100}%` }}
              onChange={(e) => {
                const z = Number(e.target.value);
                setZoom(z);
                setPan((p) => clampPan(p, z));
              }}
            />
            <Icon name="zoom-in" size={16} />
          </label>
        </div>
      </div>
    </Modal>
  );
}
