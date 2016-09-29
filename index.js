var express = require('express');
var bodyParser = require('body-parser');
var socketio = require('socket.io');
var mongoose = require('mongoose');

// database connection
mongoose.connect('mongodb://localhost:27017/chat');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('database is working!');
});

// create a schema
var ChatSchema = mongoose.Schema({
	name: String,
	message: String
});

// create a model from the chat schema
var ChatMessage = mongoose.model('ChatMessage', ChatSchema);

var app = express();
var server = app.listen(8888);
var io = socketio.listen(server);

// tell express where to serve static files from	
var staticDir = __dirname + '/public/';
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// route for index file
app.get('/', function(req, res) {
	res.sendFile(staticDir + 'socket.html');
});

app.get('/jquery', function(req, res) {
	res.sendFile(staticDir + 'jq.html');
});

app.get('/ajax', function(req, res) {
	res.sendFile(staticDir + 'ajax.html');
});

app.get('/messages', function(req, res) {
	//res.json(messages);
	//listMessages(res.body);	
});

app.post('/messages', function(req, res) {
	// var message = req.body;
	// messages.push(message);
	// res.json(message);
});

//Listen for connection
io.on('connection', function(socket) {

	console.log('Client connected');
	
	socket.on('disconnected', function() {
		console.log('Client disconnected');
	});

	//Listens for a new chat message
	socket.on('chat message', function(msg) {		
		// Create message as a new instance of mongoose model
		var message = new ChatMessage({
			name: msg.name,
			message: msg.text
		});
		// Save it to database
		message.save(function (err) {
			if (err) return console.error(err);
		});
		// Updating chat in real-time
		io.emit('chat message', message);
	});

	var messages = [];
	// Chat history for new users
	ChatMessage.find({}, function(err, messages) {
		if (err) throw err;
		socket.emit('chat history', messages);
	});
	
});