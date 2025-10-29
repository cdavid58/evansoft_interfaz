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

        request.onsuccess = function (event) {
            const db = event.target.result;
            const tx = db.transaction("memory", "readwrite");
            const store = tx.objectStore("memory");
            const getAll = store.getAll();

            getAll.onsuccess = function () {
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

async function obtenerFechaHoraLocal() {
    try {
        const pos = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
        });

        const { latitude, longitude } = pos.coords;
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const ahora = new Date();

        const fecha = ahora.toLocaleDateString("es", {
            timeZone,
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });

        const hora = ahora.toLocaleTimeString("es", {
            timeZone,
            hour: "2-digit",
            minute: "2-digit"
        });

        return `📍 Estás en lat: ${latitude.toFixed(2)}, long: ${longitude.toFixed(2)}. Hoy es ${fecha} y son las ${hora} en tu zona horaria (${timeZone}).`;
    } catch (err) {
        // Si no hay permisos de ubicación, usa hora local del dispositivo
        const ahora = new Date();
        const fecha = ahora.toLocaleDateString("es", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });
        const hora = ahora.toLocaleTimeString("es", {
            hour: "2-digit",
            minute: "2-digit"
        });
        return `⛔ No se pudo obtener la ubicación. Hoy es ${fecha} y son las ${hora} según la hora local de tu dispositivo.`;
    }
}

async function Gemini(message, fileBase64 = null) {
    const API_KEY = "AIzaSyAIUup6uw1m6vzAZMm5x5iR8YjGhu3UC6E";
    const headers = { "Content-Type": "application/json" };

    const memoryHistory = await getStoredMemory();
    const horaActual = await obtenerFechaHoraLocal();

    let contents = [
        {
            role: "user",
            parts: [{ text: `Ten en cuenta que ${horaActual}. Usa siempre información actualizada basada en esta hora.` }]
        },
        ...memoryHistory,
        {
            role: "user",
            parts: [{ text: message }]
        }
    ];

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

                await saveToMemoryPersistent({ role: "user", message });
                await saveToMemoryPersistent({ role: "model", message: botResponse });
            }
        } else if (data?.error) {
             console.warn("⚠️ Error en la API Gemini:", data.error);

            botResponse = `🚫 Ha ocurrido un error procesando tu solicitud. 
                Es posible que se haya perdido la conexión con el servidor o que la respuesta esté incompleta. 
                La página se recargará automáticamente para intentar solucionarlo.`;

            // Esperar 3 segundos antes de recargar
            setTimeout(() => {
                location.reload();
            }, 3000);
        }

        return botResponse;
    } catch (error) {
        console.error("❌ Error de conexión con Gemini:", error);
        return "Ocurrió un error al intentar responder.";
    }
}
