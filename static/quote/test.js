var software_online = false;

async function checkInternet() {
    try {
        // Primero lo que dice el navegador
        if (!navigator.onLine) {
            throw new Error("offline");
        }

        // Luego un ping real
        let response = await fetch("https://play-lh.googleusercontent.com/NN8G4Xc03GSv2_Tu-icuoeOwSo1xoZ4ouzUl24fVlwm5OeIAo7gV0zS1dVRWgCay-BU", {method: "GET", cache: "no-store"});
        if (response.ok) {
            if (!software_online) {
                software_online = true;
                disableRefresh = false;
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: "Conexión restaurada",
                    text: "Ya tienes acceso a internet.",
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true
                });
            }
        } else {
            // throw new Error("sin respuesta");
        }
    } catch (e) {
        if (software_online) {
            software_online = false;
            disableRefresh = true;
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'warning',
                title: "Sin conexión",
                text: "Las facturas se guardarán y se enviarán automáticamente cuando vuelva la conexión a internet.",
                showConfirmButton: false,
                timer: 6000,
                timerProgressBar: true
            });
        }
    }
}

$(document).ready(function() {

	function getCookie(name) {
	    let cookieValue = null;
	    if (document.cookie && document.cookie !== '') {
	        const cookies = document.cookie.split(';');
	        for (let i = 0; i < cookies.length; i++) {
	            const cookie = cookies[i].trim();
	            // ¿Esta cookie empieza con el nombre que buscamos?
	            if (cookie.substring(0, name.length + 1) === (name + '=')) {
	                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
	                break;
	            }
	        }
	    }
	    return cookieValue;
	}
	
	quote.details = []
	let modal = true
	let total_other_charges = 0
    let discount_global = 0
	_date = new Date().toISOString().split('T')[0]
	quote.date = _date
	quote.customer_id = customer_id
	quote.name_customer = "CONSUMIDOR FINAL"
	quote.type_document = type_document
	quote.employee_id = employee_id
	quote.branch_id = branch_id
	quote.total = 0
	quote.payment_form = {
        payment_form_id: 1,
        payment_method_id: 10,
        payment_due_date: _date,
        duration_measure: 0
    }
    quote.status = "Paid"
    quote.anulled = false
    quote.credit_note_applied = false


    checkInternet();

    // Revisa cada 5 segundos
    setInterval(checkInternet, 1000);

    // Eventos nativos como refuerzo
    $(window).on("online offline", checkInternet);

    $(".stock").val(0)

	$("#fecha").val(_date)

	function formatearMiles(valor) {
        // Elimina todo excepto números
        valor = valor.replace(/\D/g, '');
        // Agrega puntos como separadores de miles
        return valor.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    $(document).on("input", ".monto", function () {
        const input = $(this);
        const caretPos = this.selectionStart;

        // Limpia el valor
        let limpio = input.val().replace(/\./g, '');
        if (!limpio) return;

        // Formatea
        let formateado = formatearMiles(limpio);

        // Establece el valor formateado
        input.val(formateado);

        // Ajusta el cursor al final
        this.setSelectionRange(formateado.length, formateado.length);
    });

    $(document).on("input", ".montos", function () {
        const input = $(this);
        const caretPos = this.selectionStart;

        // Limpia el valor
        let limpio = input.val().replace(/\./g, '');
        if (!limpio) return;

        // Formatea
        let formateado = formatearMiles(limpio);

        // Establece el valor formateado
        input.val(formateado);

        // Ajusta el cursor al final
        this.setSelectionRange(formateado.length, formateado.length);
    });

	$(document).on('click','.other_charges',function(){
		$("#modalOtherCharges").modal('show')
	})

	function Set_Other_Charges(){
		let charge_indicator = $("#charge_indicator").val();
		let allowance_charge_reason = $("#allowance_charge_reason").val();
		let amount_charges = $("#amount_charges").val();
		if(charge_indicator){
			total_other_charges += limpiarNumero(amount_charges)
		}else{
			discount_global += limpiarNumero(amount_charges)
		}
		amount_charges = limpiarNumero(amount_charges)
		if (!charge_indicator || !amount_charges || !allowance_charge_reason) {
			Swal.fire({
				toast: true,
				position: 'top-end',
				icon: 'warning',
				title: "Por favor completa todos los campos del cargo",
				showConfirmButton: false,
				timer: 2000,
				timerProgressBar: true,
			});
			return;
		}

		if (!quote['other_charges']) {
			quote['other_charges'] = [];
		}
		quote['other_charges'].push({
			"charge_indicator": charge_indicator,
			"note": allowance_charge_reason,
			"amount": amount_charges
		});
		console.log(quote)
		Swal.fire({
			toast: true,
			position: 'top-end',
			icon: 'success',
			title: "El cargo fue agregado correctamente",
			showConfirmButton: false,
			timer: 2000,
			timerProgressBar: true,
		});
		localStorage.setItem("quote", JSON.stringify(quote))
		$('#charge_indicator').val('');
		$("#allowance_charge_reason").val('')
		$("#amount_charges").val('')
		Calculate_Total_quote()
	}


	$(document).on('click', '#set_other_charges', function() {
		Set_Other_Charges()
	});

	$('#amount_charges').on("keydown", function(event) {
		if (event.key === "Escape" || event.key === "Esc") {
	        console.log("Se presionó Escape");
	        $('#charge_indicator').val('');
			$("#allowance_charge_reason").val('')
			$("#amount_charges").val('')
	        $("#modalOtherCharges").modal("hide");
	    }
	    if (event.key === 'Enter') {
			Set_Other_Charges()
		}
	});

	function getDaysBetweenDates(fecha1, fecha2) {
	    const start = new Date(fecha1);
	    const end = new Date(fecha2);
	    const diff = end - start;
	    return Math.ceil(diff / (1000 * 60 * 60 * 24));
	}

	function updatePaymentForm() {
	    var value = parseInt($("#paymentmethod").val(), 10);
	    var fechaSeleccionada = $("#fecha").val();
	    console.log(fechaSeleccionada)
        quote.date = fechaSeleccionada

	    if ([30, 45, 48].includes(value)) {
	        const dias = getDaysBetweenDates(_date, fechaSeleccionada);

	        if (dias <= 0) {
	            // alert("Cuando se refiere a crédito debe elegir una fecha superior a la actual");
	            return;
	        }

	        quote.payment_form = {
	            payment_form_id: 2,
	            payment_method_id: value,
	            payment_due_date: fechaSeleccionada,
	            duration_measure: dias
	        };
	    } else {
	        quote.payment_form = {
	            payment_form_id: 1,
	            payment_method_id: 10,
	            payment_due_date: _date,
	            duration_measure: 0
	        };

	        $("#fecha").val(_date);  // restaurar la fecha actual si no es crédito
	    }
	    localStorage.setItem("quote", JSON.stringify(quote))
	}

	// Disparar validación cuando cambia el método de pago o la fecha
	$("#paymentmethod").change(updatePaymentForm);
	$("#fecha").change(updatePaymentForm);

	$(document).on("keydown", function(event) {

	    if (event.altKey && event.key.toLowerCase() === "c") {
	        event.preventDefault();
	        let clientSelect = $("#clientSelect");
	        if (clientSelect.length > 0) {
	            clientSelect.prop("disabled", false).show();
	            if (clientSelect.hasClass("select2-hidden-accessible")) {
	                clientSelect.select2("open");
	            }
	            else if (clientSelect.next(".chosen-container").length > 0) {
	                clientSelect.trigger("chosen:open");
	            }
	            else if (clientSelect.parent().hasClass("bootstrap-select")) {
	                clientSelect.selectpicker("toggle");
	            }
	            else {
	                clientSelect[0].size = 5;
	                setTimeout(() => {
	                    clientSelect[0].size = 1;
	                }, 3000);
	                clientSelect.focus().trigger("mousedown").trigger("mouseup").trigger("click");
	            }
	        } else {
	            console.warn("El elemento #clientSelect no se encuentra en el DOM.");
	        }
	    }
	    if (event.altKey && event.key.toLowerCase() === "p") {
	        event.preventDefault();
	        $('#search_product').modal('show');
	    }
	    if (event.altKey && event.key.toLowerCase() === "o") {
	        $("#modalOtherCharges").modal('show')
	    }
	    if (event.altKey && event.key.toLowerCase() === "b") {
	    	$('#search_product').modal('show');
	    }
	    if (event.key === "F10") {
		    Save_quote(quote)
		}
	    if (event.altKey && event.key.toLowerCase() === "n") {
	    	if(software_online){
		    	$.ajax({
					url: return_product,
					success: function(response){
						console.log(response)
					}
				})
		    	localStorage.removeItem('quote')
				location.reload(true)
			}
			else{
				clean_data()
			}
	    }
	    if (event.ctrlKey && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
	        event.preventDefault(); // Evita el scroll de la página
	        const select = $("#paymentmethod")[0];
	        let index = select.selectedIndex;

	        if (event.key === "ArrowDown" && index < select.options.length - 1) {
	            select.selectedIndex = index + 1;
	        } else if (event.key === "ArrowUp" && index > 0) {
	            select.selectedIndex = index - 1;
	        }

	        // Disparar evento change manualmente
	        $(select).trigger("change");
	    }
	    if (event.altKey && event.key.toLowerCase() === "t") {
	    	Save_quote(quote)
	    }
	});

    $('#search_product').on('shown.bs.modal', function () {
        $(':focus').blur(); // Quita cualquier focus activo
        $('#filtroProductos').focus().select(); // Focus y seleccionar texto
        const defaultQuery = ''; 
        cargarProductos(defaultQuery);
    });

    $("#buscador_productos").on('keyup', function (e) {
	    if (e.key === 'Enter') {
	        const valor = $("#buscador_productos").val().trim();
	        if (valor === '') {
	            $('#search_product').modal('show');
	            return 
	        }

	        $.ajax({
	            url: url_product,
	            dataType: 'json',
	            type: 'POST',
	            headers: { "X-CSRFToken": getCookie("csrftoken") },
	            delay: 250,
	            contentType: "application/json",
	            data: JSON.stringify({ q: valor }),
	            success: function (response) {
	                console.log(response)
	                list_product_tmp = response
	                $("#buscador_productos").val(list_product_tmp[0].name)
	                let product = list_product_tmp[0];
	                product_id = product.id
	                if (product) {
	                    list_product_quote.push(product);
	                    $(".price1").val(product['price_1'])
	                    $(".price2").val(product['price_2'])
	                    $(".price3").val(product['price_3'])
	                    $(".price4").val(product['price_4'])
	                    $(".price5").val(product['price_5'])
	                    $(".price6").val(product['price_6'])
	                    setTimeout(() => {
	                        $(".quantity").focus();
	                    }, 100);
	                } else {
	                    console.error("Producto no encontrado en list_product_tmp");
	                }
	            }
	        });
	    }
	});


    let currentRowIndex = -1;

	$('#filtroProductos').on('keydown', function (e) {
	    let filas = $('#tablaproductos tr');

	    if (['ArrowDown', 'ArrowUp'].includes(e.key)) {
	        e.preventDefault();

	        if (filas.length === 0) return;

	        if (e.key === 'ArrowDown') {
	            currentRowIndex = (currentRowIndex + 1) % filas.length;
	        } else if (e.key === 'ArrowUp') {
	            currentRowIndex = (currentRowIndex - 1 + filas.length) % filas.length;
	        }

	        filas.removeClass('selected');
	        filas.eq(currentRowIndex).addClass('selected');

	        filas.eq(currentRowIndex)[0].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
	    }

	    if (e.key === 'Enter') {
	        let filaSeleccionada = $('#tablaproductos tr.selected');
	        if (filaSeleccionada.length > 0) {
	            let codigo = filaSeleccionada.find('td').eq(0).text().trim();
	            let name_product = filaSeleccionada.find('td').eq(1).text().trim();
	            $("#buscador_productos").val(name_product)
	            product_id = codigo
	            console.log('Código seleccionado:', codigo);
	            let product = list_product_tmp.find(product => product.id == codigo);
			    if (product) {
			        list_product_quote.push(product);
			        $(".price1").val(product['price_1'])
			        $(".price2").val(product['price_2'])
			        $(".price3").val(product['price_3'])
			        $(".price4").val(product['price_4'])
			        $(".price5").val(product['price_5'])
			        $(".price6").val(product['price_6'])
			        setTimeout(() => {
			            $(".quantity").focus();
			        }, 100);
			    } else {
			        console.error("Producto no encontrado en list_product_tmp");
			    }

	            // Cerrar modal
	            $('#search_product').modal('hide');

	            // Limpiar filtro y resetear índice
	            $('#filtroProductos').val('');
	            currentRowIndex = -1;
	        }
	    }
	});


	// Filtro dinámico por nombre/código
	$('#filtroProductos').on('keyup', function (e) {
	    // Ignorar flechas
	    if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;

	    let filtro = $(this).val().trim();

	    if (filtro.length > 1) {
	        cargarProductos(filtro);
	    }
	});

	// Navegación con flechas dentro de la tabla
	$(document).on('keydown', function (e) {
	    let filas = $('#tablaProductos tbody tr');
	    if (filas.length === 0) return;

	    if (e.key === 'ArrowDown') {
	        if (currentRowIndex < filas.length - 1) {
	            currentRowIndex++;
	        }
	    } else if (e.key === 'ArrowUp') {
	        if (currentRowIndex > 0) {
	            currentRowIndex--;
	        }
	    } else {
	        return;
	    }

	    filas.removeClass('selected');
	    filas.eq(currentRowIndex).addClass('selected').focus();
	});

    async function cargarProductos(query) {
	    if (!query || query.trim().length < 1) {
	        return;
	    }

	    const $tabla = $('#tablaproductos');

	    // Mostrar spinner
	    if ($('#spinner-row').length === 0) {
	        $tabla.append(`
	            <tr id="spinner-row">
	                <td colspan="8" class="text-center text-muted">
	                    <div class="spinner-border text-primary" role="status" style="width: 1.5rem; height: 1.5rem;"></div>
	                    <span class="ms-2">Buscando productos...</span>
	                </td>
	            </tr>
	        `);
	    }

	    if (software_online) {
	        // 🔹 Buscar en el servidor
	        $.ajax({
	            url: url_product,
	            dataType: 'json',
	            type: 'POST',
	            headers: { "X-CSRFToken": getCookie("csrftoken") },
	            contentType: "application/json",
	            data: JSON.stringify({ q: query }),

	            success: function (data) {
	                list_product_tmp = data;
	                let results = data.customer ? data.customer : data;

	                if (!Array.isArray(results)) results = [];

	                renderTablaProductos(results);
	            },

	            error: function (xhr, status, error) {
	                console.error("Error al cargar productos:", error);
	                $tabla.html(`
	                    <tr>
	                        <td colspan="8" class="text-center text-danger">Error al cargar productos.</td>
	                    </tr>
	                `);
	            },

	            complete: function () {
	                $('#spinner-row').remove();
	            }
	        });
	    } else {
	        // 🔹 Buscar en inventario local (IndexedDB)
	        try {
	            let localInventory = await GetInventoryLocal();
	            let results = localInventory.filter(p =>
	                p.name.toLowerCase().includes(query.toLowerCase()) ||
	                String(p.id).includes(query)
	            );

	            list_product_tmp = results;
	            renderTablaProductos(results);
	        } catch (error) {
	            console.error("Error buscando en inventario local:", error);
	            $tabla.html(`
	                <tr>
	                    <td colspan="8" class="text-center text-danger">Error al buscar productos locales.</td>
	                </tr>
	            `);
	        } finally {
	            $('#spinner-row').remove();
	        }
	    }
	}


	function renderTablaProductos(results) {
	    const $tabla = $('#tablaproductos');
	    let rows = '';

	    if (!results || results.length === 0) {
	        rows = `
	            <tr>
	                <td colspan="8" class="text-center text-muted">No se encontraron productos.</td>
	            </tr>
	        `;
	    } else {
	        results.forEach(p => {
	            rows += `
	                <tr>
	                    <td>${p.id || 0}</td>
	                    <td>${p.name || ''}</td>
	                    <td>${p.price_1 || 0}</td>
	                    <td>${p.price_2 || 0}</td>
	                    <td>${p.price_3 || 0}</td>
	                    <td>${p.price_4 || 0}</td>
	                    <td>${p.price_5 || 0}</td>
	                    <td>${p.price_6 || 0}</td>
	                </tr>
	            `;
	        });
	    }

	    $tabla.html(rows);
	}

	function formatNumbers(num) {
	    return num.toLocaleString('es-CO', {
	        minimumFractionDigits: 2,
	        maximumFractionDigits: 2
	    });
	}

	function limpiarNumero(str) {
	    // "13.800,00" -> 13800.00
	    return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
	}
	let valorLimpio = 0

	$('#amount_received').on('input', function () {
	    let valorRaw = $(this).val(); // Ej: "20.000"
	    valorLimpio = valorRaw.replace(/\./g, ''); // "20000"
	    let total_quote_raw = $("#amount_total_quote").val(); // Ej: "13.800,00"
	    let recibido = parseFloat(valorLimpio) || 0; // 20000
	    let total = limpiarNumero(total_quote_raw); // 13800.00
	    let cambio = recibido - total; // 6200.00
	    quote['import_received'] = recibido
	    $("#amount_return").val(formatNumbers(cambio)); // → 6.200,00
	});

	$(document).on("keydown", '#amount_received', function(event) {
	    if (event.key === "Escape" || event.key === "Esc") {
	        $("#amount_received").val('');  // ✅ Corregido aquí
	        $("#import_received").modal("hide");
	    }
	    if (event.key === 'Enter') {
	        if (valorLimpio >= quote['total']) {
	        	if(software_online){
	            	Save_quote(quote);
	            }else{
	            	insertRecord("quotes", quote, async function(id) {
	                    console.log("✅ quote insertado con id: " + id);
	                });
	                clean_data()
	            }
	        } else {
	            console.log("No puede facturar con valores negativos");
	            Notification(
	                "error",
	                "Oopss.. Algo salió mal.",
	                "El valor recibido no puede ser menor al total de la factura. Por favor, verifica el monto antes de continuar.",
	                "OK"
	            );
	        }
	    }
	});


	let data_quote = localStorage.getItem("quote");
	if (data_quote) {
	    values = JSON.parse(data_quote);
	    let newOption = new Option(values.name_customer, values.customer_id, true, true);
	    $('#clientSelect').append(newOption).trigger('change');
	    quote.details = values['details'] || [];
	    quote.customer_id = values.customer_id;
	    quote.name_customer = values.name_customer;
	    quote.other_charges = values['other_charges'] || [];

	    if (Array.isArray(quote.other_charges) && quote.other_charges.length > 0) {
	        for (let i = 0; i < quote.other_charges.length; i++) {
	            let charge = quote.other_charges[i];
	            if (charge['charge_indicator'] == 'true') {
	                total_other_charges += charge['amount'];
	            } else {
	                discount_global += charge['amount'];
	                console.log(discount_global, 'Descuento global');
	            }
	        }
	    }
	    quote.other_charges = values['other_charges']
	    let list_product_quote = quote.details;
	    for (let i = 0; i < list_product_quote.length; i++) {
	        let product_only = list_product_quote[i];
	        AddProduct(product_only, true);
	    }
	    
	}

	$(".note").keyup(function(){
		message = $(this).val()
		quote.note = message
		localStorage.setItem("quote", JSON.stringify(quote))
	})
	
    $('#clientSelect').select2({
        placeholder: 'Buscar cliente...',
        allowClear: true,
        minimumInputLength: 2,
        ajax: {	
            url: url_customer,
            dataType: 'json',
            type: "POST",
            headers: { "X-CSRFToken": getCookie("csrftoken")},
            delay: 250,
            contentType: "application/json",
            data: function(params) {
                return JSON.stringify({ q: params.term })
            },
            processResults: function(data) {
			    if (Array.isArray(data)) {
			        return {
			            results: data.map(function(client) {
			            	quote.customer_id = client.id
			            	quote.name_customer = client.name
			            	localStorage.setItem("quote", JSON.stringify(quote))
			                return { id: client.id, text: client.name };
			            })
			        };
			    } else if (data.customer && Array.isArray(data.customer)) {
			        return {
			            results: data.customer.map(function(client) {
			            	quote.customer_id = client.id
			            	quote.name_customer = client.name
			            	localStorage.setItem("quote", JSON.stringify(quote))
			                return { id: client.id, text: client.name };
			            })
			        };
			    } else {
			        console.error("Error: La respuesta no es un array válido", data);
			        return { results: [] };
			    }
			},
            cache: true
        }
    });

	$('#productSelect').change(function() {
	    product_id = $(this).val();
	    console.log(product_id,'ID de productos temporales')
	    console.log(list_product_tmp,'Listado de productos temporales')
	    let product = list_product_tmp.find(product => product.id == product_id);
	    if (product) {
	        list_product_quote.push(product);
	        $(".price1").val(product['price_1'])
	        $(".price2").val(product['price_2'])
	        $(".price3").val(product['price_3'])
	        $(".price4").val(product['price_4'])
	        $(".price5").val(product['price_5'])
	        $(".price6").val(product['price_6'])
	        setTimeout(() => {
	            $(".quantity").focus();
	        }, 100);
	    } else {
	        console.error("Producto no encontrado en list_product_tmp");
	    }
	});

	$(".quantity").keyup(function(event){
		console.log(apply_discount,'apply_discount')
		if(event.key.toLowerCase() === "enter"){
			if(apply_discount === 'True'){
				$(".discount").focus()
			}
			else{
				$(".type_price").focus()
			}
		}
	})

	$(".discount").on("focus", function() {
	    $(this).val('')
	});

	$(".discount").on("keyup", function(event) {
	    if (event.key === "Enter") {
	        const value = $(this).val().trim();
	        if (value === "") {
	            $(this).val(0);
	        }
	        $(".type_price").focus();
	    }
	});

	function Stock(product, type_price){
		var stock = null
		if(type_price == 1 || type_price == 4){
			stock = product['unit']
		}
		else if(type_price == 2 || type_price == 5){
			stock = product['display']
		}
		else if(type_price == 3 || type_price == 6){
			stock = product['bale']
		}
		return stock
	}

	function Query_Stock(product, type_price){
		var query_stock = "No se recargo nada"
		let stock_static= product['unit']

		if(type_price == 1 || type_price == 4){
			if(product['display'] > 0 ){
				query_stock = "Se recargo la Unidad"
				stock_static = product['unit_static']
			}
		}
		else if(type_price == 2 || type_price == 5){
			if(product['bale'] > 0 ){
				query_stock = "Se recargo la Unidad"
				stock_static = product['display']
			}
		}
		return [query_stock, stock_static]
	}

	let _type_price = 0
	let _quan = 0
	let _code = 0

	$(".type_price").keyup(async function(event) {
	    type_price = $(this).val();
	    _type_price = type_price;
	    let product = list_product_tmp.find(product => parseInt(product.id) === parseInt(product_id));
	    let stock = Stock(product, type_price);
	    $(".stock").val(stock);
	    console.log(product)

	    if(event.key === 'Enter') {
	        AddProduct(product, false);
	    } else {
	        // if (stock <= limited_inventory && $(".type_price").val() !== "") {
	        //     $(".stock").css({
	        //         "background-color": "red",
	        //         "color": "white"
	        //     });
	        //     if(stock <= 0){
	        //         result = Query_Stock(product, type_price);
	        //         $(".stock").val(result[1]);
	        //     }
	        // } else {
	        //     $(".stock").css({
	        //         "background-color": "",
	        //         "color": ""
	        //     });
	        // }
	    }
	});


	$(document).on('click','.loan_button',function(){
		let id = this.id
		console.log(id)
		data = {
		  receiving_branch: branch_id,
		  code: _code,
		  branch_that_lends: id,
		  type_unit: _type_price,
		  quantity: _quan
		}
		$.ajax({
			url: loan,
			type: "POST",
			headers: { "X-CSRFToken": getCookie("csrftoken")},
			data: data,
			success: function(response){
				console.log(response)
				console.log(type_price,'type_price')
				let _e = response
				if(_e.result){
					let _cant = _e.values.quantity_loaned
					$(".stock").val(_cant)
					let product = list_product_tmp.find(product => parseInt(product.id) === parseInt(product_id));
					if(type_price == 1 || type_price == 4){
						product['unit'] = parseFloat(product['unit']) + _cant
					}
					if(type_price == 2 || type_price == 5){
						product['display'] = parseFloat(product['display']) + _cant
					}
					if(type_price == 3 || type_price == 6){
						product['bale'] = parseFloat(product['bale']) + _cant
					}
					console.log(product)

				}
				else{
					Notification("error", "Oopss.. Algo salió mal.", _e.message, "OK")
				}

			}
		})
		$("#loan_products").modal('hide')
		$(".type_price").focus()
	})

	function codigoExiste(codigo) {
	    let existe = false;		    
	    $(".row_quote tr").each(function() {
	        let codigoExistente = $(this).find("th:first").text().trim();
	        if (codigoExistente === codigo) {
	            existe = true;
	            return false;
	        }
	    });
	    return existe;
	}

	function formatNumber(num) {
        return num.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function Calculate_Total_quote() {
	    var total_neto = 0;
	    var subtotal = 0;
	    var totalTax = 0;
	    var totalICO = 0;
	    var totalDiscount = 0;
	    var totalquote = 0;
	    $(".row_quote tr").each(function() {
	        var base = parseFloat($(this).find("th:eq(3)").text().replace(/\./g, "").replace(",", ".")) || 0;
	        var quantity = parseInt($(this).find("th:eq(2)").text()) || 0;
	        var valtax = parseFloat($(this).find("th:eq(4)").text().replace(/\./g, "").replace(",", ".")) || 0;
	        var ico = parseFloat($(this).find("th:eq(5)").text().replace(/\./g, "").replace(",", ".")) || 0;
	        var discount = parseFloat($(this).find("th:eq(6)").text().replace(/\./g, "").replace(",", ".")) || 0;
	        var subtotal_row = parseFloat($(this).find("th:eq(7)").text().replace(/\./g, "").replace(",", ".")) || 0;
	        var neto = parseFloat($(this).find("th:eq(8)").text().replace(/\./g, "").replace(",", ".")) || 0;
	        subtotal += subtotal_row;
	        totalTax += valtax * quantity;
	        totalICO += ico * quantity;
	        totalDiscount += discount * quantity;
	        total_neto += neto
	    });
	    totalquote = Math.round(subtotal + totalTax + totalICO)
	    totalquote += total_other_charges
	    total_with_discount = totalquote - discount_global

	    $(".row_totales tr:eq(0) th:eq(1)").text(formatNumbers(total_neto));
	    $(".row_totales tr:eq(1) th:eq(1)").text(formatNumbers(subtotal));
	    $(".row_totales tr:eq(2) th:eq(1)").text(formatNumbers(totalTax));
	    $(".row_totales tr:eq(3) th:eq(1)").text(formatNumbers(totalICO));
	    $(".row_totales tr:eq(4) th:eq(1)").text(formatNumbers(totalDiscount));
	    $(".row_totales tr:eq(5) th:eq(1)").text(formatNumbers(parseFloat(total_other_charges)));
	    $(".row_totales tr:eq(6) th:eq(1)").text(formatNumbers(totalquote));
	    $(".row_totales tr:eq(7) th:eq(1)").text(formatNumbers(discount_global));
	    $(".row_totales tr:eq(8) th:eq(1)").text(formatNumbers(total_with_discount));
	    $(".total_quote").val(formatNumber(totalquote))
	    if(quote){
	    	quote.total = totalquote
	    }
	    Clear_Tmp()
	    $("#buscador_productos").val('')
	    $("#buscador_productos").focus()

	}

	function AddProduct(product, save) {
	    var total = (save) ? product['price'] : product['price_'+type_price];
	    var total_save = total
	    var producto_total = total
	    var ico = product['ico']
	    var quantity = (save) ? product['quantity'] : parseInt($(".quantity").val());
	    total -= ico

	    var tax = 1 + (product['tax'] / 100)
	    var base = total / tax
	    var tax_value = total - base
	    var inputDiscount = (save) ? product['discount'] : parseFloat($(".discount").val()) || product['discount'];
	    let discount = null
	    if (apply_discount){
	    	discount = (!isNaN(inputDiscount) && inputDiscount > 100) ? inputDiscount : base * (inputDiscount / 100);
	    }
	    else{
	    	discount = base * (product['discount'] / 100);
	    }
		
	    base -= discount
	    total = base * tax
	    tax_value = total - base
	    total = (base + tax_value + ico) * quantity
	    var subtotal_row = base * quantity;
	    var neto = total + discount

	    var productRow = $(".row_quote tr").filter(function() {
	        return $(this).find("th:first").text() === product['code'];
	    });

	    if (productRow.length > 0) {
	        var currentQuantity = parseInt(productRow.find("th:eq(2)").text());
	        var newQuantity = currentQuantity + quantity;
	        var newSubtotal = base * newQuantity;
	        var newNeto = total * newQuantity;

	        productRow.find("th:eq(2)").text(newQuantity); // Actualiza cantidad
	        productRow.find("th:eq(3)").text(formatNumber(base)); // Costo
	        productRow.find("th:eq(4)").text(formatNumber(tax_value)); // IVA
	        productRow.find("th:eq(5)").text(formatNumber(ico)); // ICO
	        productRow.find("th:eq(6)").text(formatNumber(discount)); // Dcto
	        productRow.find("th:eq(7)").text(formatNumber(newSubtotal)); // SubTotal
	        productRow.find("th:eq(8)").text(formatNumber(producto_total)); // Neto

	        let rows_details = quote.details.find(product => product.id == product_id)
	        rows_details.quantity = newQuantity
	    } else {
	        $(".row_quote").prepend(`
	            <tr>
	                <th style="width: 5%;">${product['code']}</th>
	                <th style="width: 20%;">${product['name']}</th>
	                <th style="width: 7%; text-align: right;">${quantity}</th>
	                <th style="width: 7%; text-align: right;">${formatNumber(base)}</th>
	                <th style="width: 7%; text-align: right;">${formatNumber(tax_value)}</th>
	                <th style="width: 7%; text-align: right;">${formatNumber(ico)}</th>
	                <th style="width: 7%; text-align: right;">${formatNumber(discount)}</th>
	                <th style="width: 10%; text-align: right;">${formatNumber(subtotal_row)}</th>
	                <th style="width: 10%; text-align: right;">${formatNumber(producto_total)}</th>
	        		<th style="width: 10%; text-align: center;">
					  <i class="dw dw-delete-3 delete_row" style="font-size: 24px;" id="${product['id']}"></i>
					</th>
	            </tr>
	        `);
	        if(!save){
		        quote.details.push(
			    	{
			    		"id":product_id,
			            "code": product['code'],
			            "name": product['name'],
			            "quantity": quantity,
			            "price": total_save,
			            "tax": product['tax'],
			            "discount": (apply_discount && !isNaN(parseFloat($(".discount").val()))) ? parseFloat($(".discount").val()) : product['discount'],
			            "type_price": type_price,
			            "ico": product['ico']
			        }
			    )
		    }
	    }
	    localStorage.setItem("quote", JSON.stringify(quote))
	    Calculate_Total_quote()
	}

	function Save_quote(quote){
		disableRefresh = true;
		let type_document = quote.type_document
		console.log(quote)
		if (navigator.onLine) {
			$(".text_send_email").text('Espere mientras enviamos la factura a la DIAN.');
			var modalLoader = new bootstrap.Modal(document.getElementById('loader1'), {
			  keyboard: false,
			  backdrop: 'static'
			});
			if(modal){
				modalLoader.show();
			}
			$.ajax({
				url: save_quote,
				type: "POST",
				headers: { "X-CSRFToken": getCookie("csrftoken")},
				data: JSON.stringify(quote),
				success: function(response){
					console.log(response,'RESPONSE')
					if(modal){
						modalLoader.hide()
					}
					console.log(response._result)
					if(response._result){
						console.log(response)
						if(response._result)
						{
							quote_id = response.quote_id
							let screenWidth = window.screen.width;
		                    let screenHeight = window.screen.height;
		                    let windowWidth = 800;
		                    let windowHeight = 600;
		                    let leftPosition = (screenWidth - windowWidth) / 2;
		                    let topPosition = (screenHeight - windowHeight) / 2;
		                    let params = `scrollbars=no,resizable=no,status=no,location=no,toolbar=no,menubar=no,width=${windowWidth},height=${windowHeight},left=${leftPosition},top=${topPosition}`;
		                    let printWindow = window.open(print_quote + quote_id + '/' + type_document, "quote", params);
		                    if (printWindow) {
							    printWindow.onload = function() {
							        printWindow.document.body.style.zoom = "100%";
							        printWindow.print();

							        printWindow.onafterprint = function() {
							            printWindow.close();
							        };
							    };

							    let checkClose = setInterval(function() {
							        if (printWindow.closed) {
							            clearInterval(checkClose);
							            console.log("La ventana de impresión se ha cerrado");
							            localStorage.removeItem('quote')
										location.reload(true)
							        }
							    }, 500);
							}
						
							
						}
						else{
							console.log(response.data.message)
							Swal.fire({
						      icon: 'error',
						      title: "Oopss.. Algo salió mal.",
						      text: response.data.message,
						      confirmButtonText: 'OK',
						      confirmButtonColor: '#3085d6'
						    }).then((result) => {
						      if (result.isConfirmed) {
						        location.reload(true)
						      }
						    })
						}
						
					}
					else{
						console.log("ERROR")
						if(modal){
							modalLoader.hide()
						}
						Swal.fire({
					      icon: 'error',
					      title: "Oopss.. Algo salió mal.",
					      text: response.message,
					      confirmButtonText: 'OK',
					      confirmButtonColor: '#3085d6'
					    }).then((result) => {
					      if (result.isConfirmed) {
					        location.reload(true)
					      }
					    })
					}
				}
			})
		}else{
			guardarFacturaLocal(quote);
			console.log("Lo sentimos no tiene internet, la factura sera guardada y se enviara automaticamente")
		}
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

    $(document).on('click','.details_quote',function(){
    	verDetalles()
    })

    $(".reader_quote").click(function(){
    	leerFacturas()
    })

    let socket;
	let reconnectInterval = null;

	function connectSocket() {
	    socket = new WebSocket(url_websocket);

	    socket.onopen = function () {
	        console.log("✅ Conexión WebSocket establecida");
	        clearInterval(reconnectInterval); // detener intentos de reconexión
	    };

	    socket.onmessage = function (event) {
	        try {
	            let data = JSON.parse(event.data);
	            if (data.result && data.resolution) {
	                quote.prefix = data.resolution.prefix;
	                $(".days_resolution").text("La resolución vence en " + data.resolution.days_remaining + " días");
	                $(".number_quote").text(data.resolution._from);
	                quote.number = data.resolution._from;
	            }
	        } catch (error) {
	            console.error("Error al procesar mensaje WebSocket:", error);
	        }
	    };

	    socket.onerror = function (error) {
	        console.warn("⚠️ Error en WebSocket: ", error);
	    };

	    socket.onclose = function () {
	        console.log("❌ Conexión WebSocket cerrada.");
	        if (navigator.onLine && !reconnectInterval) {
	            reconnectInterval = setInterval(() => {
	                console.log("🔄 Intentando reconectar WebSocket...");
	                connectSocket();
	            }, 1000);
	        }
	    };
	}

	// Enviar la consulta de resolución cada segundo
	setInterval(() => {
	    if (navigator.onLine && socket && socket.readyState === WebSocket.OPEN) {
	        socket.send(JSON.stringify({
	            action: "get_resolution",
	            branch_id: branch_id,
	            type_document: type_document
	        }));
	    }
	}, 1000);

	connectSocket();



	function Clear_Tmp(){
		$(".price1").val(0)
		$(".price2").val(0)
		$(".price3").val(0)
		$(".price4").val(0)
		$(".price5").val(0)
		$(".price6").val(0)
		$("#productSelect").focus();
		$(".quantity").val('')
		$(".type_price").val('')
	}

	$(document).on('click', '.delete_row', function () {
	    const product_id = parseInt(this.id);
	    const $row = $(this).closest('tr');
	    const removedProduct = quote.details.find(item => parseInt(item.id) === parseInt(product_id));
	    console.log(removedProduct,'_removedProduct')

	    if (!removedProduct) {
	        Swal.fire('Error', 'Producto no encontrado en la factura local', 'error');
	        return;
	    }

	    // Eliminar del array local y actualizar localStorage de inmediato
	    quote.details = quote.details.filter(item => parseInt(item.id) !== parseInt(product_id));
	    localStorage.setItem("quote", JSON.stringify(quote));

	    // Eliminar fila del DOM
	    $row.remove();

	    // Recalcular totales
	    Calculate_Total_quote();

	    // Si hay internet, hacemos AJAX para eliminar en backend
	    if (software_online) {
	        const data = {
	        	product_id : removedProduct.id,
	            code: removedProduct.id,
	            employee_id: quote.employee_id, 
	        };
	        console.log(data,'Datos enviados')

	        Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Producto eliminado correctamente',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true
            });
	    } else {removeReservedByProductId(removedProduct.id,removedProduct.quantity, true)
	        ; // Ahora sí entra
	        Swal.fire({
	            toast: true,
	            position: 'top-end',
	            icon: 'info',
	            title: 'Producto eliminado localmente. Se sincronizará cuando vuelva internet.',
	            showConfirmButton: false,
	            timer: 2500,
	            timerProgressBar: true
	        });
	    }
	});



	function clean_data(){
		quote.date = _date
		quote.customer_id = customer_id
		quote.name_customer = "CONSUMIDOR FINAL"
		quote.type_document = type_document
		quote.employee_id = employee_id
		quote.branch_id = branch_id
		quote.total = 0
		quote.payment_form = {
	        payment_form_id: 1,
	        payment_method_id: 10,
	        payment_due_date: _date,
	        duration_measure: 0
	    }
	    quote.status = "Paid"
	    quote.anulled = false
	    quote.credit_note_applied = false
	    $(".stock").val('0')
	    localStorage.removeItem('quote')
	    $("#amount_received").val('')
	    $("#import_received").modal("hide")
		$(".row_quote").empty()
		Calculate_Total_quote()
	}





});
