//tables.js

function createTables(db) {
    // Tabla invoices (facturas offline)
    if (!db.objectStoreNames.contains("invoices")) {
        let store = db.createObjectStore("invoices", { keyPath: "id", autoIncrement: true });
        store.createIndex("date", "date", { unique: false });
        store.createIndex("customer_id", "customer_id", { unique: false });
        store.createIndex("prefix_number", ["prefix", "number"], { unique: false });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("total", "total", { unique: false });
    }

    // Tabla detalles de invoices (relacionada por invoice_id)
    if (!db.objectStoreNames.contains("InvoiceDetails")) {
        let store = db.createObjectStore("InvoiceDetails", { keyPath: "id", autoIncrement: true });
        store.createIndex("invoice_id", "invoice_id", { unique: false });
        store.createIndex("code", "code", { unique: false });
        store.createIndex("name", "name", { unique: false });
        store.createIndex("quantity", "quantity", { unique: false });
        store.createIndex("price", "price", { unique: false });
        store.createIndex("type_price", "type_price", { unique: false });
        store.createIndex("tax", "tax", { unique: false });
        store.createIndex("discount", "discount", { unique: false });
        store.createIndex("ico", "ico", { unique: false });
    }

    // Tabla payments de invoices (relacionada por invoice_id)
    if (!db.objectStoreNames.contains("InvoicePayments")) {
        let store = db.createObjectStore("InvoicePayments", { keyPath: "id", autoIncrement: true });
        store.createIndex("invoice_id", "invoice_id", { unique: false });
        store.createIndex("payment_form_id", "payment_form_id", { unique: false });
        store.createIndex("payment_method_id", "payment_method_id", { unique: false });
        store.createIndex("payment_due_date", "payment_due_date", { unique: false });
        store.createIndex("duration_measure", "duration_measure", { unique: false });
    }

    // Tabla reserved
    if (!db.objectStoreNames.contains("reserved")) {
        let store = db.createObjectStore("reserved", { keyPath: "id", autoIncrement: true });
        store.createIndex("product_id", "product_id", { unique: false });
        store.createIndex("quantity", "quantity", { unique: false });
        store.createIndex("type_unit", "type_unit", { unique: false });
    }

    // Tabla Cotizaciones (factura offline)
    if (!db.objectStoreNames.contains("quotations")) {
        let store = db.createObjectStore("quotations", { keyPath: "id", autoIncrement: true });
        store.createIndex("date", "date", { unique: false });
        store.createIndex("customer_id", "customer_id", { unique: false });
        store.createIndex("prefix_number", ["prefix", "number"], { unique: false });
    }

    // Tabla detalles de Cotizaciones (relacionada por cotizacion_id)
    if (!db.objectStoreNames.contains("Details")) {
        let store = db.createObjectStore("Details", { keyPath: "id", autoIncrement: true });
        store.createIndex("cotizacion_id", "cotizacion_id", { unique: false });
        store.createIndex("code", "code", { unique: false });
        store.createIndex("name", "name", { unique: false });
        store.createIndex("quantity", "quantity", { unique: false });
        store.createIndex("price", "price", { unique: false });
    }

    // Tabla payments de Cotizaciones (relacionada por cotizacion_id)
    if (!db.objectStoreNames.contains("Payments")) {
        let store = db.createObjectStore("Payments", { keyPath: "id", autoIncrement: true });
        store.createIndex("cotizacion_id", "cotizacion_id", { unique: false });
        store.createIndex("payment_form_id", "payment_form_id", { unique: false });
        store.createIndex("payment_method_id", "payment_method_id", { unique: false });
        store.createIndex("payment_due_date", "payment_due_date", { unique: false });
    }

    // 📦 Tabla inventory (productos en inventario)
    if (!db.objectStoreNames.contains("inventory")) {
        let store = db.createObjectStore("inventory", { keyPath: "id" });
        store.createIndex("code", "code", { unique: true });
        store.createIndex("name", "name", { unique: false });
        store.createIndex("bale_static", "bale_static", { unique: false });
        store.createIndex("bale", "bale", { unique: false });
        store.createIndex("display_static", "display_static", { unique: false });
        store.createIndex("display", "display", { unique: false });
        store.createIndex("unit_static", "unit_static", { unique: false });
        store.createIndex("unit", "unit", { unique: false });
        store.createIndex("tax", "tax", { unique: false });
        store.createIndex("cost", "cost", { unique: false });
        store.createIndex("price_1", "price_1", { unique: false });
        store.createIndex("price_2", "price_2", { unique: false });
        store.createIndex("price_3", "price_3", { unique: false });
        store.createIndex("price_4", "price_4", { unique: false });
        store.createIndex("price_5", "price_5", { unique: false });
        store.createIndex("price_6", "price_6", { unique: false });
        store.createIndex("discount", "discount", { unique: false });
        store.createIndex("ico", "ico", { unique: false });
        store.createIndex("active", "active", { unique: false });
        store.createIndex("brand", "brand", { unique: false });
        store.createIndex("category_id", "category_id", { unique: false });
        store.createIndex("branch_id", "branch_id", { unique: false });
        store.createIndex("unit_measures_id", "unit_measures_id", { unique: false });
        store.createIndex("employee_id", "employee_id", { unique: false });
    }

}
