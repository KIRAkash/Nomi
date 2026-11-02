// A real, scannable QR code drawn with react-native-svg, so table tents work on Android and web alike.
import makeQR from 'qrcode-generator';
import { useMemo } from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

export function QR({ value, size = 120, fg = '#1B1B3A', bg = '#FFFFFF' }: { value: string; size?: number; fg?: string; bg?: string }) {
  const { d, n } = useMemo(() => {
    const q = makeQR(0, 'M');
    q.addData(value);
    q.make();
    const count = q.getModuleCount();
    let path = '';
    for (let r = 0; r < count; r++) for (let c = 0; c < count; c++) if (q.isDark(r, c)) path += `M${c + 2} ${r + 2}h1v1h-1z`;
    return { d: path, n: count + 4 };
  }, [value]);
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${n} ${n}`} accessibilityLabel={`QR code for ${value}`}>
      <Rect width={n} height={n} fill={bg} />
      <Path d={d} fill={fg} />
    </Svg>
  );
}
