const express = require('express');
const path = require('path');
const http =require('http');
const socketio = require('socket.io');
const Filter = require('bad-words');
const {generateMessage,generateLocationMessage,generateFileShareMessage} = require('./utils/message');
const {addUser,removeUser,getUser,getUsersInRoom} = require('./utils/users');

const app =  express();
const server = http.createServer(app);
const io = socketio(server);
const port =  process.env.PORT || 3000;

// *Serving up public directory
const publicDirectoryPath = path.join(__dirname,'../public');
app.use(express.static(publicDirectoryPath));

let count = 0;


//* WebSocket new connection
io.on('connection', (socket) => {

	console.log('New web socket connection.');


	socket.on('join',({username,room}, callback) => {

		const {error, user} = addUser({id: socket.id, username, room});

		if(error){
			return callback(error);
		}

		socket.join(user.room);

		// * Fire when a new user is connected. Only emitting to the connected socket
		socket.emit('message',generateMessage("Admin", 'Welcome'));

		// * Emit to all connection except you
		socket.broadcast.to(user.room).emit('message',generateMessage("Admin",`${user.username} has joined.`));

		io.to(user.room).emit('roomData',{
			room: user.room,
			users: getUsersInRoom(user.room)
		})

		callback();
	})




	socket.on('sendMessage', (msg,callback) => {

		const user = getUser(socket.id);

		if(user === undefined){
			return callback('No user found!');
		}

		// Check fot profanity
		let filter = new Filter();
		if(filter.isProfane(msg)){
			io.to(user.room).emit('message',generateMessage("Admin", `Profanity is not allowed ${user.username}`));
			return callback();
		}


		io.to(user.room).emit('message', generateMessage(user.username,msg));
		callback();
	})

	socket.on('disconnect', () => {
		const user = removeUser(socket.id);

		if(user){
			io.to(user.room).emit('message', generateMessage("Admin",`${user.username} has left!`));
			io.to(user.room).emit('roomData',{
				room: user.room,
				users: getUsersInRoom(user.room)
			})
	
		}
	})

	socket.on('sendLocation', (location, callback) => {

		const user = getUser(socket.id);

		if(user === undefined){
			return callback("No user found!")
		}

		io.to(user.room).emit('locationMessage',generateLocationMessage(user.username, location));
		callback();
	})


	// *File sharing

	socket.on('fs-begin', () => {
		const user = getUser(socket.id);
		io.to(user.room).emit('fs-reset');
	})

	socket.on('file-raw',(data) => {
		const user = getUser(socket.id);
		io.to(user.room).emit('fs-share', generateFileShareMessage(user.username,data));
	});

})


// * Start listing 
server.listen(port, () => console.log(`Server is up and running on ${port}...`));