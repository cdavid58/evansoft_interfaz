// Abrir o crear la base de datos
function abrirBaseDeDatos() {
    return new Promise((resolve, reject) => {
        let request = indexedDB.open("MiBaseDeDatos", 3); // Incrementa la versión si es necesario

        request.onupgradeneeded = function(event) {
            let db = event.target.result;

            // Crear object store si no existe
            if (!db.objectStoreNames.contains("facturas")) {
                let store = db.createObjectStore("facturas", { keyPath: "id", autoIncrement: true });
                store.createIndex("cliente_total_fecha", ["supplier_id", "total", "payment_due_date"], { unique: true });
                console.log("Object store 'facturas' creado.");
            }
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
        
        let customerId = factura.supplier_id || 0;
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
        let existe = await facturaExiste(factura);

        if (existe) {
            console.warn("La factura ya existe y no se guardará.");
            return;
        }

        let db = await abrirBaseDeDatos();
        let transaction = db.transaction(["facturas"], "readwrite");
        let store = transaction.objectStore("facturas");

        let request = store.add(factura);

        request.onsuccess = function() {
            console.log("Factura guardada con éxito:", factura);
            localStorage.removeItem('invoice')
            location.reload(true)
        };

        request.onerror = function(event) {
            console.error("Error al guardar la factura:", event.target.error);
        };
    } catch (error) {
        console.error("Error en IndexedDB:", error);
    }
}


async function leerFacturas() {
    try {
        let db = await abrirBaseDeDatos();
        let transaction = db.transaction(["facturas"], "readonly");
        let store = transaction.objectStore("facturas");

        let request = store.getAll();

        request.onsuccess = function(event) {
            let facturas = event.target.result;
            let tabla = $("#tablaFacturas");
            tabla.empty();

            if (facturas.length === 0) {
                tabla.append(`<tr><td colspan="5" class="text-center">No hay facturas almacenadas.</td></tr>`);
            } else {
                facturas.forEach(factura => {
                    let fila = `
                        <tr>
                            <td>${factura.id}</td>
                            <td>${factura.supplier_id}</td>
                            <td>${factura.date}</td>
                            <td>${factura.prefix}</td>
                            <td>
                                <button class="btn btn-info btn-sm" onclick='addInvoice(${JSON.stringify(factura)})'>
                                    Agrega Factura
                                </button>
                            </td>
                        </tr>`;
                    tabla.append(fila);
                });
            }

            $("#facturasModal").modal("show");
        };

        request.onerror = function(event) {
            console.error("Error al leer facturas:", event.target.error);
        };
    } catch (error) {
        console.error("Error en IndexedDB:", error);
    }
}


function addInvoice(invoice_recover){
    console.log(invoice_recover)
    for(i = 0; i < invoice_recover.details.length; i++){
        list_product_invoice.push(invoice_recover.details[i])
    }
    localStorage.removeItem('invoice')
    localStorage.setItem("invoice", JSON.stringify(invoice_recover))
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