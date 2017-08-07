var express = require('express');
var socket = require('socket.io');

//App setup
var app = express();
var server = app.listen(4000,function(){
	console.log('listening to requests on port 4000');
});

//Static files
app.use(express.static('public'));


//Socket setup
var io = socket(server);

io.on('connection',function(socket){
	console.log('made socket connection',socket.id);
	socket.on('chat',function(data){
		console.log(data);
	});
	connectWebSocket();

	setInterval(function(){
	 
	 if(liveChartXAxisArray.length < 1000){
	 	socket.emit('socketResponse', wsSocketResponse); 
	 }
	}, 10000);
	
});



//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
var wsSocketResponse = {};
var liveChartXAxisArray = [];
var liveChartYAxisArray = [];
var temp = [];

//Connect Web Socket
function connectWebSocket(){
	const WebSocketClient = require('websocket').client;
	const uaa_util = require('predix-uaa-client');
	const url = require('url');

	

	process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

	const tsUrl = 'wss://de-live-events-service-digital-engine-dev.run.aws-usw02-pr.ice.predix.io/v3/liveevents/events';
	const uaaUrl = 'https://bae4c9fd-6f41-43fc-abc4-bebb8ca6d477.predix-uaa.run.aws-usw02-pr.ice.predix.io/oauth/token?grant_type=client_credentials';
	const clientId = '6b9b9556-89e4-d8d6-6cae-83c527ee67c0';
	const clientSecret = 'password';

	const requestOptions = {
	    agent: false
	};

	if(process.env.https_proxy) {
		const proxy = url.parse(process.env.https_proxy);
		const tunnelingAgent = require('tunnel').httpsOverHttp({
		  proxy: {
		    host: proxy.hostname,
		    port: proxy.port
		  }
		});

		console.log('Using proxy', proxy);
		requestOptions.agent = tunnelingAgent;
	}

	// Send a timeseries sample on the provided websocket connection
	const sendSample = connection => {
			if (connection.connected) {
					// Object.keys(connection).forEach(function(key) {
					// 	console.log(key);
					// });
					const data = {
						"eventTypes":["OCCUPANCY"],
						"assetUids": ["LOAD-TEST-SIMULATOR"]
					};
					console.log('Sending...', data);
					connection.sendUTF(JSON.stringify(data));

			} else {
				console.log('Not connected!!');
			}
	};

	uaa_util.getToken(uaaUrl, clientId, clientSecret).then((token) => {

	  // Use token.access_token as a Bearer token Authroization header
	  // in calls to secured services.
		// All three of these headers are required to time-series ingestion.
		// You can set Origin to whatever you want, but it is needed.
		// Origin can be added manually as a header, or specified as the third
		// parameter to the client.connect call.
		const headers = {
			Authorization: 'Bearer ' + token.access_token,
			//'predix-zone-id': '1e017b31-f2b9-4102-aee8-f43b3b291a9e',
			'predix-zone-id': 'E2EDemo-7-28-17-IE-DIGITAL-ENGINE',
			'Origin': 'http://localhost'
		};
		const client = new WebSocketClient();

		client.on('connectFailed', error => {
				console.log('Connect Error: ', error);
		});

		client.on('connect', connection => {
				console.log('WebSocket Client Connected');
				connection.on('error', error => {
						console.log("Connection Error: " + error.toString());
				});
				connection.on('close', () => {
						console.log('echo-protocol Connection Closed');
				});
				connection.on('message', message => {
						if (message.type === 'utf8') {
								//console.log("Received: '" + message.utf8Data + "'");
								wsSocketResponse = JSON.parse(message.utf8Data);

								if(liveChartXAxisArray.length < 1000){
									liveChartYAxisArray.push(wsSocketResponse.measures.OCCUPANCY);
									liveChartXAxisArray.push(wsSocketResponse.timestamp);
								}
								
								// wsSocketResponse.YAxis = liveChartYAxisArray;
								// wsSocketResponse.XAxis = liveChartXAxisArray;

								var dataFormatter = liveChartXAxisArray.map(function(x,i) {
							   		temp = [];
							        temp.push(liveChartXAxisArray[i],liveChartYAxisArray[i]);
							        return temp;
								});

								wsSocketResponse.customData = dataFormatter;

						}
				});

				// Send a sample value every second, until the app is stopped
				//setInterval(() => { sendSample(connection); }, 1000);

				sendSample(connection);
		});

		//console.log('connecting with headers', headers);
		// These request options that define the proxy to use can be specified on the WebSocketClient constructor instead.
		// If this option is used, the constructor call would be:
		// const client = new WebSocketClient({ tlsOptions: { agent: tunnelingAgent }});
		// The args here are:
		// wss url, sub-protocol, origin, headers, request options
		client.connect(tsUrl, null, 'http://localhost', headers, null);
	}).catch((err) => {
	  console.error('Error getting token', err);
	});
}
