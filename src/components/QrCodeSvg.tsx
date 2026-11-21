import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';

interface QrCodeSvgProps {
  value: string;
  size?: number;
  label?: string;
  caption?: string;
  hideCaption?: boolean;
}

// Generates a crisp high-contrast ISO-18004 QR code (rendered as a pixel-aligned PNG with synchronous SVG fallback)
export const QrCodeSvg: React.FC<QrCodeSvgProps> = ({
  value,
  size = 112,
  label,
  caption,
  hideCaption = false,
}) => {
  const safeValue = value || 'ecoscrap';
  const [pngUrl, setPngUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(safeValue, {
      errorCorrectionLevel: 'M',
      margin: 4,
      width: Math.max(320, size * 3),
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })
      .then((url) => {
        if (!cancelled) setPngUrl(url);
      })
      .catch(() => {
        if (!cancelled) setPngUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [safeValue, size]);

  const fallbackSvg = useMemo(() => {
    const qr = QRCode.create(safeValue, { errorCorrectionLevel: 'M' });
    const count = qr.modules.size;
    const data = qr.modules.data;
    const quietZone = 4;
    const parts: string[] = [];
    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) {
        if (data[r * count + c]) {
          parts.push(`M${c + quietZone},${r + quietZone}h1v1h-1z`);
        }
      }
    }
    return {
      totalViewBox: count + quietZone * 2,
      pathData: parts.join(''),
    };
  }, [safeValue]);

  return (
    <div className="inline-flex flex-col items-center gap-1.5">
      <div className="rounded-xl bg-white p-2 border border-[#143326]/15 shadow-xs inline-flex">
        {pngUrl ? (
          <img
            src={pngUrl}
            width={size}
            height={size}
            alt={label || `Scannable QR code for ${caption ?? safeValue}`}
            className="block rounded-sm"
            style={{ imageRendering: 'pixelated' }}
          />
        ) : (
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${fallbackSvg.totalViewBox} ${fallbackSvg.totalViewBox}`}
            shapeRendering="crispEdges"
            role="img"
            aria-label={label || `Scannable QR code for ${caption ?? safeValue}`}
            className="block"
          >
            <rect width={fallbackSvg.totalViewBox} height={fallbackSvg.totalViewBox} fill="#FFFFFF" />
            <path d={fallbackSvg.pathData} fill="#000000" />
          </svg>
        )}
      </div>
      {!hideCaption && (
        <span className="font-mono-data text-[11px] tracking-tight text-[#143326]/75 max-w-[140px] truncate text-center">
          {caption ?? safeValue}
        </span>
      )}
    </div>
  );
};
