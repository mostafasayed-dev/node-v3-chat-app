const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require ('./utils/messages')

const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
//__dirname = current file directory
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

//let count = 0

// server (emit) -> client (receive) --acknowledgement--> server  - countUpdated
// client (emit) -> server (receive) --acknowledgement--> client  - increment
io.on('connection', (socket) => {
    console.log('New WebSocket connection')

    // socket.emit('countUpdated', count)

    // socket.on('increment', () => {
    //     count++
    //     //socket.emit('countUpdated', count) // emmiting event to a specific single connection
    //     io.emit('countUpdated', count) // emmiting event to every single connection
    // })

    // socket.emit('message', 'Welcome!')
    // socket.emit('message', generateMessage('Welcome!'))
    // socket.broadcast.emit('message', generateMessage('A new user has joined!'))// send to all users excepts this socket (the user who joined)
    
    socket.on('join', (/*{username, room }*/ options, callback) => {
        // const { error, user } = addUser({
        //     id: socket.id,
        //     username,
        //     room
        // })
        // using spread operator instead
        const { error, user } = addUser({
            id: socket.id,
            ...options
        })

        if(error){
            return callback(error)
        }

        //socket.join(room)// to join a specific chat room
        socket.join(user.room)

        socket.emit('message', generateMessage('Admin', 'Welcome!'))
        //socket.broadcast.to(room).emit('message', generateMessage(`${username} has joined!`))// send to all users in chat room excepts this socket (the user who joined a specific chat room)
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        
        callback()// user joined successfully
    })

    socket.on('sendMessage', (message, callback) => {
        // console.log('message received from client...')
        // console.log(message)
        const filter = new Filter()
        if(filter.isProfane(message)){
            return callback('Invalid message with profanity!')// send back to client 
        }
        
        //io.emit('sendMessage', message)// emmiting event to every single connection
        //io.emit('message', generateMessage(message))// emmiting event to every single connection
        const user = getUser(socket.id)
        if(!user){
            return callback('Invalid user!')
        }

        io.to(user.room).emit('message', generateMessage(user.username, message))
        callback('Message delivered successfully')// send back to client 
    })

    socket.on('shareLocation', (position, callback) => {
        // console.log(position)
        //io.emit('location', 'Location: ' + position.latitude + ', ' + position.longitude)
        // io.emit('location', `https://google.com/maps?q=${position.latitude},${position.longitude}`)
        //io.emit('location', generateLocationMessage(`https://google.com/maps?q=${position.latitude},${position.longitude}`))
        const user = getUser(socket.id)
        if(!user){
            return callback('Invalid user!')
        }

        io.to(user.room).emit('location', generateLocationMessage(user.username, `https://google.com/maps?q=${position.latitude},${position.longitude}`))
        callback('Location shared successfully')
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if(user){
            // io.emit('message', generateMessage('A user has left!'))
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

server.listen(port, () => {
    console.log(`Server is up and running on port ${port}`)
})