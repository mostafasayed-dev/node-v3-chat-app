const socket = io()

// Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = document.querySelector('input')
const $messageFormButton = document.querySelector('button')
const $messageFormButtonShareLocation = document.querySelector('#share-location')
const $messages = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const { username, room } = Qs.parse(location.search, {ignoreQueryPrefix: true})

// socket.on('countUpdated', (count) => {
//     console.log('The count has been updated', count)
// })

const autoscrool = () => {
    // get new message element
    const $newMesssage = $messages.lastElementChild

    // get height of last message
    const newMessageStyles = getComputedStyle($newMesssage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMesssage.offsetHeight + newMessageMargin

    // visible height
    const visibleHeight = $messages.offsetHeight

    // height of messages container
    const containerHeight = $messages.scrollHeight

    //how far have i scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        // message
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:m:s A')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscrool()
})

// document.querySelector('#increment').addEventListener('click', () => {
//     console.log('Clicked')
//     socket.emit('increment')
// })

socket.on('sendMessage', (message) => {
    console.log(message)
    // const html = Mustache.render(messageTemplate, {
    //     message
    // })
    // $messages.insertAdjacentHTML('beforeend', html)
})

//event listener
socket.on('location', (location) => {
    console.log(location)
    const html = Mustache.render(locationTemplate, {
        username: location.username,
        location: location.url,
        createdAt: moment(location.createdAt).format('h:m:s A')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscrool()
})

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

// sending message
$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    $messageFormButton.setAttribute('disabled', 'disabled')
    const message = e.target.elements.message.value

    socket.emit('sendMessage', message, (serverAcknowledgementMessage) => {
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        console.log(serverAcknowledgementMessage)// receive acknowledgement from server to make sure that message has been successfully delivered to the server
    })
})
// share location
document.querySelector('#share-location').addEventListener('click', () => {
    if(!navigator.geolocation){
        return alert('Geolocation is not supported!')
    }

    $messageFormButtonShareLocation.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        //console.log(position)
        socket.emit('shareLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, (serverAcknowledgementMessage) => {
            $messageFormButtonShareLocation.removeAttribute('disabled')
            console.log(serverAcknowledgementMessage)
        })
    })
})

socket.emit('join', {username, room}, (error) => {
    if(error){
        alert(error)
        location.href = '/'
    }
})