import json, requests, operations as op, time, operations

class Home:
	def __init__(self, request):
		self.headers = {'Content-Type': 'application/json'}
		self.request = request

	def Login(self):
		payload = json.dumps({
		  "documentI": self.request.GET['documentI'],
		  "user":  self.request.GET['user'],
		  "psswd":  self.request.GET['psswd']
		})
		response = requests.request("GET", op.LOGIN, headers = self.headers, data=payload)
		result = json.loads(response.text)
		self.request.session['pk_employee'] = result['pk_employee']
		self.request.session['name_employee'] = result['name']
		self.request.session['company_id'] = result['company_id']
		self.request.session['branch_id'] = result['branch_id']
		self.request.session['customer_id'] = result['customer_id']
		self.request.session['supplier_id'] = result['supplier_id']
		self.request.session['limited_inventory'] = result['limited_inventory']
		self.request.session['logo'] = result['logo']
		self.request.session['rols'] = result['rols']
		self.request.session['discount'] = result['discount']
		self.request.session['print_close_box'] = result['print_close_box']
		self.request.session['create_box'] = result['create_box']
		self.request.session['branch_list'] = result['branch_list']
		self.request.session['url_interfaz'] = operations.URL_INTERFAZ
		self.request.session['url_websokect'] = operations.URL_WEBSOKECT
		self.request.session['nit'] = result['nit']
		return json.dumps(result)

class Branch:
    def __init__(self, request, debug=True):
        self.request = request
        self.debug = debug
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})

    def _request(self, method, url, data=None):
        payload = json.dumps(data) if data else None
        start_total = time.perf_counter()
        response = None
        try:
            response = self.session.request(method, url, data=payload, timeout=(5, 600))
            response.raise_for_status()
            result = response.json()
            print(result)
        except requests.exceptions.RequestException as e:
            result = {
                "error": str(e),
                "status_code": getattr(e.response, "status_code", None),
            }
        except ValueError:
            result = {
                "error": "Respuesta no es JSON válido",
                "content": response.text if response else None,
            }
        end_total = time.perf_counter()

        if self.debug:
            print(f"{method} {url}")
            print(f"  → Tiempo total request: {end_total - start_total:.4f}s")
            print(f"  → Resultado: {str(result)[:200]}")

        return result

    def List_Branch(self):
        return self._request(
            "POST",
            op.LIST_BRANCH,
            {"company_id": self.request.session['company_id']}
        )['list_branch']

    def Create_Or_Update_License(self):
        return self._request("POST", op.CREATE_OR_UPDATE_LICENSE, self.request.body)

    def Create_Or_Update_Branch(self, data):
        return self._request("POST", op.CREATE_OR_UPDATE_BRANCH, data)

    def Update_Resolution_PDF_Dian(self, data):
        return self._request("POST", op.UPDATE_RESOLUTION_PDF_DIAN, data)

    def Get_Resolution(self):
        data = {
            "branch_id": self.request.session['branch_id'],
            "type_document": self.request.session["type_document"]
        }
        return self._request("GET", op.GET_RESOLUTION, data)

    def Get_Branch(self):
        return self._request(
            "GET",
            op.GET_BRANCH,
            {"branch_id": self.request.session['branch_select']}
        )

    def Activate_Discount(self):
        result = self._request("POST", op.GET_RESOLUTION, {"branch_id": self.request.session['branch_id']})
        self.request.session['discount'] = result['state']
        return result

