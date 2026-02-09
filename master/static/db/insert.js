// insert.js

function insertRecord(storeName, data) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject("❌ La base de datos no está abierta todavía.");
            return;
        }

        let transaction = db.transaction([storeName], "readwrite");
        let store = transaction.objectStore(storeName);

        let request = store.add(data);

        request.onsuccess = function(event) {
            console.log(`✅ Registro insertado en ${storeName}`, event.target.result);
            resolve(event.target.result); // devuelve el id insertado
        };

        request.onerror = function(event) {
            console.error(`❌ Error insertando en ${storeName}:`, event.target.error);
            reject(event.target.error);
        };
    });
}
