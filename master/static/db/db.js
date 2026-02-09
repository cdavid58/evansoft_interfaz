// db.js
let db;
let retryCount = 0;
const maxRetries = 5; // Número máximo de intentos
const retryDelay = 2000; // ms entre reintentos

function openDatabase() {
    return new Promise((resolve, reject) => {
        console.log("📂 Intentando abrir la base de datos IndexedDB...");

        let request = indexedDB.open("invoice_offline", 1);

        request.onupgradeneeded = function(event) {
            db = event.target.result;
            createTables(db); // 👉 llama al creador de tablas
        };

        request.onsuccess = function(event) {
            db = event.target.result;
            retryCount = 0; // reset
            console.log("✅ Base de datos invoice_offline abierta");
            resolve(db); // 👈 importante
        };

        request.onerror = function(event) {
            console.error("❌ Error al abrir la base de datos:", event);

            if (retryCount < maxRetries) {
                retryCount++;
                console.warn(`🔄 Reintentando abrir la base de datos... intento ${retryCount}/${maxRetries}`);
                setTimeout(() => {
                    openDatabase().then(resolve).catch(reject);
                }, retryDelay);
            } else {
                console.error("⛔ No se pudo abrir la base de datos después de varios intentos.");
                reject(event);
            }
        };
    });
}
