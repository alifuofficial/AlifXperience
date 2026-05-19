import { readFile } from "fs/promises";
import path from "path";
import Script from "next/script";

const SETTINGS_PATH = path.join(process.cwd(), "data", "settings.json");

async function getScriptSettings() {
  try {
    const raw = await readFile(SETTINGS_PATH, "utf-8");
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

/**
 * Server Component — reads settings.json and injects GA4 + AdSense scripts.
 * Renders nothing if the IDs are not configured.
 */
export default async function GoogleScripts() {
  const settings = await getScriptSettings();
  const gaId = settings.googleAnalyticsId?.trim();
  const adsenseId = settings.googleAdsenseId?.trim();

  return (
    <>
      {/* ── Google Analytics 4 ─────────────────────────────────────────── */}
      {gaId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="lazyOnload"
          />
          <Script id="google-analytics" strategy="lazyOnload">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}', { page_path: window.location.pathname });
            `}
          </Script>
        </>
      )}

      {/* ── Google AdSense ─────────────────────────────────────────────── */}
      {adsenseId && (
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`}
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
      )}
    </>
  );
}
