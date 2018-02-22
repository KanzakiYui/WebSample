const Cryptography = require('crypto');			  // For encrption
const { Client } = require('pg');				//Postgres database connection
const connectString = process.env.DATABASE_URL;
const KEY = process.env.USER_ACCOUNT_PRIVATE_KEY;

function PSQLSeach(query, callback=null){
	var client = new Client({
  		connectionString: connectString,
		ssl: true,
	});
	client.connect();
	client.query(query, (error, queryResult) => {
  		if (error) throw error;
		client.end();
		if(callback!=null) callback(error, queryResult.rows);
	});
}

function Encryption(string){
	var cipher = Cryptography.createCipher('aes256', KEY);
	var encrypted = '';
	cipher.on('readable', () => {
  		const data = cipher.read();
  		if (data)
    		encrypted += data.toString('hex');
	});
	cipher.write(string);
	cipher.end();
	return encrypted;
}

module.exports ={
	PSQLSeach: PSQLSeach,
	Encryption: Encryption
} 
