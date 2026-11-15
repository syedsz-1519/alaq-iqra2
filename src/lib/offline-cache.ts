/**
 * Network-first JSON fetch that keeps a copy in the browser's Cache Storage,
 * so anything read once (or downloaded on the Offline page) still opens without a connection.
 */
export const CACHE_TEXT = "alaq-text-v1";
export const CACHE_AUDIO = "alaq-audio-v1";

const hasCaches = () => typeof window !== "undefined" && "caches" in window;

export async function cachedJson<T>(url: string): Promise<T> {
  if (!hasCaches()) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    return (await res.json()) as T;
  }
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    const cache = await caches.open(CACHE_TEXT);
    await cache.put(url, res.clone()).catch(() => {});
    return (await res.json()) as T;
  } catch (err) {
    const hit = await caches.match(url, { cacheName: CACHE_TEXT });
    if (hit) return (await hit.json()) as T;
    throw err;
  }
}

export async function isCached(url: string, cacheName: string) {
  if (!hasCaches()) return false;
  return Boolean(await caches.match(url, { cacheName }));
}

/** Store a list of files; skips ones already saved. Reports progress after each file. */
export async function saveAll(
  urls: string[],
  cacheName: string,
  onProgress?: (done: number, total: number) => void,
  signal?: AbortSignal,
) {
  const cache = await caches.open(cacheName);
  let done = 0;
  const queue = [...urls];
  const worker = async () => {
    while (queue.length) {
      if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
      const url = queue.shift()!;
      if (!(await cache.match(url))) {
        const res = await fetch(url, signal ? { signal } : {});
        if (!res.ok) throw new Error(`Download failed (${res.status})`);
        await cache.put(url, res);
      }
      done++;
      onProgress?.(done, urls.length);
    }
  };
  await Promise.all(Array.from({ length: 4 }, worker));
}

export async function countCached(urls: string[], cacheName: string) {
  if (!hasCaches()) return 0;
  const cache = await caches.open(cacheName);
  const hits = await Promise.all(urls.map((u) => cache.match(u)));
  return hits.filter(Boolean).length;
}

export async function removeAll(urls: string[], cacheName: string) {
  const cache = await caches.open(cacheName);
  await Promise.all(urls.map((u) => cache.delete(u)));
}

export async function clearCache(cacheName: string) {
  if (hasCaches()) await caches.delete(cacheName);
}

/** Returns a playable URL: a local copy when the file was saved, otherwise the online address. */
export async function playableUrl(url: string) {
  if (!hasCaches()) return url;
  const hit = await caches.match(url, { cacheName: CACHE_AUDIO });
  if (!hit) return url;
  return URL.createObjectURL(await hit.blob());
}

export async function storageEstimate() {
  if (typeof navigator === "undefined" || !navigator.storage?.estimate) return null;
  const e = await navigator.storage.estimate();
  return { usage: e.usage ?? 0, quota: e.quota ?? 0 };
}
