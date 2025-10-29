async function abrirBaseDeDatos() {
    return new Promise((resolve, reject) => {
        let request = indexedDB.open("MiBaseDeDatos", 5); // Aumentamos la versión para aplicar cambios

        request.onupgradeneeded = function(event) {
            let db = event.target.result;

            // Eliminar el object store si ya existe (para aplicar los cambios)
            if (db.objectStoreNames.contains("facturas")) {
                db.deleteObjectStore("facturas");
            }

            // Crear un nuevo object store donde `customer_id` sea la clave primaria
            let store = db.createObjectStore("facturas", { keyPath: "customer_id" });

            console.log("Object store 'facturas' creado con 'customer_id' como clave única.");
        };

        request.onsuccess = function(event) {
            console.log("Base de datos abierta con éxito.");
            resolve(event.target.result);
        };

        request.onerror = function(event) {
            console.error("Error al abrir la base de datos", event.target.error);
            reject(event.target.error);
        };
    });
}

async function facturaExiste(factura) {
    try {
        let db = await abrirBaseDeDatos();
        let transaction = db.transaction(["facturas"], "readonly");
        let store = transaction.objectStore("facturas");
        let index = store.index("cliente_total_fecha");
        
        let customerId = factura.customer_id || 0;
        let total = factura.total || 0;
        let paymentDueDate = (factura.payment_form && factura.payment_form.payment_due_date) ? factura.payment_form.payment_due_date : "0000-00-00";
        
        return new Promise((resolve) => {
            let request = index.get([customerId, total, paymentDueDate]);

            request.onsuccess = function(event) {
                resolve(!!event.target.result);
            };

            request.onerror = function() {
                resolve(false);
            };
        });
    } catch (error) {
        console.error("Error al verificar la factura:", error);
        return false;
    }
}

async function guardarFacturaLocal(factura) {
    try {
        let db = await abrirBaseDeDatos();
        let transaction = db.transaction(["facturas"], "readwrite");
        let store = transaction.objectStore("facturas");

        // Buscar la factura del cliente
        let request = store.get(factura.customer_id);

        request.onsuccess = function(event) {
            let facturaExistente = event.target.result;

            if (facturaExistente) {
                const swalWithBootstrapButtons = Swal.mixin({
                    customClass: {
                        confirmButton: "btn btn-success",
                        cancelButton: "btn btn-danger"
                    },
                    buttonsStyling: false
                });

                swalWithBootstrapButtons.fire({
                    title: "¿Está seguro?",
                    text: `Se encontro ya una factura guardada para el cliente ${factura.name_customer}, ¿desea actualizarla?`,
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonText: "Sí, actualizar",
                    cancelButtonText: "No, actualizar",
                    reverseButtons: true
                }).then(async (result) => {
                    if (result.isConfirmed) {
                        try {
                            // Nueva transacción solo para actualizar la factura
                            let updateTransaction = db.transaction(["facturas"], "readwrite");
                            let updateStore = updateTransaction.objectStore("facturas");
                            updateStore.put(factura);

                            updateTransaction.oncomplete = function () {
                                swalWithBootstrapButtons.fire({
                                    title: "¡Actualizado!",
                                    text: "La factura fue actualizada correctamente.",
                                    icon: "success"
                                }).then(() => {
                                    localStorage.removeItem('invoice');
                                    location.reload(true);
                                });
                            };

                            updateTransaction.onerror = function (event) {
                                console.error("Error al actualizar la factura:", event.target.error);
                            };

                        } catch (err) {
                            console.error("Error al crear transacción de actualización:", err);
                        }

                    } else {
                        swalWithBootstrapButtons.fire({
                            title: "Cancelado",
                            text: "La factura no fue actualizada.",
                            icon: "error"
                        });
                    }
                });
            } else {
                console.log("No hay factura previa para este cliente, guardando nueva...");
                store.add(factura);

                // SOLO ejecutar esto si se crea una nueva factura
                transaction.oncomplete = function() {
                    console.log("Factura procesada correctamente:", factura);
                    localStorage.removeItem('invoice');
                    location.reload(true);
                };
            }
        };

        request.onerror = function(event) {
            console.error("Error al buscar la factura del cliente:", event.target.error);
        };

        transaction.onerror = function(event) {
            console.error("Error al guardar la factura:", event.target.error);
        };

    } catch (error) {
        console.error("Error en IndexedDB:", error);
    }
}

