const socket = io(); 


// *Elements
const $messageForm = document.querySelector("#messageForm");
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $sendLocationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');
const $fileInput = document.querySelector('#file-input');
const $sendFileButton = document.querySelector('#send-file');
// const $fileShareAnchor = document.querySelector('#file-share-anchor');

// * Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;
const fileShareTemplate = document.querySelector("#file-share-template").innerHTML;


// * Options
const {username,room} = Qs.parse(location.search,{ ignoreQueryPrefix: true});
// console.log(username,room);

const autoscroll = () => {
	// Todo: Fix the auto Scroll
	// //New message element
	// const $newMessage = $messages.lastElementChild;
	
	// // Height of the new message
	// const newMessageStyles = getComputedStyle($newMessage);
	// const newMessageMargin = parseInt(newMessageStyles.marginBottom);
	// const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

	// // Visible height
	// const visibleHeight = $messages.offsetHeight; 

	// // Height of the messages container
	// const containerHeight = $messages.scrollHeight;

	// // How far I have scrolled
	// const scrollOffset = $messages.scrollTop + visibleHeight;

	// if((containerHeight - newMessageHeight) <= scrollOffset){
	// 	$messages.scrollTop = $messages.scrollHeight;
	// }

	$messages.scrollTop = $messages.scrollHeight;
}

socket.on('message', (message) => {
	// console.log(message);

	const html = ejs.render(messageTemplate,{
		username: message.username,
		message: message.text,
		createdAt: moment(message.createdAt).format('h:mm a')
	});

	$messages.insertAdjacentHTML('beforeend',html);
	autoscroll();
})


socket.on('locationMessage', (message) => {
	// console.log(url);
	const html = ejs.render(locationTemplate,{
		username: message.username,
		url: message.url,
		createdAt: moment(message.createdAt).format('h:mm a')
	});
	$messages.insertAdjacentHTML('beforeend',html);
	autoscroll();
})

socket.on('roomData', ({room, users}) => {
	const html = ejs.render(sidebarTemplate,{
		room,
		users
	});

	document.querySelector("#sidebar").innerHTML = html;
})



$messageForm.addEventListener('submit', (e) => {
	e.preventDefault();
	// Disable send button
	$messageFormButton.setAttribute('disabled','disabled');

	let msg = e.target.elements.message.value;

	socket.emit("sendMessage", msg, (error) => {

		// Enable send button and clear input field
		$messageFormButton.removeAttribute('disabled');
		$messageFormInput.value = '';
		$messageFormInput.focus();

		if(error){
			return console.log(error);
		}

		console.log('Delivered!');

	});
})

$sendLocationButton.addEventListener('click', () => {

	if(!navigator.geolocation){
		return alert('Geolocation is not supported by your browser.');
	}
	
	// disable button
	$sendLocationButton.setAttribute('disabled','disabled');

	navigator.geolocation.getCurrentPosition(position => {
		let location = {
			latitude: position.coords.latitude,
			longitude: position.coords.longitude
		}
		socket.emit('sendLocation', location, () => {
			$sendLocationButton.removeAttribute('disabled');
			console.log("Location Shared!");
		});
	}) 
})


$sendFileButton.addEventListener('click', () => {
	$fileInput.click();
})

let fileShare = {
	filename: null,
	transmitted: 0,
	buffer: []
}

$fileInput.addEventListener('change', (e) => {
	const file = e.target.files[0];
	if(!file)return;
	
	let reader = new FileReader();
	reader.onload = () => {
		const buffer = new Uint8Array(reader.result);
		// console.log(buffer.length);
		shareFile({
			filename: file.name,
			total_buffer_size: buffer.length,
			buffer_size: 1024
		},buffer)
	}
	reader.readAsArrayBuffer(file)
})

const shareFile = (metadata, buffer) => {
	// socket.emit('file-meta', metadata);
		socket.emit('fs-begin');
		let chunk = buffer.slice(0,metadata.buffer_size);
		while(chunk.length != 0){
			buffer = buffer.slice(metadata.buffer_size,buffer.length);
			socket.emit('file-raw',{metadata, buffer: chunk});
			chunk = buffer.slice(0,metadata.buffer_size);
	}
}

socket.on('fs-reset', () => {
	fileShare = {
		filename: null,
		transmitted: 0,
		buffer: []
	};
})

socket.on('fs-share', (message) => {
	// console.log(message);
	fileShare.buffer.push(message.buffer);
	fileShare.transmitted += message.buffer.byteLength;
	fileShare.filename = message.metadata.filename;
	
	if(fileShare.transmitted == message.metadata.total_buffer_size){
		console.log(fileShare.transmitted, message.metadata.total_buffer_size);
		const html = ejs.render(fileShareTemplate,{
			username: message.username,
			filename: message.metadata.filename,
			createdAt: moment(message.createdAt).format('h:mm a')
		});
	
		$messages.insertAdjacentHTML('beforeend',html);
		autoscroll();
		generateEventListner();
		console.log(fileShare);
		// download(new Blob(fileShare.buffer), metadata.filename);
	}
})


const generateEventListner = () => {

	const fileAnchorArray = [...document.querySelectorAll(".file-share-anchor")];

	if(fileAnchorArray.length > 1){
		fileAnchorArray[fileAnchorArray.length - 2].removeEventListener('click', downloadBtn);
	}
	
	fileAnchorArray[fileAnchorArray.length - 1].addEventListener('click', downloadBtn);
}

function downloadBtn() {
	download(new Blob(fileShare.buffer), fileShare.filename);
}


socket.emit('join',{username,room}, (error) => {
	if(error){
		alert(error);
		location.href = '/';
	}
});