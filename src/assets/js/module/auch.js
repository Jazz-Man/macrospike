var $$ = require('domtastic');

var loginForm = $$('#login-form');

if (loginForm.length) {
	
	var Base64 = require('js-base64').Base64;
	var RestClient = require('./rest-client');
	var jwt = new RestClient('https://macrospike.com/wp-json/jwt-auth/v1');
	
	jwt.res('validate');
	jwt.res('token');
	
	var signInBtn = loginForm.find('#sign-in');
	
	signInBtn.on('click', function (e) {
		e.preventDefault();
		var username = loginForm.find('#username');
		var password = loginForm.find('#passwd');

		jwt.token.post({
			username: Base64.encode(username.val()),
			password: Base64.encode(password.val())
		}).then(function (res) {
			console.log(res);
			localStorage.setItem('token', res.token);
			// jwt.validate.post().then(function (res) {
			// 	console.log(res);
			// })
			
		}).catch(function (e) {
			console.error( 'Error', e );
		});
		
		
	});
}