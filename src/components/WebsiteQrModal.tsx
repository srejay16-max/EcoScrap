import React, { useEffect, useState } from 'react';
import { Check, Copy, ExternalLink, QrCode, X } from 'lucide-react';
import { fetchAppUrlStatus, useAppBaseUrl } from '../utils/appUrl';

const WEBSITE_QR_IMG = '/assets/aistudio/Screenshot_2026-11-21_152550_973df9e7.png';

interface WebsiteQrModalProps {
  open: boolean;
  onClose: () => void;
}

export const WebsiteQrModal: React.FC<WebsiteQrModalProps> = ({ open, onClose }) => {
  const initialBaseUrl = useAppBaseUrl();
  const [websiteUrl, setWebsiteUrl] = useState(initialBaseUrl);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setWebsiteUrl(initialBaseUrl);
  }, [initialBaseUrl]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void fetchAppUrlStatus(true).then((status) => {
      if (!cancelled) {
        setWebsiteUrl(status.baseUrl);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(websiteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API fallback ignored if denied
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="website-qr-title"
    >
      <div className="w-full max-w-sm rounded-2xl border border-[#143326]/15 bg-white shadow-2xl overflow-hidden">
        <div className="bg-[#143326] px-5 py-4 text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#84CC16] text-[#143326]">
              <QrCode className="h-4 w-4" />
            </span>
            <div>
              <h2 id="website-qr-title" className="font-display text-base font-semibold">
                EcoScrap Website QR
              </h2>
              <p className="text-[11px] text-[#BEF264]">
                Scan to open EcoScrap
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close website QR modal"
            className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="rounded-2xl border border-[#143326]/12 bg-[#FAF8F3] p-5 flex flex-col items-center text-center gap-3">
            <div className="rounded-xl bg-white p-2 border border-[#143326]/15 shadow-xs inline-flex">
              <img
                src={WEBSITE_QR_IMG}
                width={212}
                height={212}
                alt="QR code leading to the EcoScrap website"
                className="block rounded-sm object-contain"
              />
            </div>
            <span className="text-xs font-mono-data text-[#143326]/75 break-all">
              {websiteUrl}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#143326]/20 bg-white px-3 py-2 text-xs font-semibold text-[#143326] hover:bg-[#FAF8F3] cursor-pointer"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-[#15803D]" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy Link'}
            </button>
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#143326] px-3 py-2 text-xs font-semibold text-white hover:bg-[#1E4A38]"
            >
              <ExternalLink className="h-3.5 w-3.5 text-[#BEF264]" />
              Open Website
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
