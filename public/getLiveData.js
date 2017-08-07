//Make connection
var socket = io.connect('http://localhost:4000');
var customData = [];
socket.emit('chat',{
	message:"Client"
});

socket.on('socketResponse', function (data) {
    console.log(data);
    customData = data.customData;
    testt();
});