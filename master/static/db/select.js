/**
 * Select genérico en IndexedDB
 * @param {string} storeName - Nombre de la tabla principal (ej: 'invoices' o 'quotations')
 * @param {object} [where] - Filtro en formato { campo: valor }
 * @param {boolean} includeRelated - Si es true, trae detalles y pagos relacionados
 * @returns {Promise<Array>} - Registros encontrados con sus relaciones
 */
async function getAllData(storeName, where = null, includeRelated = false) {
    if (!db) throw "❌ La base de datos no está abierta todavía.";

    const detailsTable = storeName === "invoices" ? "InvoiceDetails" : "Details";
    const paymentsTable = storeName === "invoices" ? "InvoicePayments" : "Payments";
    const relationKey = storeName === "invoices" ? "invoice_id" : "cotizacion_id";


    // Función para obtener todos los registros de un store
    const fetchAll = (store) => new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = e => resolve(e.target.result);
        request.onerror = e => reject(e.target.error);
    });

    // Función para obtener por filtro (si no hay índices)
    const fetchWhere = (store, where) => new Promise((resolve, reject) => {
        let res = [];
        const request = store.openCursor();
        request.onsuccess = e => {
            const cursor = e.target.result;
            if (cursor) {
                let match = true;
                for (let key in where) {
                    if (cursor.value[key] !== where[key]) {
                        match = false;
                        break;
                    }
                }
                if (match) res.push(cursor.value);
                cursor.continue();
            } else {
                resolve(res);
            }
        };
        request.onerror = e => reject(e.target.error);
    });

    // 🔹 Obtener registros principales
    let transaction = db.transaction([storeName], "readonly");
    let store = transaction.objectStore(storeName);

    let results = where ? await fetchWhere(store, where) : await fetchAll(store);

    

    return results;
}
