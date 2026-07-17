const MEASUREMENT_ID = "G-851WJ4PVJ7";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackPageView(path: string, title: string) {
  window.gtag?.("config", MEASUREMENT_ID, {
    page_path: path,
    page_title: title,
  });
}

