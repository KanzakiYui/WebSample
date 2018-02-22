const NodeMailer = require('nodemailer');
const { Client } = require('pg');				//Postgres database connection
var PostgreSQL = require("../sql/postgresql");

function randomString(n){
	var list = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';	
	var result = "";
	for(var i=0; i<n; i++){
		var random = Math.floor(Math.random() * list.length);
		result+=list[random];
	}
	return result;
}

var SendEmail= function(email, timeout){
	var code = randomString(10);
	var transporter = NodeMailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, 					// true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER, 
            pass: process.env.EMAIL_PIN 
        }
    });
	
	var mailOptions = {
		from: 'Kanzaki Yui', 
        to: email, 
        subject: 'Email Validation Message', 
		html: '<p>Hello! The below is your <strong>Validation Code</strong></p><br>'+
		'<p><strong>'+code+"</strong></p><br><p>Please use it to verify your email...</p>"
    };
	
	transporter.sendMail(mailOptions, (error, info) => {
        if (error) return console.log(error);   
    });
	
	var checkQuery = `SELECT email FROM public.emailcode where email = '${email}';`;
	PostgreSQL.PSQLSeach(checkQuery, function(error, queryResult){
		if(queryResult.length===0){
			var insertQuery = `Insert into public.emailcode Values ('${email}', '${code}');`;
			PostgreSQL.PSQLSeach(insertQuery);
		}
		else{
			var updateQuery = `Update public.emailcode Set code = '${code}' where email = '${email}' ;`;
			PostgreSQL.PSQLSeach(updateQuery);
		}
	});
	setTimeout(function(){
		var deleteQuery = `Delete from public.emailcode Where email = '${email}' AND code = '${code}' ;`;
		PostgreSQL.PSQLSeach(deleteQuery);
	},timeout*1000);
}

module.exports = SendEmail;