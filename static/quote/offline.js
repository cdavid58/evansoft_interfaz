// static/invoice/offline.js


if (typeof jQuery === 'undefined') {
    console.error("jQuery is not loaded");
} else {
    console.log("jQuery is loaded");
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
        let cookies = document.cookie.split(";");
        for (let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i].trim();
            if (cookie.startsWith(name + "=")) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

async function OpenDBInventory() {
    return new Promise((resolve, reject) => {
        let request = indexedDB.open("InventoryDB", 1);
        request.onerror = function(event) {
            reject("Error opening database: " + event.target.error);
        };
        request.onsuccess = function(event) {
            resolve(event.target.result);
        };
        request.onupgradeneeded = function(event) {
            let db = event.target.result;
            if (!db.objectStoreNames.contains("inventory")) {
                db.createObjectStore("inventory", { keyPath: "id" });
            }
        };
    });
}

async function SaveInventoryLocal(inventory) {

    if (inventory.data && Array.isArray(inventory.data)) {
        inventory = inventory.data;
    } else {
        console.error("Error: The inventory does not contain a valid list", inventory);
        return;
    }

    let db = await OpenDBInventory();
    let transaction = db.transaction("inventory", "readwrite");
    let store = transaction.objectStore("inventory");

    inventory.forEach(item => store.put(item));
}

async function GetInventoryLocal() {
    try {
        let db = await OpenDBInventory();
        return new Promise((resolve, reject) => {
            let transaction = db.transaction("inventory", "readonly");
            let store = transaction.objectStore("inventory");
            let request = store.getAll();

            request.onsuccess = function(event) {
                resolve(event.target.result || []);
            };

            request.onerror = function(event) {
                console.error("Error reading local inventory:", event.target.error);
                reject([]);
            };
        });
    } catch (error) {
        console.error("Error retrieving local inventory:", error);
        return [];
    }
}

async function LoadInventory() {
    try {
        let localInventory = await GetInventoryLocal();

        if (localInventory.length > 0) {
            return;
        }

        let response = await fetch(url_all_inventory, {
            method: "POST",
            headers: {
                "X-CSRFToken": getCookie("csrftoken"),
                "X-Requested-With": "XMLHttpRequest"
            }
        });

        let inventory = await response.json();

        await SaveInventoryLocal(inventory);
    } catch (error) {
        console.error("Error loading inventory:", error);
    }
}

async function InitializeSelectInventory() {
    let hasInternet = navigator.onLine;

    if (hasInternet) {
        $('#productSelect').select2({
            placeholder: 'Search product...',
            allowClear: true,
            minimumInputLength: 2,
            ajax: {
                url: url_product,
                dataType: 'json',
                type: "POST",
                headers: { "X-CSRFToken": getCookie("csrftoken") },
                delay: 250,
                contentType: "application/json",
                data: params => JSON.stringify({ q: params.term }),
                processResults: data => {
                    console.log("Data received:", data);
                    list_product_tmp = data;
                    let results = data.customer ? data.customer : data;
                    return { results: Array.isArray(results) ? results.map(p => ({ id: p.id, text: p.name })) : [] };
                },
                cache: true
            }
        });
    } else {
        let localProducts = await GetInventoryLocal();
        list_product_tmp = localProducts;
        console.log("Local products loaded:", localProducts);

        if (!localProducts.length) {
            console.warn("No products in IndexedDB.");
            return;
        }

        $('#productSelect').select2("destroy").empty().select2({
            placeholder: 'Search product...',
            allowClear: true,
            data: localProducts.map(p => ({ id: p.id, text: p.name }))
        });
    }
}


// async function searchProductByName(name) {
//     try {
//         let hasInternet = navigator.onLine;
//         let products = [];
//         console.log("No connection, searching product by name locally...");
//         let localInventory = await GetInventoryLocal();
//         products = localInventory.filter(p => p.name.toLowerCase().includes(name.toLowerCase()));
//         console.log("Products found:", products);
//         return products;
//     } catch (error) {
//         console.error("Error searching product:", error);
//         return []; // En caso de error, retorna un arreglo vacío
//     }
// }

// ✨ Normalizar texto (quita mayúsculas, tildes y espacios extras)
function normalizeText(text) {
    return text
        .toLowerCase()
        .normalize("NFD") // separa acentos
        .replace(/[\u0300-\u036f]/g, "") // elimina diacríticos
        .replace(/[.,;:]$/, "") // quita punto, coma, ; o : al final
        .trim();
}

async function searchProductByName(name) {
    try {
        let hasInternet = navigator.onLine;
        let products = [];

        console.log("🔎 Buscando producto por nombre:", name);

        // Obtener inventario local
        let localInventory = await GetInventoryLocal();

        // Normalizar nombre buscado
        let cleanName = normalizeText(name);

        // Filtrar con normalización
        products = localInventory.filter(p => 
            normalizeText(p.name).includes(cleanName)
        );

        console.log("✅ Productos encontrados:", products);
        return products;
    } catch (error) {
        console.error("❌ Error searching product:", error);
        return []; // En caso de error, retorna un arreglo vacío
    }
}



window.addEventListener('online', () => {
    console.log("Connection restored");
    InitializeSelectInventory();
});

window.addEventListener('offline', () => {
    console.log("No connection, using local data");
    InitializeSelectInventory();
});

$(document).ready(function(){
    console.log('Starting...');
    LoadInventory();
    InitializeSelectInventory();
})
