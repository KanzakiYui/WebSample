const Express = require('express');
const bodyParser = require('body-parser');
const { Client } = require('pg');				//Postgres database connection
const SendEmail = require("./account/SendEmail");
const PostgreSQL = require("./sql/postgresql");

var app = Express();
/*-------------------  Configure Part -----------------*/

app.use(function (request, response, next) {
    response.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');			//For React
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    response.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,Content-Type, Accept');
    response.setHeader('Access-Control-Allow-Credentials', true);
    next();
});
app.use(bodyParser.json());


/*-------------------  File Get Part --------------------*/
const ClientFileDirectory =  __dirname + '\\client\\login';
app.get('/', function(request, response, next){
	var options = {
    	root: ClientFileDirectory,
    	headers: { 'Content-Type': 'text/html'}
  	};
	response.sendFile("index.html", options, function (error) {
		 if (error) next(error)
  	});
});

app.get('/static/css/:name', function(request, response, next){
	var options = {
    	root: ClientFileDirectory + "\\static\\css",
    	headers: { 'Content-Type': 'text/css' }
  	};
	response.sendFile(request.params.name, options, function (error) {
		 if (error) next(error)
  	});
});

app.get('/static/js/:name', function(request, response, next){
	var options = {
    	root: ClientFileDirectory + "\\static\\js",
    	headers: { 'Content-Type': 'application/x-javascript' }
  	};
	response.sendFile(request.params.name, options, function (error) {
		 if (error) next(error)
  	});
});

app.get('/userHomePage', function(request, response, next){
	response.send("To be continued...");
});

/*------------------------	POST request part ----------------------*/

/*---- This is handle for development mode, pass all "options" methods   -----*/
app.options('/:name', function (request, response, next) {
  	if (!request.body) return response.sendStatus(400);
  	next();
});

app.post('/checkIfEmailExists', function (request, response, next) {
  	if (!request.body) return response.sendStatus(400);
  	response.set({ 'Content-Type': 'application/json' });
  	var emailAddress = request.body.emailAddress.toLowerCase();
  	var query = `SELECT * FROM public.useraccount where email = '${emailAddress}';`;
		PostgreSQL.PSQLSeach(query, function(error, queryResult){
			var result = queryResult.length !=0 ? true:false;
			var responseData = {result: result};
			response.send(JSON.stringify(responseData));
	});
});

app.post('/emailCodeRequest', function (request, response, next) {
  	if (!request.body) return response.sendStatus(400);
  	response.set({ 'Content-Type': 'application/json' });
  	var emailAddress = request.body.emailAddress.toLowerCase();
	var emailTimeout = Number(request.body.emailTimeout);
	var responseData = {emailReceived: emailAddress, expiresIn: emailTimeout};
  	response.send(JSON.stringify(responseData));
	SendEmail(emailAddress, emailTimeout);
});

app.post('/emailCodeVerification', function (request, response, next) {
  	if (!request.body) return response.sendStatus(400);
  	response.set({ 'Content-Type': 'application/json' });
  	var emailAddress = request.body.emailAddress.toLowerCase();
	var code = request.body.code;
	var query = `SELECT * FROM public.emailcode where email = '${emailAddress}' AND code='${code}';`;
	PostgreSQL.PSQLSeach(query, function(error, queryResult){
		var result = queryResult.length !=0 ? true:false;
		console.log(result);
		response.send(JSON.stringify({result: result}));
		if(result){
			var username =  request.body.username;
			var password = PostgreSQL.Encryption(request.body.password);
			var insert = `Insert into public.useraccount Values ('${emailAddress}', '${username}', '${password}', false);`;
			PostgreSQL.PSQLSeach(insert);
		}		
	});
});

app.post('/loginToAccount', function (request, response, next) {
  	if (!request.body) return response.sendStatus(400);
  	response.set({ 'Content-Type': 'application/json' });
  	var emailAddress = request.body.emailAddress.toLowerCase();
	var password = PostgreSQL.Encryption(request.body.password);
	var query = `SELECT * FROM public.useraccount where email = '${emailAddress}' AND password='${password}';`;
	PostgreSQL.PSQLSeach(query, function(error, queryResult){
		var result = queryResult.length !=0 ? true:false;
		response.send(JSON.stringify({result: result}));
		if(result){
			var updateQuery = `Update public.useraccount Set login = true where email = '${emailAddress}' ;`;
			PostgreSQL.PSQLSeach(updateQuery);
		}
	});
});





app.listen(process.env.PORT || 8080);
