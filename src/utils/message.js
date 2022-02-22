const generateMessage = (username, text) => {
	return{
		username,
		text,
		createdAt: new Date().getTime()
	}
}

const generateLocationMessage = (username, location) => {
	return {
		username,
		url: `https://google.com/maps?q=${location.latitude},${location.longitude}`,
		createdAt: new Date().getTime()
	}
}

const generateFileShareMessage = (username,data) => {
	return {
		username,
		metadata: data.metadata,
		buffer: data.buffer,
		createdAt: new Date().getTime()
	}
}


module.exports = {
	generateMessage,
	generateLocationMessage,
	generateFileShareMessage
}