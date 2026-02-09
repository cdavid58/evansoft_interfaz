// async function Gemini(message) {
//     const API_KEY = "AIzaSyDhiB5wCogp7zp4xdtjF7NSyaTm3KzqBlU";

//     // Guardar el mensaje del usuario en la memoria
//     geminiMemory.push({
//         role: "user",
//         parts: [{ text: message }]
//     });

//     console.log("📚 Memoria actual:", geminiMemory);

//     try {
//         const response = await fetch(
//             `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
//             {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/json"
//                 },
//                 body: JSON.stringify({
//                     contents: geminiMemory
//                 })
//             }
//         );

//         const data = await response.json();
//         let botResponse = "Lo siento, no entendí eso.";

//         if (data?.candidates?.length > 0) {
//             const firstCandidate = data.candidates[0];
//             const parts = firstCandidate?.content?.parts;

//             if (parts && parts.length > 0) {
//                 botResponse = parts[0].text || botResponse;

//                 // Guardar la respuesta del modelo en la memoria
//                 geminiMemory.push({
//                     role: "model",
//                     parts: [{ text: botResponse }]
//                 });
//             }
//         } else if (data.error) {
//             botResponse = `Error: ${data.error.message}`;
//             console.warn("⚠️ Error en la API Gemini:", data.error);
//         } else {
//             console.warn("⚠️ Respuesta inesperada de Gemini:", data);
//         }

//         return botResponse;

//     } catch (error) {
//         console.error("❌ Error de conexión con Gemini:", error);
//         return "Ocurrió un error al intentar responder.";
//     }
// }



async function Gemini(message, fileBase64 = null) {
    const API_KEY = "AIzaSyDhiB5wCogp7zp4xdtjF7NSyaTm3KzqBlU";

    // Añade el mensaje de usuario a la memoria
    geminiMemory.push({
        role: "user",
        parts: [{ text: message }]
    });

    // Si hay un archivo adjunto
    if (fileBase64 && typeof fileBase64 === 'object' && fileBase64.data && fileBase64.mimeType) {
        console.log("📎 Archivo detectado para enviar:");
        console.log("Tipo MIME:", fileBase64.mimeType);
        console.log("Base64:", fileBase64.data.slice(0, 100) + "...");

        geminiMemory.push({
            role: "user",
            parts: [{
                inlineData: {
                    mimeType: fileBase64.mimeType,
                    data: fileBase64.data
                }
            }]
        });
    }

    console.log("📚 Memoria actual:", geminiMemory);

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    contents: geminiMemory
                })
            }
        );

        const data = await response.json();
        let botResponse = "Lo siento, no entendí eso.";

        if (data?.candidates?.length > 0) {
            const firstCandidate = data.candidates[0];
            const parts = firstCandidate?.content?.parts;

            if (parts && parts.length > 0) {
                botResponse = parts[0].text || botResponse;

                geminiMemory.push({
                    role: "model",
                    parts: [{ text: botResponse }]
                });
            }
        } else if (data.error) {
            botResponse = `Error: ${data.error.message}`;
            console.warn("⚠️ Error en la API Gemini:", data.error);
        } else {
            console.warn("⚠️ Respuesta inesperada de Gemini:", data);
        }

        return botResponse;

    } catch (error) {
        console.error("❌ Error de conexión con Gemini:", error);
        return "Ocurrió un error al intentar responder.";
    }
}





// function parseGeminiPostmanResponse(text) {
//   let jsonStr;

//   // Extraer JSON principal
//   const blockMatch = text.match(/```json([\s\S]*?)```/);
//   if (blockMatch) {
//     jsonStr = blockMatch[1].trim();
//   } else {
//     const firstBrace = text.indexOf('{');
//     const lastBrace = text.lastIndexOf('}');
//     if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
//       jsonStr = text.slice(firstBrace, lastBrace + 1).trim();
//     } else {
//       // No encontró JSON válido, pero no es un error, solo retornar null
//       return null;
//     }
//   }

//   // Si llegó aquí, hay algo parecido a JSON, intentar limpiar y parsear
//   try {
//     // Manejo especial para campos "raw" con saltos de línea y comillas
//     const rawMatch = jsonStr.match(/"raw"\s*:\s*"([\s\S]*?)"\s*(,|\})/m);
//     if (rawMatch) {
//       let rawContent = rawMatch[1];
//       const rawEscaped = rawContent
//         .replace(/\r?\n/g, "\\n")
//         .replace(/"/g, '\\"');
//       jsonStr = jsonStr.replace(rawContent, rawEscaped);
//     }
    
