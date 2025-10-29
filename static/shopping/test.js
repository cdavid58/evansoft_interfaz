
$(document).ready(function() {

	_document = "shopping"
	
	shopping.details = []
	_date = new Date().toISOString().split('T')[0]
	shopping.date_registration = _date
	shopping.supplier_id = supplier_id
	shopping.type_document = type_document
	shopping.employee_id = employee_id
	shopping.branch_id = branch_id
	shopping.total = 0
	shopping.payment_form = {
        payment_form_id: 1,
        payment_method_id: 10,
        payment_due_date: _date,
        duration_measure: 0
    }
    shopping.status = "Paid"
    shopping.anulled = false
    shopping.notes = false
    shopping.credit_note_applied = false

	$("#fecha").val(_date)

	function getDaysBetweenDates(fecha1, fecha2) {
	    const start = new Date(fecha1);
	    const end = new Date(fecha2);
	    const diff = end - start;
	    return Math.ceil(diff / (1000 * 60 * 60 * 24));
	}

	function updatePaymentForm() {
	    const value = parseInt($("#paymentmethod").val(), 10);
	    const fechaSeleccionada = $("#fecha").val();

	    // Validar si la fecha está vacía
	    if (!fechaSeleccionada) {
	        Swal.fire({
	            icon: 'warning',
	            title: 'Fecha requerida',
	            text: 'Por favor seleccione una fecha de vencimiento.',
	        });
	        return;
	    }

	    // Verifica si _date está definido
	    if (!_date) {
	        Swal.fire({
	            icon: 'error',
	            title: 'Error interno',
	            text: 'La fecha actual (_date) no está definida.',
	        });
	        return;
	    }

	    // Validación para métodos de pago a crédito
	    if ([30, 45, 48].includes(value)) {
	        const dias = getDaysBetweenDates(_date, fechaSeleccionada);

	        shopping.payment_form = {
	            payment_form_id: 2,
	            payment_method_id: value,
	            payment_due_date: fechaSeleccionada,
	            duration_measure: dias
	        };

	        Swal.fire({
	            icon: 'success',
	            title: 'Forma de pago actualizada',
	            text: `Pago a crédito. Días hasta vencimiento: ${dias}`,
	            timer: 2000,
	            toast: true,
	            position: 'top-end',
	            showConfirmButton: false
	        });

	    } else {
	        shopping.payment_form = {
	            payment_form_id: 1,
	            payment_method_id: 10,
	            payment_due_date: _date,
	            duration_measure: 0
	        };

	        $("#fecha").val(_date); // Restaurar fecha actual

	        Swal.fire({
	            icon: 'info',
	            title: 'Forma de pago: Contado',
	            text: 'Se estableció la fecha actual como vencimiento.',
	            timer: 2000,
	            toast: true,
	            position: 'top-end',
	            showConfirmButton: false
	        });
	    }
	    localStorage.setItem(_document, JSON.stringify(shopping))
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
	    if (event.key === "F10") {
	    	Save_Shopping()
	    }
	    if (event.altKey && event.key.toLowerCase() === "g") {
	    	Save_Account()
	    }
	    if (event.altKey && event.key.toLowerCase() === "n") {
	    	localStorage.removeItem(_document)
			location.reload(true)
	    }
	});

	let data_shopping = localStorage.getItem(_document);
	if (data_shopping) {
		values = JSON.parse(data_shopping)
		$(".number_shopping").val(values.number)
	    shopping.details = values['details'];
	    let list_product_shopping = shopping.details;
	    for (let i = 0; i < list_product_shopping.length; i++) {
	        let product_only = list_product_shopping[i];
	        $(".cost").val(product_only['cost'])
	        $(".ico").val(product_only['ipo'])
	        $(".discount").val(product_only['discount'])
	        $(".price1").val(product_only['price1'])
	        $(".price2").val(product_only['price2'])
	        $(".price3").val(product_only['price3'])
	        $(".price4").val(product_only['price4'])
	        $(".price5").val(product_only['price5'])
	        $(".price6").val(product_only['price6'])
	        AddProduct(product_only, true);
	    }
	}

	$(".note").keyup(function(){
		message = $(this).val()
		shopping.note = message
		localStorage.setItem(_document, JSON.stringify(shopping))
	})

    $('#supplierSelect').select2({
        placeholder: 'Buscar proveedor...',
        allowClear: true,
        minimumInputLength: 2,
        ajax: {	
            url: url_supplier,
            dataType: 'json',
            type: "POST",
            headers: { "X-CSRFToken": getCookie("csrftoken")},
            delay: 250,
            contentType: "application/json",
            data: function(params) {
                return JSON.stringify({ q: params.term })
            },
            processResults: function(data) {
            	console.log(data)
			    if (Array.isArray(data)) {
			        return {
			            results: data.map(function(client) {
			            	shopping.supplier_id = client.id
			                return { id: client.id, text: client.name };
			            })
			        };
			    } else if (data.customer && Array.isArray(data.customer)) {
			        return {
			            results: data.customer.map(function(client) {
			            	shopping.supplier_id = client.id
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
	        list_product_shopping.push(product);

	        $(".cost").val(product['cost'])
	        $(".ico").val(product['ico'])
	        $(".discount").val(product['discount'])
	        $(".price1").val(product['price_1'])
	        $(".price2").val(product['price_2'])
	        $(".price3").val(product['price_3'])
	        $(".price4").val(product['price_4'])
	        $(".price5").val(product['price_5'])
	        $(".price6").val(product['price_6'])
	        
	        $(".cost").prop("disabled", false);
	        $(".discount").prop("disabled", false);
	        $(".quantity").prop("disabled", false);
	        $(".ico").prop("disabled", false);
	        $(".price1").prop("disabled", false);
	        $(".price2").prop("disabled", false);
	        $(".price3").prop("disabled", false);
	        $(".price4").prop("disabled", false);
	        $(".price5").prop("disabled", false);
	        $(".price6").prop("disabled", false);
	        setTimeout(() => {
	            $(".quantity").focus();
	        }, 100); // Retraso de 100ms para asegurar que el DOM está actualizado
	    } else {
	        console.error("Producto no encontrado en list_product_tmp");
	    }
	});

	$(".add_product").click(function(event){
		let product = list_product_tmp.find(product => product.id == product_id);
		quantity_product = parseInt($(".quantity").val())
		AddProduct(product, false)
	})

	$(".quantity").keyup(function(event){
		if(event.key.toLowerCase() === "enter"){
			let product = list_product_tmp.find(product => product.id == product_id);
			quantity_product = parseInt($(".quantity").val())
			AddProduct(product, false)
		}
	})

	function codigoExiste(codigo) {
	    let existe = false;		    
	    $(".row_shopping tr").each(function() {
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

    function Calculate_Total_shopping() {
	    var subtotal = 0;
	    var totalTax = 0;
	    var totalICO = 0;
	    var totalDiscount = 0;
	    var totalshopping = 0;
	    $(".row_shopping tr").each(function() {
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
	        totalshopping += Math.round(subtotal + totalTax + totalICO)
	    });

	    $(".row_totales tr:eq(0) th:eq(1)").text(formatNumber(subtotal));
	    $(".row_totales tr:eq(1) th:eq(1)").text(formatNumber(totalTax));
	    $(".row_totales tr:eq(2) th:eq(1)").text(formatNumber(totalICO));
	    $(".row_totales tr:eq(3) th:eq(1)").text(formatNumber(totalDiscount));
	    $(".row_totales tr:eq(4) th:eq(1)").text(formatNumber(totalshopping));
	    $(".total_shopping").val(formatNumber(totalshopping))
	    shopping.total += totalshopping
	    Clear_Tmp()
	    Open_List_Product()

	}

	function AddProduct(product, save) {
	    var total = (parseFloat($(".cost").val()) * ( 1 + (product['tax'] / 100))) + parseFloat($(".ico").val());
	    var total_save = total
	    var ico = parseFloat($(".ico").val())
	    var quantity = (save) ? product['quantity'] : parseInt($(".quantity").val());
	    total -= ico

	    var tax = 1 + (product['tax'] / 100)
	    var base = total / tax
	    var tax_value = total - base
	    var discount = base * (parseFloat($(".discount").val()) / 100)
	    base -= discount
	    total = base * tax
	    tax_value = total - base
	    total = (base + tax_value + ico) * quantity
	    var subtotal_row = base * quantity;
	    var neto = total

	    var productRow = $(".row_shopping tr").filter(function() {
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
	        productRow.find("th:eq(8)").text(formatNumber(newNeto)); // Neto

	        let rows_details = shopping.details.find(product => product.id == product_id)
	        rows_details.quantity = newQuantity
	    } else {
	        $(".row_shopping").prepend(`
	            <tr>
	                <th style="width: 5%;">${product['code']}</th>
	                <th style="width: 20%;">${product['name']}</th>
	                <th style="width: 7%; text-align: right;">${quantity}</th>
	                <th style="width: 7%; text-align: right;">${formatNumber(base)}</th>
	                <th style="width: 7%; text-align: right;">${formatNumber(tax_value)}</th>
	                <th style="width: 7%; text-align: right;">${formatNumber(ico)}</th>
	                <th style="width: 7%; text-align: right;">${formatNumber(discount)}</th>
	                <th style="width: 10%; text-align: right;">${formatNumber(subtotal_row)}</th>
	                <th style="width: 10%; text-align: right;">${formatNumber(neto)}</th>
	                <th style="width: 10%; text-align: right;"><button class="btn btn-primary" onclick="verDetalle(this)">Detalles</button></th>
	            </tr>
	        `);
	        if(!save){
		        shopping.details.push(
			    	{
			    		"id":product_id,
			            "code": product['code'],
			            "name": product['name'],
			            "quantity": quantity,
			            "cost": $(".cost").val(),
			            "price": $(".cost").val(),
			            "price1": $(".price1").val(),
			            "price2": $(".price2").val(),
			            "price3": $(".price3").val(),
			            "price4": $(".price4").val(),
			            "price5": $(".price5").val(),
			            "price6": $(".price6").val(),
			            "tax": product['tax'],
			            "discount": $(".discount").val(),
			            "ultra_processed": type_price,
			            "ipo": $(".ico").val()
			        }
			    )
		    }
	    }
	    localStorage.setItem(_document, JSON.stringify(shopping))
	    Calculate_Total_shopping()
	}


	$(".number_shopping").keyup(function(){
		shopping.number = $(".number_shopping").val()
	})

	function Save_Shopping(){
		let list_branch = $("#branchSelect").val()
		console.log(list_branch)
		if (!list_branch?.length) {
			Notification("warning", "ALERTA!!!", "No se seleccionaron sucursales.", "OK")
			return;
		}
		if(!$(".number_shopping").val()){
			$(".number_shopping").focus()
			Notification("warning", "ALERTA!!!", "Debe colocar el numero de factura.", "OK")
			return;
		}
		if (navigator.onLine) {
			list_branch.forEach(branchId => {
				let shopping_copy = { ...shopping }
				shopping_copy['branch_id'] = branchId;
				$.ajax({
					url: save_shopping,
					type: "POST",
					headers: { "X-CSRFToken": getCookie("csrftoken")},
					data: JSON.stringify(shopping_copy),
					success: function(e){
						console.log(e)
						if(e.data && e.result){
							if(e.data.result)
							{
								Notification("success", "Registro exitoso.", e.data.message, "OK")
								localStorage.removeItem(_document)
								location.reload(true)
								Clear_Tmp()
								// 	let screenWidth = window.screen.width;
				                //     let screenHeight = window.screen.height;
				                //     let windowWidth = 800;
				                //     let windowHeight = 600;
				                //     let leftPosition = (screenWidth - windowWidth) / 2;
				                //     let topPosition = (screenHeight - windowHeight) / 2;
				                //     let params = `scrollbars=no,resizable=no,status=no,location=no,toolbar=no,menubar=no,width=${windowWidth},height=${windowHeight},left=${leftPosition},top=${topPosition}`;
				                //     let printWindow = window.open(print_shopping + shopping.number, "shopping", params);
				                //     if (printWindow) {
				                //         printWindow.onload = function() {
				                //             printWindow.document.body.style.zoom = "100%";
				                //             printWindow.print();
				                //             printWindow.onafterprint = function () {
				                //                 printWindow.close();
				                //             };
				                //         };
				                //     }
							}
							else{
								console.log(e.data.message)
								Notification("error", "Oopss.. Algo salió mal.", e.data.message, "OK")
							}
							
						}
						else{
							console.log("ERROR")
						}
					}
				})
			})
		}
	}

	function Save_Account(){
	    guardarFacturaLocal(shopping);
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

    $(document).on('click','.details_shopping',function(){
    	verDetalles()
    })

    $(".reader_shopping").click(function(){
    	console.log(shopping)
    	let list_branch = $("#branchSelect").val()
    	list_branch.forEach(branchId => {
    		let productData = {branch_id: branchId };
    	})
    })
    

	function Open_List_Product(){
		let productSelect = $("#productSelect");
        if (productSelect.length > 0) {
            productSelect.prop("disabled", false).show();
            if (productSelect.hasClass("select2-hidden-accessible")) {
                productSelect.select2("open");
            }
            else if (productSelect.next(".chosen-container").length > 0) {
                productSelect.trigger("chosen:open");
            }
            else if (productSelect.parent().hasClass("bootstrap-select")) {
                productSelect.selectpicker("toggle");
            }
            else {
                productSelect[0].size = 5;
                setTimeout(() => {
                    productSelect[0].size = 1;
                }, 3000);
                productSelect.focus().trigger("mousedown").trigger("mouseup").trigger("click");
            }
        } else {
            console.warn("El elemento #productSelect no se encuentra en el DOM.");
        }
	}

	// Open_List_Product()

	function Clear_Tmp(){
		$(".price1").val(0)
		$(".price2").val(0)
		$(".price3").val(0)
		$(".price4").val(0)
		$(".price5").val(0)
		$(".price6").val(0)
		$(".ico").val(0)
		$(".discount").val(0)
		$(".cost").val(0)
		$("#productSelect").val(null).trigger("change");
		$(".quantity").val('')
        
        $(".cost").prop("disabled", true);
        $(".discount").prop("disabled", true);
        $(".quantity").prop("disabled", true);
        $(".ico").prop("disabled", true);
        $(".price1").prop("disabled", true);
        $(".price2").prop("disabled", true);
        $(".price3").prop("disabled", true);
        $(".price4").prop("disabled", true);
        $(".price5").prop("disabled", true);
        $(".price6").prop("disabled", true);
		
	}


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
	                    list_product_shopping.push(product);
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
			        list_product_shopping.push(product);
			        $(".cost").val(product['cost'])
			        $(".ico").val(product['ico'])
			        $(".discount").val(product['discount'])
			        $(".price1").val(product['price_1'])
			        $(".price2").val(product['price_2'])
			        $(".price3").val(product['price_3'])
			        $(".price4").val(product['price_4'])
			        $(".price5").val(product['price_5'])
			        $(".price6").val(product['price_6'])
			        
			        $(".cost").prop("disabled", false);
			        $(".discount").prop("disabled", false);
			        $(".quantity").prop("disabled", false);
			        $(".ico").prop("disabled", false);
			        $(".price1").prop("disabled", false);
			        $(".price2").prop("disabled", false);
			        $(".price3").prop("disabled", false);
			        $(".price4").prop("disabled", false);
			        $(".price5").prop("disabled", false);
			        $(".price6").prop("disabled", false);
			        setTimeout(() => {
			            $(".quantity").focus();
			        }, 100); // Retraso de 100ms para asegurar que el DOM está actualizado
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


	// Filtro dinámico por nombre/código (mínimo 4 caracteres)
	$('#filtroProductos').on('keyup', function (e) {
	    // Ignorar flechas
	    if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;

	    let filtro = $(this).val().trim();

	    if (filtro.length > 3) {
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
	    if (!query || query.trim().length < 4) {
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


	

});

// Función para mostrar los detalles del producto en el modal
function verDetalle(btn) {
  let row = $(btn).closest('tr'); // Encuentra la fila más cercana
  let index = row.index(); // Obtiene el índice de la fila dentro de la tabla normal

  // Cargar datos en el modal
  $('#rowIndex').val(index);
  $('#modalProducto').val(row.find("th:eq(0)").text()); // Código
  $('#modalCantidad').val(row.find("th:eq(2)").text()); // Cantidad
  $('#modalCosto').val(row.find("th:eq(3)").text()); // Costo
  $('#modalPrecio1').val(row.find("th:eq(4)").text()); // IVA
  $('#modalPUC').val(row.find("th:eq(5)").text()); // PUC

  // Cargar precios desde los campos de entrada
  $('#modalPrecio2').val($(".price2").val());
  $('#modalPrecio3').val($(".price3").val());
  $('#modalPrecio4').val($(".price4").val());
  $('#modalPrecio5').val($(".price5").val());
  $('#modalPrecio6').val($(".price6").val());

  // Valores fijos
  $('#modalConsumo').val(8);
  $('#modalDescuento').val(5);

  // Mostrar modal
  $('#modalDetalle').show();
}

// Función para guardar los cambios realizados en el modal
function guardarCambios() {
  let index = $('#rowIndex').val();
  let producto = $('#modalProducto').val();
  let cantidad = parseFloat($('#modalCantidad').val());
  let costo = parseFloat($('#modalCosto').val());
  let precio1 = parseFloat($('#modalPrecio1').val());
  let precio2 = parseFloat($('#modalPrecio2').val());
  let precio3 = parseFloat($('#modalPrecio3').val());
  let precio4 = parseFloat($('#modalPrecio4').val());
  let precio5 = parseFloat($('#modalPrecio5').val());
  let precio6 = parseFloat($('#modalPrecio6').val());
  let consumo = parseFloat($('#modalConsumo').val());
  let descuento = parseFloat($('#modalDescuento').val());
  let puc = $('#modalPUC').val();

  // Cálculos
  let subtotal = cantidad * costo;
  let valorDescuento = subtotal * (descuento / 100);
  let subtotalConDescuento = subtotal - valorDescuento;
  let valorConsumo = subtotalConDescuento * (consumo / 100);
  let total = subtotalConDescuento + valorConsumo;

  // Actualizar la tabla con los valores nuevos
  let row = $(".row_shopping tr").eq(index);
  row.find("th:eq(0)").text(producto);
  row.find("th:eq(2)").text(cantidad);
  row.find("th:eq(3)").text(costo.toFixed(2));
  row.find("th:eq(4)").text(precio1.toFixed(2));
  row.find("th:eq(5)").text(puc);
  row.find("th:eq(7)").text(total.toFixed(2));
  cerrarModal();
  recalcularGranTotal();
}

// Función para cerrar el modal
function cerrarModal() {
  $('#modalDetalle').hide();
}

// Función para recalcular el total de la factura
function recalcularGranTotal() {
  let total = 0;
  $(".row_shopping tr").each(function() {
    let valor = parseFloat($(this).find("th:eq(7)").text()) || 0; // Subtotal
    total += valor;
  });

  $('#granTotal').text(total.toFixed(2));
}

// Función para eliminar un producto de la factura
function eliminarProducto(btn) {
  $(btn).closest('tr').remove();
  recalcularGranTotal();
}

// Función para agregar un nuevo producto a la factura
function agregarProducto() {
  let nuevaFila = `
    <tr>
      <th style="width: 5%;">Nuevo Producto</th>
      <th style="width: 20%;">Descripción</th>
      <th style="width: 7%; text-align: right;">1</th>
      <th style="width: 7%; text-align: right;">0.00</th>
      <th style="width: 7%; text-align: right;">0.00</th>
      <th style="width: 7%; text-align: right;">613505</th>
      <th style="width: 10%; text-align: right;">
        <button class="btn btn-primary" onclick="verDetalle(this)">Ver Detalle</button>
        <button class="btn btn-danger" onclick="eliminarProducto(this)">Eliminar</button>
      </th>
    </tr>
  `;

  $(".row_shopping").prepend(nuevaFila);
  recalcularGranTotal();
}
