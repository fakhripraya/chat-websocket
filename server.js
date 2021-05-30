const app = require('express')()
const { Op } = require("sequelize");
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

    socket.on('join room', (room, otherUser, callback) => {

        DBChatRoomMembers.findAll({
            where: {
                room_id: {
                    [Op.eq]: room.id
                }
            }
        })
            .then(function (res) {
                console.log(res)
            })
            .catch(function (err) {
                console.log(err)
            })

        // db.transaction().then(function (t) {
        //     DBChatRoom.create({
        //         room_desc: "room-" + socket.id.toString(),
        //         is_active: true,
        //         created: user.displayname,
        //         modified: user.displayname,
        //     }, {
        //         transaction: t
        //     }).then(function (res) {

        //         console.log(res)

        //         DBChatRoomMembers.create({
        //             room_id: res.id,
        //             user_id: user.id,
        //             socket_id: socket.id,
        //             is_active: true,
        //             created: name,
        //             modified: name,
        //         }, {
        //             transaction: t
        //         }).then(function () {

        //             socket.join(res.room_desc);
        //             t.commit();

        //             callback({ error: null, user: { id: socket.id, name: user.displayname, room: "room-" + socket.id.toString() } });

        //         }).catch(function (error) {

        //             t.rollback();
        //             callback({ error: error, user: null });

        //         });

        //     }).catch(function (error) {

        //         t.rollback();
        //         callback({ error: error, user: null });

        //     });
        // });
    });

    socket.on('send message', ({ message, type, senderId, room }) => {

        db.transaction().then(function (t) {
            DBChatRoomChats.create({
                is_active: true,
                created: name,
                modified: name,
            }, {
                transaction: t
            }).then(function () {

                io.to(room).emit('set message', { message, type, senderId })

                t.commit();

                callback({ error: null, user: user });

            }).catch(function (error) {

                io.to(room).emit('get error', { message: error.message, type, senderId })

                t.rollback();

            });
        });
    })

    socket.on('disconnect', () => {
        // const user = removeUser(socket.id);

        // if (user) {
        //     io.to(user.room).emit('message', { user: 'Admin', text: `${user.name} has left.` });
        //     io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });
        // }
    })

})

http.listen(3001, function () {
    console.log('listening on port 3001')
})