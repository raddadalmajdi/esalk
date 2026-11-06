'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BRAND_COLORS } from '@/lib/brand-colors';

export type CornerPoint = { x: number; y: number };

type DocumentCornerEditorProps = {
  sourceCanvas: HTMLCanvasElement;
  /** أربع نقاط بترتيب: أعلى-يسار، أعلى-يمين، أسفل-يمين، أسفل-يسار (إحداثيات الصورة الأصلية). */
  corners: CornerPoint[];
  onChange: (corners: CornerPoint[]) => void;
  onConfirm: () => void;
  onRetake: () => void;
};

const HANDLE_R = 22;
const HANDLE_HIT_R = 36;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function orderCornersLabel(index: number): string {
  const labels = ['أعلى · يسار', 'أعلى · يمين', 'أسفل · يمين', 'أسفل · يسار'];
  return labels[index] ?? '';
}

export function DocumentCornerEditor({
  sourceCanvas,
  corners,
  onChange,
  onConfirm,
  onRetake,
}: DocumentCornerEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragIndexRef = useRef<number | null>(null);
  const [activeHandle, setActiveHandle] = useState<number | null>(null);

  const previewUrl = useMemo(() => sourceCanvas.toDataURL('image/jpeg', 0.82), [sourceCanvas]);

  const imageToClient = useCallback(
    (point: CornerPoint, rect: DOMRect): { x: number; y: number } => {
      const scaleX = rect.width / sourceCanvas.width;
      const scaleY = rect.height / sourceCanvas.height;
      return { x: point.x * scaleX, y: point.y * scaleY };
    },
    [sourceCanvas.width, sourceCanvas.height]
  );

  const clientToImage = useCallback(
    (clientX: number, clientY: number): CornerPoint | null => {
      const container = containerRef.current;
      if (!container) return null;
      const rect = container.getBoundingClientRect();
      const scaleX = sourceCanvas.width / rect.width;
      const scaleY = sourceCanvas.height / rect.height;
      return {
        x: clamp((clientX - rect.left) * scaleX, 0, sourceCanvas.width),
        y: clamp((clientY - rect.top) * scaleY, 0, sourceCanvas.height),
      };
    },
    [sourceCanvas.height, sourceCanvas.width]
  );

  const pickHandle = useCallback(
    (clientX: number, clientY: number): number | null => {
      const container = containerRef.current;
      if (!container) return null;
      const rect = container.getBoundingClientRect();
      let bestIndex: number | null = null;
      let bestDist = HANDLE_HIT_R * HANDLE_HIT_R;

      corners.forEach((corner, index) => {
        const p = imageToClient(corner, rect);
        const dx = clientX - rect.left - p.x;
        const dy = clientY - rect.top - p.y;
        const d2 = dx * dx + dy * dy;
        if (d2 <= bestDist) {
          bestDist = d2;
          bestIndex = index;
        }
      });
      return bestIndex;
    },
    [corners, imageToClient]
  );

  const onPointerDown = (event: React.PointerEvent) => {
    event.preventDefault();
    const index = pickHandle(event.clientX, event.clientY);
    if (index === null) return;
    dragIndexRef.current = index;
    setActiveHandle(index);
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent) => {
    if (dragIndexRef.current === null) return;
    const next = clientToImage(event.clientX, event.clientY);
    if (!next) return;
    const updated = corners.map((c, i) => (i === dragIndexRef.current ? next : c));
    onChange(updated);
  };

  const endDrag = (event: React.PointerEvent) => {
    if (dragIndexRef.current === null) return;
    dragIndexRef.current = null;
    setActiveHandle(null);
    try {
      (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') onConfirm();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onConfirm]);

  const aspectRatio = `${sourceCanvas.width} / ${sourceCanvas.height}`;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-mistara-sand">
      <div className="shrink-0 border-b border-mistara-gold/20 bg-mistara-cream/95 px-4 py-3 text-center">
        <p className="text-sm font-black text-mistara-gold">ضبط حواف الفاتورة</p>
        <p className="mt-1 text-xs font-bold leading-relaxed text-mistara-brown/75">
          اسحب النقاط الأربع حتى تطابق زوايا الإيصال — ثم اضغط «تأكيد القص».
        </p>
      </div>

      <div className="relative min-h-0 flex-1 overflow-auto p-3">
        <div
          ref={containerRef}
          className="relative mx-auto w-full max-w-lg touch-none select-none overflow-hidden rounded-2xl border border-mistara-gold/35 bg-black shadow-xl"
          style={{ aspectRatio, maxHeight: '58vh' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="صورة الفاتورة للتعديل"
            className="absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />

          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            aria-hidden
            viewBox={`0 0 ${sourceCanvas.width} ${sourceCanvas.height}`}
            preserveAspectRatio="none"
          >
            <polygon
              points={corners.map((c) => `${c.x},${c.y}`).join(' ')}
              fill="rgba(0,115,207,0.18)"
              stroke={BRAND_COLORS.primary}
              strokeWidth={Math.max(3, sourceCanvas.width / 280)}
            />
            {corners.map((c, i) => (
              <g key={i}>
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={HANDLE_HIT_R * (sourceCanvas.width / 400)}
                  fill="transparent"
                />
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={HANDLE_R * (sourceCanvas.width / 400)}
                  fill={activeHandle === i ? BRAND_COLORS.primaryDark : BRAND_COLORS.primary}
                  stroke="#fff"
                  strokeWidth={Math.max(2, sourceCanvas.width / 500)}
                />
              </g>
            ))}
          </svg>
        </div>

        {activeHandle !== null && (
          <p className="mt-2 text-center text-xs font-bold text-primary">
            {orderCornersLabel(activeHandle)}
          </p>
        )}
      </div>

      <div className="shrink-0 border-t border-mistara-gold/20 bg-mistara-cream/95 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onRetake}
            className="flex-1 rounded-2xl border border-mistara-brown/25 bg-white py-3.5 text-sm font-bold text-mistara-brown active:scale-[0.98]"
          >
            إعادة التصوير
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-[1.35] rounded-2xl bg-gradient-to-r from-primary to-primary-dark py-3.5 text-sm font-black text-white shadow-lg active:scale-[0.98]"
          >
            تأكيد القص
          </button>
        </div>
      </div>
    </div>
  );
}
