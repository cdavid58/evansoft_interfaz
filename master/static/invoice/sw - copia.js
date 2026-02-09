const CACHE_NAME = "mi-app-cache-v6";
const OFFLINE_PAGE = "/static/offline.html";

// 📌 Instalar el Service Worker y almacenar URLs en IndexedDB
self.addEventListener("install", event => {
    event.waitUntil(
        fetch("/service_worker_cache/")
            .then(response => response.json())
            .then(files => {
                console.log("Archivos a cachear:", files.files);

                return caches.open(CACHE_NAME).then(cache => {
                    return Promise.all(
                        files.files.map(url => {
                            const correctedUrl = url.replace(/%5C/g, '/'); // 🔹 Corrige rutas
                            return fetch(correctedUrl)
                                .then(response => {
                                    if (!response.ok) throw new Error(`No se pudo obtener: ${correctedUrl}`);
                                    cache.put(correctedUrl, response.clone());
                                    saveUrlToDB(correctedUrl);
                                    return response;
                                })
                                .catch(error => console.warn(error));
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
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) return cachedResponse; // 🔹 Devuelve caché si existe

            return fetch(event.request)
                .then(response => {
                    if (event.request.method === "GET" && event.request.destination !== "document") {
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, response.clone());
                        });
                    }
                    return response;
                })
                .catch(() => {
                    if (event.request.destination === "document") {
                        return getUrlFromDB(event.request.url).then(url => {
                            if (url) return caches.match(url);
                            return caches.match(OFFLINE_PAGE);
                        });
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

            // Verifica si la URL ya existe para evitar duplicados
            store.get(url).onsuccess = event => {
                if (!event.target.result) {
                    store.put({ url });
                }
            };

            resolve();
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
