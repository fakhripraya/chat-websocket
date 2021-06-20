const app = require('express')()
const { Op, where } = require("sequelize");
const cors = require('cors');
const http = require('http').createServer(app)
const io = require('socket.io').listen(http, {
    "transports": ['websocket',
        'flashsocket',
        'htmlfile',
        'xhr-polling',
        'jsonp-polling',
        'polling'],
    "polling duration": 10
});

// Database
const db = require('./config/database');

const { DBChatRoom, DBChatRoomMembers, DBChatRoomChats } = require('./models/room_chat');

app.use(cors());

// Test DB
db.authenticate()
    .then(() => console.log('Connection to the database is established'))
    .catch(err => console.log('Error: ' + err))

io.on('connection', socket => {

    // trigger rerender for the first time
    io.to(socket.id).emit('trigger rerender')

    socket.on('trigger rerender self', (user) => {
        // trigger rerender to the selected user for joining the room
        io.to(socket.id).emit('trigger' + user.id)
    })

    socket.on('join room', (callback) => {
        try {
            callback({ error: null, room_desc: "room-" + socket.id.toString() });
        } catch (error) {
            callback({ error: error.message, room_desc: null });
        }
    });

    socket.on('send message', ({ sender, receiver, message }) => {
        io.emit("set message" + sender.id, { message: message, senderId: sender.id, receiverId: receiver.user_id })
        io.emit("set message root" + receiver.user_id, { message: message, senderId: sender.id, receiverId: receiver.user_id })
    });

    socket.on('read messages', ({ reader, roomId }) => {
        DBChatRoomChats.update(
            {
                chat_read: true
            },
            {
                where: {
                    sender_id: {
                        [Op.ne]: reader.id
                    },
                    room_id: {
                        [Op.eq]: roomId
                    }
                }
            }
        )
    })

    socket.on('disconnect', function (reason) {
        if (reason === "ping timeout") {
        }
    });

})

http.listen(3001, function () {
    console.log('listening on port 3001')
})