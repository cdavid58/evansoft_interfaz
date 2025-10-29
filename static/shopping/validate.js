$(".number_Invoice").keyup(function(event){
	type_price = $(this).val()
	if(event.key === 'Enter'){
		Open_List_Product()
	}
});