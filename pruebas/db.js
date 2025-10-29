// db.js
let db;
let request = indexedDB.open("invoice_offline", 1);

request.onupgradeneeded = function(event) {
    db = event.target.result;
    createTables(db); // 👉 llama al creador de tablas
};

request.onsuccess = function(event) {
    db = event.target.result;
    console.log("✅ Base de datos invoice_offline abierta");
};

request.onerror = function(event) {
    console.error("❌ Error al abrir la base de datos:", event);
};
