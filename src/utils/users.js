const users = []

const addUser = ({ id, username, room }) => {
    // clean the data
    username = username.trim().toLowerCase()
    room = room.trim().toLowerCase()

    // validate the data
    if(!username || !room){
        return {
            error: 'Username and Room are required!'
        }
    }

    // check for existing user
    const existingUser = users.find((user) => {
        return user.room === room && user.username === username
    })

    // validate username
    if(existingUser){
        return {
            error: 'Username is in use!'
        }
    }

    // store user
    const user = {id, username, room}
    users.push(user)
    return { user }
}

const removeUser = (id) => {
    const index = users.findIndex((user) => {
        return user.id === id // return true
    })

    if(index !== -1){
        return users.splice(index, 1)[0] // remove item from array by index then return this item
    }
}

const getUser = (id) => {
    const user = users.find((user) => {
        return user.id === id
    })

    return user
}

const getUsersInRoom = (room) => {
    room  =room.trim().toLowerCase()
    const usersInRoom = users.filter((user) => {
        return user.room === room
    })

    return usersInRoom
}

module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
}