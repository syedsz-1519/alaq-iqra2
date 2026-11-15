/**
 * The only place the offline service worker is registered.
 * It never runs in development, inside the editor preview, or in iframes; `?sw=off` removes it.
 */
const SW_URL = "/sw.js";

function isPreviewHost(host: string) {
  const previewLabel = /^(?:id-preview|preview)(?:-[a-z0-9]+)?--.+$/;
  const label = host.split(".")[0] ?? "";
  const lovableHosted = [".lovable.app", ".gpt-eng.com", ".gptengineer.run"].some((d) => host.endsWith(d));
  if (lovableHosted && previewLabel.test(label)) return true;
  if (lovableHosted && /^project--[a-z0-9-]+-dev$/.test(label)) return true;
  return (
    host === "lovableproject.com" ||
    host.endsWith(".lovableproject.com") ||
    host === "lovableproject-dev.com" ||
    host.endsWith(".lovableproject-dev.com") ||
    host === "beta.lovable.dev" ||
    host.endsWith(".beta.lovable.dev")
  );
}

async function unregisterAppWorkers() {
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    regs
      .filter((r) => [r.active, r.waiting, r.installing].some((w) => w?.scriptURL.endsWith(SW_URL)))
      .map((r) => r.unregister()),
  );
}

export function registerOfflineSupport() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  const host = window.location.hostname.toLowerCase();
  let inIframe = true;
  try {
    inIframe = window.self !== window.top;
  } catch {
    inIframe = true;
  }
  const refused =
    !import.meta.env.PROD ||
    inIframe ||
    isPreviewHost(host) ||
    new URLSearchParams(window.location.search).get("sw") === "off";

  if (refused) {
    void unregisterAppWorkers().catch(() => {});
    return;
  }
  void navigator.serviceWorker.register(SW_URL, { scope: "/" }).catch(() => {});
}
