const HTTP = require('http');
const QueryString = require('querystring');
const { Client } = require('pg');				//Postgres database connection

var SendEmail = require("./account/SendEmail");
var PostgreSQL = require("./sql/postgresql");
var server = HTTP.createServer();
var developmentMode = true;

server.on("request",function(request, response){
	var method = request.method;
	var URL = request.url;
	var header = new Object();
	if(developmentMode){
		header['Access-Control-Allow-Origin']="http://localhost:3000";
		header['Access-Control-Allow-Headers']="Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers";
	}
	if(method==="POST"&&URL==="/checkIfEmailExists"){
		var receivedData="";
		request.on('data', function(data) {
            receivedData += data;
		});
		request.on('end', function() {
            var receivedDataObject = JSON.parse(Object.keys(QueryString.parse(receivedData)).shift());
			var emailAddress = receivedDataObject['emailAddress'].toLowerCase();
            header['Content-Type']="application/json";
			response.writeHead(200, header);
			var query = `SELECT * FROM public.useraccount where email = '${emailAddress}';`;
			PostgreSQL.PSQLSeach(query, function(error, queryResult){
				var result = queryResult.length !=0 ? true:false;
				var responseData = {result: result};
				response.write(JSON.stringify(responseData));
				response.end();
			});
		});
	}
	else if(method==="POST"&&URL==="/emailCodeRequest"){
		var receivedData="";
		request.on('data', function(data) {
            receivedData += data;
		});
		request.on('end', function() {
            var receivedDataObject = JSON.parse(Object.keys(QueryString.parse(receivedData)).shift());
			var emailAddress = receivedDataObject['emailAddress'].toLowerCase();
			var emailTimeout = Number(receivedDataObject['emailTimeout']);
            header['Content-Type']="application/json";
			response.writeHead(200, header);
			var responseData = {emailReceived: emailAddress, expiresIn: emailTimeout};
    		response.write(JSON.stringify(responseData));
    		response.end();
			SendEmail(emailAddress, emailTimeout);
        });
	}
	else if(method==="POST"&&URL==="/emailCodeVerification"){
		var receivedData="";
		request.on('data', function(data) {
            receivedData += data;
		});
		request.on('end', function() {
            var receivedDataObject = JSON.parse(Object.keys(QueryString.parse(receivedData)).shift());
			var emailAddress = receivedDataObject['emailAddress'].toLowerCase();
			var code = receivedDataObject['code'];
            header['Content-Type']="application/json";
			response.writeHead(200, header);
			var query = `SELECT * FROM public.emailcode where email = '${emailAddress}' AND code='${code}';`;
			PostgreSQL.PSQLSeach(query, function(error, queryResult){
				var result = queryResult.length !=0 ? true:false;
				if(result){
					var username = receivedDataObject['username'];
					var password = PostgreSQL.Encryption(receivedDataObject['password']);
					var insert = `Insert into public.useraccount Values ('${emailAddress}', '${username}', '${password}', false);`;
					PostgreSQL.PSQLSeach(insert, function(){});
				}
				var responseData = {result: result};
				response.write(JSON.stringify(responseData));
				response.end();
			});
        });
	}
	else if(method==="POST"&&URL==="/loginToAccount"){
		var receivedData="";
		request.on('data', function(data) {
            receivedData += data;
		});
		request.on('end', function() {
            var receivedDataObject = JSON.parse(Object.keys(QueryString.parse(receivedData)).shift());
			var emailAddress = receivedDataObject['emailAddress'].toLowerCase();
			var password = PostgreSQL.Encryption(receivedDataObject['password']);
            header['Content-Type']="application/json";
			response.writeHead(200, header);
			var query = `SELECT * FROM public.useraccount where email = '${emailAddress}' AND password='${password}';`;
			PostgreSQL.PSQLSeach(query, function(error, queryResult){
				var result = queryResult.length !=0 ? true:false;
				if(result){
					var updateQuery = `Update public.useraccount Set login = true where email = '${emailAddress}' ;`;
					PostgreSQL.PSQLSeach(updateQuery, function(){});
				}
				var responseData = {result: result};
				response.write(JSON.stringify(responseData));
				response.end();
			});
        });
	}
	else if(method==="GET"&&URL==="/userHomePage"){
		 header['Content-Type']="text/html";
		 response.writeHead(200, header);
		 response.write("To be continued...");
		 response.end();
	}
});

server.listen(process.env.PORT || 8080);