class Inventory:
    def __init__(self, request, debug=True):
        self.request = request
        self.debug = debug
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})

    def _request(self, method, url, data=None):
	    payload = json.dumps(data) if data else None
	    start_total = time.perf_counter()
	    response = None
	    try:
	        response = self.session.request(method, url, data=payload, timeout=(5, 600))
	        response.raise_for_status()
	        result = response.json()

	        # Guardar respuesta exitosa
	        with open("request_inventory_success.txt", "w", encoding="utf-8") as f:
	            f.write(f"URL: {url}\n")
	            f.write(f"Method: {method}\n")
	            f.write(f"Payload: {payload}\n")
	            f.write(f"Status: {response.status_code}\n")
	            f.write(f"Response: {json.dumps(result, indent=2, ensure_ascii=False)}\n")

	    except requests.exceptions.RequestException as e:
	        # Guardar error HTTP / conexión
	        with open('error_pos.txt','w') as file:
	        	file.write(str(response.text))
	        result = {
	            "error": str(e),
	            "status_code": getattr(e.response, "status_code", None),
	        }
	        with open("request_inventory_error.txt", "w", encoding="utf-8") as f:
	            f.write(f"URL: {url}\n")
	            f.write(f"Method: {method}\n")
	            f.write(f"Payload: {payload}\n")
	            if e.response is not None:
	                f.write(f"Status: {e.response.status_code}\n")
	                f.write(f"Response text: {e.response.text[:2000]}\n")  # Máx 2000 chars
	            else:
	                f.write("No response object (timeout o conexión rechazada)\n")
	            f.write(f"Error: {str(e)}\n")

	    except ValueError:
	        # Guardar error de parseo JSON
	        result = {
	            "error": "Respuesta no es JSON válido",
	            "content": response.text,
	        }
	        with open("request_inventory_invalid_json.txt", "w", encoding="utf-8") as f:
	            f.write(f"URL: {url}\n")
	            f.write(f"Method: {method}\n")
	            f.write(f"Payload: {payload}\n")
	            f.write(f"Status: {response.status_code}\n")
	            f.write(f"Response text: {response.text[:2000]}\n")

	    end_total = time.perf_counter()

	    if self.debug:
	        print(f"{method} {url}")
	        print(f"  → Tiempo total request: {end_total - start_total:.4f}s")
	        print(f"  → Resultado: {str(result)[:200]}")

	    return result


    # Métodos
    def Get_Products_By_Branch(self, data):
        return self._request("POST", op.GET_PRODUCTS_BY_BRANCH, data)

    def Sales_By_Product(self, data):
    	with open("data_Sales_By_Product.txt",'w') as file:
    		file.write(str(data))
    	return self._request("POST", op.SALES_BY_PRODUCT, data)

    def Return_One_Product(self, data):
        return self._request("POST", op.RETURN_ONE_PRODUCT, data)

    def Generate_Movement_History_Report(self, data):
        return self._request("POST", op.GENERATE_MOVEMENT_HISTORY_REPORT, data)

    def Export_Inventory_To_Excel(self, data):
        return self._request("POST", op.EXPORT_INVENTORY_TO_EXCEL, data)

    def Get_Profit_Report(self):
        return self._request("POST", op.GET_PROFIT_REPORT, {"branch_id": self.request.session['branch_id']})

    def Get_Product(self, data):
        return self._request("POST", op.GET_PRODUCT, data)

    def Get_All_Category(self):
        return self._request("POST", op.GET_ALL_CATEGORY, {"branch_id": self.request.session['branch_id']})

    def Create_Inventory(self, data):
        return self._request("POST", op.CREATE_INVENTORY, data)

    def Get_All_Inventory(self):
        return self._request("POST", op.GET_ALL_INVENTORY, {"branch_id": self.request.session['branch_id']})

    def Delete_Inventory(self, data):
        return self._request("DELETE", op.DELETE_INVENTORY, data)

    def Reserved(self):
        return self._request("POST", op.RESERVED, dict(self.request.GET))

    def Return_Product(self):
        return self._request("POST", op.RETURN_PRODUCT, {"employee_id": self.request.session['pk_employee']})

    def Finalizado(self):
        return self._request("POST", op.FINALIZADO, {"employee_id": self.request.session['pk_employee']})

    def Get_Sales_Predictions(self, data):
        return self._request("POST", op.GET_SALES_PREDICTIONS, data)

    def Scan_Inventory(self, data):
        return self._request("POST", op.SCAN_INVENTORY, data)

    def Loan(self, data):
        return self._request("POST", op.LOAN, data)

    def Get_Product_By_Name(self):
        data = json.loads(self.request.body)
        payload = {
            "branch_id": self.request.session.get('branch_id'),
            "name": data.get("q", "")
        }
        result = self._request("POST", op.GET_PRODUCT_BY_NAME, payload)
        return result.get('product', [])

