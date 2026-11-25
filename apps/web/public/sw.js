const SHELL_CACHE = "pmki-shell-v3";
const PUBLIC_IMAGE_CACHE = "pmki-public-images-v3";
const SHELL_ASSETS = [
  "/",
  "/program",
  "/gallery",
  "/news",
  "/pendaftaran",
  "/offline",
  "/manifest.webmanifest",
  "/icons/icon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== SHELL_CACHE && key !== PUBLIC_IMAGE_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // Never intercept or cache Next.js RSC payloads or Tier C /workspace sub-fetches
  if (
    request.mode !== "navigate" &&
    (url.pathname.startsWith("/workspace") ||
      url.searchParams.has("_rsc") ||
      request.headers.get("RSC") === "1")
  ) {
    return;
  }

  // Navigation requests: Network First with Cached Page / Offline Fallback (06 §9)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && !url.pathname.startsWith("/workspace")) {
            const clone = response.clone();
            caches.open(SHELL_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const offlinePage = await caches.match("/offline");
          return offlinePage || Response.error();
        })
    );
    return;
  }

  // Static images, icons, fonts: Cache First (06 §9, §28 Repeated Load < 1s)
  if (
    url.pathname.startsWith("/images/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/_next/static/")
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request)
            .then((response) => {
              if (response.ok) {
                const clone = response.clone();
                caches
                  .open(PUBLIC_IMAGE_CACHE)
                  .then((cache) => cache.put(request, clone));
              }
              return response;
            })
            .catch(() => Response.error())
      )
    );
    return;
  }

  // Other same-origin GET assets: Stale-While-Revalidate (never resolve undefined)
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response.ok && !url.pathname.startsWith("/workspace")) {
            const clone = response.clone();
            caches.open(SHELL_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached || Response.error());
      return cached || networkFetch;
    })
  );
});


