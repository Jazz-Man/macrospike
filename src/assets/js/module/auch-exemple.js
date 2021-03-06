// Get token

jQuery.ajax({
	"async": true,
	'crossDomain': true,
	url: 'https://macrospike.com/wp-json/jwt-auth/v1/token?username=restapi@macrospike.com&password=JocEvcalpook5',
	method: 'POST',
	headers: {
		'cache-control': 'no-cache'
	}
}).done(function (response) {
	
	/* response:
	* {
	 "token": "bla-bla",
	 "user_email": "restapi@macrospike.com",
	 "user_nicename": "restapi",
	 "user_display_name": "restapi"
	 }
	*
	* */


	localStorage.setItem('token', response.token);
	console.log(response);
});



// Validate token

jQuery.ajax({
	async: true,
	crossDomain: true,
	url: 'https://macrospike.com/wp-json/jwt-auth/v1/validate',
	method: "POST",
	headers: {
		'authorization': 'Bearer ' + localStorage.getItem('token'),
		'cache-control': 'no-cache'
	}
}).done(function (response) {
	console.log(response);
	
	/* response:
	*
	* {
	 "code": "jwt_auth_valid_token",
	 "data": {
	 "status": 200
	 }
	 }
	*
	*
	* */
});