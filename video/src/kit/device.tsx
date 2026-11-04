// A phone or tablet built in CSS 3D: a satin metal body with real thickness, a black bezel, the screen under glass that
// catches the light as the device turns, and a status bar the web recordings don't have. The screen's children are laid
// out at the device's own size in CSS pixels (tablet 1280×800, phone 412×915) and scaled to fit.
import type { ReactNode } from 'react';
import { useCurrentFrame } from 'remotion';

import { c, display } from '../theme';

export const SCREENS = {
  tablet: { w: 1280, h: 800, bar: 30, radius: 26, bezel: 30, body: 48 },
  phone: { w: 412, h: 915, bar: 40, radius: 48, bezel: 11, body: 58 },
} as const;
export type Kind = keyof typeof SCREENS;

/** Outer size of a device drawn `width` px wide. */
export function deviceSize(kind: Kind, width: number) {
  const s = SCREENS[kind];
  const scale = width / (s.w + s.bezel * 2);
  return { scale, width, height: (s.h + s.bar + s.bezel * 2) * scale };
}

export function Device({ kind, width, rx = 0, ry = 0, rz = 0, children, time = '8:40' }: {
  kind: Kind; width: number; rx?: number; ry?: number; rz?: number; children?: ReactNode; time?: string;
}) {
  const s = SCREENS[kind];
  const { scale, height } = deviceSize(kind, width);
  const depth = kind === 'tablet' ? 14 : 18;
  // The glass highlight slides across as the device turns, and drifts a little on its own.
  const frame = useCurrentFrame();
  const glint = 30 + ry * 2.2 + Math.sin(frame / 70) * 4;
  return (
    <div style={{ width, height, perspective: 3200, position: 'relative' }}>
      <div style={{ position: 'absolute', left: '8%', right: '8%', bottom: -height * 0.06, height: height * 0.12, borderRadius: '50%', background: 'rgba(70,50,10,0.3)', filter: 'blur(40px)', transform: `translateX(${ry * 3}px)` }} />
      <div style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: `rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)` }}>
        {/* the body's edge: stacked slices give it thickness when it turns */}
        {Array.from({ length: depth }, (_, i) => (
          <div key={i} style={{ position: 'absolute', inset: 0, borderRadius: s.body * scale, background: i < 2 ? '#5b5b66' : '#26262d', transform: `translateZ(${-(i + 1) * 1.4}px)` }} />
        ))}
        <div style={{ position: 'absolute', inset: 0, borderRadius: s.body * scale, padding: 3, background: 'linear-gradient(135deg, #8d8d99 0%, #3a3a43 30%, #6e6e79 55%, #2a2a31 80%, #7d7d88 100%)', boxShadow: '0 40px 90px rgba(70,50,10,0.32)' }}>
          <div style={{ position: 'absolute', inset: 3, borderRadius: s.body * scale - 3, background: '#050507' }} />
          <div style={{ position: 'absolute', left: s.bezel * scale, top: s.bezel * scale, width: s.w * scale, height: (s.h + s.bar) * scale, borderRadius: s.radius * scale, overflow: 'hidden', background: c.white }}>
            <StatusBar kind={kind} scale={scale} time={time} />
            <div style={{ position: 'absolute', top: s.bar * scale, left: 0, width: s.w, height: s.h, transform: `scale(${scale})`, transformOrigin: '0 0', overflow: 'hidden' }}>
              {children}
            </div>
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(115deg, transparent ${glint - 18}%, rgba(255,255,255,0.10) ${glint}%, transparent ${glint + 16}%)`, pointerEvents: 'none' }} />
          </div>
          {/* front camera: on the long edge of the tablet, a punch hole on the phone */}
          {kind === 'tablet'
            ? <div style={{ position: 'absolute', top: (s.bezel / 2) * scale - 4, left: '50%', width: 8, height: 8, marginLeft: -4, borderRadius: 4, background: '#1b1b22', boxShadow: 'inset 0 0 2px #3c3c48' }} />
            : <div style={{ position: 'absolute', top: (s.bezel + 14) * scale, left: '50%', width: 13 * scale, height: 13 * scale, marginLeft: -6.5 * scale, borderRadius: '50%', background: '#000', zIndex: 2 }} />}
        </div>
        {kind === 'phone' && (
          <>
            <div style={{ position: 'absolute', right: -3, top: height * 0.22, width: 4, height: height * 0.07, borderRadius: 2, background: '#55555f' }} />
            <div style={{ position: 'absolute', right: -3, top: height * 0.32, width: 4, height: height * 0.12, borderRadius: 2, background: '#55555f' }} />
          </>
        )}
      </div>
    </div>
  );
}

function StatusBar({ kind, scale, time }: { kind: Kind; scale: number; time: string }) {
  const s = SCREENS[kind];
  const h = s.bar * scale;
  const fs = (kind === 'tablet' ? 15 : 15) * scale;
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: h, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `0 ${(kind === 'tablet' ? 24 : 26) * scale}px`, paddingTop: kind === 'phone' ? 6 * scale : 0 }}>
      <span style={{ fontFamily: display, fontWeight: 700, fontSize: fs, color: c.ink }}>{time}</span>
      <svg width={58 * scale} height={14 * scale} viewBox="0 0 58 14">
        {/* signal */}
        {[0, 1, 2, 3].map((i) => <rect key={i} x={i * 4.5} y={10 - i * 3} width={3} height={4 + i * 3} rx={0.8} fill={c.ink} />)}
        {/* wifi */}
        <path d="M27 12.5 24.6 10a3.4 3.4 0 0 1 4.8 0Zm-4.6-4.7a6.6 6.6 0 0 1 9.2 0l1.4-1.4a8.6 8.6 0 0 0-12 0Z" fill={c.ink} />
        {/* battery */}
        <rect x={38} y={2} width={16} height={10} rx={2.4} fill="none" stroke={c.ink} strokeWidth={1.2} />
        <rect x={39.8} y={3.8} width={11} height={6.4} rx={1.2} fill={c.ink} />
        <rect x={54.6} y={5} width={1.6} height={4} rx={0.6} fill={c.ink} />
      </svg>
    </div>
  );
}

/** Fingertip presses drawn over a recording: a soft press that fades, then a ring that opens out. Taps are in device px. */
export function Taps({ taps, now, dpr }: { taps: { t: number; x: number; y: number; hold?: number }[]; now: number; dpr: number }) {
  return (
    <>
      {taps.map((t, i) => {
        const held = t.hold ?? 0;
        // The press shows a moment before the screen reacts; a held press stays down, then lifts.
        const dt = now - t.t + 0.18;
        const k = dt - held;
        if (dt < 0 || k > 0.7) return null;
        const press = k < 0 ? 1 : Math.max(0, 1 - k / 0.35);
        const ring = k < 0 ? 0 : Math.min(1, k / 0.7);
        return (
          <div key={i} style={{ position: 'absolute', left: t.x / dpr, top: t.y / dpr, pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', width: 54, height: 54, left: -27, top: -27, borderRadius: '50%', background: `rgba(27,27,58,${0.28 * press})` }} />
            <div style={{ position: 'absolute', width: 54 + ring * 50, height: 54 + ring * 50, left: -27 - ring * 25, top: -27 - ring * 25, borderRadius: '50%', border: `3px solid rgba(27,27,58,${0.5 * (1 - ring)})` }} />
          </div>
        );
      })}
    </>
  );
}
