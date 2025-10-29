/**
 * Eliminar registro por id en IndexedDB
 * @param {string} storeName - Nombre de la tabla
 * @param {number|string} id - ID del registro a eliminar
 * @returns {Promise<string>} - Mensaje de éxito o error
 */
function removeById(storeName, id) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject("❌ La base de datos no está abierta todavía.");
            return;
        }

        try {
            let transaction = db.transaction([storeName], "readwrite");
            let store = transaction.objectStore(storeName);

            // Comprobar si existe primero
            let getRequest = store.get(id);
            getRequest.onsuccess = function(event) {
                if (!event.target.result) {
                    resolve(`⚠️ No se encontró registro con id ${id}`);
                    return;
                }

                // Eliminar registro
                let deleteRequest = store.delete(id);
                deleteRequest.onsuccess = () => resolve(`✅ Registro con id ${id} eliminado`);
                deleteRequest.onerror = (e) => reject(`❌ Error al eliminar: ${e.target.error}`);
            };

            getRequest.onerror = function(e) {
                reject(`❌ Error al verificar existencia del registro: ${e.target.error}`);
            };
        } catch (error) {
            reject(`❌ Error inesperado: ${error}`);
        }
    });
}
