
        
    // else if (message.includes("reporte") && message.includes("movimiento de inventario")) {
    //     let respuesta = await Gemini(message + ' Dile al usuario que se espere mientras tu obtienes la información');
    //     sendMessage([respuesta]);

    //     // Cambié la llamada AJAX para usar una Promise con async/await
    //     try {
    //         const response = await generarReporteDeMovimientos();
    //         let respuesta = await Gemini("Ahora dile que ya tienes la informacion y que se la vas a descargar");
    //         sendMessage([respuesta]);
    //         setTimeout(function() {
    //             const link = document.createElement("a");
    //             link.href = response.path_report;
    //             link.download = "movimientos_inventario.xlsx";
    //             document.body.appendChild(link);
    //             link.click();
    //             document.body.removeChild(link);
    //         }, 5000);

    //     } catch (error) {
    //         console.error("Error al generar el reporte:", error);
    //         sendMessage(["Ocurrió un error al obtener el reporte."]);
    //     }
    // } else {
    //     let respuesta = await Gemini(message);
    //     sendMessage([respuesta]);

    //     // Si el audio está habilitado, leer la respuesta
    //     if (isAudioEnabled) {
    //         speak(respuesta);
    //     }
    // }
