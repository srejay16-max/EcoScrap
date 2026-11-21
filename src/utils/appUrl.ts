import { useEffect, useState } from 'react';

export interface AppUrlStatus {
  baseUrl: string;
  devUrl: string;
  sharedUrl: string;
  sharedUrlLive: boolean;
}

let cachedStatus: AppUrlStatus | null = null;

function getFallbackStatus(): AppUrlStatus {
  const origin =
    typeof window !== 'undefined'
      ? window.location.origin.replace(/\/+$/, '')
      : 'https://localhost:3000';
  const sharedUrl = origin.includes('://ais-dev-')
    ? origin.replace('://ais-dev-', '://ais-pre-')
    : origin;
  return {
    baseUrl: origin,
    devUrl: origin,
    sharedUrl,
    sharedUrlLive: sharedUrl === origin,
  };
}

export async function fetchAppUrlStatus(force = false): Promise<AppUrlStatus> {
  if (cachedStatus && !force) return cachedStatus;
  const fallback = getFallbackStatus();
  try {
    const res = await fetch('/api/app-url-status');
    if (!res.ok) return fallback;
    const data = (await res.json()) as {
      appUrl?: string;
      sharedUrl?: string;
      sharedUrlLive?: boolean;
    };
    const devUrl = (data.appUrl || fallback.devUrl).replace(/\/+$/, '');
    const sharedUrl = (data.sharedUrl || fallback.sharedUrl).replace(/\/+$/, '');
    const sharedUrlLive = Boolean(data.sharedUrlLive);
    cachedStatus = {
      baseUrl: sharedUrlLive && sharedUrl ? sharedUrl : devUrl,
      devUrl,
      sharedUrl,
      sharedUrlLive,
    };
    return cachedStatus;
  } catch {
    return fallback;
  }
}

export function useAppBaseUrl(): string {
  const [baseUrl, setBaseUrl] = useState<string>(() =>
    cachedStatus ? cachedStatus.baseUrl : getFallbackStatus().baseUrl
  );

  useEffect(() => {
    let cancelled = false;
    void fetchAppUrlStatus().then((status) => {
      if (!cancelled) setBaseUrl(status.baseUrl);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return baseUrl;
}