class Customer:
	def __init__(self, request):
		self.headers = {'Content-Type': 'application/json'}
		self.request = request

	def Get_All_Customer(self, data):
		response = requests.request("POST", op.GET_ALL_CUSTOMER, headers=self.headers, data=json.dumps(data))
		return json.loads(response.text)

	def Get_All_Evangeli(self):
		response = requests.request("POST", op.GET_ALL_EVANGELI, headers=self.headers, data=json.dumps({'company_id': self.request.session['company_id']}))
		return json.loads(response.text)

	def Create_Customer(self,data):
		response = requests.request("POST", op.CREATE_CUSTOMER, headers=self.headers, data=json.dumps(data))
		return json.loads(response.text)

	def Get_Customer(self,data):
		response = requests.request("GET", op.GET_CUSTOMER, headers=self.headers, data=json.dumps(data))
		return json.loads(response.text)

	def Delete_Customer(self,data):
		response = requests.request("DELETE", op.DELETE_CUSTOMER, headers=self.headers, data=json.dumps(data))
		return json.loads(response.text)

	def Create_Customer_By_RUT(self,data):
		payload = json.dumps({
		  "employee_id": self.request.session.get('pk_employee'),
		  "company_id": self.request.session.get('company_id'),
		  "rut": data
		})
		response = requests.request("POST", op.CREATE_CUSTOMER_BY_RUT, headers=self.headers, data=payload)
		result = json.loads(response.text)
		return result

	def Get_Customer_By_Name(self):
		data = json.loads(self.request.body)
		payload = json.dumps({
            "company_id": self.request.session.get('company_id'),
            "name": data.get("q", "")
        })
		response = requests.request("POST", op.GET_CUSTOMER_BY_NAME, headers = self.headers, data=payload)
		return json.loads(response.text)

class Setting:
	def __init__(self, request):
		self.headers = {'Content-Type': 'application/json'}
		self.request = request

	def Get_Data_General(self, data):
		response = requests.request("POST", f"{op.GET_ALL_DATA}{data}/", headers={}, data=json.dumps({'branch_id':self.request.session['branch_id']}))
		return json.loads(response.text)

class Supplier:
	def __init__(self, request):
		self.headers = {'Content-Type': 'application/json'}
		self.request = request

	def Create_Or_Update_Supplier(self, data):
		response = requests.request("POST", op.CREATE_OR_UPDATE_SUPPLIER, headers = self.headers, data=json.dumps(data))
		return json.loads(response.text)

	def Get_List_Supplier(self, data):
		response = requests.request("POST", op.GET_LIST_SUPPLIER, headers=self.headers, data=json.dumps(data))
		return json.loads(response.text)

	def Get_Supplier(self,data):
		response = requests.request("GET", op.GET_SUPPLIER, headers=self.headers, data=json.dumps(data))
		return json.loads(response.text)

	def Delete_Supplier(self,data):
		response = requests.request("DELETE", op.DELETE_SUPPLIER, headers=self.headers, data=json.dumps(data))
		return json.loads(response.text)

	def Get_Supplier_By_Name(self):
		data = json.loads(self.request.body)
		payload = json.dumps({
            "company_id": self.request.session.get('company_id'),
            "name": data.get("q", "")
        })
		response = requests.request("POST", op.GET_SUPPLIER_BY_NAME, headers = self.headers, data=payload)
		return json.loads(response.text)

