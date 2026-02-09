async function saveToMemoryPersistent(data) {
    const request = indexedDB.open("evangeliMemoryDB", 1);

    request.onsuccess = function (event) {
        const db = event.target.result;
        const tx = db.transaction("memory", "readwrite");
        const store = tx.objectStore("memory");
        store.add({ timestamp: Date.now(), ...data });
    };
}

async function getStoredMemory() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("evangeliMemoryDB", 1);

        request.onupgradeneeded = function (event) {
            const db = event.target.result;
            if (!db.objectStoreNames.contains("memory")) {
                db.createObjectStore("memory", { keyPath: "id", autoIncrement: true });
            }
        };

        request.onsuccess = async function (event) {
            const db = event.target.result;
            const tx = db.transaction("memory", "readwrite");
            const store = tx.objectStore("memory");
            const getAll = store.getAll();

            getAll.onsuccess = async () => {
                const existing = getAll.result || [];

                if (existing.length === 0) {
                    baseMemory.forEach(entry => {
                        const textParts = entry.parts
                            .filter(p => typeof p.text === "string")
                            .map(p => p.text)
                            .join("\n");

                        store.add({
                            timestamp: Date.now(),
                            role: entry.role,
                            message: textParts
                        });
                    });

                    resolve(baseMemory);
                } else {
                    resolve(
                        existing
                            .filter(item => item.message && typeof item.message === "string")
                            .map(item => ({
                                role: item.role,
                                parts: [{ text: item.message }]
                            }))
                    );
                }
            };

            getAll.onerror = () => reject("❌ Error al leer la memoria persistente.");
        };

        request.onerror = function () {
            reject("❌ No se pudo abrir la base de datos.");
        };
    });
}

async function obtenerFechaHoraBogota() {
    const ahora = new Date();
    const fecha = ahora.toISOString().split("T")[0];
    const hora = ahora.toTimeString().slice(0, 5);
    return `${fecha}T${hora}`;
}

async function Gemini(message, fileBase64 = null) {
    const API_KEY = "AIzaSyDhiB5wCogp7zp4xdtjF7NSyaTm3KzqBlU";
    const headers = { "Content-Type": "application/json" };

    let memoryHistory = await getStoredMemory();

    // 📥 Preparar el contenido para enviar a la API
    let contents = Array.isArray(memoryHistory) ? [...memoryHistory] : [];

    // ✅ Agregar mensaje actual del usuario
    contents.push({
        role: "user",
        parts: [{ text: message }]
    });

    // 📎 Adjuntar archivo si viene
    if (fileBase64 && typeof fileBase64 === 'object' && fileBase64.data && fileBase64.mimeType) {
        contents.push({
            role: "user",
            parts: [{
                inlineData: {
                    mimeType: fileBase64.mimeType,
                    data: fileBase64.data
                }
            }]
        });
    }

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
            {
                method: "POST",
                headers,
                body: JSON.stringify({ contents })
            }
        );

        const data = await response.json();
        let botResponse = "Lo siento, no entendí eso.";

        if (data?.candidates?.length > 0) {
            const parts = data.candidates[0]?.content?.parts;

            if (parts && parts.length > 0 && parts[0].text) {
                botResponse = parts[0].text;

                // 💾 Guardar mensaje y respuesta
                await saveToMemoryPersistent({ role: "user", message });
                await saveToMemoryPersistent({ role: "model", message: botResponse });
            }
        } else if (data.error) {
            console.warn("⚠️ Error en la API Gemini:", data.error);
            botResponse = `Error: ${data.error.message}`;
        }

        return botResponse;
    } catch (error) {
        console.error("❌ Error de conexión con Gemini:", error);
        return "Ocurrió un error al intentar responder.";
    }
}
