const CACHE_NAME = "mi-app-cache-v8";
const OFFLINE_PAGE = "/static/offline.html";

// 📌 Normaliza URLs para evitar problemas con queries (?foo=1)
function normalizeUrl(requestUrl) {
    const url = new URL(requestUrl, self.location.origin);
    url.search = ""; // elimina parámetros de query
    return url.href;
}

// 📌 Instalar y precachear rutas desde Django
self.addEventListener("install", event => {
    event.waitUntil(
        fetch("/service_worker_cache/")
            .then(response => response.json())
            .then(files => {
                console.log("📥 Archivos a cachear:", files.files.length);

                return caches.open(CACHE_NAME).then(cache => {
                    return Promise.all(
                        files.files.map(url => {
                            const correctedUrl = url.replace(/%5C/g, "/");
                            const cleanUrl = normalizeUrl(correctedUrl);

                            return fetch(correctedUrl)
                                .then(response => {
                                    if (!response.ok) throw new Error(`No se pudo obtener: ${correctedUrl}`);
                                    cache.put(cleanUrl, response.clone());
                                    saveUrlToDB(cleanUrl);
                                    return response;
                                })
                                .catch(error => console.warn("⚠️ Error al cachear:", correctedUrl, error));
                        })
                    );
                });
            })
            .catch(error => console.error("❌ Error al obtener archivos:", error))
    );
});

// 📌 Activación: limpieza de cachés viejos
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log(`🗑️ Borrando caché antiguo: ${cache}`);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

// 📌 Estrategia de cache: páginas → cache first, recursos → network first
self.addEventListener("fetch", event => {
    if (event.request.method !== "GET") return;

    const cleanUrl = normalizeUrl(event.request.url);

    event.respondWith(
        caches.match(cleanUrl).then(cachedResponse => {
            // 🔹 Si es documento HTML → Cache First + fallback offline
            if (event.request.destination === "document") {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(event.request)
                    .then(response => {
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(cleanUrl, response.clone());
                        });
                        return response;
                    })
                    .catch(() => caches.match(OFFLINE_PAGE));
            }

            // 🔹 Para estáticos (CSS, JS, imágenes) → Network First
            return fetch(event.request)
                .then(response => {
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(cleanUrl, response.clone());
                    });
                    return response;
                })
                .catch(() => cachedResponse || caches.match(OFFLINE_PAGE));
        })
    );
});

// 📌 Guardar URLs en IndexedDB
function saveUrlToDB(url) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("PWA_DB", 1);

        request.onupgradeneeded = event => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains("urls")) {
                db.createObjectStore("urls", { keyPath: "url" });
            }
        };

        request.onsuccess = event => {
            const db = event.target.result;
            const tx = db.transaction("urls", "readwrite");
            const store = tx.objectStore("urls");

            store.get(url).onsuccess = e => {
                if (!e.target.result) {
                    store.put({ url });
                }
            };

            tx.oncomplete = () => resolve();
            tx.onerror = e => reject(e.target.error);
        };

        request.onerror = event => reject(event.target.error);
    });
}

// 📌 Obtener URL desde IndexedDB (no lo usamos mucho, pero lo dejo por compatibilidad)
function getUrlFromDB(requestUrl) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("PWA_DB", 1);
        request.onsuccess = event => {
            const db = event.target.result;
            const tx = db.transaction("urls", "readonly");
            const store = tx.objectStore("urls");
            const getRequest = store.get(requestUrl);

            getRequest.onsuccess = () => resolve(getRequest.result ? getRequest.result.url : null);
            getRequest.onerror = () => reject(getRequest.error);
        };
        request.onerror = event => reject(event.target.error);
    });
}

// 📌 Registrar el Service Worker (esto va en tu base template Django, no aquí normalmente)
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/service-worker.js")
        .then(reg => console.log("✅ Service Worker registrado correctamente.", reg))
        .catch(err => console.log("❌ Error al registrar Service Worker", err));
}