class Invoice:

    def __init__(self, request, debug=True):
        self.request = request
        self.debug = debug
        # Sesión persistente para todas las solicitudes
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})

    def _post(self, url, data):
        url = url.replace("localhost", "127.0.0.1")  # Más rápido en local

        start_total = time.perf_counter()      # Timer total de la función
        start_request = time.perf_counter()    # Timer de envío+respuesta

        response = self.session.post(url, json=data)

        end_request = time.perf_counter()
        result = response.json()
        print(result)
        end_total = time.perf_counter()

        if self.debug:
            print(f"POST {url}")
            print(f"  → Tiempo envío+respuesta: {end_request - start_request:.4f}s")
            print(f"  → Tiempo total _post: {end_total - start_total:.4f}s")
        return result

    # Métodos
    def Anulled_Invoice(self, data):
        return self._post(op.ANULLED_INVOICE, data)

    # Métodos
    def Export_Invoices_To_Excel(self, data):
        return self._post(op.EXPORT_INVOICES_TO_EXCEL, data)

    def Create_PDF(self, data):
        return self._post(op.CREATE_PDF, data)

    def Send_Email_Invoice(self, data):
        return self._post(op.SEND_EMAIL_INVOICE, data)

    def Send_Dian(self, data):
        res = self._post(op.SEND_DIAN, data)
        if self.debug:
            print(res)
        return res

    def Get_List_Invoice(self, data):
        res = self._post(op.GET_LIST_INVOICE, data)
        if self.debug:
            print(f"Get_List_Invoice result count: {len(res.get('invoice', []))}")
        return res

    def Get_List_Credit_Note(self, data):
    	res = self._post(op.GET_LIST_CREDIT_NOTE, data)
    	if self.debug:
    		print(f"Get_List_Invoice result count: {len(res.get('invoice', []))}")
    	return res

    def Create_Invoice(self, data):
        return self._post(op.CREATE_INVOICE, data)

    def Export_Sales_Report(self):
        payload = dict(self.request.GET)
        return self._post(op.EXPORT_SALES_REPORT, payload)

    def Generate_Journal_Report(self):
        payload = dict(self.request.GET)
        return self._post(op.GENERATE_JOURNAL_REPORT, payload)

    def Generate_Closure_Report_By_Date(self, data):
        return self._post(op.GENERATE_CLOSURE_REPORT_BY_DATE, data)

    def Generate_Closure_Report(self):
        payload = {
            "branch_id": self.request.session['branch_id'],
            "employee_id": self.request.session['pk_employee']
        }
        return self._post(op.GENERATE_CLOSURE_REPORT, payload)

    def Get_Full_Invoice(self, branch_id, invoice_id, type_document):
        payload = {
            "branch_id": branch_id,
            "type_document": type_document,
            "invoice_id": invoice_id
        }
        return self._post(op.GET_FULL_INVOICE, payload)

class Shopping:
	def __init__(self, request):
		self.headers = {'Content-Type': 'application/json'}
		self.request = request
		self.session = requests.Session()  # <--- aquí creas la sesión
		self.debug = True 

	def _post(self, url, data):
		start_total = time.perf_counter()
		start_request = time.perf_counter()
		response = self.session.post(url, json=data)
		end_request = time.perf_counter()
		result = response.json()
		print(result)
		end_total = time.perf_counter()
		if self.debug:
		    print(f"POST {url}")
		    print(f"  → Tiempo envío+respuesta: {end_request - start_request:.4f}s")
		    print(f"  → Tiempo total _post: {end_total - start_total:.4f}s")
		return result

	def Create_Shopping(self, data):
		return self._post(op.CREATE_SHOPPING, data)

	def Get_List_Shopping(self, data):
		return self._post(op.GET_LIST_SHOPPING, data)

class Company:
	def __init__(self, request):
		self.headers = {'Content-Type': 'application/json'}
		self.request = request

	def Get_Data_Company(self):
		payload = json.dumps({
		  "company_id": self.request.session['company_id']
		})
		response = requests.request("POST", op.GET_DATA_COMPANY, headers=self.headers, data=payload)
		return json.loads(response.text)

	def Update_Company(self):
		data = self.request.GET.copy()
		data['company_id'] = self.request.session['company_id']
		payload = json.dumps(data)
		response = requests.request("POST", op.UPDATE_COMPANY, headers=self.headers, data=payload)
		return json.loads(response.text)

	def Update_Logo(self, data):
		payload = json.dumps(data)
		response = requests.request("POST", op.UPDATE_LOGO, headers=self.headers, data=payload)
		result = json.loads(response.text)
		self.request.session['logo'] = result['message']
		return result

	def Create_Company(self, data):
		payload = json.dumps(data)
		response = requests.request("POST", op.CREATE_COMPANY, headers=self.headers, data=payload)
		result = json.loads(response.text)
		print("Resultado:",result)
		return result

class Employee:

	def __init__(self, request):
		self.headers = {'Content-Type': 'application/json'}
		self.request = request


	def Get_All_Employee(self,data):
		payload = json.dumps(data)
		response = requests.request("POST", op.GET_ALL_EMPLOYEE, headers=self.headers, data=payload)
		return json.loads(response.text)

	def Create_Employee(self,data):
		payload = json.dumps(data)
		response = requests.request("POST", op.CREATE_EMPLOYEE, headers=self.headers, data=payload)
		return json.loads(response.text)

	def Get_Employee(self,employee_id):
		payload = json.dumps({'employee_id': employee_id})
		response = requests.request("GET", op.GET_EMPLOYEE, headers=self.headers, data=payload)
		return json.loads(response.text)

	def Get_All_Roles(self):
		response = requests.request("GET", op.GET_ALL_ROLES, headers=self.headers, data={})
		return json.loads(response.text)

	def Delete_Employee(self, data):
		response = requests.request("DELETE", op.DELETE_EMPLOYEE, headers=self.headers, data=json.dumps(data))
		return json.loads(response.text)

	def Get_List_Employee(self):
		response = requests.request("POST", op.GET_LIST_EMPLOYEE, headers=self.headers, data=json.dumps({'company_id': self.request.session['company_id']}))
		return json.loads(response.text)

	def Payroll_Basic(self):
		response = requests.request("POST", op.PAYROLL_BASIC, headers=self.headers, data=json.dumps(self.request.GET))
		return json.loads(response.text)

