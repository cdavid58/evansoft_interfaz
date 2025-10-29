var software_online = false;
function checkInternet() {
    if (navigator.onLine) {
        software_online = true;
    } else {
        software_online = false;
    }
    console.log("Estado actual del internet:", software_online);
}

$(document).ready(function() {
	
	invoice.details = []
	let modal = true
	let total_other_charges = 0
    let discount_global = 0
	_date = new Date().toISOString().split('T')[0]
	invoice.date = _date
	invoice.customer_id = customer_id
	invoice.name_customer = "CONSUMIDOR FINAL"
	invoice.type_document = type_document
	invoice.employee_id = employee_id
	invoice.branch_id = branch_id
	invoice.total = 0
	invoice.payment_form = {
        payment_form_id: 1,
        payment_method_id: 10,
        payment_due_date: _date,
        duration_measure: 0
    }
    invoice.status = "Paid"
    invoice.anulled = false
    invoice.credit_note_applied = false


    checkInternet();

    $(window).on("online", function () {
        software_online = true;
        console.log("✅ Conectado:", software_online);
    });

    $(window).on("offline", function () {
        software_online = false;
        console.log("❌ Sin conexión:", software_online);
    });


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

		if (!invoice['other_charges']) {
			invoice['other_charges'] = [];
		}
		invoice['other_charges'].push({
			"charge_indicator": charge_indicator,
			"note": allowance_charge_reason,
			"amount": amount_charges
		});
		console.log(invoice)
		Swal.fire({
			toast: true,
			position: 'top-end',
			icon: 'success',
			title: "El cargo fue agregado correctamente",
			showConfirmButton: false,
			timer: 2000,
			timerProgressBar: true,
		});
		localStorage.setItem("invoice", JSON.stringify(invoice))
		$('#charge_indicator').val('');
		$("#allowance_charge_reason").val('')
		$("#amount_charges").val('')
		Calculate_Total_Invoice()
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
	    const value = parseInt($("#paymentmethod").val(), 10);
	    const fechaSeleccionada = $("#fecha").val();

	    if ([30, 45, 48].includes(value)) {
	        const dias = getDaysBetweenDates(_date, fechaSeleccionada);

	        if (dias <= 0) {
	            // alert("Cuando se refiere a crédito debe elegir una fecha superior a la actual");
	            return;
	        }

	        invoice.payment_form = {
	            payment_form_id: 2,
	            payment_method_id: value,
	            payment_due_date: fechaSeleccionada,
	            duration_measure: dias
	        };
	    } else {
	        invoice.payment_form = {
	            payment_form_id: 1,
	            payment_method_id: 10,
	            payment_due_date: _date,
	            duration_measure: 0
	        };

	        $("#fecha").val(_date);  // restaurar la fecha actual si no es crédito
	    }
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
		    event.preventDefault();
		    $("#amount_total_invoice").val(formatNumber(parseFloat(invoice['total'])));
		    $("#import_received").modal({
		        backdrop: 'static',
		        keyboard: false
		    });
		    $('#import_received').one('shown.bs.modal', function () {
		        const $input = $("#amount_received");
		        if ($input.length) {
		            $input.focus().select();
		        }
		    });
		}
	    if (event.altKey && event.key.toLowerCase() === "g") {
	    	Save_Account()
	    }
	    if (event.altKey && event.key.toLowerCase() === "n") {
	    	$.ajax({
				url: return_product,
				success: function(response){
					console.log(response)
				}
			})
	    	localStorage.removeItem('invoice')
			location.reload(true)
	    }
	    if (event.altKey && event.key.toLowerCase() === "v") {
	    	$(".reader_invoice").click() //PERMITE RECUPERAR FACTURAS GUARDADAS
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
	    	invoice.type_document = 99
	    	$("#amount_total_invoice").val(formatNumber(parseFloat(invoice['total'])));
		    $("#import_received").modal({
		        backdrop: 'static',
		        keyboard: false
		    });
		    $('#import_received').one('shown.bs.modal', function () {
		        const $input = $("#amount_received");
		        if ($input.length) {
		            $input.focus().select();
		        }
		    });
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
	                    list_product_invoice.push(product);
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
			        list_product_invoice.push(product);
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

    function cargarProductos(query) {
	    if (!query || query.trim().length < 1) {
	        return;
	    }

	    // Mostrar spinner de forma superpuesta (no borra tabla)
	    const $tabla = $('#tablaproductos');
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

	            // Construir nuevas filas sin tocar el DOM aún
	            let rows = '';
	            if (results.length === 0) {
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

	            // Reemplazar toda la tabla una vez, evitando parpadeo
	            $tabla.html(rows);
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
	            // Quitar spinner cuando finalice la petición
	            $('#spinner-row').remove();
	        }
	    });
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

	    let total_invoice_raw = $("#amount_total_invoice").val(); // Ej: "13.800,00"

	    let recibido = parseFloat(valorLimpio) || 0; // 20000
	    let total = limpiarNumero(total_invoice_raw); // 13800.00

	    let cambio = recibido - total; // 6200.00
	    invoice['import_received'] = recibido

	    console.log("Valor recibido:", recibido);
	    console.log("Total factura:", total);
	    console.log("Cambio:", cambio);
	    console.log("Formateado:", formatNumbers(cambio));

	    $("#amount_return").val(formatNumbers(cambio)); // → 6.200,00
	    console.log(invoice)
	});

	$(document).on("keydown", '#amount_received', function(event) {
	    if (event.key === "Escape" || event.key === "Esc") {
	        console.log("Se presionó Escape");
	        $("#amount_received").val('');  // ✅ Corregido aquí
	        $("#import_received").modal("hide");
	    }

	    if (event.key === 'Enter') {
	        console.log('Facturando', invoice);
	        if (valorLimpio >= invoice['total']) {
	            Save_Invoice();
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


	let data_invoice = localStorage.getItem("invoice");
	if (data_invoice) {
	    values = JSON.parse(data_invoice);
	    let newOption = new Option(values.name_customer, values.customer_id, true, true);
	    $('#clientSelect').append(newOption).trigger('change');
	    invoice.details = values['details'] || [];
	    invoice.customer_id = values.customer_id;
	    invoice.name_customer = values.name_customer;
	    invoice.other_charges = values['other_charges'] || [];

	    if (Array.isArray(invoice.other_charges) && invoice.other_charges.length > 0) {
	        for (let i = 0; i < invoice.other_charges.length; i++) {
	            let charge = invoice.other_charges[i];
	            if (charge['charge_indicator'] == 'true') {
	                total_other_charges += charge['amount'];
	            } else {
	                discount_global += charge['amount'];
	                console.log(discount_global, 'Descuento global');
	            }
	        }
	    }
	    invoice.other_charges = values['other_charges']
	    let list_product_invoice = invoice.details;
	    for (let i = 0; i < list_product_invoice.length; i++) {
	        let product_only = list_product_invoice[i];
	        AddProduct(product_only, true);
	    }
	    
	}

	$(".note").keyup(function(){
		message = $(this).val()
		invoice.note = message
		localStorage.setItem("invoice", JSON.stringify(invoice))
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
			            	invoice.customer_id = client.id
			            	invoice.name_customer = client.name
			            	localStorage.setItem("invoice", JSON.stringify(invoice))
			                return { id: client.id, text: client.name };
			            })
			        };
			    } else if (data.customer && Array.isArray(data.customer)) {
			        return {
			            results: data.customer.map(function(client) {
			            	invoice.customer_id = client.id
			            	invoice.name_customer = client.name
			            	localStorage.setItem("invoice", JSON.stringify(invoice))
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
	        list_product_invoice.push(product);
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
		var query_stock = null
		let stock_static= null

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

	$(".type_price").keyup(function(event){
		type_price = $(this).val()
		_type_price = type_price
		let product = list_product_tmp.find(product => product.id == product_id);
		let stock = Stock(product, type_price)	
		$(".stock").val(stock)
		if(event.key === 'Enter'){
			quantity_product = parseInt($(".quantity").val())
			_quan = quantity_product
			_code = product['code']
			data_product = {
				id: product_id,
			    code: product['code'],
			    branch_id: branch_id,
			    employee_id: employee_id,
			    type_price: type_price,
			    quantity: quantity_product,
			}
			$.ajax({
				url:reserved,
				data: data_product,
				success: function(e){
					if(e.result){
						AddProduct(product, false)
						$(".stock").val(0)
					}
					else{
						console.log(e.message,'No hay')
						// Notification("error", "Oopss.. Algo salió mal.", e.message, "OK")
						if(type_price == 1 || type_price == 4){
							_type_price = 1
						}
						if(type_price == 2 || type_price == 5){
							_type_price = 2
						}
						if(type_price == 3 || type_price == 6){
							_type_price = 3
						}
						$.ajax({
							url: scan_inventory,
							type: "POST",
							headers: { "X-CSRFToken": getCookie("csrftoken")},
							data: {'code':product['code'], 'quantity':quantity_product,'type_unit':type_price},
							success: function(response){
								console.log(response)
								if(response.result){
									values = response.values
									for(i = 0; i < values.length; i++){
										$("#tableLoan").append(`
											<tr>
												<td>${values[i].branch}</td>
												<td>${values[i].quantity}</td>
												<td>
													<button class='btn btn-primary loan_button' id="${values[i].branch_id}">Prestar</button>
												</td>
											</tr>
										`)
									}
									$("#loan_products").modal('show')
								}
							}
						})
					}
				}
			})			
		}
		else{
			if (stock <= limited_inventory && $(".type_price").val() !== "") {
		        $(".stock").css({
		            "background-color": "red",
		            "color": "white"
		        });
		        if(stock <= 0){
		        	result = Query_Stock(product, type_price)
		        	$(".stock").val(result[1])
		        	// Swal.fire({
					//   position: "top-end",
					//   icon: "success",
					//   title: `${result[0]}`,
					//   showConfirmButton: false,
					//   timer: 1500
					// });
		        }
		        else{
		        	// Swal.fire({
					//   position: "top-end",
					//   icon: "success",
					//   title: `Quedan ${stock} ${(stock > 1) ? "cantidades": "cantidad"} de este producto!!!... `,
					//   showConfirmButton: false,
					//   timer: 1500
					// });
		        }
		    } else {
		        $(".stock").css({
		            "background-color": "",
		            "color": ""
		        });
		    }
		}
	})

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
					let product = list_product_tmp.find(product => product.id == product_id);
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
	    $(".row_invoice tr").each(function() {
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

    function Calculate_Total_Invoice() {
	    var total_neto = 0;
	    var subtotal = 0;
	    var totalTax = 0;
	    var totalICO = 0;
	    var totalDiscount = 0;
	    var totalInvoice = 0;
	    $(".row_invoice tr").each(function() {
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
	    totalInvoice = Math.round(subtotal + totalTax + totalICO)
	    totalInvoice += total_other_charges
	    console.log(totalInvoice)
	    total_with_discount = totalInvoice - discount_global

	    $(".row_totales tr:eq(0) th:eq(1)").text(formatNumbers(total_neto));
	    $(".row_totales tr:eq(1) th:eq(1)").text(formatNumbers(subtotal));
	    $(".row_totales tr:eq(2) th:eq(1)").text(formatNumbers(totalTax));
	    $(".row_totales tr:eq(3) th:eq(1)").text(formatNumbers(totalICO));
	    $(".row_totales tr:eq(4) th:eq(1)").text(formatNumbers(totalDiscount));
	    $(".row_totales tr:eq(5) th:eq(1)").text(formatNumbers(parseFloat(total_other_charges)));
	    $(".row_totales tr:eq(6) th:eq(1)").text(formatNumbers(totalInvoice));
	    $(".row_totales tr:eq(7) th:eq(1)").text(formatNumbers(discount_global));
	    $(".row_totales tr:eq(8) th:eq(1)").text(formatNumbers(total_with_discount));
	    $(".total_invoice").val(formatNumber(totalInvoice))
	    invoice.total = totalInvoice
	    Clear_Tmp()
	    $("#buscador_productos").val('')
	    $("#buscador_productos").focus()
	    // Open_List_Product()

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

	    var productRow = $(".row_invoice tr").filter(function() {
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

	        let rows_details = invoice.details.find(product => product.id == product_id)
	        rows_details.quantity = newQuantity
	    } else {
	        $(".row_invoice").prepend(`
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
					  <i class="dw dw-delete-3 delete_row" style="font-size: 24px;" id="${product['code']}"></i>
					</th>
	            </tr>
	        `);
	        if(!save){
		        invoice.details.push(
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
	    localStorage.setItem("invoice", JSON.stringify(invoice))
	    Calculate_Total_Invoice()
	}

	function Save_Invoice(){
		disableRefresh = true;
		number = invoice.number
		let type_document = invoice.type_document
		console.log(invoice)
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
				url: send_dian,
				type: "POST",
				headers: { "X-CSRFToken": getCookie("csrftoken")},
				data: JSON.stringify(invoice),
				success: function(response){
					console.log(response,'RESPONSE')
					if(modal){
						modalLoader.hide()
					}
					if(response.data && response.result){
						console.log(response)
						if(response.data.result)
						{
							number = response.data.invoice_id
							let screenWidth = window.screen.width;
		                    let screenHeight = window.screen.height;
		                    let windowWidth = 800;
		                    let windowHeight = 600;
		                    let leftPosition = (screenWidth - windowWidth) / 2;
		                    let topPosition = (screenHeight - windowHeight) / 2;
		                    let params = `scrollbars=no,resizable=no,status=no,location=no,toolbar=no,menubar=no,width=${windowWidth},height=${windowHeight},left=${leftPosition},top=${topPosition}`;
		                    let printWindow = window.open(print_invoice + number + '/' + type_document, "invoice", params);
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
							            localStorage.removeItem('invoice')
										location.reload(true)
							        }
							    }, 500);
							}
							$.ajax({
								url: finalizado,
								success: function(response){
									console.log(response)
								}
							})
							
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
			})
		}else{
			guardarFacturaLocal(invoice);
			console.log("Lo sentimos no tiene internet, la factura sera guardada y se enviara automaticamente")
		}
	}

	function Save_Account(){
	    guardarFacturaLocal(invoice);
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

    $(document).on('click','.details_invoice',function(){
    	verDetalles()
    })

    $(".reader_invoice").click(function(){
    	leerFacturas()
    })

    let socket = new WebSocket(url_websocket);
    // let socket = new WebSocket("wss://api.evansoft.co/ws/resolution/");

	socket.onopen = function() {
	    console.log("Conexión WebSocket establecida");
	    socket.send(JSON.stringify({ 
	    	action: "get_resolution", 
	    	branch_id : branch_id,
	    	type_document : type_document
	    }));
	};

	socket.onmessage = function(event) {
	    try {
	        let data = JSON.parse(event.data);
	        if (data.result && data.resolution) {
	        	invoice.prefix = data.resolution.prefix
	            $(".days_resolution").text("La resolución vence en " + data.resolution.days_remaining + " días");
	            $(".number_invoice").text(data.resolution._from);
	            invoice.number = data.resolution._from
	        }
	    } catch (error) {
	        console.error("Error al procesar mensaje WebSocket:", error);
	    }
	};

	socket.onerror = function(error) {
	    console.log("Error en WebSocket: ", error);
	};

	socket.onclose = function() {
	    console.log("Conexión WebSocket cerrada. Intentando reconectar...");
	    setTimeout(() => {
	        location.reload();
	    }, 3000);
	};

	setInterval(() => {
	    if (socket.readyState === WebSocket.OPEN) {
	        socket.send(JSON.stringify({ action: "get_resolution",branch_id : branch_id,
	    	type_document : type_document }));
	    }
	}, 1000);


	function Clear_Tmp(){
		$(".price1").val(0)
		$(".price2").val(0)
		$(".price3").val(0)
		$(".price4").val(0)
		$(".price5").val(0)
		$(".price6").val(0)
		$("#productSelect").val(null).trigger("change");
		$(".quantity").val('')
		$(".type_price").val('')
		
	}

	$(document).on('click', '.delete_row', function () {
	    const productCode = $(this).attr('id'); // Código del producto (asignado como ID)
	    const $row = $(this).closest('tr');     // Fila a eliminar

	    // Buscar el producto en invoice.details
	    const removedProduct = invoice.details.find(item => item.code === productCode);

	    // Si no se encuentra, cancelamos
	    if (!removedProduct) {
	        Swal.fire('Error', 'Producto no encontrado en la factura local', 'error');
	        return;
	    }

	    // Datos a enviar al servidor
	    const data = {
	        code: removedProduct.code,
	        employee_id: invoice.employee_id, // Asegúrate de tener esta propiedad en invoice
	    };

	    // AJAX para eliminar en el backend
	    $.ajax({
	        url: return_one_product, // Asegúrate que esta variable tenga la URL correcta
	        method: "POST",
	        data: data,
	        headers: { "X-CSRFToken": getCookie("csrftoken")},
	        success: function (response) {
	            if (response.result) {
	                // Mostrar toast de éxito
	                Swal.fire({
	                    toast: true,
	                    position: 'top-end',
	                    icon: 'success',
	                    title: 'Producto eliminado correctamente',
	                    showConfirmButton: false,
	                    timer: 2000,
	                    timerProgressBar: true
	                });

	                // Eliminar fila del DOM
	                $row.remove();

	                // Eliminar del array local y localStorage
	                invoice.details = invoice.details.filter(item => item.code !== productCode);
	                localStorage.setItem("invoice", JSON.stringify(invoice));

	                // Recalcular totales
	                Calculate_Total_Invoice();

	            } else {
	                Swal.fire('Error', response.message || 'No se pudo eliminar el producto en el servidor', 'error');
	            }
	        },
	        error: function () {
	            Swal.fire('Error', 'Error de comunicación con el servidor', 'error');
	        }
	    });
	});

});
