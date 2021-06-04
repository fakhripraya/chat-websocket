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

    socket.on('join room', (room, user, users, callback) => {

        // trigger rerender to the selected user for joining the room
        io.to(socket.id).emit('trigger' + user.id)

        DBChatRoomChats.findAll({
            raw: true,
            where: {
                room_id: {
                    [Op.eq]: room.id
                }
            }
        }).then(function (res) {

            if (res !== null && res.length !== 0) {

                DBChatRoomChats.update(
                    {
                        chat_read: true
                    },
                    {
                        where: {
                            sender_id: {
                                [Op.ne]: user.id
                            },
                            room_id: {
                                [Op.eq]: room.id
                            }
                        }
                    }
                )

                callback({ error: null, callbackRoom: room, callbackChats: res });

            } else {

                if (users !== null) {
                    db.transaction().then(function (t) {
                        DBChatRoom.create({
                            room_desc: "room-" + socket.id.toString(),
                            is_active: true,
                            created_by: user.displayname,
                            modified_by: user.displayname,
                        }, {
                            transaction: t
                        }).then(function (res2) {

                            const roomObj = res2.get({ plain: true })

                            users.forEach(u => {
                                DBChatRoomMembers.create({
                                    room_id: roomObj.id,
                                    user_id: u.id,
                                    is_active: true,
                                    created_by: user.displayname,
                                    modified_by: user.displayname,
                                }, {
                                    transaction: t
                                }).then(function () {

                                    t.commit();
                                    callback({ error: null, callbackRoom: roomObj, callbackChats: null });

                                }).catch(function (err3) {

                                    t.rollback();
                                    callback({ error: err3, callbackRoom: null, callbackChats: null });

                                });
                            });

                        }).catch(function (err2) {
                            t.rollback();
                            callback({ error: err2, callbackRoom: null, callbackChats: null });
                        });
                    });
                }

            }

        }).catch(function (err) {
            callback({ error: err, callbackRoom: null, callbackChats: null });
        })
    });

    socket.on('send message', ({ type, sender, receiver, message, messages, room }) => {

        db.transaction().then(function (t) {
            DBChatRoomChats.create({
                room_id: room.id,
                sender_id: sender.id,
                chat_body: message,
                attachment: null, // next feature
                pic_url: null, // next feature
                chat_read: false,
                is_active: true,
                created_by: sender.displayname,
                modified_by: sender.displayname,
            }, {
                transaction: t

            }).then(function (res) {

                console.log(receiver.user_id)
                io.emit("set message" + receiver.user_id, { message: res, messages: messages, type, senderId: sender.id })
                io.emit("set message" + sender.id, { message: res, messages: messages, type, senderId: sender.id })
                t.commit();

                io.emit('trigger' + sender.id)
                io.emit('trigger' + receiver.user_id)

            }).catch(function (error) {

                console.log(error)

                // io.to(room).emit('get error', { message: error.message, type, senderId })
                t.rollback();

            });
        });
    })

    socket.on('disconnect', function (reason) {
        if (reason === "ping timeout") {
        }
    });

})

http.listen(3001, function () {
    console.log('listening on port 3001')
})