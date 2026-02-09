/**
 * Select genérico en IndexedDB
 * @param {string} storeName - Nombre de la tabla principal (ej: 'invoices' o 'Cotizaciones')
 * @param {object} [where] - Filtro en formato { campo: valor }
 * @param {boolean} includeRelated - Si es true, trae detalles y pagos relacionados
 * @returns {Promise<Array>} - Registros encontrados con sus relaciones
 */
async function getAllData(storeName, where = null, includeRelated = false) {
    if (!db) throw "❌ La base de datos no está abierta todavía.";

    let transaction = db.transaction(db.objectStoreNames, "readonly");
    let store = transaction.objectStore(storeName);
    let results = [];

    // Función interna para obtener todos los registros de la tabla principal
    const fetchAll = () => {
        return new Promise((resolve, reject) => {
            let request = store.getAll();
            request.onsuccess = e => resolve(e.target.result);
            request.onerror = e => reject(e.target.error);
        });
    };

    results = where ? [] : await fetchAll();

    if (where) {
        // Filtrado con cursor
        results = await new Promise((resolve, reject) => {
            let res = [];
            let request = store.openCursor();
            request.onsuccess = function(event) {
                let cursor = event.target.result;
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
    }

    // Traer datos relacionados si aplica
    if (includeRelated) {
        for (let i = 0; i < results.length; i++) {
            let record = results[i];

            // Determinar la tabla de detalles según si es invoice o cotizacion
            let detailsTable = storeName === "invoices" ? "InvoiceDetails" : "Details";
            let paymentsTable = storeName === "invoices" ? "InvoicePayments" : "Payments";

            // Detalles
            record.details = await new Promise((resolve, reject) => {
                let detailStore = transaction.objectStore(detailsTable);
                let details = [];
                let request = detailStore.index(storeName === "invoices" ? "invoice_id" : "cotizacion_id").openCursor(IDBKeyRange.only(record.id));
                request.onsuccess = function(e) {
                    let cursor = e.target.result;
                    if (cursor) {
                        details.push(cursor.value);
                        cursor.continue();
                    } else {
                        resolve(details);
                    }
                };
                request.onerror = e => reject(e.target.error);
            });

            // Pagos
            record.payments = await new Promise((resolve, reject) => {
                let paymentStore = transaction.objectStore(paymentsTable);
                let payments = [];
                let request = paymentStore.index(storeName === "invoices" ? "invoice_id" : "cotizacion_id").openCursor(IDBKeyRange.only(record.id));
                request.onsuccess = function(e) {
                    let cursor = e.target.result;
                    if (cursor) {
                        payments.push(cursor.value);
                        cursor.continue();
                    } else {
                        resolve(payments);
                    }
                };
                request.onerror = e => reject(e.target.error);
            });
        }
    }

    return results;
}
