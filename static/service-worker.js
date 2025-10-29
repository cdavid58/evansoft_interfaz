const CACHE_NAME = "mi-app-cache-v7";  // 🔹 Se actualiza el nombre del caché para evitar conflictos
const OFFLINE_PAGE = "/static/offline.html";

if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().then(persistent => {
        console.log(persistent ? "✅ IndexedDB ahora es persistente" : "⚠️ No se pudo activar el almacenamiento persistente");
    });
}

// 📌 Instalar el Service Worker y almacenar URLs en IndexedDB
self.addEventListener("install", event => {
    event.waitUntil(
        fetch("/service_worker_cache/")
            .then(response => response.json())
            .then(files => {
                return caches.open(CACHE_NAME).then(cache => {
                    return Promise.all(
                        files.files.map(url => {
                            if (!url.endsWith(".html") && !url.includes("/Save_Product/")) {
                                const correctedUrl = url.replace(/%5C/g, '/');
                                return fetch(correctedUrl, { method: "HEAD" })
                                    .then(response => {
                                        if (!response.ok) throw new Error(`No se pudo obtener: ${correctedUrl}`);
                                        return fetch(correctedUrl)
                                            .then(res => {
                                                cache.put(correctedUrl, res.clone());
                                                return saveUrlToDB(correctedUrl);
                                            });
                                    })
                                    .catch(error => console.warn("⚠️ Error al cachear:", correctedUrl, error));
                            }
                        })
                    );
                });
            })
            .catch(error => console.error("❌ Error al obtener archivos:", error))
    );
});

// 📌 Activación y limpieza de cachés antiguos
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

// 📌 Interceptar peticiones y responder con caché, IndexedDB o fallback offline
self.addEventListener("fetch", event => {
    if (event.request.method !== "GET") return;

    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) return cachedResponse;
            return fetch(event.request)
                .then(response => {
                    if (!response || response.status !== 200 || response.type !== "basic") {
                        return response;
                    }
                    return caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, response.clone());
                        return response;
                    });
                })
                .catch(() => {
                    if (event.request.destination === "document") {
                        return getUrlFromDB(event.request.url).then(url => url ? caches.match(url) : caches.match(OFFLINE_PAGE));
                    }
                    return caches.match(OFFLINE_PAGE);
                });
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
            const transaction = db.transaction("urls", "readwrite");
            const store = transaction.objectStore("urls");

            store.get(url).onsuccess = event => {
                if (!event.target.result) {
                    store.put({ url });
                }
            };

            transaction.oncomplete = () => resolve();
            transaction.onerror = event => reject(event.target.error);
        };

        request.onerror = event => reject(event.target.error);
    });
}

// 📌 Obtener URL desde IndexedDB
function getUrlFromDB(requestUrl) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("PWA_DB", 1);
        request.onsuccess = event => {
            const db = event.target.result;
            const transaction = db.transaction("urls", "readonly");
            const store = transaction.objectStore("urls");
            const getRequest = store.get(requestUrl);

            getRequest.onsuccess = () => resolve(getRequest.result ? getRequest.result.url : null);
            getRequest.onerror = () => reject(getRequest.error);
        };
        request.onerror = event => reject(event.target.error);
    });
}

// 📌 Registrar el Service Worker
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/service-worker.js")
        .then(reg => console.log("✅ Service Worker registrado correctamente.", reg))
        .catch(err => console.log("❌ Error al registrar Service Worker", err));
}