class Wallet:

	def __init__(self, request):
		self.headers = {'Content-Type': 'application/json'}
		self.request = request

	def Get_All_accounts_Receivable(self, data):
		payload = json.dumps(data)
		response = requests.request("POST", op.GET_ALL_ACCOUNTS_RECEIVABLE, headers=self.headers, data=payload)
		return json.loads(response.text)

	def Create_Pass_Invoice(self, data):
		payload = json.dumps(data)
		response = requests.request("POST", op.CREATE_PASS_INVOICE, headers=self.headers, data=payload)
		return json.loads(response.text)

class Novelty:

	def __init__(self, request):
		self.headers = {'Content-Type': 'application/json'}
		self.request = request

	def Create_Internal_Transaction(self, data):
		payload = json.dumps(data)
		response = requests.request("POST", op.CREATE_INTERNAL_TRANSACTION, headers=self.headers, data=payload)
		return json.loads(response.text)

class Quote:
    def __init__(self, request):
        self.headers = {'Content-Type': 'application/json'}
        self.request = request
        self.session = requests.Session()  # <--- aquí creas la sesión
        self.debug = True 

    def _post(self, url, data):
        start_total = time.perf_counter()
        start_request = time.perf_counter()
        response = self.session.post(url, json=data)
        with open("result_response_quote.txt",'w') as file:
        	file.write(f"{response}")
        end_request = time.perf_counter()
        result = response.json()
        
        end_total = time.perf_counter()
        if self.debug:
            print(f"POST {url}")
            print(f"  → Tiempo envío+respuesta: {end_request - start_request:.4f}s")
            print(f"  → Tiempo total _post: {end_total - start_total:.4f}s")
        return result

    def Create_Quote(self, data):
        return self._post(op.CREATE_QUOTE, data)

    def Get_List_Quote(self, data):
        return self._post(op.GET_LIST_QUOTE, data)

    def Get_Full_Quote(self, branch_id, quote_id, type_document):
        payload = {
            "branch_id": branch_id,
            "type_document": type_document,
            "quote_id": quote_id
        }
        return self._post(op.GET_FULL_QUOTE, payload)

    def Create_PDF(self, data):
        return self._post(op.CREATE_PDF_QUOTE, data)

    def Bill_Quote(self, data):
        return self._post(op.BILL_QUOTE, data)



class Transfer:
    def __init__(self, request):
        self.headers = {'Content-Type': 'application/json'}
        self.request = request
        self.session = requests.Session()  # <--- aquí creas la sesión
        self.debug = True 

    def _post(self, url, data):
        start_total = time.perf_counter()
        start_request = time.perf_counter()
        response = self.session.post(url, json=data)
        end_request = time.perf_counter()
        result = response.json()
        print(result)
        end_total = time.perf_counter()
        if self.debug:
            print(f"POST {url}")
            print(f"  → Tiempo envío+respuesta: {end_request - start_request:.4f}s")
            print(f"  → Tiempo total _post: {end_total - start_total:.4f}s")
        return result

    def Create_Transfer(self, data):
        return self._post(op.CREATE_TRANSFER, data)

    def Get_List_Transfer(self, data):
        return self._post(op.GET_LIST_TRANSFER, data)

    def Get_List_Notifications(self, data):
        return self._post(op.GET_LIST_NOTIFICATIONS, data)

    def Transfer_Accepted(self, data):
        return self._post(op.TRANSFER_ACCEPTED, data)

    def Anulled_Transfer(self, data):
        return self._post(op.ANULLED_TRANSFER, data)

    def Get_Full_Transfer(self, transfer_id, type_document):
        payload = {
            "type_document": type_document,
            "transfer_id": transfer_id
        }
        return self._post(op.GET_FULL_TRANSFER, payload)






