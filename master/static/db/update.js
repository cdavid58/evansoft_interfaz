/**
 * Actualizar la quantity de un registro en IndexedDB según id y product_id
 * @param {string} storeName - Nombre de la tabla
 * @param {Object} match - Objeto con los campos para buscar {id, product_id}
 * @param {number} newQuantity - Nuevo valor de quantity
 * @returns {Promise<string>} - Mensaje de éxito o error
 */
function updateReservedQuantity(storeName, match, newQuantity) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject("❌ La base de datos no está abierta todavía.");
            return;
        }

        try {
            const transaction = db.transaction([storeName], "readwrite");
            const store = transaction.objectStore(storeName);
            const request = store.get(match.id);

            request.onsuccess = function(event) {
                const record = event.target.result;

                if (!record) {
                    resolve(`⚠️ No se encontró registro con id ${match.id}`);
                    return;
                }

                // Verificar product_id
                if (record.product_id === match.product_id) {
                    record.quantity = newQuantity; // actualizar quantity

                    const updateRequest = store.put(record);
                    updateRequest.onsuccess = () => resolve(`✅ Registro con id ${match.id} actualizado con quantity = ${newQuantity}`);
                    updateRequest.onerror = (e) => reject(`❌ Error al actualizar: ${e.target.error}`);
                } else {
                    resolve(`⚠️ No coincide product_id para el registro con id ${match.id}`);
                }
            };

            request.onerror = function(e) {
                reject(`❌ Error al obtener el registro: ${e.target.error}`);
            };
        } catch (error) {
            reject(`❌ Error inesperado: ${error}`);
        }
    });
}

// Ejemplo de uso:
// updateReservedQuantity(
//     "reserved",
//     {id: register_id, product_id: product_id},
//     15
// ).then(console.log)
//  .catch(console.error);
