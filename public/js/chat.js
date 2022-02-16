const socket = io(); 


// *Elements
const $messageForm = document.querySelector("#messageForm");
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $sendLocationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');

// * Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;


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


socket.emit('join',{username,room}, (error) => {
	if(error){
		alert(error);
		location.href = '/';
	}
});