async function leerFacturas() {
    try {
        let db = await abrirBaseDeDatos(); // Debes tener esta función creada
        let transaction = db.transaction(["facturas"], "readonly");
        let store = transaction.objectStore("facturas");

        let request = store.getAll();

        request.onsuccess = function (event) {
            let facturas = event.target.result;
            let tabla = document.getElementById("tablaFacturas");
            tabla.innerHTML = ""; // Limpia la tabla

            if (facturas.length === 0) {
                tabla.innerHTML = `<tr><td colspan="4" class="text-center">No hay facturas almacenadas.</td></tr>`;
            } else {
                facturas.forEach(factura => {
                    const fila = document.createElement("tr");
                    fila.innerHTML = `
                        <td>${factura.name_customer}</td>
                        <td>${factura.date}</td>
                        <td>${factura.prefix}</td>
                        <td>${factura.total.toLocaleString()}</td>
                        <td>
                            <button class="btn btn-info btn-sm" onclick='addInvoice(${JSON.stringify(factura)})'>
                                Agrega Factura
                            </button>
                        </td>
                    `;
                    fila.style.cursor = "pointer";

                    fila.addEventListener("click", () => mostrarDetallesFactura(factura));
                    tabla.appendChild(fila);
                });
            }

            $("#facturasModal").modal("show");
        };

        request.onerror = function (event) {
            console.error("Error al leer facturas:", event.target.error);
        };
    } catch (error) {
        console.error("Error en IndexedDB:", error);
    }
}

function mostrarDetallesFactura(factura) {
    console.log("Factura seleccionada:", factura);

    let tablaDetalles = document.getElementById("tablaDetalles");
    tablaDetalles.innerHTML = "";

    if (!factura.details || factura.details.length === 0) {
        tablaDetalles.innerHTML = `<tr><td colspan="6" class="text-center">Sin detalles para esta factura.</td></tr>`;
        return;
    }
    factura.details.forEach(det => {
        const filaDet = document.createElement("tr");
        filaDet.innerHTML = `
            <td>${det.code ?? ''}</td>
            <td>${det.name ?? ''}</td>
            <td>${det.price != null ? det.price.toLocaleString() : '0'}</td>
            <td>${det.quantity ?? '0'}</td>
            <td>${det.tax != null ? det.tax.toLocaleString() : '0'}</td>
            <td>${det.discount != null ? det.discount.toLocaleString() : '0'}</td>
        `;
        tablaDetalles.appendChild(filaDet);
    });
}


async function eliminarFacturaLocal(customer_id) {
    try {
        let db = await abrirBaseDeDatos();
        let transaction = db.transaction(["facturas"], "readwrite");
        let store = transaction.objectStore("facturas");

        let request = store.delete(customer_id);

        request.onsuccess = function() {
            console.log(`Factura con customer_id ${customer_id} eliminada de IndexedDB.`);
        };

        request.onerror = function(event) {
            console.error("Error al eliminar factura:", event.target.error);
        };
    } catch (error) {
        console.error("Error en la eliminación de la factura:", error);
    }
}


function addInvoice(invoice_recover) {

    for (let i = 0; i < invoice_recover.details.length; i++) {
        list_product_invoice.push(invoice_recover.details[i]);
    }

    localStorage.removeItem('invoice');
    localStorage.setItem("invoice", JSON.stringify(invoice_recover));

    eliminarFacturaLocal(invoice_recover.customer_id); // Eliminamos de IndexedDB

    location.reload(true);
}


function verDetalles(detalles) {
    let tablaDetalles = $("#tablaDetalles");
    tablaDetalles.empty();

    if (!detalles || detalles.length === 0) {
        tablaDetalles.append(`<tr><td colspan="6" class="text-center">No hay detalles para esta factura.</td></tr>`);
        return;
    }

    detalles.forEach(item => {
        let fila = `
            <tr>
                <td>${item.code}</td>
                <td>${item.name}</td>
                <td>${item.price}</td>
                <td>${item.quantity}</td>
                <td>${item.tax}</td>
                <td>${item.discount}</td>
            </tr>`;
        tablaDetalles.append(fila);
    });
}