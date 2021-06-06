#!/usr/bin/node

const http = require("http");
const node_static = require("node-static");
 
//Para conectarse a mongo
const mongo = require("mongodb").MongoClient;

//Servidor de mongodb
let server_url = "mongodb://localhost:27017";

//la definimos global para acceder desde fuera
let chat_db;

mongo.connect(server_url, (err, server) => {
	if (err){
		console.log("Error en la conexión a MongoDB");
		//throw es un return para errores, lanza un error
		throw err;	
	}

	console.log("Dentro de MongoDB");

	//conexion a la base de datos
	chat_db = server.db("amongmeme");
	
});


console.log("Inicializando servidor chat");

//directorio de nuestro sismeta y por defecto de nuestro servidor web
let public_files = new node_static.Server("pub");

http.createServer( (request, response) => {
	//si empieza por /chat entrara aqui
	if (request.url.startsWith("/chat")){
		
		//se retorna la url dividida en arrays de string x cada "="
		let info = request.url.split("=");
		//console.log(info[1]);	
		
		//creo el objeto que buscare en la base de datos
		let query = {date: {$gt: parseInt(info[1])} };
		
		//puntero a los datos
		let cursor = chat_db.collection("chat").find(query);

		cursor.toArray().then( (data) => {
			//console.log(data);

			//error 200 es 'todo encontrado' es decir esta bien
			response.writeHead(200, {'Content-Type': 'text/plain'});			
			
			response.write( JSON.stringify(data) );

			response.end();
		});

		return;
	}
	
	if (request.url == "/recent"){
	
		//registros en la base de datos
		const estimated_count = chat_db.collection("chat").estimatedDocumentCount();

		estimated_count.then( (count) => {
	
			//max que queremos ver
			const MAX = 5;
		
			//puntero a los datos
			//sort -> es un metodo interno para ordenar los campos
			//con un campo existente o con "$natural" (en el orden de inserccion)
			// 1 lo hara ascendente "en orden" / -1 lo hara descendente "al reves"
			//limit -> devolviendo los ultimos 5 resultados
			let cursor = chat_db.collection("chat").find({}, {
				skip: count - MAX,
				limit: MAX, 
				sort: { $natural:1 }
				});

			//para recorrer los datos que nos ha devuelto el .find
			cursor.toArray().then( (data) => {

				//error 200 es 'todo encontrado' es decir esta bien
				response.writeHead(200, {'Content-Type': 'text/plain'});			
			
				response.write( JSON.stringify(data) );

				response.end();
			});
			
		});

		return;
	}

	if (request.url == "/submit"){
		console.log("Envío de datos");

		let body = [];

		//chunk son los bloques de datos
		request.on('data', (chunk) => {

			body.push(chunk);

		}).on('end', () => {
			
			//convierte a objetos 
			let chat_data = JSON.parse(Buffer.concat(body).toString());

			//insertamos el valor en la base de datos
			chat_db.collection("chat").insertOne({
				user: chat_data.chat_user,
				msg: chat_data.chat_msg,
				date: Date.now()
				//date: new Date()
			}); 

		});

		response.end();

		return;
	}

	if (request.url == "/history"){
				
			//error 200 es 'todo encontrado' es decir esta bien
			response.writeHead(200, {'Content-Type': 'text/plain'});			

			//puntero a los datos
			let cursor = chat_db.collection("chat").find().sort({ date: -1 });

			let p = "";

			cursor.toArray().then( (data) => {
			//console.log(data);

				for (let i = 0; i < data.length; i++) {
						//me guardo la fecha
						let date = data[i].date;

						//si el parametro es un DATE obj devuelve el numero en milisegs desde 1 JAN, 1970
						date = Number(date);

						//me cargo lo que tenga y lo convierto en una data "humana"
						date = new Date(date);

						let date_showed = date.getDay() + "-" + date.getMonth() + "-" + date.getFullYear() + "/" 				+ date.getHours() + ":" + date.getMinutes();

						p = "[" + date_showed + "]" + data[i].user + " : " + data[i].msg;
			
						response.write( JSON.stringify(p) + "\n");
			}

			response.end();

		});

		return;
	}

	public_files.serve(request, response);

}).listen(8080);
