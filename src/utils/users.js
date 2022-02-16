const users = [];

// * Add user
const addUser = ({id,username,room}) =>{

	// * Clean the data
	username = username.trim().toLowerCase();
	room = room.trim().toLowerCase();

	// * Validate the data
	if(!username || !room){
		return {
			error: 'Username and room are required.'
		}
	}

	// * Check existing user
	const existingUser = users.find((user) => {
		return user.room === room && user.username === username;
	})

	// *Validate username
	if(existingUser){
		return{
			error: 'Username is already in use!'
		}
	}

	// * Store User 
	const user = {id,username,room};
	users.push(user);

	return {user};
}


// * Remove user
const removeUser = (id) => {
	const index = users.findIndex((user) => user.id === id);

	if(index !== -1){
		return users.splice(index,1)[0];
	}
}

// *Get user
const getUser = (id) => {
	return users.find((user) => user.id === id);
}

// * Get users in a room
const getUsersInRoom = (room) => {
	const allUser = users.filter((user) => user.room === room);
	return allUser;
}


module.exports = {
	addUser,
	removeUser,
	getUser,
	getUsersInRoom
}