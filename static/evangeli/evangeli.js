$(document).ready(function() {
    let isAudioEnabled = false;

    function toggleAudio(button) {
        isAudioEnabled = !isAudioEnabled;

        if (isAudioEnabled) {
            $(button).addClass("btn-success").removeClass("btn-secondary");
            console.log("🎤 Audio habilitado");
        } else {
            $(button).removeClass("btn-success").addClass("btn-secondary");
            console.log("🎤 Audio deshabilitado");
        }

        $('#chatbot-input').focus();
    }

    $(document).on("click", "#audio-button, #audio-button-m", function() {
        toggleAudio(this);
    });

    $(".call_chat").click(function() {
        calling = true;
        console.log("Start Call Chat", calling);
    });

    $('#chatbot').on('click', '#chatbot-submit, #chatbot-submit-m', async function(e) {
        e.preventDefault();
        let message = $('#chatbot-input').val().toLowerCase();
        sendMessage();
        await bot(message);
        $('#chatbot-input').focus();
    });

    $(".upload_document").click(function() {
        $("#document").click();
    });

    $("#document").change(function () {
        const file = this.files[0];
        const preview = $("#pdf-preview");
        const name = $("#pdf-name");
        const icon = $("#doc-icon");

        if (file) {
            const type = file.type;

            let iconClass = "fa-file-alt"; 
            if (type === "application/pdf") iconClass = "fa-file-pdf";
            else if (type === "text/plain") iconClass = "fa-file-lines";
            else if (type === "text/csv") iconClass = "fa-file-csv";
            else if (type === "text/html") iconClass = "fa-code";
            else if (type === "text/css") iconClass = "fa-brush";
            else if (type === "text/xml" || type === "application/xml") iconClass = "fa-code";
            else if (type === "text/md" || file.name.endsWith(".md")) iconClass = "fa-markdown";
            else if (type.includes("javascript")) iconClass = "fa-js";

            icon.removeClass().addClass(`fas ${iconClass}`);
            name.text(file.name);
            preview.show();
        } else {
            preview.hide();
            name.text("");
        }
    });

    function checkFile() {
        const input = $("#document")[0];
        return input && input.files.length > 0;
    }

    async function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    function sendDocumentMessage(filename) {
        const messageHTML = `<p class="from-bot"><span class="user">${evangeli}: </span>📄 Documento recibido: <strong>${filename}</strong></p>`;
        $('#chatbot-message').append(messageHTML);
        scrollToMessage();
    }

    function clearPdfPreview() {
        $("#pdf-preview").hide();
        $("#pdf-name").text("");
    }

    function limpiarTextoProducto(mensaje) {
        return mensaje.toLowerCase()
            .replace(/- código:.*$/i, "") // elimina desde "- Código:" hasta el final
            .trim();
    }


    function extraerPalabraClave(texto) {
        const palabras = texto.toLowerCase().replace(/[?¿!.,]/g, "").split(" ").filter(p => p.length > 2);
        return palabras.length ? palabras[palabras.length - 1] : "";
    }

    async function esNombreDeProductoExacto(mensaje) {
        const inventario = await GetInventoryLocal();
        const limpio = limpiarTextoProducto(mensaje);
        return inventario.some(p =>
            p.name.toLowerCase() === limpio
        );
    }

    async function mostrarProductoExacto(nombreProducto) {
        const inventario = await GetInventoryLocal();
        const limpio = limpiarTextoProducto(nombreProducto);

        const producto = inventario.find(p =>
            p.name.toLowerCase() === limpio
        );

        if (producto) {
            const respuesta = `
            📦 <strong>Producto encontrado</strong><br>
            <strong>Nombre:</strong> ${producto.name}<br>
            <strong>Código:</strong> ${producto.code}<br>
            <strong>Cantidad por caja:</strong> ${producto.bale || 0}<br>
            <strong>Cantidad por Display:</strong> ${producto.display || 0}<br>
            <strong>Cantidad por Unidad:</strong> ${producto.unit || 0}<br>
            <strong>Precio 1:</strong> $${producto.price_1}<br>
            <strong>Precio 2:</strong> $${producto.price_2}<br>
            <strong>Precio 3:</strong> $${producto.price_3}<br>
            <strong>Precio 4:</strong> $${producto.price_4}<br>
            <strong>Precio 5:</strong> $${producto.price_5}<br>
            <strong>Precio 6:</strong> $${producto.price_6}
            `;
            sendMessage([respuesta]);
            if (isAudioEnabled) speak(respuesta);
            return true;
        }

        return false;
    }

    async function searchProductInLocalInventory(query) {
        const inventory = await GetInventoryLocal();
        const nombre = query.toLowerCase().trim();
        if (!nombre) return [];

        return inventory.filter(item =>
            item.name?.toLowerCase().includes(nombre)
        );
    }


    async function encontrarProductoPorFrase(message) {
        const inventario = await GetInventoryLocal();
        const mensaje = message.toLowerCase();
        return inventario.find(p => mensaje.includes(p.name.toLowerCase()));
    }



    async function bot(message) {
      const mensajeLimpio = message.trim().toLowerCase();
      const mensajesIgnorados = ["hola", "buenos días", "buenas tardes", "buenas noches", "hey", "saludos"];
      const terminosInvalidos = ["en internet", "la hora", "hora actual", "clima", "traducir", "traduce", "quién eres", "qué puedes hacer"];

      // 2. Facturación
      if (mensajeLimpio.includes("factura")) {
        await Facturar(message);
        return;
      }

      // 3. Cliente (NIT o cédula)
      if ((mensajeLimpio.includes("nit") || mensajeLimpio.includes("cedula")) && mensajeLimpio.includes("actualiza")) {
        let respuesta = await GetCustomer(message);
        respuesta = await Gemini(respuesta);
        sendMessage([respuesta]);
        if (isAudioEnabled) speak(respuesta);
        return;
      }

      // 4. Reporte inventario
      if ((mensajeLimpio.includes("reporte") || mensajeLimpio.includes("informe")) && mensajeLimpio.includes("movimiento de inventario")) {
        await Movement_History_Inventory(message);
        return;
      }

      if (mensajeLimpio.includes("cuántos productos") || mensajeLimpio.includes("cuantos productos")) {
        const inventario = await GetInventoryLocal();
        const total = inventario.length;
        const respuesta = `📦 Actualmente tienes <strong>${total}</strong> producto(s) registrados en tu inventario local.`;
        sendMessage([respuesta]);
        if (isAudioEnabled) speak(respuesta);
        return;
      }

      // 5. Búsqueda de productos
      if (mensajeLimpio.startsWith("busca") || mensajeLimpio.startsWith("buscando")) {
        const nombreProducto = mensajeLimpio
          .replace(/^buscando\s*/i, '')
          .replace(/^busca\s*/i, '')
          .replace(/\bproducto\b/g, '')
          .trim();

        const contienePalabraProhibida = terminosInvalidos.some(p => mensajeLimpio.includes(p));
        if (contienePalabraProhibida) {
          const respuesta = `🙃 Parece que estás buscando algo fuera del inventario. Solo puedo ayudarte a buscar productos que tengas registrados.`;
          sendMessage([respuesta]);
          if (isAudioEnabled) speak(respuesta);
          return;
        }

        if (nombreProducto.length === 0) {
          const respuesta = "🤔 ¿Qué producto quieres que busque? Escríbelo después de 'busca' o 'buscando'.";
          sendMessage([respuesta]);
          if (isAudioEnabled) speak(respuesta);
          return;
        }

        let coincidencias = await searchProductInLocalInventory(nombreProducto);

        if (coincidencias.length === 0) {
          const todos = await searchProductInLocalInventory("");
          coincidencias = todos.filter(p =>
            (p.name || "").toLowerCase().includes(nombreProducto.toLowerCase())
          );
        }

        if (coincidencias.length === 1) {
          await mostrarProductoExacto(coincidencias[0].name);
          return;
        }

        if (coincidencias.length > 1) {
          let sugerencia = `He encontrado ${coincidencias.length} producto(s) parecidos a "<strong>${nombreProducto}</strong>":<br><ul>`;
          coincidencias.forEach(prod => {
            sugerencia += `<li>${prod.name} - Código: ${prod.code}</li>`;
          });
          sugerencia += "</ul>";
          sendMessage([sugerencia]);
          if (isAudioEnabled) speak(sugerencia);
          return;
        }

        const noEncontrado = `No encontré productos que coincidan con "<strong>${nombreProducto}</strong>". ¿Quieres intentar con otro nombre? 😉`;
        sendMessage([noEncontrado]);
        if (isAudioEnabled) speak(noEncontrado);
        return;
      }

      // 6. Si hay archivo cargado
      if (checkFile()) {
        const file = $("#document")[0].files[0];
        const base64Data = await fileToBase64(file);
        sendMessage([`📄 Documento recibido: <strong>${file.name}</strong>`]);
        const respuesta = await Gemini(`Analiza el documento cargado y responde: ${message}`, {
          mimeType: file.type,
          data: base64Data
        });
        sendMessage([respuesta]);
        if (isAudioEnabled) speak(respuesta);
        $("#document")[0].value = "";
        clearPdfPreview();
        return;
      }

      // 7. Fallback a Gemini
      console.log("Buscando en internet")
      const respuesta = await Gemini(message);
      sendMessage([respuesta]);
      if (isAudioEnabled) speak(respuesta);
    }


    function speak(text) {
        const cleanText = text.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|[\uD83C-\uDBFF\uDC00-\uDFFF]|[\uFE00-\uFE0F])/g, '').replace(/\*/g, '');
        const speech = new SpeechSynthesisUtterance(cleanText);
        speech.rate = 1.0;
        speech.pitch = 1.2;
        speech.volume = 0.9;
        const voices = window.speechSynthesis.getVoices();
        const voice = voices.find(v => v.lang === 'es-MX' && /google|sabina|female|mujer/i.test(v.name));
        if (voice) speech.voice = voice;
        window.speechSynthesis.speak(speech);
    }

    function sendMessage(message) {
        if (message) {
            $('#chatbot-input, #chatbot-submit').addClass('disabled').attr('disabled', 'disabled');

            const rawMessage = message[Math.floor(Math.random() * message.length)];
            const respond = formatMessage(rawMessage);

            // Mostrar "Evangeli está escribiendo..."
            setTimeout(() => {
                $('#chatbot-message').append(`
                    <p class="from-bot typing">
                        <span class="user">${evangeli}: </span>
                        <span class="message">${evangeli} está escribiendo... <i class="glyphicon glyphicon-pencil"></i></span>
                    </p>`);
                scrollToMessage();
            }, 300);

            // Reemplazar con la respuesta real
            setTimeout(() => {
                $('#chatbot-message .from-bot.typing').replaceWith(
                    $('<p class="from-bot">').html(`<span class="user">${evangeli}: </span>${respond}`)
                );
                scrollToMessage();
                $('#chatbot-input, #chatbot-submit').removeClass('disabled').removeAttr('disabled');
                $('#chatbot-input').focus();
            }, 1200);
        } else {
            const userVal = $('#chatbot-input').val();
            $('#chatbot-message').append(`<p class="from-user"><span class="user">Tú: </span>${userVal}</p>`);
            scrollToMessage();
            $('#chatbot-input').val('');
        }
    }

    // Esta función detecta si la respuesta contiene código o enlaces y lo estructura con HTML
    function formatMessage(response) {
        if (!response) return "";

        const hasCode = response.includes("```");

        // ✅ Convertir enlaces Markdown [texto](url) a <a>
        const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
        let formatted = response.replace(markdownLinkRegex, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

        // ✅ También convertir URLs planas en enlaces (si no están en Markdown)
        const plainUrlRegex = /(?<!["'>])\bhttps?:\/\/[^\s<]+/g;
        formatted = formatted.replace(plainUrlRegex, url =>
            `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
        );

        // ✅ Reemplazo de saltos de línea
        formatted = formatted.replace(/\n/g, '<br>');

        // ✅ Si contiene bloques de código (ejemplo simple), encierra en <pre><code>
        const lines = formatted.split('<br>');
        const codeLines = lines.filter(line =>
            line.includes('def ') || line.includes('return ') || line.includes('print(') ||
            line.includes('function ') || line.includes('const ') || line.includes('let ')
        );

        if (codeLines.length >= 2) {
            return `<pre><code class="language-javascript">${formatted}</code></pre>`;
        }

        return formatted;
    }




    function scrollToMessage() {
        const msgBox = $('#chatbot-message');
        msgBox.scrollTop(msgBox[0].scrollHeight);
    }
});