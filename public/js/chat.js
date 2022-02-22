// *Global variables

// fileshare storage
let fileShare = {
	filename: null,
	transmitted: 0,
	buffer: []
}

// Socket instance
const socket = io(); 


// *Elements
const $messageForm = document.querySelector("#messageForm");
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $sendLocationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');
const $fileInput = document.querySelector('#file-input');
const $sendFileButton = document.querySelector('#send-file');

// * Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;
const fileShareTemplate = document.querySelector("#file-share-template").innerHTML;


// * Options
const {username,room} = Qs.parse(location.search,{ ignoreQueryPrefix: true});


// *Socket Listeners

// Message listener
socket.on('message', (message) => {
	const html = ejs.render(messageTemplate,{
		username: message.username,
		message: message.text,
		createdAt: moment(message.createdAt).format('h:mm a')
	});

	$messages.insertAdjacentHTML('beforeend',html);
	autoscroll();
})

// Location message listener
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

// room data to render sidebar listener
socket.on('roomData', ({room, users}) => {
	const html = ejs.render(sidebarTemplate,{
		room,
		users
	});
	document.querySelector("#sidebar").innerHTML = html;
})

// File transfer initiation listener
socket.on('fs-reset', () => {
	fileShare = {
		filename: null,
		transmitted: 0,
		buffer: []
	};
})

// File share listener
socket.on('fs-share', (message) => {
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

// *Socket emit

socket.emit('join',{username,room}, (error) => {
	if(error){
		alert(error);
		location.href = '/';
	}
});



// *Event listeners

// Message send button listener
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
		// console.log('Delivered!');
	});
})

// location send button listener
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


//custom send file button listener
$sendFileButton.addEventListener('click', () => {
	$fileInput.click();
})


// file share listener for chnage in state
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


// *Functions

// Funtion to initiate file share
const shareFile = (metadata, buffer) => {
		socket.emit('fs-begin');
		let chunk = buffer.slice(0,metadata.buffer_size);
		while(chunk.length != 0){
			buffer = buffer.slice(metadata.buffer_size,buffer.length);
			socket.emit('file-raw',{metadata, buffer: chunk});
			chunk = buffer.slice(0,metadata.buffer_size);
	}
}

// generate event listener for p tag of file-share-anchor class
const generateEventListner = () => {
	// Array of elements of all p tag with file-share-anchor class
	const fileAnchorArray = [...document.querySelectorAll(".file-share-anchor")];
	if(fileAnchorArray.length > 1){
		fileAnchorArray[fileAnchorArray.length - 2].removeEventListener('click', downloadBtn);
	}
	fileAnchorArray[fileAnchorArray.length - 1].addEventListener('click', downloadBtn);
}

function downloadBtn() {
	download(new Blob(fileShare.buffer), fileShare.filename);
}

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