//     const postmanObj = JSON.parse(jsonStr);

//     // Parsear body.raw si existe
//     if (postmanObj?.item?.[0]?.request?.body?.raw) {
//       try {
//         postmanObj.item[0].request.body.parsed = JSON.parse(postmanObj.item[0].request.body.raw);
//       } catch {
//         postmanObj.item[0].request.body.parsed = null;
//       }
//     }

//     return postmanObj;

//   } catch (e) {
//     // No pudo parsear: no es error fatal, solo devolver null para que el flujo siga
//     return null;
//   }
// }






// async function ejecutarPostmanGemini(postmanJson) {
//   try {
//     // Validar que es una colección Postman básica
//     if (
//       !postmanJson ||
//       typeof postmanJson !== "object" ||
//       !Array.isArray(postmanJson.item) ||
//       postmanJson.item.length === 0
//     ) {
//       throw new Error("El JSON recibido no tiene la estructura esperada de una colección Postman.");
//     }

//     // Por ahora, usar la primera petición (item[0])
//     const request = postmanJson.item[0].request;
//     if (!request) {
//       throw new Error("No se encontró la propiedad request en el primer item.");
//     }

//     const { method, url, header, body } = request;

//     const headers = { "Content-Type": "application/json" };

//     if (header && Array.isArray(header)) {
//       header.forEach(h => {
//         if (h.key && h.value) headers[h.key] = h.value;
//       });
//     }

//     // body.raw puede ser string con JSON, así que parsear para luego stringify es correcto
//     const fetchBody = body?.raw ? JSON.stringify(JSON.parse(body.raw)) : undefined;

//     const response = await fetch(url.raw || url, {
//       method,
//       headers,
//       body: fetchBody,
//     });

//     if (!response.ok) {
//       throw new Error(`HTTP ${response.status} - ${response.statusText}`);
//     }

//     const result = await response.json();
//     console.log("✅ Respuesta del servidor:", result);
//     return result;

//   } catch (error) {
//     console.error("❌ Error en fetch Gemini postman:", error);
//     return null;
//   }
// }




// async function Gemini(message, fileBase64 = null) {
//   const API_KEY = "AIzaSyDhiB5wCogp7zp4xdtjF7NSyaTm3KzqBlU";

//   // Añade el mensaje de usuario a la memoria
//   geminiMemory.push({
//     role: "user",
//     parts: [{ text: message }]
//   });

//   // Si hay un archivo adjunto
//   if (fileBase64 && typeof fileBase64 === 'object' && fileBase64.data && fileBase64.mimeType) {
//     console.log("📎 Archivo detectado para enviar:");
//     console.log("Tipo MIME:", fileBase64.mimeType);
//     console.log("Base64:", fileBase64.data.slice(0, 100) + "...");

//     geminiMemory.push({
//       role: "user",
//       parts: [{
//         inlineData: {
//           mimeType: fileBase64.mimeType,
//           data: fileBase64.data
//         }
//       }]
//     });
//   }

//   console.log("📚 Memoria actual:", geminiMemory);

//   try {
//     const response = await fetch(
//       `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
//       {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json"
//         },
//         body: JSON.stringify({
//           contents: geminiMemory
//         })
//       }
//     );

//     const data = await response.json();
//     let botResponse = "Lo siento, no entendí eso.";

//     if (data?.candidates?.length > 0) {
//       const firstCandidate = data.candidates[0];
//       const parts = firstCandidate?.content?.parts;

//       if (parts && parts.length > 0) {
//         botResponse = parts[0].text || botResponse;

//         geminiMemory.push({
//           role: "model",
//           parts: [{ text: botResponse }]
//         });
//       }
//     } else if (data.error) {
//       botResponse = `Error: ${data.error.message}`;
//       console.warn("⚠️ Error en la API Gemini:", data.error);
//     } else {
//       console.warn("⚠️ Respuesta inesperada de Gemini:", data);
//     }

//     console.log(botResponse,'botResponse')

//     // Aquí tratamos de extraer JSON Postman y ejecutar la petición
//     const postmanObj = parseGeminiPostmanResponse(botResponse);
//     console.log(postmanObj,'postmanObj')
//     if (postmanObj) {
//       const resultado = await ejecutarPostmanGemini(postmanObj);
//       return { botResponse, resultado };
//     }

//     return { botResponse };

//   } catch (error) {
//     console.error("❌ Error de conexión con Gemini:", error);
//     return { botResponse: "Ocurrió un error al intentar responder." };
//   }
// }






































